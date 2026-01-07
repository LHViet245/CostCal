# Tính Giá Bán Đa Kênh

App tính giá bán cho 3 kênh bán hàng: **Offline**, **Grab**, **Shopee**.

## ✨ Tính năng

- 📦 2 chế độ nhập giá vốn (Nhanh/Chi tiết)
- 📈 Tính toán tự động cho 3 kênh
- 🔄 Làm tròn LÊN theo bước từng kênh
- ⚠️ Bảo vệ lỗi khi tổng phí ≥ 100%
- 💾 Lưu cài đặt tự động
- 📱 PWA - Cài như app mobile

## 🚀 Sử dụng

### Chạy local

```bash
npx serve .
```

### Deploy Cloudflare Pages

1. Fork/clone repo này
2. Kết nối với Cloudflare Pages
3. Build command: để trống
4. Deploy!

## 📐 Công thức

```
Giá vốn thực = Giá nhập + Vận chuyển + Hao hụt + Rủi ro
Giá bán = (Giá vốn thực + Lãi mong muốn) ÷ (1 - Tổng % phí)
```

## 📄 License

MIT
