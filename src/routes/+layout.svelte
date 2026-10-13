<script lang="ts">
	import { PUBLIC_ADSENSE_CLIENT } from '$app/env/public';
	import { ModeWatcher, mode } from 'mode-watcher';
	import Footer from '$lib/components/layout/Footer.svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import favicon from '$lib/assets/favicon.svg';
	import './layout.css';

	let { children } = $props();
	const adsClient = PUBLIC_ADSENSE_CLIENT;
	const themeColor = $derived(mode.current === 'dark' ? '#18181b' : '#f4f6fb');
</script>

<ModeWatcher />
<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="theme-color" content={themeColor} />
	{#if adsClient}
		<script
			async
			src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adsClient)}`}
			crossorigin="anonymous"
		></script>
	{/if}
</svelte:head>

<Tooltip.Provider>
	<a
		href="#noi-dung"
		class="bg-primary text-primary-foreground sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:px-3 focus:py-2"
	>
		Đi tới nội dung
	</a>
	<Header />
	<main id="noi-dung">
		{@render children()}
	</main>
	<Footer />
	<Toaster />
</Tooltip.Provider>
