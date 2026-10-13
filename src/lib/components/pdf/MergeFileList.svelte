<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import FileText from '@lucide/svelte/icons/file-text';
	import Folder from '@lucide/svelte/icons/folder';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { formatBytes } from '$lib/pdf/format';
	import type { UserFile } from '$lib/pdf/user-file';
	import MergeThumb from './MergeThumb.svelte';

	let {
		files,
		accept,
		busy = false,
		onadd,
		onreorder,
		onremove,
		onunlock
	}: {
		files: UserFile[];
		accept: string;
		busy?: boolean;
		onadd: (files: File[]) => void;
		onreorder: (from: number, to: number) => void;
		onremove: (id: string) => void;
		onunlock: (id: string) => void;
	} = $props();

	let draggedId = $state<string | null>(null);
	let targetId = $state<string | null>(null);
	let overZone = $state(false);
	let input = $state<HTMLInputElement | null>(null);

	function canDrag() {
		return !busy && files.length > 1;
	}

	function isControl(event: DragEvent) {
		const origin = event.target;
		return origin instanceof Element && Boolean(origin.closest('button, input, textarea, label, a'));
	}

	function onDragStart(event: DragEvent, id: string) {
		if (!canDrag() || isControl(event)) {
			event.preventDefault();
			return;
		}
		draggedId = id;
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
			event.dataTransfer.setData('text/plain', id);
		}
	}

	function onDragOver(event: DragEvent, id: string) {
		if (!draggedId) return;
		event.preventDefault();
		if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
		const next = id === draggedId ? null : id;
		if (targetId !== next) targetId = next;
	}

	function onDrop(event: DragEvent, id: string) {
		const fromId = draggedId;
		if (!fromId) return;
		event.preventDefault();
		const from = files.findIndex((file) => file.id === fromId);
		const to = files.findIndex((file) => file.id === id);
		draggedId = null;
		targetId = null;
		if (from >= 0 && to >= 0 && from !== to) onreorder(from, to);
	}

	function onDragEnd() {
		draggedId = null;
		targetId = null;
	}

	function openPicker() {
		if (!busy) input?.click();
	}

	function takeFiles(list: FileList | null) {
		if (!list || busy) return;
		const next = [...list];
		if (next.length === 0) return;
		onadd(next);
		if (input) input.value = '';
	}

	function zoneDragOver(event: DragEvent) {
		if (draggedId || busy || ![...(event.dataTransfer?.types ?? [])].includes('Files')) return;
		event.preventDefault();
		overZone = true;
	}

	function statusOf(file: UserFile) {
		if (file.error) return { label: 'Không đọc được', tone: 'bad' as const };
		if (file.encrypted && file.pageCount === null) {
			return { label: 'Cần mật khẩu', tone: 'wait' as const };
		}
		if (file.pageCount === null) return { label: 'Đang đọc', tone: 'wait' as const };
		return { label: 'Sẵn sàng', tone: 'ready' as const };
	}
</script>

<section
	class="rounded-2xl border border-border bg-card p-4 text-card-foreground sm:p-5 dark:border-[#2c3548] dark:bg-[#141a27]"
