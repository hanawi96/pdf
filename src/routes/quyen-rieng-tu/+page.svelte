<script lang="ts">
	import Seo from '$lib/components/seo/Seo.svelte';
</script>

<Seo
	title="Quyền riêng tư"
	description="Cách Sổ xử lý file PDF, mật khẩu, quảng cáo và tệp tạm trên máy chủ."
	path="/quyen-rieng-tu"
/>

<article class="mx-auto max-w-3xl space-y-4 px-4 py-14">
	<h1 class="text-3xl font-semibold tracking-tight">Quyền riêng tư</h1>
	<p class="text-muted-foreground text-sm leading-7">
		Với file nằm trong ngưỡng xử lý cục bộ, nội dung PDF không được tải lên máy chủ của Sổ. Trình duyệt đọc, sửa và tạo file mới ngay trên thiết bị của bạn.
	</p>
	<p class="text-muted-foreground text-sm leading-7">
		Khi file quá nặng, có mật khẩu cần qpdf mở, hoặc máy không đủ sức xử lý, Sổ hiện hộp thoại giải thích. File chỉ được gửi sau khi bạn bấm đồng ý. Máy chủ qpdf ghi tệp vào thư mục tạm, xử lý, trả kết quả rồi xóa thư mục đó trong mọi trường hợp thành công hoặc lỗi.
	</p>
	<p class="text-muted-foreground text-sm leading-7">
		Mật khẩu PDF chỉ nằm trong bộ nhớ của phiên làm việc để mở file. Sổ không tạo tài khoản và không lưu mật khẩu.
	</p>
	<p class="text-muted-foreground text-sm leading-7">
		Nếu chủ site bật Google AdSense, trình duyệt sẽ tải script quảng cáo của Google và có thể dùng cookie theo chính sách của Google. Vị trí quảng cáo nằm ngoài vùng kéo thả và nút xử lý để giảm nguy cơ bấm nhầm. Khi chưa cấu hình mã quảng cáo, các vị trí này không chiếm chỗ.
	</p>
</article>
