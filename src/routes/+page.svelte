<script lang="ts">
	import Shield from '@lucide/svelte/icons/shield';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Zap from '@lucide/svelte/icons/zap';
	import AdSlot from '$lib/components/ads/AdSlot.svelte';
	import Seo from '$lib/components/seo/Seo.svelte';
	import ToolCard from '$lib/components/pdf/ToolCard.svelte';
	import { Button } from '$lib/components/ui/button';
	import { siteDescription, siteName } from '$lib/content/site';
	import { tools } from '$lib/content/tools';

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: siteName,
		applicationCategory: 'BusinessApplication',
		operatingSystem: 'Web',
		description: siteDescription,
		offers: { '@type': 'Offer', price: '0', priceCurrency: 'VND' },
		inLanguage: 'vi'
	};

	const benefits = [
		{
			icon: Shield,
			title: 'File ở lại trên máy',
			text: 'Ghép, tách, xoay và đánh số trang chạy trong trình duyệt. File chỉ rời máy khi bạn đồng ý xử lý bản quá nặng.'
		},
		{
			icon: Zap,
			title: 'Đủ nhanh cho việc hằng ngày',
			text: 'Ảnh thu nhỏ được vẽ theo vùng nhìn thấy. Tác vụ nặng chạy trong Web Worker để giao diện vẫn phản hồi.'
		},
		{
			icon: Sparkles,
			title: 'Không cần tài khoản',
			text: 'Mở công cụ, thả file, tải kết quả. Không có cơ sở dữ liệu người dùng ở phiên bản này.'
		}
	];
</script>

<Seo title={`${siteName} — công cụ PDF miễn phí`} description={siteDescription} path="/" {jsonLd} />

<section class="hero-surface border-b">
	<div class="mx-auto max-w-6xl px-4 py-16 sm:py-24">
		<p class="text-primary text-sm font-medium">Miễn phí · Xử lý trên trình duyệt</p>
		<h1 class="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
			Công cụ PDF gọn, riêng tư và đủ rõ cho công việc mỗi ngày
		</h1>
		<p class="text-muted-foreground mt-4 max-w-2xl text-lg leading-8">
			Ghép, tách, xoay, sắp xếp trang và chuyển đổi ảnh mà không cần tạo tài khoản. Sổ hỏi ý bạn trước khi một file quá nặng phải rời khỏi máy.
		</p>
		<div class="mt-8 flex flex-wrap gap-3">
			<Button href="/ghep-pdf" size="lg">Ghép PDF</Button>
			<Button href="#cong-cu" variant="outline" size="lg">Xem 8 công cụ</Button>
		</div>
	</div>
</section>

<section id="cong-cu" class="mx-auto max-w-6xl px-4 py-16">
	<div class="mb-8 flex items-end justify-between gap-4">
		<div>
			<h2 class="text-2xl font-semibold tracking-tight">Tám công cụ đang dùng được</h2>
			<p class="text-muted-foreground mt-2 text-sm">Mỗi công cụ có trang riêng, hướng dẫn và kết quả tải về thật.</p>
		</div>
	</div>
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		{#each tools as tool (tool.id)}
			<ToolCard {tool} />
		{/each}
	</div>
</section>

<section class="mx-auto grid max-w-6xl gap-4 px-4 pb-8 md:grid-cols-3">
	{#each benefits as benefit (benefit.title)}
		{@const Icon = benefit.icon}
		<article class="bg-card ring-foreground/10 rounded-xl p-5 ring-1">
			<Icon class="text-primary size-5" />
			<h3 class="mt-4 font-semibold">{benefit.title}</h3>
			<p class="text-muted-foreground mt-2 text-sm leading-6">{benefit.text}</p>
		</article>
	{/each}
</section>

<div class="py-8">
	<AdSlot placement="home" />
</div>

<section class="mx-auto max-w-6xl px-4 py-12">
	<h2 class="text-2xl font-semibold tracking-tight">Cách Sổ xử lý một file</h2>
	<ol class="mt-6 grid gap-4 md:grid-cols-3">
		<li class="rounded-xl border p-5">
			<p class="text-primary text-sm font-medium">01</p>
			<h3 class="mt-2 font-semibold">Thả file vào công cụ</h3>
			<p class="text-muted-foreground mt-2 text-sm leading-6">PDF hoặc ảnh được đọc cục bộ. Thumbnail chỉ hiện khi bạn kéo tới trang đó.</p>
		</li>
		<li class="rounded-xl border p-5">
			<p class="text-primary text-sm font-medium">02</p>
			<h3 class="mt-2 font-semibold">Chỉnh rồi bấm xử lý</h3>
			<p class="text-muted-foreground mt-2 text-sm leading-6">Bộ định tuyến nhìn dung lượng, số trang và máy đang dùng để chọn xử lý tại chỗ hoặc hỏi bạn.</p>
		</li>
		<li class="rounded-xl border p-5">
			<p class="text-primary text-sm font-medium">03</p>
			<h3 class="mt-2 font-semibold">Tải kết quả</h3>
			<p class="text-muted-foreground mt-2 text-sm leading-6">Một file hoặc gói zip. Bộ nhớ xem trước được giải phóng sau khi xong.</p>
		</li>
	</ol>
</section>
