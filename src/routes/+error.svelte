<script lang="ts">
	import { page } from '$app/state';
	import Seo from '$lib/components/seo/Seo.svelte';
	import { Button } from '$lib/components/ui/button';
</script>

<Seo title="Không tìm thấy trang" description="Trang này không có trên Sổ." path={page.url.pathname} />

<section class="mx-auto max-w-xl px-4 py-24 text-center">
	<p class="text-primary text-sm font-medium">{page.status}</p>
	<h1 class="mt-2 text-3xl font-semibold tracking-tight">
		{page.error?.message || 'Đã có lỗi khi mở trang'}
	</h1>
	<Button class="mt-6" href="/">Về trang chủ</Button>
</section>
