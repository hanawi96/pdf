<script lang="ts">
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import Download from '@lucide/svelte/icons/download';
	import { Button } from '$lib/components/ui/button';
	import ActionButton from './ActionButton.svelte';
	import { downloadAll, downloadOutput } from '$lib/pdf/download';
	import { formatBytes } from '$lib/pdf/format';
	import type { OutputFile } from '$lib/pdf/types';

	let {
		files,
		onreset,
		autodownload = false
	}: {
		files: OutputFile[];
		onreset?: () => void;
		autodownload?: boolean;
	} = $props();

	const total = $derived(files.reduce((sum, file) => sum + file.data.byteLength, 0));
	let saved = false;

	$effect(() => {
		if (!autodownload || saved || files.length !== 1) return;
		saved = true;
		downloadOutput(files[0]);
	});
</script>

<section class="space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10" aria-live="polite">
	<div class="flex items-start gap-3">
		<CircleCheck class="mt-0.5 size-5 text-primary" />
		<div>
			<h2 class="text-lg font-semibold tracking-tight">Đã xử lý xong</h2>
			<p class="text-sm text-muted-foreground">
				{files.length} tệp · {formatBytes(total)}. File chỉ nằm trên trình duyệt cho đến khi bạn tải
				về.
			</p>
		</div>
	</div>
	<ul class="divide-y divide-border rounded-lg border">
		{#each files as file (file.name)}
			<li class="flex items-center justify-between gap-3 px-3 py-2">
				<div class="min-w-0">
					<p class="truncate text-sm font-medium">{file.name}</p>
					<p class="text-xs text-muted-foreground">{formatBytes(file.data.byteLength)}</p>
				</div>
				{#if files.length > 1}
					<Button variant="outline" size="sm" type="button" onclick={() => downloadOutput(file)}>
						Tải xuống
					</Button>
				{/if}
			</li>
		{/each}
	</ul>
	<div class="space-y-2">
		{#if files.length > 1}
			<ActionButton type="button" onclick={() => downloadAll(files, 'so-ket-qua.zip')}>
				<Download />
				Tải tất cả
			</ActionButton>
		{:else if files[0]}
			<ActionButton type="button" onclick={() => downloadOutput(files[0])}>
				<Download />
				Tải xuống
			</ActionButton>
		{/if}
		<Button class="w-full" variant="ghost" type="button" onclick={onreset}>Xử lý tệp khác</Button>
	</div>
</section>
