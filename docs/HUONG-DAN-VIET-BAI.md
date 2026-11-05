# Hướng dẫn viết bài cho sổ cái

## Quy trình một trang

1. **Chọn nguồn:** mở trang gốc (ảnh Hán văn trên thư viện số, hoặc ảnh chụp trang sách).
2. **Soạn nháp:** sao chép mẫu trong `templates/`, điền theo nguồn. Có thể nhờ Claude soạn nháp —
   luôn đưa kèm trang gốc, không để soạn theo trí nhớ.
3. **Đối chiếu:** so từng ý, từng liều lượng với trang gốc. Chỗ các sách nói khác nhau thì ghi cả hai.
4. **Đổi trạng thái:** khi đã đối chiếu xong, đổi `trang_thai: nhap` → `trang_thai: da-doi-chieu`.
5. **Kiểm tra:** `npm run check`, rồi đẩy lên GitHub.

Sửa nhanh không cần máy: mở file trên GitHub, bấm biểu tượng bút chì, sửa, bấm *Commit changes*.

## Tên file

Viết thường, không dấu, nối bằng `-`: `Bạch truật` → `bach-truat.md`. Tên file chính là mã của trang,
dùng để liên kết: `[[bach-truat]]`.

## Các trường

| Trường | Bắt buộc với | Ghi chú |
|---|---|---|
| `ten` | mọi trang | Tên tiếng Việt |
| `ten_han` | — | Chữ Hán |
| `ten_khac` | — | `[Tên 1, Tên 2]`. Ô kiểm chứng nhận ra cả tên khác |
| `tom_tat` | mọi trang | Một câu ai cũng hiểu |
| `tinh`, `vi`, `quy_kinh` | vị thuốc | |
| `thanh_phan` | bài thuốc | Mỗi dòng `Tên vị \| vai trò \| liều`. Vai trò: quân, thần, tá, sứ |
| `muc_an_toan` | vị thuốc, bài thuốc | `xanh` tự dùng được · `vang` cần đúng thể bệnh · `do` không tự dùng |
| `trang_thai` | — | `nhap` (mặc định) hoặc `da-doi-chieu` |
| `nguon` | khi `da-doi-chieu` | Mỗi dòng `Sách · tập · quyển · trang \| https://link-trang-goc` |
| `lien_quan` | — | `[ma-trang-1, ma-trang-2]` |

Các trường khác (`cong_nang`, `chu_tri`, `lieu`, `bao_che`, `kieng_ky`, `doc_tinh`, `xuat_xu`,
`phap_tri`, `cach_dung`, `gia_giam`…) sẽ hiện thành bảng thông tin.

## Phần nội dung

- `## Tiêu đề` cho từng phần; `**đậm**`, `*nghiêng*`; danh sách bằng `- `.
- Nguyên văn chữ Hán đặt trong trích dẫn: dòng bắt đầu bằng `> `.
- Liên kết trang khác: `[[ma-trang]]` hoặc `[[ma-trang|chữ hiển thị]]`.
- Thuật ngữ: ba phần `## Tầng 1 · …`, `## Tầng 2 · …`, `## Tầng 3 · …` hiện thành ba thẻ.

## Web sẽ chặn (LỖI) khi

- Thiếu trường bắt buộc, sai giá trị `muc_an_toan` / `trang_thai`.
- Trang `da-doi-chieu` không có nguồn, hoặc nguồn không ghi quyển/trang/đường dẫn.
- Vị có tên trong `rules/vi-doc.json` mục `rat_doc` mà không để `muc_an_toan: do`.
- Vị có độc đã đối chiếu mà thiếu `lieu` hoặc `bao_che`.
- Tên file có dấu hoặc trùng mã.

## Web chỉ nhắc (cảnh báo) khi

- Bài thuốc có vị chưa có trang trong sổ cái.
- Bài thuốc có cặp phản/úy — vẫn lên web, kèm cảnh báo đỏ trên trang.
- Liên kết `[[...]]` tới trang chưa có.

## Quy tắc an toàn (`rules/`)

Ba file JSON đang ở trạng thái **nháp**: danh sách khởi đầu theo các bài ca truyền thống, cần đối chiếu
với *Tọa thảo lương mô*, *Dược phẩm vựng yếu*. Khi thêm vị, ghi đúng tên tiếng Việt như tên trang.
