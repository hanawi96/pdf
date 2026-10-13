<script lang="ts">
	import type { PdfPreviewSession } from '$lib/pdf/preview';
	import type { QuarterTurn } from '$lib/pdf/types';
	import PageThumbnail from './PageThumbnail.svelte';

	type PageModel = {
		number: number;
		rotation: QuarterTurn;
		selected: boolean;
	};

	let {
		session,
		pages,
		mode = 'view',
		onToggle,
		onRotate,
		onMove,
		onReorder
	}: {
		session: PdfPreviewSession;
		pages: PageModel[];
		mode?: 'view' | 'select' | 'rotate' | 'reorder';
		onToggle?: (number: number) => void;
		onRotate?: (number: number) => void;
		onMove?: (index: number, direction: -1 | 1) => void;
		onReorder?: (from: number, to: number) => void;
	} = $props();
</script>

<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
	{#each pages as page, index (page.number)}
		<PageThumbnail
			{session}
			pageNumber={page.number}
			rotation={page.rotation}
			selected={page.selected}
			{mode}
			{index}
			total={pages.length}
			onToggle={() => onToggle?.(page.number)}
			onRotate={() => onRotate?.(page.number)}
			onMove={(direction) => onMove?.(index, direction)}
			{onReorder}
		/>
	{/each}
</div>
