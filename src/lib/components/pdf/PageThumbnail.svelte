<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import RotateCw from '@lucide/svelte/icons/rotate-cw';
	import { Button } from '$lib/components/ui/button';
	import type { PdfPreviewSession } from '$lib/pdf/preview';
	import type { QuarterTurn } from '$lib/pdf/types';

	let {
		session,
		pageNumber,
		rotation = 0,
		selected = false,
		mode = 'view',
		index = 0,
		total = 1,
		onToggle,
		onRotate,
		onMove,
		onReorder
	}: {
		session: PdfPreviewSession;
		pageNumber: number;
		rotation?: QuarterTurn;
		selected?: boolean;
		mode?: 'view' | 'select' | 'rotate' | 'reorder';
		index?: number;
		total?: number;
		onToggle?: () => void;
		onRotate?: () => void;
		onMove?: (direction: -1 | 1) => void;
		onReorder?: (from: number, to: number) => void;
	} = $props();

	let element = $state<HTMLElement | null>(null);
	let imageUrl = $state<string | null>(null);
	let loading = $state(false);
	let failed = $state(false);

	$effect(() => {
		const node = element;
		const current = session;
		const page = pageNumber;
		if (!node) return;
		let alive = true;
		let started = false;
		const observer = new IntersectionObserver(
			(entries) => {
				if (!alive || started || !entries.some((entry) => entry.isIntersecting)) return;
				started = true;
				loading = true;
				current
					.request(page)
					.then((url) => {
						if (alive) imageUrl = url;
					})
					.catch(() => {
						if (alive) failed = true;
					})
					.finally(() => {
						if (alive) loading = false;
					});
			},
			{ rootMargin: '280px' }
		);
		observer.observe(node);
		return () => {
			alive = false;
			observer.disconnect();
		};
	});
</script>

<article
	bind:this={element}
	class="bg-card ring-foreground/10 flex flex-col overflow-hidden rounded-xl ring-1 {selected
		? 'ring-primary ring-2'
		: ''}"
	draggable={mode === 'reorder'}
	ondragstart={(event) => event.dataTransfer?.setData('text/plain', String(index))}
	ondragover={(event) => {
		if (mode === 'reorder') event.preventDefault();
	}}
	ondrop={(event) => {
		if (mode !== 'reorder') return;
		event.preventDefault();
		const from = Number(event.dataTransfer?.getData('text/plain'));
		if (Number.isInteger(from)) onReorder?.(from, index);
	}}
>
	<button
		type="button"
		class="bg-muted relative flex aspect-[3/4] items-center justify-center"
		aria-label={`Trang ${pageNumber}`}
		aria-pressed={mode === 'select' ? selected : undefined}
		onclick={() => {
			if (mode === 'select') onToggle?.();
		}}
	>
		{#if imageUrl}
			<img
				src={imageUrl}
				alt={`Xem trước trang ${pageNumber}`}
				class="max-h-full max-w-full object-contain transition-transform"
				style:transform={`rotate(${rotation}deg)`}
			/>
		{:else if failed}
			<span class="text-muted-foreground px-3 text-xs">Không xem được trang</span>
		{:else}
			<span class="bg-background/80 text-muted-foreground rounded-full px-2 py-1 text-xs">
				{loading ? 'Đang tải' : 'Trang ' + pageNumber}
			</span>
		{/if}
		{#if mode === 'select' && selected}
			<span class="bg-primary text-primary-foreground absolute top-2 left-2 rounded-full px-2 py-0.5 text-[11px]">
				Đã chọn
			</span>
		{/if}
	</button>
	<div class="flex items-center justify-between gap-1 px-2 py-2">
		<p class="text-muted-foreground min-w-0 truncate text-xs">Trang {pageNumber}</p>
		<div class="flex items-center">
			{#if mode === 'reorder'}
				<Button
					variant="ghost"
					size="icon-xs"
					aria-label="Đưa trang lên trước"
					disabled={index === 0}
					onclick={() => onMove?.(-1)}
				>
					<ChevronLeft />
				</Button>
				<Button
					variant="ghost"
					size="icon-xs"
					aria-label="Đưa trang ra sau"
					disabled={index === total - 1}
					onclick={() => onMove?.(1)}
				>
					<ChevronRight />
				</Button>
			{/if}
			{#if mode === 'rotate'}
				<Button variant="ghost" size="icon-xs" aria-label="Xoay trang 90 độ" onclick={() => onRotate?.()}>
					<RotateCw />
				</Button>
			{/if}
		</div>
	</div>
</article>
