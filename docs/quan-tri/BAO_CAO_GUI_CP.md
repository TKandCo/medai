# Báo cáo MEDAI gửi Tổng chỉ huy dự án (CP)

Ngày: 13/11/2026. Nguồn: repo `D:\MEDAI` (nhánh `main` tại commit `ad6aac1`). Điều chưa kiểm ghi rõ "chưa kiểm". Tài liệu không chứa bí mật nào.

## 1. Việc chờ chủ dự án duyệt

- Hai tệp quản trị này — chủ dự án đã duyệt ngày 13/11/2026.
- Thử chọn ảnh từ thư viện trên điện thoại thật sau khi PR #7 lên web.
- Chủ dự án báo: đã gửi ảnh nhưng app không đọc được chữ — đang tìm nguyên nhân.
- Không có PR nào đang mở chờ merge (các nhánh đã đẩy đều đã vào `main`).

## 2. Việc quá hạn

- `docs/KE-HOACH.md` đặt giai đoạn 1 ("Sổ cái lõi") ở tuần 2–8 nhưng không ghi ngày bắt đầu, nên **chưa xác định được** có quá hạn hay không.
- Mục "Việc tiếp theo" trong kế hoạch đã lỗi thời (vẫn ghi chưa tạo kho GitHub).
- Đối chiếu nguồn: chưa trang nào xong — đây là việc chậm nhất so với định hướng "tin cậy nhờ minh bạch nguồn".

## 3. Bảo mật

- **Bí mật trong repo:** không có. Đã tìm token, mật khẩu, khóa trong mã và cấu hình — không thấy. `.env` nằm trong `.gitignore`.
- **Đưa lên web:** workflow dùng quyền tạm của GitHub (`id-token: write`, `pages: write`), không dùng Secrets nào. Danh sách Secrets trong cài đặt repo: **chưa kiểm**.
- **Dữ liệu người dùng:** web không có tài khoản, không có máy chủ, không gửi dữ liệu đi. Trình duyệt chỉ lưu trên máy người dùng: bài thuốc vừa nhập, tiến độ ôn luyện, tầng đọc đang chọn.
- **Ảnh đơn thuốc:** xử lý ngay trên máy (Tesseract.js đặt sẵn trong `site/vendor/`), không tải lên đâu.
- **Chặn nội dung lạ:** trang có Content-Security-Policy chặt (chỉ cho tải từ chính trang).
- Bảo vệ tài khoản GitHub (2FA), quyền ghi repo, tài khoản tên miền `thuankhoi.com`: **chưa kiểm**.

## 4. Sao lưu và phương án khi mất dịch vụ ngoài

- **Bản sao hiện có:** GitHub (`TKandCo/medai`) và máy chủ dự án (`D:\MEDAI`). Không có bản thứ ba. Khôi phục thử: **chưa làm lần nào**.
- **Mất nhà cung cấp AI:** web vẫn chạy bình thường — không phần nào gọi AI. Nút "nhờ trợ lý AI" chỉ chép sẵn câu hỏi để người dùng dán vào AI của họ, không bắt buộc. Chỉ việc viết thêm nội dung bị chậm lại.
- **Mất GitHub Pages:** thư mục `site/` là web tĩnh thuần, dựng lại bằng `npm run build`, đặt được lên bất kỳ chỗ lưu web tĩnh nào. Đã thử chạy từ máy bằng máy chủ tĩnh nội bộ.
- **Mất tên miền:** web vẫn có ở địa chỉ GitHub Pages mặc định; người dùng cũ cần địa chỉ mới.
- **Thư viện ngoài:** chỉ có Tesseract.js, đã chép vào repo kèm giấy phép, không phụ thuộc CDN.

## 5. Audit

- **Người giữ:** phiên "Tổng chỉ huy dự án" (CP), do chủ dự án giao ngày 13/11/2026. CP không phải phiên đã viết nội dung, nên giữ được tính độc lập.
- **Cách làm:** mỗi đợt nội dung, CP đọc lại và đối chiếu với nguồn (thành phần, liều, tính vị, quy kinh, cấm kỵ, cách ghi nguồn), rồi ghi kết quả vào bảng dưới. Lỗi tìm được do phiên MEDAI sửa trên nhánh riêng; chủ dự án merge.
- **Trước khi có kết quả audit:** trang vẫn để "Bản nháp"; kiểm tự động vẫn chạy mỗi PR (khuôn trang, vị độc phải có mức an toàn đỏ, cặp phản/úy, 23 test).

| Đợt | Phạm vi | Người kiểm | Ngày | Kết quả |
|---|---|---|---|---|
| 1 | 22 vị thuốc + 12 bài thuốc (PR #5), `rules/` | CP | — | Chưa làm |

## 6. Checklist theo người giữ việc

Chi tiết trong [CHECKLIST.md](CHECKLIST.md). Tóm tắt:

| Người giữ | Đã | Đang | Sẽ |
|---|---|---|---|
| Claude (viết) | Khung web, 105 trang, phân tích bài thuốc, đọc chữ trong ảnh, 23 test | — | Đối chiếu nguồn, trang còn thiếu, sửa kế hoạch |
| Chủ dự án (duyệt) | Merge PR #1–#7; duyệt tệp quản trị; giao CP audit | Thử chọn ảnh trên điện thoại | — |
| CP (audit) | — | — | Audit đợt 1 |
| Kiểm tự động | Chạy mỗi PR | — | — |

## 7. Lỗ hổng đã biết

1. **Nội dung chưa đối chiếu:** 0/105 trang "đã đối chiếu"; `rules/` cũng là nháp. Người đọc có thể tin nhầm liều hoặc thành phần.
2. **Rủi ro người đọc tự dùng thuốc:** web có nhãn "Không tự dùng" cho 7 trang mức đỏ, nhãn "Bản nháp", dòng nhắc đi khám (115) ở cuối trang. Xem xét pháp lý về thông tin sức khỏe: **chưa kiểm**.
3. **Audit độc lập mới được giao** cho CP, chưa có kết quả đợt nào (mục 5).
4. **Chỉ một người giữ tài khoản** GitHub và tên miền; chưa có phương án khi người đó vắng.
5. **Chưa khôi phục thử** từ sao lưu.
6. Bản quyền: bản dịch hiện đại chỉ trích ngắn có nguồn; nguyên văn Hán thuộc phạm vi công cộng (`LICENSE-CONTENT.md`). Rà toàn bộ trích dẫn: **chưa kiểm**.
7. Sửa lỗi điện thoại giữ bản cũ (PR #7) chưa thử trên điện thoại thật.
8. Đọc chữ trong ảnh không đọc được ảnh chủ dự án gửi — đang tìm nguyên nhân.
