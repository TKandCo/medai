import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from '../tools/build.mjs';
import { parseFormulaText, analyzeFormula, levenshtein } from '../site/assets/phan-tich-core.js';

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

test('Không đoán bừa: "Sinh khương" không bị hiểu thành "Đinh hương"', () => {
  const r = analyzeFormula('Sinh khương 3 lát', db);
  assert.equal(r.vi.length, 0);
  assert.equal(r.unknown[0].ten, 'Sinh khương');
});

test('Bắt được phản, thai kỵ, vị độc — kể cả tên gõ không dấu', () => {
  const r = analyzeFormula('Cam thảo 6g\nCam toại 3g\nPhụ tử 8g\nBan ha 10g', db);
  const pairs = r.canh_bao.pairs.map((p) => `${p.a}-${p.b}`);
  assert.ok(pairs.includes('Cam thảo-Cam toại'));
  assert.ok(pairs.some((p) => p.includes('Bán hạ') && p.includes('Phụ tử')));
  assert.ok(r.canh_bao.doc.some((d) => d.vi === 'Phụ tử' && d.muc === 'rat-doc'));
});
