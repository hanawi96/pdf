<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import X from '@lucide/svelte/icons/x';
	import { onDestroy } from 'svelte';
	import { toast } from 'svelte-sonner';
	import type { ToolDefinition } from '$lib/content/tools';
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { imageKind, startsWithPdf } from '$lib/pdf/bytes';
	import { downloadOutput } from '$lib/pdf/download';
	import { errorMessage, isPdfError, throwIfAborted } from '$lib/pdf/errors';
	import { fileFingerprint } from '$lib/pdf/fingerprint';
	import { createId, formatBytes } from '$lib/pdf/format';
	import { mergeSettleDelay } from '$lib/pdf/merge-settle';
	import { reorder } from '$lib/pdf/order';
	import { parseRanges } from '$lib/pdf/ranges';
	import { countUnlockedPages, PdfPreviewSession } from '$lib/pdf/preview';
	import { routeJob } from '$lib/pdf/router';
	import { runOnServer } from '$lib/pdf/server-client';
	import type { Job, PageNumberPosition, PageNumberTemplate, QuarterTurn } from '$lib/pdf/types';
	import type { UserFile } from '$lib/pdf/user-file';
	import { inspectFile, runInWorker } from '$lib/pdf/worker-client';
	import ActionButton from './ActionButton.svelte';
	import DownloadResult from './DownloadResult.svelte';
	import { toolIcons } from './icons';
	import FileUploader from './FileUploader.svelte';
	import MergeFileList from './MergeFileList.svelte';
	import MergePanel from './MergePanel.svelte';
	import PDFPreview from './PDFPreview.svelte';
	import ProcessingProgress from './ProcessingProgress.svelte';
	import ToolOptions from './ToolOptions.svelte';

	let { tool }: { tool: ToolDefinition } = $props();
	const ToolIcon = $derived(toolIcons[tool.id]);

	type PageModel = { number: number; rotation: QuarterTurn; selected: boolean };

	let files = $state<UserFile[]>([]);
	let pages = $state<PageModel[]>([]);
	let preview = $state<PdfPreviewSession | null>(null);
	let stage = $state<'idle' | 'ready' | 'processing' | 'done'>('idle');
	let inspecting = $state(false);
	let progress = $state<number | null>(0);
	let orderHistory = $state<string[][]>([]);
	let progressMessage = $state('Đang xử lý');
	let errorText = $state('');
	let results = $state<import('$lib/pdf/types').OutputFile[]>([]);
	let generation = 0;
	let presentToken = 0;
	let mergeStarted = 0;
	let controller: AbortController | null = null;
	let consentOpen = $state(false);
	let serverReason = $state('');

	let splitMode = $state<'each' | 'ranges'>('each');
	let ranges = $state('');
	let pageSize = $state<'a4' | 'fit'>('a4');
	let imageFormat = $state<'jpeg' | 'png'>('jpeg');
	let quality = $state(0.82);
	let scale = $state('1.5');
	let position = $state<PageNumberPosition>('bc');
	let startNumber = $state(1);
	let fontSize = $state(12);
	let margin = $state(36);
	let template = $state<PageNumberTemplate>('n');
	let skipFirst = $state(false);
	let numberColor = $state<'black' | 'white'>('black');

	const totalBytes = $derived(files.reduce((sum, file) => sum + file.size, 0));
	const pageCount = $derived.by(() => {
		if (tool.kind === 'image') return files.length;
		const known = files.reduce((sum, file) => sum + (file.pageCount ?? 0), 0);
		if (known > 0) return known;
		return files.some((file) => file.encrypted) ? 1 : 0;
	});
	const signed = $derived(files.some((file) => file.signed));
	const rangeError = $derived.by(() => {
		if (tool.id !== 'split' || splitMode !== 'ranges') return '';
		const count = files[0]?.pageCount ?? 0;
		if (!count) return 'Hãy mở khóa PDF trước khi nhập khoảng trang.';
		try {
			parseRanges(ranges, count);
			return '';
		} catch (error) {
			return errorMessage(error);
		}
	});
	const mergeHint = $derived.by(() => {
		if (files.length < 2) return 'Hãy thêm ít nhất hai PDF.';
		if (files.some((file) => file.error))
			return 'Có tệp không ghép được. Hãy bỏ tệp đó khỏi danh sách.';
		if (files.some((file) => file.encrypted && !file.password.trim()))
			return 'Nhập mật khẩu cho tệp đang khóa.';
		if (inspecting) return 'Đang đọc số trang…';
		return '';
	});
	const canProcess = $derived.by(() => {
		if (stage === 'processing' || inspecting || files.length === 0) return false;
		if (files.some((file) => file.error)) return false;
		if (tool.id === 'merge' && files.length < 2) return false;
		if (files.some((file) => file.encrypted && !file.password.trim())) return false;
		if (
			tool.kind === 'pdf' &&
			!tool.multiple &&
			pages.length === 0 &&
			!files.some((file) => file.encrypted)
		) {
			return false;
		}
		if (tool.id === 'delete') {
			const marked = pages.filter((page) => page.selected).length;
			return marked > 0 && marked < pages.length;
		}
		if (tool.id === 'rotate') return pages.some((page) => page.rotation !== 0);
		if (tool.id === 'split' && splitMode === 'ranges')
			return rangeError === '' && ranges.trim() !== '';
		if (tool.id === 'pdf-to-images') return pages.some((page) => page.selected);
		if (tool.id === 'organize') return pages.length > 0;
		return pageCount > 0;
	});

	onDestroy(() => {
		presentToken += 1;
		controller?.abort();
		preview?.destroy();
		for (const file of files) revoke(file.coverUrl);
	});

	function revoke(url: string | null) {
		if (url) URL.revokeObjectURL(url);
	}

	function resetAll() {
		generation += 1;
		controller?.abort();
		preview?.destroy();
		preview = null;
		for (const file of files) revoke(file.coverUrl);
		files = [];
		pages = [];
		results = [];
		stage = 'idle';
		errorText = '';
		progress = 0;
		orderHistory = [];
		presentToken += 1;
	}

	function reopenMergeDraft() {
		if (tool.id !== 'merge' || stage !== 'done') return;
		stage = 'ready';
		results = [];
	}

	async function addFiles(incoming: File[]) {
		reopenMergeDraft();
		const next = tool.multiple ? [...files] : [];
		if (!tool.multiple) {
			preview?.destroy();
			preview = null;
			pages = [];
			for (const file of files) revoke(file.coverUrl);
		}
		for (const file of incoming) {
			if (next.length >= 30) {
				toast.error('Chỉ xử lý tối đa 30 tệp mỗi lượt.');
				break;
			}
			const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
			if (tool.kind === 'pdf' && !startsWithPdf(head)) {
				toast.error(`${file.name} không phải PDF.`);
				continue;
			}
			if (tool.kind === 'image' && !imageKind(head, file.type)) {
				toast.error(`${file.name} cần là JPG hoặc PNG.`);
				continue;
			}
			const fingerprint = tool.id === 'merge' ? await fileFingerprint(file) : null;
			if (fingerprint && next.some((item) => item.fingerprint === fingerprint)) {
				toast.info(`${file.name} trùng một tệp đã có, nên đã bỏ qua.`);
				continue;
			}
			next.push({
				id: createId(),
				file,
				name: file.name,
				size: file.size,
				pageCount: tool.kind === 'image' ? 1 : null,
				encrypted: false,
				signed: false,
				error: null,
				password: '',
				coverUrl: tool.kind === 'image' ? URL.createObjectURL(file) : null,
				fingerprint
			});
		}
		files = next;
		results = [];
		errorText = '';
		stage = files.length ? 'ready' : 'idle';
		if (tool.kind === 'pdf' && files.length) void settleFiles();
	}

	async function settleFiles() {
		const token = ++generation;
		if (tool.id === 'merge') await removeDuplicates(token);
		if (token !== generation) return;
		await inspectFiles(token);
	}

	async function removeDuplicates(token: number) {
		const seen = new Set<string>();
		const kept: UserFile[] = [];
		let skipped = 0;
		for (const item of files.slice()) {
			if (token !== generation) return;
			const fingerprint = item.fingerprint ?? (await fileFingerprint(item.file));
			if (token !== generation) return;
			const current = files.find((file) => file.id === item.id);
			if (!current) continue;
			current.fingerprint = fingerprint;
			if (seen.has(fingerprint)) {
				skipped += 1;
				revoke(current.coverUrl);
				continue;
			}
			seen.add(fingerprint);
			kept.push(current);
		}
		if (token !== generation || skipped === 0) return;
		files = kept;
		stage = files.length ? 'ready' : 'idle';
		toast.info(
			skipped === 1 ? 'Đã bỏ một tệp trùng nội dung.' : `Đã bỏ ${skipped} tệp trùng nội dung.`
		);
	}

	async function inspectFiles(token: number) {
		if (tool.kind !== 'pdf') return;
		inspecting = true;
		try {
			const ids = files.map((file) => file.id);
			for (const id of ids) {
				if (token !== generation) return;
				const item = files.find((file) => file.id === id);
				if (!item || item.error || item.encrypted || item.pageCount) continue;
				try {
					const info = await inspectFile(item.file);
					if (token !== generation) return;
					const current = files.find((file) => file.id === id);
					if (!current) continue;
					current.pageCount = info.pageCount;
					current.encrypted = info.encrypted;
					current.signed = info.signed;
					current.error = null;
				} catch (error) {
					const current = files.find((file) => file.id === id);
					if (current) current.error = errorMessage(error);
				}
			}
			const first = files[0];
			if (token === generation && first && !tool.multiple && !first.encrypted && !first.error) {
				await openSingle(first, token);
			}
		} finally {
			if (token === generation) inspecting = false;
		}
	}

	async function unlockFile(id: string) {
		const item = files.find((file) => file.id === id);
		if (!item || !item.password.trim()) return;
		const token = generation;
		try {
			const bytes = new Uint8Array(await item.file.arrayBuffer());
			if (token !== generation) return;
			const count = await countUnlockedPages(bytes, item.password);
			if (token !== generation) return;
			const current = files.find((file) => file.id === id);
			if (!current) return;
			current.pageCount = count;
			current.error = null;
			toast.success('Đã mở khóa tệp');
		} catch (error) {
			const current = files.find((file) => file.id === id);
			if (!current || token !== generation) return;
			current.error = errorMessage(error);
			toast.error(current.error);
		}
	}

	async function openSingle(item: UserFile, token = generation, password = item.password) {
		const bytes = new Uint8Array(await item.file.arrayBuffer());
		if (token !== generation) return;
		const session = new PdfPreviewSession();
		try {
			const count = await session.open(bytes, password || undefined);
			if (token !== generation) {
				session.destroy();
				return;
			}
			preview?.destroy();
			preview = session;
			item.pageCount = count;
			item.error = null;
			pages = Array.from({ length: count }, (_, index) => ({
				number: index + 1,
				rotation: 0 as QuarterTurn,
				selected: tool.id === 'pdf-to-images'
			}));
		} catch (error) {
			session.destroy();
			item.error = errorMessage(error);
			toast.error(item.error);
		}
	}

	function removeFile(id: string) {
		const file = files.find((item) => item.id === id);
		revoke(file?.coverUrl ?? null);
		files = files.filter((item) => item.id !== id);
		reopenMergeDraft();
		if (!tool.multiple) {
			preview?.destroy();
			preview = null;
			pages = [];
		}
		stage = files.length ? 'ready' : 'idle';
	}

	function applyOrder(from: number, to: number, remember: boolean) {
		const next = reorder(files, from, to);
		if (next === files) return;
		if (remember) orderHistory = [...orderHistory, files.map((file) => file.id)].slice(-40);
		files = next;
		reopenMergeDraft();
	}

	function moveFile(index: number, direction: -1 | 1) {
		applyOrder(index, index + direction, tool.id === 'merge');
	}

	function undoOrder() {
		const previous = orderHistory.at(-1);
		if (!previous || stage === 'processing') return;
		orderHistory = orderHistory.slice(0, -1);
		const byId = new Map(files.map((file) => [file.id, file]));
		const known = new Set(previous);
		const restored = previous.flatMap((id) => {
			const file = byId.get(id);
			return file ? [file] : [];
		});
		const extras = files.filter((file) => !known.has(file.id));
		files = [...restored, ...extras];
		reopenMergeDraft();
	}

	function onUndoKey(event: KeyboardEvent) {
		if (tool.id !== 'merge' || stage === 'processing') return;
		if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z' || event.shiftKey)
			return;
		const target = event.target;
		if (target instanceof HTMLElement && target.closest('input, textarea')) return;
		if (orderHistory.length === 0) return;
		event.preventDefault();
		undoOrder();
	}

	function movePage(index: number, direction: -1 | 1) {
		pages = reorder(pages, index, index + direction);
	}

	function reorderPages(from: number, to: number) {
		pages = reorder(pages, from, to);
	}

	function rotatePage(number: number) {
		pages = pages.map((page) =>
			page.number === number
				? { ...page, rotation: ((page.rotation + 90) % 360) as QuarterTurn }
				: page
		);
	}

	function rotateAll() {
		pages = pages.map((page) => ({
			...page,
			rotation: ((page.rotation + 90) % 360) as QuarterTurn
		}));
	}

	function togglePage(number: number) {
		pages = pages.map((page) =>
			page.number === number ? { ...page, selected: !page.selected } : page
		);
	}

	function selectAll(value: boolean) {
		pages = pages.map((page) => ({ ...page, selected: value }));
	}

	async function buildJob(signal: AbortSignal): Promise<Job> {
		if (tool.id === 'merge') {
			return {
				tool: 'merge',
				names: files.map((file) => file.name),
				files: await readAll(files, signal)
			};
		}
		if (tool.id === 'images-to-pdf') {
			return {
				tool: 'images-to-pdf',
				name: files[0]?.name ?? 'anh',
				pageSize,
				images: await Promise.all(
					files.map(async (file) => ({
						name: file.name,
						mime: file.file.type,
						data: new Uint8Array(await file.file.arrayBuffer())
					}))
				)
			};
		}
		const file = files[0];
		const bytes = new Uint8Array(await file.file.arrayBuffer());
		if (tool.id === 'split') {
			return { tool: 'split', file: bytes, name: file.name, mode: splitMode, ranges };
		}
		if (tool.id === 'delete') {
			return {
				tool: 'delete',
				file: bytes,
				name: file.name,
				pages: pages.filter((page) => page.selected).map((page) => page.number)
			};
		}
		if (tool.id === 'rotate') {
			return {
				tool: 'rotate',
				file: bytes,
				name: file.name,
				rotations: Object.fromEntries(
					pages.filter((page) => page.rotation).map((page) => [String(page.number), page.rotation])
				)
			};
		}
		if (tool.id === 'organize') {
			return {
				tool: 'organize',
				file: bytes,
				name: file.name,
				order: pages.map((page) => page.number)
			};
		}
		if (tool.id === 'pdf-to-images') {
			return {
				tool: 'pdf-to-images',
				file: bytes,
				name: file.name,
				format: imageFormat,
				quality,
				scale: Number(scale),
				pages: pages.filter((page) => page.selected).map((page) => page.number),
				password: file.password || undefined
			};
		}
		return {
			tool: 'page-numbers',
			file: bytes,
			name: file.name,
			options: {
				position,
				start: Number(startNumber) || 1,
				fontSize: Number(fontSize) || 12,
				margin: Number(margin) || 36,
				template,
				skipFirst,
				color: numberColor
			}
		};
	}

	async function readAll(list: UserFile[], signal: AbortSignal) {
		const buffers: Uint8Array[] = [];
		for (let index = 0; index < list.length; index += 1) {
			throwIfAborted(signal);
			progress = Math.round((index / list.length) * 8);
			progressMessage = `Đang đọc tệp ${index + 1}/${list.length}`;
			buffers.push(new Uint8Array(await list[index].file.arrayBuffer()));
		}
		return buffers;
	}

	function serverOptions() {
		if (tool.id === 'split') return { mode: splitMode, ranges };
		if (tool.id === 'delete') {
			return { pages: pages.filter((page) => page.selected).map((page) => page.number) };
		}
		if (tool.id === 'rotate') {
			return {
				rotations: Object.fromEntries(
					pages.filter((page) => page.rotation).map((page) => [String(page.number), page.rotation])
				)
			};
		}
		if (tool.id === 'organize') return { order: pages.map((page) => page.number) };
		return {};
	}

	async function presentMergeResult(outputs: import('$lib/pdf/types').OutputFile[]) {
		const token = ++presentToken;
		results = outputs;
		progress = 100;
		progressMessage = 'Đã ghép xong';
		const elapsed = performance.now() - mergeStarted;
		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		await new Promise((resolve) => setTimeout(resolve, mergeSettleDelay(elapsed, reduceMotion)));
		if (token !== presentToken || stage !== 'processing') return;
		stage = 'done';
		preview?.destroy();
		preview = null;
		if (outputs[0]) downloadOutput(outputs[0]);
	}

	async function start(allowServer = false) {
		errorText = '';
		const device = navigator as Navigator & { deviceMemory?: number };
		const decision = routeJob({
			tool: tool.id,
			totalBytes,
			pageCount,
			encrypted: files.some((file) => file.encrypted),
			deviceMemory: device.deviceMemory,
			hardwareConcurrency: navigator.hardwareConcurrency
		});
		if (decision.target === 'blocked') {
			errorText = decision.reason;
			return;
		}
		if (
			(decision.target === 'server' || decision.target === 'decrypt-then-client') &&
			!allowServer
		) {
			serverReason = decision.reason;
			consentOpen = true;
			return;
		}

		stage = 'processing';
		progress = tool.id === 'merge' ? 0 : null;
		progressMessage = tool.id === 'merge' ? 'Đang ghép' : 'Đang chuẩn bị';
		if (tool.id === 'merge') mergeStarted = performance.now();
		controller = new AbortController();
		try {
			let outputs;
			if (decision.target === 'server') {
				outputs = await runOnServer({
					operation: tool.id as 'merge' | 'split' | 'delete' | 'rotate' | 'organize',
					files: files.map((file) => file.file),
					passwords: files.map((file) => file.password),
					options: serverOptions(),
					signal: controller.signal,
					onProgress: (value, text) => {
						if (tool.id === 'merge') {
							if (typeof value === 'number') progress = Math.max(progress ?? 0, value);
						} else {
							progress = value;
						}
						progressMessage = text;
					}
				});
			} else if (decision.target === 'decrypt-then-client') {
				const [decrypted] = await runOnServer({
					operation: 'decrypt',
					files: [files[0].file],
					passwords: [files[0].password],
					options: {},
					signal: controller.signal,
					onProgress: (value, text) => {
						progress = value === null ? null : Math.min(35, value * 0.35);
						progressMessage = text;
					}
				});
				const job = await buildJob(controller.signal);
				if (job.tool === 'page-numbers') job.file = decrypted.data;
				outputs = await runInWorker(job, controller.signal, (value, text) => {
					progress = value === null ? null : 35 + value * 0.65;
					progressMessage = text;
				});
			} else {
				outputs = await runInWorker(
					await buildJob(controller.signal),
					controller.signal,
					(value, text) => {
						if (tool.id === 'merge') {
							if (typeof value === 'number') progress = Math.max(progress ?? 0, value);
						} else {
							progress = value;
						}
						progressMessage = text;
					}
				);
			}
			if (tool.id === 'merge') {
				await presentMergeResult(outputs);
				return;
			}
			results = outputs;
			stage = 'done';
			preview?.destroy();
			preview = null;
			toast.success('Đã xử lý xong');
		} catch (error) {
			stage = 'ready';
			if (isPdfError(error) && error.code === 'cancelled') {
				toast.info('Đã hủy tác vụ');
				return;
			}
			errorText = errorMessage(error);
			toast.error(errorText);
		}
	}

	function cancel() {
		presentToken += 1;
		controller?.abort();
	}
