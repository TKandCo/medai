# Đưa MEDAI lên GitHub và tên miền medai.thuankhoi.com

Toàn bộ miễn phí. Làm một lần, sau đó mỗi lần đẩy lên `main` web tự cập nhật.

> **Vì sao dùng `medai.thuankhoi.com` mà không dùng thẳng `thuankhoi.com`?**
> Tên miền `thuankhoi.com` hiện đang trỏ về Squarespace (website hiện có của công ty).
> Dùng tên miền con `medai.` thì website công ty giữ nguyên. Muốn đổi, xem mục cuối.

## 1. Tạo kho trên GitHub

1. Vào https://github.com/new (hoặc trong tổ chức **TKandCo**: *New repository*).
2. Tên kho: `medai`. Chọn **Public** (GitHub Pages miễn phí cho kho công khai).
3. **Không** tích "Add a README", ".gitignore" hay "license" — dự án đã có sẵn.
4. Nếu chủ kho không phải `TKandCo`, sửa dòng `repo` trong `content/_data/site.json` cho đúng.

## 2. Đẩy mã lên

Kho trên máy đã được khởi tạo sẵn với commit đầu tiên ở nhánh `main`. Chạy trong thư mục `D:\MEDAI`:

```bash
git remote add origin https://github.com/TKandCo/medai.git
git push -u origin main
```

## 3. Bật GitHub Pages

1. Trong kho: **Settings → Pages**.
2. Mục **Build and deployment → Source**: chọn **GitHub Actions**.
3. Vào tab **Actions**, đợi lượt chạy "Kiểm tra và đưa lên web" chuyển xanh (khoảng 1–2 phút).
   Web lúc này chạy ở `https://tkandco.github.io/medai/`.

## 4. Gắn tên miền medai.thuankhoi.com

**a. Thêm bản ghi DNS** (thuankhoi.com đang quản lý DNS ở Squarespace):

1. Đăng nhập Squarespace → **Domains** → `thuankhoi.com` → **DNS** (DNS Settings).
2. Thêm bản ghi mới (Custom record):

| Loại | Host | Giá trị |
|---|---|---|
| CNAME | `medai` | `tkandco.github.io` |

   Nếu kho nằm ở tài khoản cá nhân, giá trị là `<ten-tai-khoan>.github.io`.
   **Không** sửa các bản ghi A hiện có của `thuankhoi.com`.

**b. Khai báo trên GitHub:**

1. Kho → **Settings → Pages → Custom domain**: nhập `medai.thuankhoi.com` → **Save**.
2. Đợi GitHub kiểm tra DNS (vài phút đến vài giờ), rồi tích **Enforce HTTPS**.

**c. (Nên làm) Xác minh tên miền** để không ai khác chiếm được tên miền con:
Tổ chức TKandCo → **Settings → Pages → Add a domain** → nhập `thuankhoi.com`, thêm bản ghi TXT mà GitHub đưa ra vào DNS ở Squarespace.

> File `site/CNAME` ghi sẵn `medai.thuankhoi.com` để tham khảo. Với cách đưa lên bằng GitHub Actions,
> tên miền được quyết định ở bước 4b, không phải bởi file này.

## 5. Kiểm tra

- Mở https://medai.thuankhoi.com — thấy trang chủ "Sổ cái Y học cổ truyền".
- Mở một trang bất kỳ, bấm "Xem bản gốc của trang này" — phải mở đúng file trên GitHub.

## Khi muốn dùng thẳng thuankhoi.com

Việc này **thay thế website Squarespace hiện tại**. Nếu vẫn muốn:

1. Ở Squarespace, thay các bản ghi A của `@` bằng 4 địa chỉ của GitHub Pages:
   `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`; thêm CNAME `www` → `tkandco.github.io`.
2. GitHub → Settings → Pages → Custom domain: `thuankhoi.com`.
3. Sửa `content/_data/site.json` (`domain`) và `site/CNAME` cho khớp.

## Sự cố thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| Actions báo đỏ ở bước "Kiểm tra nội dung" | Mở lượt chạy, đọc dòng `LỖI:` — sửa file được nêu, đẩy lại |
| Tên miền báo "DNS check unsuccessful" | Đợi thêm; kiểm tra bản ghi CNAME `medai` đúng giá trị `…github.io` |
| Web vẫn hiện bản cũ | Tải lại trang (Ctrl+F5); web có lưu sẵn để dùng khi mất mạng |
