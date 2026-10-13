<script lang="ts">
	import { renderCover } from '$lib/pdf/preview';

	let {
		file,
		password = '',
		active
	}: {
		file: File;
		password?: string;
		active: boolean;
	} = $props();

	let url = $state<string | null>(null);
	let node = $state<HTMLDivElement | null>(null);

	$effect(() => {
		const source = file;
		const enabled = active;
		const secret = password;
		const host = node;
		if (!host || !enabled) return;

		let objectUrl: string | null = null;
		let cancelled = false;
		const controller = new AbortController();
		const maxEdge = Math.round(56 * Math.min(window.devicePixelRatio || 1, 2));
		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries.some((entry) => entry.isIntersecting)) return;
				observer.disconnect();
				void paint();
			},
			{ rootMargin: '280px 0px' }
		);
		observer.observe(host);

		async function paint() {
			try {
				const bytes = new Uint8Array(await source.arrayBuffer());
				if (cancelled) return;
				const rendered = await renderCover(bytes, secret || undefined, {
					maxEdge,
					signal: controller.signal
				});
				if (cancelled || !rendered) {
					if (rendered) URL.revokeObjectURL(rendered);
					return;
				}
				objectUrl = rendered;
				url = rendered;
			} catch {
				if (!cancelled) url = null;
			}
		}

		return () => {
			cancelled = true;
			controller.abort();
			observer.disconnect();
			if (objectUrl) URL.revokeObjectURL(objectUrl);
			url = null;
		};
	});
</script>

<div bind:this={node} class="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted sm:size-14">
	{#if url}
		<img src={url} alt="" class="size-full object-contain" decoding="async" draggable="false" />
	{/if}
</div>
