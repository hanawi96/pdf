# Sổ

Web app xử lý PDF miễn phí. Giao diện dùng SvelteKit, Tailwind CSS v4 và shadcn-svelte. File vừa được xử lý ngay trên trình duyệt bằng pdf-lib và PDF.js. File quá nặng, hoặc PDF có mật khẩu cần sửa, chỉ được gửi sang backend qpdf sau khi người dùng đồng ý.

## Công cụ

- Ghép PDF
- Tách PDF theo từng trang hoặc khoảng trang
- Xóa trang
- Xoay trang
- Sắp xếp trang bằng kéo thả
- JPG/PNG sang PDF
- PDF sang JPG/PNG
- Đánh số trang

## Cài đặt và chạy local

Cần Node.js 22 trở lên.

```bash
npm install
npm run dev
```

Mở http://localhost:5173.

Kiểm tra mã và build:

```bash
npm test
npm run check
npm run build
npm run preview
```

## Backend qpdf

Backend là một dịch vụ Node riêng, gọi binary `qpdf`. Frontend không chạy qpdf. Docker giới hạn CPU, RAM, số tiến trình và ghi file vào `tmpfs`. Mỗi việc xong sẽ xóa thư mục tạm.

```bash
cd backend
npm install
cd ..
docker compose up --build
```

SvelteKit đọc `QPDF_INTERNAL_URL`, mặc định `http://127.0.0.1:8787`. Khi chạy bản production bằng adapter Node, đặt thêm:

```bash
BODY_SIZE_LIMIT=160M
```

Nếu không dùng Docker mà máy đã có `qpdf` trong PATH:

```bash
cd backend
npm install
npm start
```

Kiểm tra dịch vụ: http://127.0.0.1:8787/health

Cổng được gắn vào `127.0.0.1` để không mở ra mạng ngoài. Đừng publish cổng 8787 ra internet; request nên đi qua `/api/qpdf` của ứng dụng.

## Biến môi trường

Xem `.env.example`.

- `PUBLIC_SITE_URL`: origin dùng cho canonical và sitemap khi build.
- `QPDF_INTERNAL_URL`: địa chỉ backend qpdf, chỉ dùng phía server.
- `PUBLIC_ADSENSE_CLIENT`, `PUBLIC_ADSENSE_SLOT_HOME`, `PUBLIC_ADSENSE_SLOT_TOOL`: để trống nếu chưa bật quảng cáo. Khi đủ cả client và slot, vị trí quảng cáo mới hiện, nằm ngoài vùng kéo thả và nút xử lý.

## Kiến trúc

```
src/lib/pdf          engine, router, worker, preview
src/lib/components   layout, shadcn/ui, công cụ PDF
src/routes           trang chủ, từng công cụ, API proxy
backend              dịch vụ qpdf trong Docker
```

Bộ định tuyến nhìn dung lượng, số trang, loại việc và bộ nhớ thiết bị. Việc sửa PDF thông thường chạy trong Web Worker. Xuất ảnh dùng PDF.js, có đường lui về luồng chính nếu trình duyệt không vẽ được trong worker. Thumbnail chỉ render khi gần vùng nhìn thấy và cache bị giới hạn.

## Giới hạn

- Tối đa khoảng 40 MB hoặc 80 trang trên trình duyệt, thấp hơn với máy yếu và khi xuất ảnh.
- Máy chủ nhận tối đa 150 MB và 800 trang, tối đa 2 việc cùng lúc, mỗi việc 60 giây.
- Chỉ JPG và PNG khi tạo PDF từ ảnh.
- PDF có mật khẩu cần nhập mật khẩu. Mật khẩu không được lưu.
- Sửa file làm chữ ký số hết hiệu lực. Ứng dụng cảnh báo khi phát hiện dấu hiệu chữ ký.
