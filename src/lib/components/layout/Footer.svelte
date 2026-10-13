<script lang="ts">
	import { siteName, siteTagline } from '$lib/content/site';
</script>

<footer class="border-t">
	<div class="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
		<div class="space-y-2">
			<p class="font-semibold">{siteName}</p>
			<p class="text-muted-foreground text-sm leading-6">{siteTagline}. Không cần tài khoản.</p>
		</div>
		<div>
			<p class="text-sm font-medium">Sản phẩm</p>
			<ul class="text-muted-foreground mt-3 space-y-2 text-sm">
				<li><a class="hover:text-foreground" href="/ghep-pdf">Ghép PDF</a></li>
				<li><a class="hover:text-foreground" href="/tach-pdf">Tách PDF</a></li>
				<li><a class="hover:text-foreground" href="/anh-sang-pdf">Ảnh sang PDF</a></li>
				<li><a class="hover:text-foreground" href="/pdf-sang-anh">PDF sang ảnh</a></li>
			</ul>
		</div>
		<div>
			<p class="text-sm font-medium">Thông tin</p>
			<ul class="text-muted-foreground mt-3 space-y-2 text-sm">
				<li><a class="hover:text-foreground" href="/gioi-thieu">Giới thiệu</a></li>
				<li><a class="hover:text-foreground" href="/quyen-rieng-tu">Quyền riêng tư</a></li>
				<li><a class="hover:text-foreground" href="/dieu-khoan">Điều khoản</a></li>
			</ul>
		</div>
		<div>
			<p class="text-sm font-medium">Xử lý file</p>
			<p class="text-muted-foreground mt-3 text-sm leading-6">
				Công cụ ưu tiên chạy trên trình duyệt. File lớn chỉ rời máy bạn khi bạn đồng ý dùng máy chủ qpdf.
			</p>
		</div>
	</div>
	<div class="text-muted-foreground border-t px-4 py-4 text-center text-xs">
		© {new Date().getFullYear()} {siteName}. Công cụ PDF miễn phí.
	</div>
</footer>
