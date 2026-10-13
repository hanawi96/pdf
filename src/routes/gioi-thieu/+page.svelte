<script lang="ts">
	import Seo from '$lib/components/seo/Seo.svelte';
</script>

<Seo
	title="Giới thiệu Sổ"
	description="Sổ là bộ công cụ PDF miễn phí, ưu tiên xử lý trên trình duyệt và chỉ dùng máy chủ khi bạn đồng ý."
	path="/gioi-thieu"
/>

<article class="mx-auto max-w-3xl space-y-4 px-4 py-14">
	<h1 class="text-3xl font-semibold tracking-tight">Giới thiệu Sổ</h1>
	<p class="text-muted-foreground text-sm leading-7">
		Sổ là một web app xử lý PDF cho công việc văn phòng hằng ngày: ghép file, tách trang, xóa trang thừa, xoay, sắp xếp, chuyển ảnh và đánh số trang.
	</p>
	<p class="text-muted-foreground text-sm leading-7">
		Phiên bản này không có tài khoản, không có cơ sở dữ liệu người dùng. Phần lớn tác vụ dùng pdf-lib và PDF.js ngay trong trình duyệt. Web Worker giữ giao diện mượt khi file vừa. Nếu file vượt ngưỡng an toàn của máy bạn, Sổ hỏi trước khi gửi sang dịch vụ qpdf chạy trong Docker.
	</p>
	<p class="text-muted-foreground text-sm leading-7">
		Các việc như OCR, chuyển PDF sang Word hay nén chuyên sâu chưa nằm trong phiên bản đầu. Những công cụ hiện có đều tạo file thật để tải về, không dùng dữ liệu giả.
	</p>
</article>
