<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import X from '@lucide/svelte/icons/x';
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

	let draggedId = $state<string | null>(null);
	let targetId = $state<string | null>(null);

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
</script>

<ul id="pm-files">
	{#each files as file, index (file.id)}
		<li
			class="filecard"
			class:drag-active={draggedId === file.id}
			class:drag-target={targetId === file.id}
			draggable={canDrag()}
			data-id={file.id}
			ondragstart={(event) => onDragStart(event, file.id)}
			ondragover={(event) => onDragOver(event, file.id)}
			ondrop={(event) => onDrop(event, file.id)}
			ondragend={onDragEnd}
		>
			<span class="grip" aria-hidden="true">
				<GripVertical />
			</span>
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
	ul {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.filecard {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 24px;
		min-height: 100px;
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: 14px;
		color: var(--card-foreground);
		transition:
			background 180ms ease,
			border-color 180ms ease,
			opacity 180ms ease;
	}

	:global(.dark) .filecard {
		background: #191c23;
		border-color: #303541;
	}

	.filecard:hover {
		background: color-mix(in oklch, var(--foreground) 4%, var(--card));
		border-color: color-mix(in oklch, var(--foreground) 22%, var(--border));
	}

	:global(.dark) .filecard:hover {
		background: #1e222b;
		border-color: #48516a;
	}

	.grip {
		display: inline-flex;
		flex: none;
		color: #687187;
		cursor: grab;
	}

	.grip :global(svg) {
		width: 24px;
		height: 24px;
	}

	.grip:active {
		cursor: grabbing;
	}

	.filecard.drag-active {
		opacity: 0.38;
	}

	.filecard.drag-target {
		border-color: #6b89ff;
		box-shadow: 0 0 0 1px #5d81ff;
	}

	@media (prefers-reduced-motion: reduce) {
		.filecard {
			transition: none;
		}
	}
</style>
