# Checklist MEDAI

Cập nhật: 13/11/2026. Chỉ ghi điều có trong repo; điều chưa kiểm ghi rõ "chưa kiểm".

## Ai giữ việc gì

MEDAI không lập phòng ban: theo định hướng của chủ dự án, đây là sổ cái 0đ, không phụ thuộc người duyệt bên ngoài, tin cậy dựa trên minh bạch nguồn. Ba chức năng bắt buộc được giao như sau:

| Chức năng | Người giữ | Cách làm hiện nay |
|---|---|---|
| Viết nội dung và mã | Claude (phiên làm việc MEDAI) | Làm trên nhánh riêng, đẩy lên, gửi link PR |
| Duyệt và merge | Chủ dự án | Xem PR, tự merge; không merge thì không lên web |
| Kiểm tự động | GitHub Actions (`npm run check`) | Mỗi PR và mỗi lần lên `main`: kiểm khuôn nội dung, quy tắc cấm kỵ, chạy test |
| Audit độc lập | Phiên "Tổng chỉ huy dự án" (CP) — không phải phiên đã viết | Chủ dự án giao ngày 13/11/2026. CP đọc lại từng đợt, đối chiếu với nguồn, ghi kết quả vào mục 5 của [BAO_CAO_GUI_CP.md](BAO_CAO_GUI_CP.md). Trang chưa qua audit vẫn để "Bản nháp" |
| Checklist | Claude cập nhật, chủ dự án xem | Tệp này |
| Bảo mật & sao lưu | Chủ dự án (giữ tài khoản GitHub, tên miền) | Xem mục 3–4 trong báo cáo |

## Đã làm

- [x] Kho GitHub `TKandCo/medai`, web tĩnh trên GitHub Pages, tên miền `medai.thuankhoi.com` (`site/CNAME`)
- [x] Tự kiểm và tự đưa lên web bằng GitHub Actions (`.github/workflows/deploy.yml`)
- [x] Khuôn trang cho 8 loại nội dung; bộ dựng `tools/build.mjs` báo lỗi khi thiếu trường bắt buộc
- [x] Quy tắc an toàn: Thập bát phản, Thập cửu úy, thai kỵ, vị độc (`rules/`) — trạng thái nháp
- [x] 105 trang nội dung (42 vị thuốc, 20 bài thuốc, bệnh, chứng, phép trị, thuật ngữ…), 174 chữ trong bảng giải chữ
- [x] Bệnh thường gặp nối sang Đông y, có khung dấu hiệu cấp cứu
- [x] Học bằng hình, Ôn luyện bằng trò chơi (chỉ tiếng Việt)
- [x] Phân tích bài thuốc từ chữ hoặc ảnh; đọc chữ trong ảnh chạy trên máy người dùng (PR #7 đã merge)
- [x] Sửa lỗi điện thoại giữ bản cũ (service worker lấy bản mới trước) — PR #7
- [x] 23 test tự động (`tests/`)

## Đang làm

- [ ] Xác nhận chọn ảnh từ thư viện chạy được trên điện thoại thật — chờ chủ dự án thử sau PR #7 (**chưa kiểm**)

## Sẽ làm

- [ ] CP audit đợt đầu: 22 vị thuốc + 12 bài thuốc nạp ngày 11/11/2026 (PR #5), và `rules/`

- [ ] Đối chiếu từng trang với bản gốc, ghi quyển/trang; hiện **0/105** trang ở trạng thái "đã đối chiếu"
- [ ] Đối chiếu `rules/` với *Tọa thảo lương mô* và *Dược phẩm vựng yếu*
- [ ] Thêm trang còn thiếu mà bài thuốc đã nhắc (ví dụ: Ô mai) và các bài thuốc trang bệnh đã nêu nhưng chưa có trang (29 chỗ)
- [ ] Cập nhật `docs/KE-HOACH.md`: mục "Việc tiếp theo" còn ghi chưa tạo kho GitHub dù đã làm xong
- [ ] Khôi phục thử từ bản sao lưu (chưa làm lần nào)
