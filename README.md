# QR Art Studio 🎨

**QR Art Studio** là một ứng dụng tạo mã QR cao cấp, cho phép bạn tùy biến mã QR theo phong cách nghệ thuật, hiện đại và bảo mật tuyệt đối. Ứng dụng hoạt động 100% ngoại tuyến (offline), đảm bảo dữ liệu của bạn không bao giờ rời khỏi thiết bị.

![QR Art Studio Preview](public/icon.svg)

## ✨ Tính năng nổi bật

- **Tùy biến hình dáng nghệ thuật**: Lựa chọn giữa nhiều kiểu điểm ảnh (Square, Dots, Rounded) và kiểu mắt góc (Eye ball/Frame) khác nhau.
- **Màu sắc Gradient**: Hỗ trợ dải màu chuyển sắc (Linear Gradient) mượt mà, chuyên nghiệp.
- **Watermark & Logo**: Tích hợp logo vào giữa mã QR với tính năng tự động xóa pixel nền để tăng khả năng quét.
- **Nhãn chữ (Labeling)**: Thêm tiêu đề trên và dưới mã QR với tùy chỉnh font chữ, cỡ chữ và độ dày.
- **Xuất bản đa định dạng**: Hỗ trợ tải về định dạng **PNG**, **JPG** và đặc biệt là **Vector SVG** chất lượng cao.
- **Bảo mật & Riêng tư**: Hoạt động hoàn toàn trên trình duyệt, không cần máy chủ, không lưu trữ dữ liệu người dùng.
- **Tối ưu PWA**: Sẵn sàng cài đặt như một ứng dụng gốc trên điện thoại và máy tính.

## 🛠 Công nghệ sử dụng

- **Vite**: Công cụ build frontend hiện đại, tốc độ cao.
- **TypeScript**: Đảm bảo mã nguồn ổn định và dễ bảo trì.
- **SCSS (Common Class Architecture)**: Hệ thống style được thiết kế theo hướng Utility-First và Common Components, giúp giao diện đồng bộ và tối ưu dung lượng.
- **qrcode-generator**: Thư viện lõi tạo ma trận QR Code chính xác.

## 🚀 Hướng dẫn cài đặt

### Yêu cầu hệ thống
- Node.js (phiên bản 16 trở lên)
- npm hoặc yarn

### Các bước cài đặt

1. Clone dự án về máy:
   ```bash
   git clone https://github.com/ttquang1063750/qr.git
   cd qr-art-studio
   ```

2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```

3. Chạy ứng dụng ở chế độ phát triển (Development):
   ```bash
   npm run dev
   ```
   Ứng dụng sẽ chạy tại địa chỉ `http://localhost:8000`.

## 📦 Xây dựng bản chính thức (Production)

Để tạo bản build tối ưu cho môi trường production:

```bash
npm run build
```

Kết quả sẽ nằm trong thư mục `dist/`, sẵn sàng để deploy lên các nền tảng như GitHub Pages, Netlify hoặc Vercel.

## 📂 Cấu trúc thư mục Styles

Dự án sử dụng kiến trúc CSS tùy chỉnh để tối đa hóa tính tái sử dụng:
- `src/styles/_variables.scss`: Quản lý hệ thống màu sắc, font chữ và các biến thiết kế.
- `src/styles/_common.scss`: Chứa các lớp tiện ích (Utility classes) và các thành phần dùng chung (Common components).
- `src/styles/main.scss`: File tổng hợp hệ thống style.

---

Thiết kế và phát triển bởi **QR Art Studio Team**. &copy; 2026.
