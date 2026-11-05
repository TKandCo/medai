# MEDAI — Sổ cái Y học cổ truyền

Nguồn tra cứu Y học cổ truyền **công khai, miễn phí, phi thương mại**, lấy *Hải Thượng Y Tông Tâm Lĩnh* của Hải Thượng Lãn Ông Lê Hữu Trác làm trục. Mỗi mục trong sổ đều ghi rõ sách, quyển, trang và đường dẫn tới bản gốc, để ai cũng tự kiểm lại được.

Web: **https://medai.thuankhoi.com** (sau khi hoàn tất [docs/TRIEN-KHAI.md](docs/TRIEN-KHAI.md))

## Cấu trúc

| Thư mục | Nội dung |
|---|---|
| `content/` | **Nội dung sổ cái** — mỗi trang là một file Markdown. `thuat-ngu/`, `vi-thuoc/`, `bai-thuoc/`, `duong-sinh/`, `so-tay/` |
| `content/_data/` | `site.json` (tên miền, đường dẫn kho), `danh-thu.json` (danh mục sách nguồn) |
| `rules/` | Quy tắc an toàn dạng dữ liệu: `phan-uy.json` (Thập bát phản, Thập cửu úy), `thai-ky.json`, `vi-doc.json` |
| `templates/` | Mẫu để viết trang mới |
| `site/` | Web app (HTML/CSS/JS thuần, chạy được khi mất mạng). **Thư mục được đưa lên web** |
| `tools/` | `build.mjs` (kiểm tra + dựng dữ liệu), `serve.mjs` (xem thử trên máy) |
| `tests/` | Kiểm thử tự động |
| `docs/` | Kế hoạch, hướng dẫn viết bài, triển khai, đóng góp |
| `.github/workflows/` | Tự kiểm tra và đưa lên GitHub Pages mỗi lần đẩy lên `main` |

## Lệnh hay dùng

Cần Node.js 20 trở lên. Không cần cài thêm thư viện nào.

```bash
npm run dev      # dựng dữ liệu rồi mở http://localhost:8780
npm run check    # kiểm tra nội dung + chạy test (giống GitHub chạy)
npm run build    # chỉ dựng site/data/db.json
```

## Viết thêm một trang

1. Sao chép mẫu trong `templates/` vào đúng thư mục trong `content/`, đặt tên file không dấu, ví dụ `content/vi-thuoc/bach-truat.md`.
2. Điền thông tin, ghi nguồn đến quyển/trang.
3. `npm run check` — sửa hết **LỖI** (cảnh báo thì có thể để sau).
4. Đẩy lên GitHub; web tự cập nhật sau khoảng 1–2 phút.

Chi tiết: [docs/HUONG-DAN-VIET-BAI.md](docs/HUONG-DAN-VIET-BAI.md).

## Nguyên tắc

- **Không có gì thiếu nguồn.** Trang "đã đối chiếu" mà thiếu nguồn sẽ bị chặn, không lên web.
- **Nguyên văn tách khỏi diễn giải.** Chỗ các danh y nói khác nhau thì ghi cả hai.
- **An toàn tự động.** Mọi bài thuốc được kiểm theo Thập bát phản, Thập cửu úy, thai kỵ, vị có độc.
- **Bản quyền.** Nguyên văn chữ Hán thuộc phạm vi công cộng. Bản dịch hiện đại còn bản quyền: chỉ tham khảo, không chép lại.

## Giấy phép

- Mã nguồn: [MIT](LICENSE)
- Nội dung trong `content/` và `rules/`: [CC BY-SA 4.0](LICENSE-CONTENT.md)
