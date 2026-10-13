<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import X from '@lucide/svelte/icons/x';
	import { onDestroy } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { formatBytes } from '$lib/pdf/format';
	import type { UserFile } from '$lib/pdf/user-file';
	import MergeThumb from './MergeThumb.svelte';

	let {
		files,
		busy = false,
		onreorder,
		onremove,
		onunlock
	}: {
		files: UserFile[];
		busy?: boolean;
		onreorder: (from: number, to: number) => void;
		onremove: (id: string) => void;
		onunlock: (id: string) => void;
	} = $props();

	let listEl = $state<HTMLUListElement | null>(null);
	let dragging = $state(false);

	type Drag = {
		from: number;
		to: number;
		pointerId: number;
		heights: number[];
		gap: number;
		originY: number;
		scrollY: number;
	};

	let drag: Drag | null = null;
	let pointerY = 0;
	let frame = 0;
	let previousUserSelect = '';
	let previousCursor = '';

	function topsOf(heights: number[], gap: number) {
		const tops: number[] = [];
		let y = 0;
		for (const height of heights) {
			tops.push(y);
			y += height + gap;
		}
		return tops;
	}

	function targetIndex(from: number, dy: number, heights: number[], gap: number) {
		const tops = topsOf(heights, gap);
		const center = tops[from] + dy + heights[from] / 2;
		let to = from;
		for (let index = 0; index < heights.length; index += 1) {
			if (index === from) continue;
			const mid = tops[index] + heights[index] / 2;
			if (index > from && center > mid) to = index;
			if (index < from && center < mid) to = Math.min(to, index);
		}
		return to;
	}

	function rows() {
		return listEl ? ([...listEl.children] as HTMLElement[]) : [];
	}

	function paint(dy: number) {
		if (!drag) return;
		const next = targetIndex(drag.from, dy, drag.heights, drag.gap);
		drag.to = next;
		const current = topsOf(drag.heights, drag.gap);
		const order = drag.heights.map((_, index) => index);
		const [moved] = order.splice(drag.from, 1);
		order.splice(next, 0, moved);
		const placed = new Array<number>(order.length);
		let y = 0;
		for (const index of order) {
			placed[index] = y;
			y += drag.heights[index] + drag.gap;
		}
		for (const [index, row] of rows().entries()) {
			const delta = index === drag.from ? dy : placed[index] - current[index];
			row.style.transform = delta ? `translate3d(0, ${delta}px, 0)` : '';
			row.style.zIndex = index === drag.from ? '2' : '';
		}
	}

	function tick() {
		if (!drag) return;
		const dy = pointerY - drag.originY + (window.scrollY - drag.scrollY);
		paint(dy);
		if (pointerY < 72) window.scrollBy(0, -10);
		else if (pointerY > window.innerHeight - 72) window.scrollBy(0, 10);
		frame = requestAnimationFrame(tick);
	}

	function clearStyles() {
		for (const row of rows()) {
			row.style.transform = '';
			row.style.zIndex = '';
		}
	}

	function startDrag(event: PointerEvent, index: number) {
		if (busy || event.button !== 0 || files.length < 2 || !listEl) return;
		const elements = rows();
		if (elements.length !== files.length) return;
		event.preventDefault();
		const rects = elements.map((row) => row.getBoundingClientRect());
		drag = {
			from: index,
			to: index,
			pointerId: event.pointerId,
			heights: rects.map((rect) => rect.height),
			gap: rects.length > 1 ? Math.max(0, rects[1].top - rects[0].bottom) : 8,
			originY: event.clientY,
			scrollY: window.scrollY
		};
		pointerY = event.clientY;
		dragging = true;
		previousUserSelect = document.body.style.userSelect;
		previousCursor = document.body.style.cursor;
		document.body.style.userSelect = 'none';
		document.body.style.cursor = 'grabbing';
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		frame = requestAnimationFrame(tick);
	}

	function onPointerMove(event: PointerEvent) {
		if (!drag || event.pointerId !== drag.pointerId) return;
		pointerY = event.clientY;
	}

	function endDrag(event: PointerEvent) {
		if (!drag || event.pointerId !== drag.pointerId) return;
		const { from, to } = drag;
		cancelAnimationFrame(frame);
		frame = 0;
		clearStyles();
		drag = null;
		dragging = false;
		document.body.style.userSelect = previousUserSelect;
		document.body.style.cursor = previousCursor;
		if (from !== to) onreorder(from, to);
	}

	onDestroy(() => {
		cancelAnimationFrame(frame);
		if (!drag) return;
		document.body.style.userSelect = previousUserSelect;
		document.body.style.cursor = previousCursor;
		drag = null;
	});
</script>

<svelte:window onpointermove={onPointerMove} onpointerup={endDrag} onpointercancel={endDrag} />

<ul
	bind:this={listEl}
	class="space-y-2"
	class:is-dragging={dragging}
	data-dragging={dragging ? '' : undefined}
>
	{#each files as file, index (file.id)}
		<li
			class="relative flex min-w-0 items-center gap-2 rounded-xl bg-card p-2.5 ring-1 ring-foreground/10 sm:gap-3 sm:p-3"
		>
			<Button
				variant="ghost"
				size="icon-sm"
				type="button"
				class="cursor-grab touch-none"
				aria-label="Kéo để đổi thứ tự"
				disabled={busy || files.length < 2}
				onpointerdown={(event) => startDrag(event, index)}
			>
				<GripVertical />
			</Button>
			<span class="w-4 shrink-0 text-center text-xs font-medium text-muted-foreground tabular-nums"
				>{index + 1}</span
			>
			<MergeThumb
				file={file.file}
				password={file.password}
				active={file.pageCount !== null &&
					!file.error &&
					file.size <= 48 * 1024 * 1024 &&
					(!file.encrypted || file.password.trim().length > 0)}
			/>
			<div class="min-w-0 flex-1">
				<p class="truncate text-sm font-medium">{file.name}</p>
				<p class="text-xs text-muted-foreground">
					{formatBytes(file.size)}
					{#if file.pageCount}
						· {file.pageCount} trang{/if}
					{#if file.encrypted}
						· có mật khẩu{/if}
					{#if file.pageCount === null && !file.error && !file.encrypted}
						· đang đọc{/if}
				</p>
				{#if file.error}
					<p class="text-xs text-destructive">{file.error}</p>
				{/if}
				{#if file.encrypted}
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
			<div class="flex flex-col">
				<Button
					variant="ghost"
					size="icon-xs"
					aria-label="Đưa lên"
					disabled={busy || index === 0}
					onclick={() => onreorder(index, index - 1)}
				>
					<ChevronLeft class="rotate-90" />
				</Button>
				<Button
					variant="ghost"
					size="icon-xs"
					aria-label="Đưa xuống"
					disabled={busy || index === files.length - 1}
					onclick={() => onreorder(index, index + 1)}
				>
					<ChevronRight class="rotate-90" />
				</Button>
			</div>
			<Button
				variant="ghost"
				size="icon-sm"
				aria-label="Bỏ tệp"
				disabled={busy}
				onclick={() => onremove(file.id)}
			>
				<X />
			</Button>
		</li>
	{/each}
</ul>

<style>
	ul.is-dragging li {
		transition: none;
		will-change: transform;
	}
</style>
