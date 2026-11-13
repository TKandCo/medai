# Tự chấm theo Tiêu chuẩn code chung v1.0 — MEDAI

- **Phiên bản đang theo:** Tiêu chuẩn code chung **v1.0** (13/11/2026), bản chép tại [TIEU_CHUAN_CODE.md](TIEU_CHUAN_CODE.md). MEDAI không có CLAUDE.md theo chỉ đạo chủ dự án, nên phiên bản được ghi ở đây (xem [NGOAI_LE.md](NGOAI_LE.md)).
- **Hạng:** A — thông tin sức khỏe công khai.
- **Chủ dự án duyệt áp dụng:** 13/11/2026, trong phiên MEDAI.
- **Người chấm:** phiên MEDAI (bên viết) — **tự chấm**, chờ CP kiểm lại. Ngày chấm: 13/11/2026, trên nhánh `sua-theo-audit-dot1`.
- Chỉ chấm quy tắc **BẮT BUỘC** áp dụng cho hạng A. "Chưa kiểm" là chưa có bằng chứng, không phải "Đạt".

## Tóm tắt dễ đọc

MEDAI là một trang web tĩnh: không có máy chủ riêng, không có tài khoản người dùng, không có cơ sở dữ liệu, không gọi AI, không giữ khóa bí mật nào. Vì vậy gần một phần ba số quy tắc **không áp dụng**.

Những chỗ **chưa đạt** quan trọng nhất:
1. **Nội dung chuyên môn chưa đối chiếu (KT-06):** 0/105 trang đã đối chiếu với sách gốc.
2. **Sao lưu chưa đủ (SL-01, SL-02, SL-03):** chỉ có GitHub và máy dự án, đẩy bằng tay, chưa khôi phục thử lần nào.
3. **Chưa có sổ tay khôi phục (TL-02), sổ sự cố (VH-04), giám sát web (VH-01, VH-03).**
4. **Chuỗi kiểm tự động còn mỏng:** CI chỉ chạy kiểm nội dung và test; chưa quét bí mật, chưa quét thư viện, action chưa ghim theo SHA (PT-02, PT-03).
5. **Chưa có CHANGELOG và số phiên bản (QT-06), chưa có trang chính sách quyền riêng tư (DL-05).**
6. **2FA của GitHub và tên miền chưa được xác nhận (BM-06)** — chỉ chủ dự án làm được.

| Kết quả | Số quy tắc |
|---|---|
| Đạt | 19 |
| Chưa | 22 |
| Chưa kiểm | 2 |
| Ngoại lệ (chủ dự án duyệt) | 2 |
| Không áp dụng | 26 |
| **Tổng quy tắc BẮT BUỘC hạng A** | **71** |

## Chi tiết

Ký hiệu: ✅ Đạt · ❌ Chưa · ❔ Chưa kiểm · ⚪ Không áp dụng · 📝 Ngoại lệ

