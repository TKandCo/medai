# Bộ đọc chữ trong ảnh (OCR)

Tệp trong thư mục này được sao chép từ các gói npm (chỉ bỏ dòng `sourceMappingURL` vì không kèm tệp .map), dùng để đọc chữ in tiếng Việt
trong ảnh đơn thuốc ngay trên trình duyệt (không gửi ảnh đi đâu). Chỉ tải khi người dùng bấm
"Đọc chữ tự động".

| Tệp | Gói npm | Phiên bản | Giấy phép |
|---|---|---|---|
| `tesseract.esm.min.js`, `worker.min.js` | tesseract.js | 5.1.1 | Apache-2.0 (`LICENSE-tesseract.js.md`) |
| `core/tesseract-core-lstm.wasm.js`, `core/tesseract-core-simd-lstm.wasm.js` | tesseract.js-core | 5.1.1 | Apache-2.0 (`core/LICENSE-tesseract.js-core`) |
| `lang/vie.traineddata.gz` (bản `4.0.0_best_int`) | @tesseract.js-data/vie | 1.0.0 | MIT; dữ liệu gốc từ dự án Tesseract (Apache-2.0) |

Nâng cấp: tải bản mới bằng `npm pack`, chép đè đúng các tệp trên, cập nhật bảng này.
