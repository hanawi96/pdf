<script lang="ts">
	import { page } from '$app/state';
	import AdSlot from '$lib/components/ads/AdSlot.svelte';
	import Seo from '$lib/components/seo/Seo.svelte';
	import { siteName } from '$lib/content/site';
	import type { ToolDefinition } from '$lib/content/tools';
	import { toolIcons } from './icons';
	import ToolWorkspace from './ToolWorkspace.svelte';

	let { tool }: { tool: ToolDefinition } = $props();
	const Icon = $derived(toolIcons[tool.id]);
	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebApplication',
				name: `${tool.title} — ${siteName}`,
				applicationCategory: 'BusinessApplication',
				operatingSystem: 'Web',
				offers: { '@type': 'Offer', price: '0', priceCurrency: 'VND' },
				description: tool.description,
				inLanguage: 'vi',
				url: new URL(`/${tool.slug}`, page.url.origin).href
			},
			{
				'@type': 'HowTo',
				name: tool.title,
				step: tool.steps.map((text, index) => ({
					'@type': 'HowToStep',
					position: index + 1,
					text
				}))
			},
			{
				'@type': 'FAQPage',
				mainEntity: tool.faqs.map((faq) => ({
					'@type': 'Question',
					name: faq.question,
					acceptedAnswer: { '@type': 'Answer', text: faq.answer }
				}))
			}
		]
	});
</script>

<Seo
	title={tool.title}
	description={tool.description}
	keywords={tool.keywords}
	path="/{tool.slug}"
	{jsonLd}
/>

<section class="mx-auto max-w-6xl px-4 pt-6 pb-4 sm:pt-10 sm:pb-6">
	<div class="flex items-start gap-3">
		<span class="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
			<Icon class="size-5" />
		</span>
		<div>
			<h1 class="text-2xl font-semibold tracking-tight text-balance sm:text-4xl">{tool.title}</h1>
			<p class="text-muted-foreground mt-2 max-w-2xl text-base leading-7">{tool.short}</p>
		</div>
	</div>
</section>

<section class="mx-auto max-w-6xl px-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
	<ToolWorkspace {tool} />
</section>

<div class="pb-8">
	<AdSlot placement="tool" />
</div>

<section class="mx-auto grid max-w-6xl gap-10 px-4 pt-4 pb-16 lg:grid-cols-[minmax(0,1fr)_18rem]">
	<article class="space-y-4">
		<h2 class="text-2xl font-semibold tracking-tight">Cách dùng {tool.title}</h2>
		{#each tool.paragraphs as paragraph, index (index)}
			<p class="text-muted-foreground text-sm leading-7">{paragraph}</p>
		{/each}
		<ol class="mt-4 space-y-3">
			{#each tool.steps as step, index (step)}
				<li class="flex gap-3 text-sm">
					<span class="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs">
						{index + 1}
					</span>
					<span class="pt-0.5">{step}</span>
				</li>
			{/each}
		</ol>
		<h2 class="pt-6 text-2xl font-semibold tracking-tight">Câu hỏi thường gặp</h2>
		<div class="space-y-3">
			{#each tool.faqs as faq (faq.question)}
				<details class="bg-card ring-foreground/10 rounded-xl px-4 py-3 ring-1">
					<summary class="cursor-pointer text-sm font-medium">{faq.question}</summary>
					<p class="text-muted-foreground mt-2 text-sm leading-6">{faq.answer}</p>
				</details>
			{/each}
		</div>
	</article>
	<aside class="text-muted-foreground space-y-3 text-sm leading-6">
		<p class="text-foreground font-medium">Trước khi xử lý</p>
		<p>File vừa và nhỏ được xử lý trên trình duyệt. Không cần đăng nhập.</p>
		<p>PDF có mật khẩu cần bạn nhập mật khẩu. Mật khẩu không được lưu.</p>
		<p>Nếu tài liệu đã ký số, bản kết quả sẽ không còn chữ ký hợp lệ.</p>
	</aside>
</section>
