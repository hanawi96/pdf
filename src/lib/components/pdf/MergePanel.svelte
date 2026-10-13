<script lang="ts">
	import Combine from '@lucide/svelte/icons/combine';
	import Download from '@lucide/svelte/icons/download';
	import { Button } from '$lib/components/ui/button';
	import ActionButton from './ActionButton.svelte';
	import { formatBytes } from '$lib/pdf/format';
	import type { OutputFile } from '$lib/pdf/types';

	let {
		stage,
		fileCount,
		pageCount,
		totalBytes,
		canProcess,
		hint = '',
		progress = null,
		message = 'Đang ghép',
		result = null,
		onstart,
		oncancel,
		ondownload,
		onreset
	}: {
		stage: 'ready' | 'processing' | 'done';
		fileCount: number;
		pageCount: number;
		totalBytes: number;
		canProcess: boolean;
		hint?: string;
		progress?: number | null;
		message?: string;
		result?: OutputFile | null;
		onstart: () => void;
		oncancel: () => void;
		ondownload: () => void;
		onreset: () => void;
	} = $props();

	let shown = $state(0);
	let targetProgress = 0;
	const reduceMotion =
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	$effect(() => {
		if (typeof progress === 'number') targetProgress = progress;
		if (reduceMotion) shown = stage === 'processing' ? targetProgress : 0;
	});

	$effect(() => {
		if (reduceMotion || stage !== 'processing') {
			if (!reduceMotion) shown = 0;
			return;
		}
		let current = 0;
		shown = 0;
		let last = performance.now();
		let frame = 0;
		const loop = (now: number) => {
			const dt = Math.min(40, now - last);
			last = now;
			const target = targetProgress;
			const gap = Math.max(0, target - current);
			const tau = gap > 30 ? 200 : 90;
			current += gap * (1 - Math.exp(-dt / tau));
			if (target - current < 0.35) current = target;
			shown = Math.min(100, current);
			frame = requestAnimationFrame(loop);
		};
		frame = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(frame);
	});

	const status = $derived(
		stage === 'processing' && progress === 100 && shown <= 92 ? 'Đang hoàn tất' : message
	);
	const summary = $derived(
		`${fileCount} tệp${pageCount > 0 ? ` · ${pageCount} trang` : ''} · ${formatBytes(totalBytes)}`
	);
</script>

<aside class="min-w-0 lg:sticky lg:top-24">
	<div class="rounded-2xl bg-card p-4 ring-1 ring-foreground/10 lg:p-5">
		<div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
			<h2 class="text-base font-semibold tracking-tight">
				{#if stage === 'done'}
					Đã ghép xong
				{:else if stage === 'processing'}
					Đang ghép
				{:else}
					Ghép PDF
				{/if}
			</h2>
			<p class="text-xs text-muted-foreground tabular-nums sm:text-right">{summary}</p>
		</div>

		<div class="mt-4">
			{#if stage === 'processing'}
				<p class="text-sm font-medium" aria-live="polite">{status}</p>
				<div
					class="mt-3 h-2.5 overflow-hidden rounded-full bg-muted"
					role="progressbar"
					aria-valuemin={0}
					aria-valuemax={100}
					aria-valuenow={Math.round(shown)}
					aria-valuetext={status}
				>
					<div class="h-full rounded-full bg-primary" style:width="{shown}%"></div>
				</div>
				<div class="mt-2 flex h-9 items-center justify-between">
					{#if progress !== 100}
						<button
							type="button"
							class="text-sm text-muted-foreground hover:text-foreground"
							onclick={oncancel}
						>
							Hủy
						</button>
					{:else}
						<span></span>
					{/if}
					<span class="text-sm text-muted-foreground tabular-nums">{Math.round(shown)}%</span>
				</div>
			{:else if stage === 'done' && result}
				<p class="truncate text-sm font-medium">{result.name}</p>
				<p class="mt-1 text-xs text-muted-foreground">{formatBytes(result.data.byteLength)}</p>
				<ActionButton class="mt-4" type="button" onclick={ondownload}>
					<Download />
					Tải xuống
				</ActionButton>
				<Button class="mt-2 w-full" variant="ghost" type="button" onclick={onreset}
					>Chọn tệp khác</Button
				>
			{:else}
				<ActionButton type="button" disabled={!canProcess} onclick={onstart}>
					<Combine />
					Ghép PDF
				</ActionButton>
				<p class="mt-3 text-center text-xs leading-5 text-muted-foreground">
					{hint || 'Giữ nguyên nội dung từng trang, ghép theo thứ tự bên trái.'}
				</p>
			{/if}
		</div>
	</div>
</aside>
