<script lang="ts">
	import {
		PUBLIC_ADSENSE_CLIENT,
		PUBLIC_ADSENSE_SLOT_HOME,
		PUBLIC_ADSENSE_SLOT_TOOL
	} from '$app/env/public';

	let { placement }: { placement: 'home' | 'tool' } = $props();

	const client = PUBLIC_ADSENSE_CLIENT;
	const slot = $derived(placement === 'home' ? PUBLIC_ADSENSE_SLOT_HOME : PUBLIC_ADSENSE_SLOT_TOOL);
	let node = $state<HTMLElement | null>(null);

	$effect(() => {
		if (!client || !slot || !node) return;
		const ads = ((window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle ??= []);
		try {
			ads.push({});
		} catch {
			// The ad script can reject a second push while the unit is already filled.
		}
	});
</script>

{#if client && slot}
	<aside class="mx-auto w-full max-w-6xl px-4" aria-label="Quảng cáo">
		<div bind:this={node} class="bg-muted/40 min-h-24 overflow-hidden rounded-xl px-2 py-3">
			<ins
				class="adsbygoogle"
				style="display:block"
				data-ad-client={client}
				data-ad-slot={slot}
				data-ad-format="auto"
				data-full-width-responsive="true"
			></ins>
		</div>
	</aside>
{/if}
