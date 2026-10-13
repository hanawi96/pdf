<script lang="ts">
	import { page } from '$app/state';
	import { siteName } from '$lib/content/site';

	let {
		title,
		description,
		path,
		keywords = '',
		jsonLd = null
	}: {
		title: string;
		description: string;
		path: string;
		keywords?: string;
		jsonLd?: Record<string, unknown> | Record<string, unknown>[] | null;
	} = $props();

	const canonical = $derived(new URL(path, page.url.origin).href);
	const fullTitle = $derived(title.includes(siteName) ? title : `${title} | ${siteName}`);
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={description} />
	{#if keywords}
		<meta name="keywords" content={keywords} />
	{/if}
	<link rel="canonical" href={canonical} />
	<meta property="og:site_name" content={siteName} />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonical} />
	<meta property="og:locale" content="vi_VN" />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={description} />
	{#if jsonLd}
		{@html `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`}
	{/if}
</svelte:head>