### QT — Quy trình và kho mã
| Mã | Kết quả | Bằng chứng / ghi chú |
|---|---|---|
| QT-01 | ✅ | Toàn bộ mã, nội dung, tài liệu trong git; bản trên GitHub `TKandCo/medai` |
| QT-02 | ❔ | Cài đặt bảo vệ nhánh trên GitHub: chưa kiểm (phiên không có quyền xem). Thực tế: `git log --first-parent main` — ngoài commit khởi tạo, mọi thay đổi vào `main` đều qua PR (#1–#7) |
| QT-03 | 📝 | Ngoại lệ: không lập phòng ban, CP làm audit độc lập. Lưu ý: PR #1–#7 merge trước khi có CP, chưa được phiên khác kiểm; CP mới kiểm nội dung đợt 1 và nhánh `sua-theo-audit-dot1` |
| QT-04 | ❌ | PR do chủ dự án tạo từ link; mô tả PR chưa có mục "đã kiểm / chưa kiểm". Thông điệp commit có liệt kê thay đổi nhưng không đều đặn ghi phần chưa kiểm |
| QT-05 | ❌ | CI (`.github/workflows/deploy.yml`) chạy `npm run check` ở mỗi PR. Chưa có quét bí mật, quét thư viện, lint trong CI. Chặn merge khi CI đỏ phụ thuộc cài đặt nhánh — chưa kiểm. Không thấy `--no-verify`/`skip ci` trong lịch sử commit |
| QT-06 | ❌ | Không có CHANGELOG; `package.json` vẫn `0.1.0`, chưa đánh số phát hành |

### BM — Bí mật và khóa
| Mã | Kết quả | Bằng chứng / ghi chú |
|---|---|---|
| BM-01 | ✅ | Tìm tay "token, secret, password, api key" trong mã và cấu hình: không có bí mật (chỉ biến `tokens` của bộ tìm kiếm). Repo không cần `.env.example` vì không có bí mật nào. **gitleaks chưa chạy** — chờ Trạm |
| BM-02 | ❌ | `.gitignore` chặn `.env`, `node_modules/`, `site/data/`; **chưa** chặn `.env.*`, tệp CSDL, thư mục sao lưu |
| BM-03 | ⚪ | Không có khóa nào. Đưa lên web dùng quyền tạm của GitHub (`id-token: write`, `pages: write` chỉ ở bước deploy) |
| BM-04 | ⚪ | Không có khóa để thu hồi |
| BM-05 | ⚪ | Không có bí mật trên máy cho MEDAI |
| BM-06 | ❔ | 2FA tài khoản GitHub TKandCo và tên miền thuankhoi.com: **chủ dự án phải tự xác nhận** |
| BM-07 | ⚪ | Không có khóa đặt lệnh, chuyển tiền |

### DV — Dữ liệu vào và ra
| Mã | Kết quả | Bằng chứng / ghi chú |
|---|---|---|
| DV-01 | ❌ | Nội dung sổ cái được kiểm khuôn khi dựng (`tools/build.mjs`, trường bắt buộc, trạng thái, mức an toàn). Ô nhập bài thuốc và ảnh tải lên **chưa giới hạn độ dài / kích thước** |
| DV-02 | ⚪ | Không có CSDL |
| DV-03 | ✅ | Kiểm tay: mọi chữ người dùng gõ và dữ liệu sổ cái đi qua `esc()` / `escHtml()` trước khi vào `innerHTML` (`site/assets/app.js:14`, `phan-tich.js:67`, `hoc.js:6`); chữ đọc từ ảnh hiện bằng `textContent`. Có CSP chặn script lạ. **Chưa có máy kiểm** (Semgrep/ESLint) |
| DV-04 | ✅ | `grep "eval(\|new Function"` trong `site/assets` và `tools`: không có. (Thư viện Tesseract đặt sẵn trong `site/vendor/` không thuộc mã của dự án) |
| DV-05 | ❌ | Không nhận đường dẫn tệp. Ảnh tải lên có kiểm loại (`image/*`, `phan-tich.js`) nhưng **chưa giới hạn kích thước** |
| DV-06 | ⚪ | Không có máy chủ |

### XQ — Xác thực và phân quyền
| Mã | Kết quả | Bằng chứng / ghi chú |
|---|---|---|
| XQ-01 | ⚪ | Không có mã hóa, mật khẩu, phiên đăng nhập |
| XQ-02 | ⚪ | Không có máy chủ, không có dữ liệu riêng của từng người |
| XQ-03 | ⚪ | Không dùng Supabase/Firebase |
| XQ-04 | ⚪ | Không có đăng nhập |
| XQ-05 | ⚪ | Không có cookie phiên, không có form đổi trạng thái phía máy chủ |
| XQ-06 | ⚪ | Không có token chủ |

### FE — Frontend
| Mã | Kết quả | Bằng chứng / ghi chú |
|---|---|---|
| FE-01 | ✅ | `<meta>` CSP trong `site/index.html`: `default-src 'self'; script-src 'self'; style-src 'self'; ... object-src 'none'; base-uri 'none'; form-action 'none'`. **Phần không làm được bằng thẻ meta trên GitHub Pages:** `frame-ancestors` (chống nhúng trang), `X-Content-Type-Options`, `Referrer-Policy` |
| FE-02 | ✅ | Không tải gì từ CDN; Tesseract.js đặt sẵn trong `site/vendor/tesseract/`, ghi phiên bản và nguồn trong `README.md` ở đó |
| FE-03 | ✅ | `localStorage` chỉ giữ bài thuốc vừa gõ, tầng đọc, tiến độ ôn luyện — không có token |
| FE-04 | ✅ | Không có máy chủ nhận dữ liệu; nội dung được CI kiểm lại khi dựng |

### BE — Backend và API
| Mã | Kết quả | Bằng chứng / ghi chú |
|---|---|---|
| BE-01 | ⚪ | Không gọi dịch vụ ngoài; chỉ tải tệp tĩnh cùng trang (`data/db.json`, bộ đọc chữ) |
| BE-02 | ⚪ | Không có API |
| BE-03 | ✅ | Lỗi hiện cho người dùng là câu tiếng Việt ("Chưa mở được sổ cái…", "Không chạy được bộ đọc chữ…"); chi tiết chỉ ghi ở console của máy người dùng |
| BE-04 | ⚪ | Không có log phía dự án |
| BE-05 | ⚪ | Không có việc gây hậu quả (tiền, tin nhắn, lệnh) |
| BE-06 | ❌ | Web chạy HTTPS qua GitHub Pages (`https://medai.thuankhoi.com`); service worker chỉ đăng ký trên https. Bật "Enforce HTTPS" trong cài đặt: chưa kiểm. **Chưa theo dõi hạn chứng chỉ** |

### PT — Thư viện và chuỗi cung ứng
| Mã | Kết quả | Bằng chứng / ghi chú |
|---|---|---|
| PT-01 | ✅ | `package.json` không có thư viện npm nào (chỉ dùng Node có sẵn), nên không cần lockfile. Thư viện duy nhất là Tesseract.js, chép sẵn và ghi phiên bản cố định |
| PT-02 | ❌ | Chưa quét lỗ hổng ở PR hay hằng tuần. Tesseract.js 5.1.1, tesseract.js-core 5.1.1 chưa được quét — chờ Trạm (OSV) |
| PT-03 | ❌ | Action đều chính chủ (`actions/*`), `permissions` tối thiểu, không dùng `pull_request_target`, không in bí mật. **Chưa ghim theo SHA** (đang `@v4`, `@v3`) — hạng A yêu cầu SHA |
| PT-05 | ✅ | Gói Tesseract lấy đúng tên trên npm (`tesseract.js`, `tesseract.js-core`, `@tesseract.js-data/vie`), ghi nguồn và giấy phép trong `site/vendor/tesseract/README.md` |

### KT — Kiểm thử
| Mã | Kết quả | Bằng chứng / ghi chú |
|---|---|---|
| KT-01 | ❌ | Nhiều lỗi có test chống tái phát (đoán nhầm "Sinh khương", dấu phẩy thập phân, đọc ảnh, cảnh báo có thai). **Chưa có test** cho: service worker giữ bản cũ, nút đọc chữ hiện sớm, ảnh không ghi loại tệp |
| KT-02 | ❌ | Có test cho đọc liều (g, chỉ, lạng, số thập phân), cảnh báo phản/úy/thai kỵ/vị độc (`tests/phan-tich.test.mjs`, `tests/core.test.mjs`). **Chưa đo độ phủ**, chưa đủ giá trị biên (liều 0, liều âm, đơn vị lạ) |
| KT-04 | ❌ | Một lần đổi kỳ vọng test: "Sinh khương" (PR #5, khi thêm trang Sinh khương) — lý do đúng nhưng **chưa ghi giải thích trong PR** |
| KT-05 | ❌ | Trang phân tích hiện tỷ lệ công năng, hàn–nhiệt, "giống bài nào". Có ghi "suy ra từ dữ liệu sổ cái" và "chưa nhận ra thì nói là không biết", nhưng **chưa có tài liệu kiểm chứng phương pháp** và chưa gắn nhãn "để biết" |
| KT-06 | ❌ | Trạng thái rõ: mọi trang có `trang_thai`, web hiện nhãn "Bản nháp" (`site/assets/app.js:22`); bộ dựng chặn "đã đối chiếu" khi thiếu quyển/trang. **Nhưng 0/105 trang đã đối chiếu**, web đang công khai |

### CS — Cơ sở dữ liệu
| Mã | Kết quả | Bằng chứng / ghi chú |
|---|---|---|
| CS-01 | ⚪ | Không có CSDL (`db.json` dựng lại từ Markdown mỗi lần) |
| CS-02 | ⚪ | Không có migration; xóa nội dung đi qua git nên luôn có đường lui |

### DL — Dữ liệu cá nhân
| Mã | Kết quả | Bằng chứng / ghi chú |
|---|---|---|
| DL-01 | ✅ | Không thu dữ liệu cá nhân. **Sổ dữ liệu:** trình duyệt người dùng tự giữ bài thuốc vừa gõ, tiến độ ôn luyện, tầng đọc (`localStorage`); ảnh đơn thuốc chỉ nằm trong bộ nhớ trang, không lưu, không gửi đi; dự án không thấy và không giữ gì trong số này |
| DL-02 | ⚪ | Không thu dữ liệu trẻ em |
| DL-03 | ⚪ | Dự án không lưu dữ liệu cá nhân; đường truyền là HTTPS |
| DL-04 | ⚪ | Không giữ dữ liệu để xóa |
| DL-05 | ❌ | **Chưa có trang chính sách quyền riêng tư.** Chỉ có lời ghi trên trang phân tích ("không gửi đi đâu") |
| DL-06 | ✅ | Không có dữ liệu thật của người dùng; ảnh thử đọc chữ là ảnh vẽ giả |

### VH — Vận hành và giám sát
| Mã | Kết quả | Bằng chứng / ghi chú |
|---|---|---|
| VH-01 | ❌ | Chưa có kiểm "còn sống" cho `medai.thuankhoi.com` |
| VH-02 | ⚪ | Không có nguồn dữ liệu ngoài chạy tự động |
| VH-03 | ❌ | Chưa theo dõi phút CI, hạn tên miền, hạn chứng chỉ |
| VH-04 | ❌ | Chưa có sổ sự cố. Sự cố đã biết chưa ghi: điện thoại giữ bản cũ của web (sửa ở PR #7) |

### SL — Sao lưu và khôi phục
| Mã | Kết quả | Bằng chứng / ghi chú |
|---|---|---|
| SL-01 | ❌ | 2 bản: GitHub và `D:\MEDAI`. Chưa có bản thứ ba trên thiết bị khác |
| SL-02 | ❌ | Không sao lưu tự động; bản trên GitHub chỉ cập nhật khi đẩy nhánh |
| SL-03 | ❌ | **Chưa khôi phục thử lần nào** |
| SL-04 | ✅ | Bản trên GitHub tách khỏi máy dự án |
| SL-05 | ⚪ | Bản sao lưu không mã hóa (repo công khai, không có bí mật) nên không có khóa giải mã |

### AI — Riêng cho AI
| Mã | Kết quả | Bằng chứng / ghi chú |
|---|---|---|
| AI-01 | ⚪ | Web không gọi mô hình AI. (Mục "nhờ trợ lý AI" chỉ chép sẵn câu hỏi để người dùng tự dán vào AI của họ) |
| AI-02 | ✅ | Nội dung do Claude viết đều để "Bản nháp", chủ dự án duyệt PR; chữ đọc từ ảnh được ghi là cần đối chiếu và người dùng sửa trước khi phân tích |
| AI-03 | ⚪ | Không dùng AI có chi phí khi chạy |
| AI-04 | ✅ | Web không phụ thuộc AI: mất nhà cung cấp AI vẫn chạy đủ (ghi ở mục 4 `BAO_CAO_GUI_CP.md`) |
| AI-05 | ⚪ | Không có tác tử AI trong sản phẩm |
| AI-06 | ✅ | Phiên MEDAI không tự merge (chủ dự án merge mọi PR); không tạo CLAUDE.md khi CP đề nghị mà hỏi chủ dự án; Tesseract.js thêm sau khi chủ dự án duyệt ("Làm bậc 2") |
| AI-07 | ✅ | Mã do Claude viết đi qua cùng CI như mọi thay đổi |

### TL — Tài liệu và tiếp quản
| Mã | Kết quả | Bằng chứng / ghi chú |
|---|---|---|
| TL-01 | 📝 | Ngoại lệ: không có CLAUDE.md theo chỉ đạo chủ dự án. Thông tin tương ứng nằm ở `README.md` (hệ thống là gì, lệnh hay dùng), `docs/TRIEN-KHAI.md` (chạy ở đâu), và thư mục này |
| TL-02 | ❌ | Chưa có sổ tay khôi phục |
| TL-03 | ✅ | `BAO_CAO_GUI_CP.md` cập nhật 13/11/2026 sau audit đợt 1 |

## Việc nên làm tiếp (đề xuất, chờ chủ dự án chọn)

Sắp theo mức rủi ro; phần lớn làm được với 0đ.
1. **BM-06** — chủ dự án bật và xác nhận 2FA (GitHub, tên miền).
2. **KT-06** — bắt đầu đối chiếu sách gốc theo từng đợt nhỏ.
3. **TL-02 + SL-03** — viết sổ tay khôi phục và khôi phục thử một lần (clone từ GitHub sang thư mục trống, dựng, chạy test).
4. **PT-02, PT-03, BM-01 (máy kiểm)** — thêm vào CI: gitleaks, quét lỗ hổng, ghim action theo SHA.
5. **BM-02, DV-01, DV-05** — sửa nhỏ: `.gitignore`, giới hạn kích thước ảnh và độ dài ô nhập.
6. **QT-06, VH-04, DL-05** — CHANGELOG, sổ sự cố, trang quyền riêng tư.
7. **VH-01, VH-03** — giám sát web và hạn mức (có thể để Trạm làm chung).