>
	<div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex items-center gap-2.5">
			<h2 class="text-base font-semibold tracking-tight">Thứ tự ghép</h2>
			<span
				class="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground dark:bg-[#2a3346] dark:text-[#c9d0de]"
			>
				{files.length} tệp
			</span>
		</div>
		<p class="text-sm text-muted-foreground">Kéo thả để sắp xếp thứ tự các tệp</p>
	</div>

	<div
		class="mt-4 flex flex-col gap-3 rounded-xl border border-dashed px-4 py-3 sm:flex-row sm:items-center {overZone
			? 'border-primary bg-primary/10'
			: 'border-primary/30 bg-primary/5 dark:border-[#3c4f78] dark:bg-[#1a2336]'}"
		ondragover={zoneDragOver}
		ondragleave={(event) => {
			const next = event.relatedTarget;
			if (!(event.currentTarget instanceof HTMLElement)) return;
			if (next instanceof Node && event.currentTarget.contains(next)) return;
			overZone = false;
		}}
		ondrop={(event) => {
			if (draggedId || ![...(event.dataTransfer?.types ?? [])].includes('Files')) return;
			event.preventDefault();
			overZone = false;
			takeFiles(event.dataTransfer?.files ?? null);
		}}
		onclick={openPicker}
	>
		<span class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#2f6fed] text-white">
			<Plus class="size-5" />
		</span>
		<span class="min-w-0 flex-1">
			<span class="block text-sm font-semibold">Thêm tệp PDF</span>
			<span class="mt-0.5 block text-xs text-muted-foreground">
				Kéo thả tệp vào đây hoặc nhấp để chọn nhiều tệp
			</span>
		</span>
		<Button
			variant="outline"
			type="button"
			class="h-10 w-full justify-center gap-2 rounded-lg border-[#c5cad6] bg-background px-3 shadow-none sm:w-auto dark:border-[#3a445c] dark:bg-[#1b2434] dark:hover:bg-[#232d42]"
			disabled={busy}
			onclick={(event) => {
				event.stopPropagation();
				openPicker();
			}}
		>
			<Folder class="size-4" />
			Chọn tệp
			<ChevronDown class="size-3.5 opacity-70" />
		</Button>
		<input
			bind:this={input}
			class="sr-only"
			type="file"
			{accept}
			multiple
			onchange={(event) => takeFiles(event.currentTarget.files)}
		/>
	</div>

	<ul id="pm-files" class="mt-3 flex flex-col">
		{#each files as file, index (file.id)}
			{@const status = statusOf(file)}
			<li
				class="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl px-1 py-2.5 sm:flex-nowrap {targetId ===
				file.id
					? 'ring-1 ring-[#6b89ff]'
					: ''}"
				class:opacity-[0.38]={draggedId === file.id}
				draggable={canDrag()}
				data-id={file.id}
				ondragstart={(event) => onDragStart(event, file.id)}
				ondragover={(event) => onDragOver(event, file.id)}
				ondrop={(event) => onDrop(event, file.id)}
				ondragend={onDragEnd}
			>
				<span class="inline-flex shrink-0 cursor-grab text-[#687187] active:cursor-grabbing">
					<GripVertical class="size-5" />
				</span>
				<span
					class="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border text-sm font-medium tabular-nums dark:border-[#343d52] dark:bg-[#1c2433]"
				>
					{index + 1}
				</span>
				<div class="relative h-14 w-11 shrink-0">
					<MergeThumb
						file={file.file}
						password={file.password}
						active={file.pageCount !== null &&
							!file.error &&
							file.size <= 48 * 1024 * 1024 &&
							(!file.encrypted || file.password.trim().length > 0)}
					/>
					<span
						class="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 rounded-[3px] bg-[#e10600] px-1 py-0.5 text-[8px] font-bold leading-none tracking-wide text-white"
					>
						PDF
					</span>
				</div>
				<div class="min-w-0 flex-1 basis-32">
					<p class="truncate text-sm font-medium">{file.name}</p>
					<p class="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
						<FileText class="size-3.5 shrink-0" />
						<span class="truncate">
							{#if file.pageCount}{file.pageCount} trang · {/if}{formatBytes(file.size)} · PDF
						</span>
					</p>
					{#if file.error}
						<p class="mt-1 line-clamp-2 text-xs text-destructive">{file.error}</p>
					{/if}
					{#if file.encrypted && file.pageCount === null}
						<Label class="mt-2 block" for={`password-${file.id}`}>Mật khẩu</Label>
						<div class="mt-1 flex gap-2">
							<Input
								id={`password-${file.id}`}
								type="password"
								autocomplete="off"
								disabled={busy}
								value={file.password}
								oninput={(event) => {
									file.password = event.currentTarget.value;
									file.error = null;
								}}
							/>
							<Button
								type="button"
								variant="outline"
								disabled={busy || !file.password.trim()}
								onclick={() => onunlock(file.id)}
							>
								Mở
							</Button>
						</div>
					{/if}
				</div>
				<div class="flex w-full shrink-0 items-center justify-between gap-2 sm:w-auto sm:justify-end">
					<span
						class="inline-flex items-center gap-1.5 text-sm font-medium {status.tone === 'ready'
							? 'text-emerald-500 dark:text-emerald-400'
							: status.tone === 'bad'
								? 'text-destructive'
								: 'text-muted-foreground'}"
					>
						{#if status.tone === 'ready'}
							<CircleCheck class="size-4" />
						{/if}
						{status.label}
					</span>
					<div class="flex shrink-0 items-center gap-1.5">
						<Button
							variant="outline"
							size="icon"
							type="button"
							class="rounded-lg border-[#c5cad6] bg-transparent shadow-none dark:border-[#3a4458] dark:hover:bg-white/5"
							aria-label="Đưa lên"
							disabled={busy || index === 0}
							onclick={() => onreorder(index, index - 1)}
						>
							<ChevronDown class="size-4 rotate-180" />
						</Button>
						<Button
							variant="outline"
							size="icon"
							type="button"
							class="rounded-lg border-[#c5cad6] bg-transparent shadow-none dark:border-[#3a4458] dark:hover:bg-white/5"
							aria-label="Đưa xuống"
							disabled={busy || index === files.length - 1}
							onclick={() => onreorder(index, index + 1)}
						>
							<ChevronDown class="size-4" />
						</Button>
						<Button
							variant="outline"
							size="icon"
							type="button"
							class="rounded-lg border-red-500/80 bg-transparent text-red-400 shadow-none hover:bg-red-500/10 hover:text-red-400"
							aria-label="Bỏ tệp"
							disabled={busy}
							onclick={() => onremove(file.id)}
						>
							<Trash2 class="size-4" />
						</Button>
					</div>
				</div>
			</li>
		{/each}
	</ul>
</section>