</script>

<div class="space-y-4">
	{#if stage === 'done' && tool.id !== 'merge'}
		<DownloadResult files={results} onreset={resetAll} />
	{:else}
		{#if files.length === 0}
			<FileUploader
				accept={tool.accept}
				multiple={tool.multiple}
				disabled={stage === 'processing'}
				onfiles={addFiles}
			/>
		{:else}
			<div
				class="grid min-w-0 items-start gap-4 {tool.id === 'merge'
					? 'lg:grid-cols-[minmax(0,1fr)_24rem]'
					: 'lg:grid-cols-[minmax(0,1fr)_20rem]'}"
			>
				<div class="min-w-0 space-y-4">
					{#if signed}
						<Alert.Root>
							<TriangleAlert />
							<Alert.Title>Tài liệu có thể đang có chữ ký số</Alert.Title>
							<Alert.Description>
								Chỉnh sửa sẽ tạo bản mới và làm chữ ký hết hiệu lực. Hãy giữ file gốc nếu bạn cần
								bản đã ký.
							</Alert.Description>
						</Alert.Root>
					{/if}
					{#if errorText}
						<Alert.Root variant="destructive">
							<TriangleAlert />
							<Alert.Title>Chưa xử lý được</Alert.Title>
							<Alert.Description>{errorText}</Alert.Description>
						</Alert.Root>
					{/if}

					{#if tool.id === 'merge'}
						<MergeFileList
							{files}
							accept={tool.accept}
							busy={stage === 'processing'}
							onadd={(list) => void addFiles(list)}
							onreorder={(from, to) => applyOrder(from, to, true)}
							onremove={removeFile}
							onunlock={unlockFile}
						/>
					{:else if tool.multiple}
						<ul class="space-y-2">
							{#each files as file, index (file.id)}
								<li
									class="flex min-w-0 items-center gap-2 rounded-xl bg-card p-2.5 ring-1 ring-foreground/10 sm:gap-3 sm:p-3"
								>
									{#if file.coverUrl}
										<img
											src={file.coverUrl}
											alt=""
											class="size-12 shrink-0 rounded-md bg-muted object-cover sm:size-14"
										/>
									{:else}
										<div class="size-12 shrink-0 rounded-md bg-muted sm:size-14"></div>
									{/if}
									<div class="min-w-0 flex-1">
										<p class="truncate text-sm font-medium">{file.name}</p>
										<p class="text-xs text-muted-foreground">
											{formatBytes(file.size)}
											{#if file.pageCount}
												· {file.pageCount} trang{/if}
											{#if file.encrypted}
												· có mật khẩu{/if}
										</p>
										{#if file.error}
											<p class="text-xs text-destructive">{file.error}</p>
										{/if}
										{#if file.encrypted}
											<Label class="mt-2 block" for={`password-${file.id}`}>Mật khẩu</Label>
											<Input
												id={`password-${file.id}`}
												class="mt-1"
												type="password"
												autocomplete="off"
												bind:value={file.password}
											/>
										{/if}
									</div>
									<div class="flex flex-col">
										<Button
											variant="ghost"
											size="icon-xs"
											aria-label="Đưa lên"
											disabled={index === 0}
											onclick={() => moveFile(index, -1)}
										>
											<ChevronLeft class="rotate-90" />
										</Button>
										<Button
											variant="ghost"
											size="icon-xs"
											aria-label="Đưa xuống"
											disabled={index === files.length - 1}
											onclick={() => moveFile(index, 1)}
										>
											<ChevronRight class="rotate-90" />
										</Button>
									</div>
									<Button
										variant="ghost"
										size="icon-sm"
										aria-label="Bỏ tệp"
										onclick={() => removeFile(file.id)}
									>
										<X />
									</Button>
								</li>
							{/each}
						</ul>
						<Button
							class="w-full sm:w-auto"
							variant="outline"
							type="button"
							onclick={() => document.getElementById('more-files')?.click()}
						>
							Thêm tệp
						</Button>
						<input
							id="more-files"
							class="sr-only"
							type="file"
							accept={tool.accept}
							multiple={tool.multiple}
							onchange={(event) => {
								void addFiles([...(event.currentTarget.files ?? [])]);
								event.currentTarget.value = '';
							}}
						/>
					{:else if files[0]}
						<div class="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10">
							<div class="min-w-0">
								<p class="truncate text-sm font-medium">{files[0].name}</p>
								<p class="text-xs text-muted-foreground">
									{formatBytes(files[0].size)}
									{#if files[0].pageCount}
										· {files[0].pageCount} trang{/if}
									{#if inspecting}
										· đang đọc{/if}
								</p>
							</div>
							<Button variant="outline" size="sm" type="button" onclick={resetAll}>Đổi tệp</Button>
						</div>
						{#if files[0].encrypted && pages.length === 0}
							<div class="space-y-2">
								<Label for="pdf-password">Mật khẩu PDF</Label>
								<div class="flex gap-2">
									<Input
										id="pdf-password"
										type="password"
										autocomplete="off"
										bind:value={files[0].password}
									/>
									<Button type="button" onclick={() => openSingle(files[0])}>Mở</Button>
								</div>
							</div>
						{/if}
						{#if preview && pages.length}
							<div class="flex flex-wrap gap-2">
								{#if tool.id === 'rotate'}
									<Button variant="outline" size="sm" type="button" onclick={rotateAll}
										>Xoay tất cả 90°</Button
									>
								{/if}
								{#if tool.id === 'delete' || tool.id === 'pdf-to-images'}
									<Button variant="outline" size="sm" type="button" onclick={() => selectAll(true)}
										>Chọn tất cả</Button
									>
									<Button variant="outline" size="sm" type="button" onclick={() => selectAll(false)}
										>Bỏ chọn</Button
									>
								{/if}
							</div>
							<PDFPreview
								session={preview}
								{pages}
								mode={tool.id === 'delete' || tool.id === 'pdf-to-images'
									? 'select'
									: tool.id === 'rotate'
										? 'rotate'
										: tool.id === 'organize'
											? 'reorder'
											: 'view'}
								onToggle={togglePage}
								onRotate={rotatePage}
								onMove={movePage}
								onReorder={reorderPages}
							/>
						{/if}
					{/if}
				</div>

				{#if tool.id === 'merge'}
					<MergePanel
						stage={stage === 'done' ? 'done' : stage === 'processing' ? 'processing' : 'ready'}
						fileCount={files.length}
						{pageCount}
						{totalBytes}
						{canProcess}
						hint={mergeHint}
						{progress}
						message={progressMessage}
						result={results[0] ?? null}
						onstart={() => start(false)}
						oncancel={cancel}
						ondownload={() => results[0] && downloadOutput(results[0])}
						onreset={resetAll}
					/>
				{:else}
					<aside
						class="min-w-0 space-y-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 lg:sticky lg:top-24 lg:p-5"
					>
						<div>
							<h2 class="text-base font-semibold tracking-tight">Tùy chọn</h2>
							<p class="mt-1 text-xs text-muted-foreground">
								{formatBytes(totalBytes)}
							</p>
						</div>
						<ToolOptions
							{tool}
							bind:splitMode
							bind:ranges
							{rangeError}
							bind:pageSize
							bind:imageFormat
							bind:quality
							bind:scale
							bind:position
							bind:startNumber
							bind:fontSize
							bind:margin
							bind:template
							bind:skipFirst
							bind:numberColor
						/>
						{#if stage === 'processing'}
							<ProcessingProgress {progress} message={progressMessage} oncancel={cancel} />
						{:else}
							<ActionButton type="button" disabled={!canProcess} onclick={() => start(false)}>
								<ToolIcon />
								{tool.action}
							</ActionButton>
							{#if !canProcess}
								<p class="text-xs leading-5 text-muted-foreground">
									{#if files.some((file) => file.error)}
										Có tệp không xử lý được. Hãy bỏ tệp đó khỏi danh sách.
									{:else if tool.id === 'delete'}
										Chọn trang cần xóa, nhưng đừng xóa hết.
									{:else if tool.id === 'rotate'}
										Xoay ít nhất một trang trước khi lưu.
									{:else if inspecting}
										Đang đọc tài liệu…
									{:else}
										Hoàn tất tệp và tùy chọn để bắt đầu.
									{/if}
								</p>
							{/if}
						{/if}
					</aside>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<svelte:window onkeydown={onUndoKey} />

<Dialog.Root bind:open={consentOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Gửi tệp lên máy chủ?</Dialog.Title>
			<Dialog.Description>{serverReason}</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" type="button" onclick={() => (consentOpen = false)}
				>Giữ trên máy</Button
			>
			<Button
				type="button"
				onclick={() => {
					consentOpen = false;
					void start(true);
				}}
			>
				Tôi đồng ý, xử lý giúp tôi
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
