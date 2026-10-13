<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import Upload from '@lucide/svelte/icons/upload';
	import { Button } from '$lib/components/ui/button';

	let {
		accept,
		multiple = false,
		disabled = false,
		onfiles
	}: {
		accept: string;
		multiple?: boolean;
		disabled?: boolean;
		onfiles?: (files: File[]) => void;
	} = $props();

	let dragging = $state(false);
	let input = $state<HTMLInputElement | null>(null);

	const image = $derived(accept.includes('image'));
	const title = $derived(
		image ? 'Kéo thả ảnh JPG hoặc PNG vào đây' : 'Kéo thả file PDF vào đây'
	);
	const hint = $derived(
		image
			? multiple
				? 'Hoặc chọn ảnh từ thiết bị của bạn · Chọn nhiều ảnh cùng lúc'
				: 'Hoặc chọn ảnh từ thiết bị của bạn'
			: multiple
				? 'Hoặc chọn file từ thiết bị của bạn · Chọn nhiều file cùng lúc'
				: 'Hoặc chọn file từ thiết bị của bạn'
	);
	const action = $derived(image ? 'Thêm ảnh' : 'Thêm file PDF');

	function emit(list: FileList | File[] | null) {
		if (!list || disabled) return;
		const files = [...list];
		if (files.length === 0) return;
		onfiles?.(files);
		if (input) input.value = '';
	}

	function openPicker() {
		if (!disabled) input?.click();
	}
</script>

<div
	class="flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-14 text-center transition-colors {dragging
		? 'border-primary bg-primary/10'
		: 'border-foreground/15 bg-[oklch(0.975_0.008_262)] hover:border-primary/40 dark:border-white/15 dark:bg-[oklch(0.23_0.032_262)] dark:hover:border-white/30'} {disabled
		? 'pointer-events-none opacity-60'
		: ''}"
	ondragover={(event) => {
		event.preventDefault();
		if (!disabled) dragging = true;
	}}
	ondragleave={() => (dragging = false)}
	ondrop={(event) => {
		event.preventDefault();
		dragging = false;
		emit(event.dataTransfer?.files ?? null);
	}}
	onclick={openPicker}
>
	<span
		class="mb-5 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-[oklch(0.32_0.04_262)] dark:text-[oklch(0.78_0.1_262)]"
	>
		<Upload class="size-5" />
	</span>
	<p class="text-lg font-semibold tracking-tight">{title}</p>
	<p class="mt-2 text-sm text-muted-foreground">{hint}</p>
	<Button
		class="mt-6 h-11 rounded-full px-5 text-sm font-semibold"
		type="button"
		{disabled}
		onclick={(event) => {
			event.stopPropagation();
			openPicker();
		}}
	>
		<Plus />
		{action}
	</Button>
	<input
		bind:this={input}
		class="sr-only"
		type="file"
		{accept}
		{multiple}
		{disabled}
		onclick={(event) => event.stopPropagation()}
		onchange={(event) => emit(event.currentTarget.files)}
	/>
</div>
