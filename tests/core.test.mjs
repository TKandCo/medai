import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify, normalizeText, buildRuleIndex, checkHerbs, splitHerbList } from '../site/assets/core.js';
import { loadRules } from '../tools/build.mjs';

const index = buildRuleIndex(loadRules());

test('slugify bỏ dấu tiếng Việt và đ', () => {
  assert.equal(slugify('Cam thảo'), 'cam-thao');
  assert.equal(slugify('Đại kích'), 'dai-kich');
  assert.equal(slugify('  Tứ quân tử thang '), 'tu-quan-tu-thang');
  assert.equal(normalizeText('TỲ HƯ'), 'ty hu');
});

test('Thập bát phản: Cam thảo – Cam toại', () => {
  const r = checkHerbs(['Cam thảo', 'Cam toại'], index);
  assert.equal(r.pairs.length, 1);
  assert.equal(r.pairs[0].loai, 'phan');
});

test('Thập cửu úy: Nhân sâm – Ngũ linh chi', () => {
  const r = checkHerbs(['nhan sam', 'Ngũ linh chi'], index);
  assert.equal(r.pairs[0].loai, 'uy');
});

test('Thai kỵ và vị độc được nhận ra', () => {
  const r = checkHerbs(['Phụ tử', 'Xạ hương'], index);
  assert.ok(r.thai.some((t) => t.vi === 'Xạ hương' && t.muc === 'cam'));
  assert.ok(r.doc.some((d) => d.vi === 'Phụ tử' && d.muc === 'rat-doc'));
  assert.equal(r.ok, false);
});

test('Tứ quân tử thang không có cảnh báo', () => {
  assert.equal(checkHerbs(['Nhân sâm', 'Bạch truật', 'Phục linh', 'Cam thảo'], index).ok, true);
});

test('Tách danh sách vị có kèm liều', () => {
  assert.deepEqual(splitHerbList('Nhân sâm 10g, Gừng 3 lát; Cam thảo 4 g\nĐại táo'), ['Nhân sâm', 'Gừng 3 lát', 'Cam thảo', 'Đại táo']);
});
