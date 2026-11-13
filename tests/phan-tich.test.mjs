import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from '../tools/build.mjs';
import { parseFormulaText, analyzeFormula, levenshtein, ocrToList, adaptiveBinarize } from '../site/assets/phan-tich-core.js';

const { db } = build({ write: false, log: () => {} });

test('Đọc liều: g, chỉ, lạng, số thứ tự, dấu hai chấm, liều đếm', () => {
  const r = parseFormulaText('1. Nhân sâm 12g\n2) Đương quy: 3 chỉ\n- Thục địa 1 lạng\nXạ hương 0,1 g\nSinh khương 3 lát\nCam thảo');
  assert.deepEqual(r.map((x) => [x.ten, x.lieu_g]), [
    ['Nhân sâm', 12], ['Đương quy', 11.3], ['Thục địa', 37.5], ['Xạ hương', 0.1], ['Sinh khương', null], ['Cam thảo', null],
  ]);
  assert.equal(r[4].lieu_text, '3 lát');
});

test('Levenshtein cơ bản', () => {
  assert.equal(levenshtein('phuc linh', 'phuc lin'), 1);
  assert.equal(levenshtein('abc', 'abc'), 0);
});

test('Nhận ra Bát trân thang khi gõ đủ 8 vị (có viết tắt, không dấu)', () => {
  const r = analyzeFormula('Nhân sâm 12g, Bach truat 12g, Phục linh 12g, Chích thảo 6g, Thục địa 16g, Đương quy 12g, Bạch thược 12g, Xuyên khung 8g', db);
  assert.equal(r.best?.id, 'bat-tran-thang');
  assert.equal(r.best.trung, 8);
  assert.ok(r.allDosed);
  assert.equal(r.tinh.nhan, 'ấm (ôn)');
  assert.equal(r.nhom[0].ten, 'Bổ huyết');
  assert.equal(r.vi.find((v) => v.id === 'nhan-sam').vai, 'quân');
});

test('Không đoán bừa: "Sinh khương" ra đúng Gừng tươi, không bị hiểu thành "Đinh hương"', () => {
  const r = analyzeFormula(['Sinh khương 3 lát', 'Xuyen tieu 3g'].join('\n'), db);
  assert.equal(r.vi[0].id, 'sinh-khuong');
  assert.ok(!r.vi.some((v) => v.id === 'dinh-huong'));
  assert.equal(r.unknown[0].ten, 'Xuyen tieu');
});

test('Bắt được phản, thai kỵ, vị độc — kể cả tên gõ không dấu', () => {
  const r = analyzeFormula('Cam thảo 6g\nCam toại 3g\nPhụ tử 8g\nBan ha 10g', db);
  const pairs = r.canh_bao.pairs.map((p) => `${p.a}-${p.b}`);
  assert.ok(pairs.includes('Cam thảo-Cam toại'));
  assert.ok(pairs.some((p) => p.includes('Bán hạ') && p.includes('Phụ tử')));
  assert.ok(r.canh_bao.doc.some((d) => d.vi === 'Phụ tử' && d.muc === 'rat-doc'));
});

test('Lọc chữ máy đọc từ ảnh: bỏ tiêu đề, sửa lỗi nhỏ, giữ dòng có liều', () => {
  const r = ocrToList(['ĐƠN THUỐC', 'Họ tên: Nguyễn Văn A', 'Nhân sâm 12g', 'Bach truat 12g', 'Phuc lin 12g', 'Vị lạ 5g', 'Ngày 3 thang'].join('\n'), db);
  assert.deepEqual(r.lines.map((l) => l.dong), ['Nhân sâm 12g', 'Bạch truật 12g', 'Phục linh 12g', 'Vị lạ 5g']);
  assert.equal(r.nhan_ra, 3);
});

test('Ảnh chụp: liều đọc sai vẫn giữ tên vị, giữ tên khác như đã viết, bỏ số trơn', () => {
  const r = ocrToList(['Họ tên: Lê Thị C Tuổi 52', 'Hoàng kỳ lóg', 'Phục thần 12g', ': Long nhãn 10g', 'sắc 3 bát còn 1'].join('\n'), db);
  assert.deepEqual(r.lines.map((l) => l.dong), ['Hoàng kỳ', 'Phục thần 12g', 'Long nhãn 10g']);
  assert.equal(r.thieu_lieu, 1);
  assert.deepEqual(ocrToList('Bạch truật 120 .', db).nghi_lieu, ['Bạch truật 120']);
});

test('Đen trắng theo vùng: chữ trong vùng tối vẫn tách khỏi nền', () => {
  // Ảnh 40x10: nửa trái sáng (200), nửa phải tối (80); mỗi nửa có một nét chữ tối hơn nền 60
  const w = 40, h = 10, g = new Uint8ClampedArray(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) g[y * w + x] = (x < 20 ? 200 : 80) - (x === 10 || x === 30 ? 60 : 0);
  const bw = adaptiveBinarize(g, w, h, { window: 9 });
  assert.equal(bw[5 * w + 10], 0);
  assert.equal(bw[5 * w + 30], 0);
  assert.equal(bw[5 * w + 5], 255);
  assert.equal(bw[5 * w + 35], 255);
});
