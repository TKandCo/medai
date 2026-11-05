import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, cpSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from '../tools/build.mjs';
import { parseFrontmatter } from '../tools/lib/frontmatter.mjs';
import { renderMarkdown } from '../tools/lib/markdown.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const quiet = () => {};

test('Nội dung hiện tại dựng được, không có lỗi', () => {
  const { errors, db } = build({ write: false, log: quiet });
  assert.deepEqual(errors, []);
  assert.ok(db.entries.length >= 5);
});

test('Đọc phần đầu bài: chuỗi, danh sách ngang và dọc', () => {
  const { data, body } = parseFrontmatter('---\nten: Cam thảo\nquy_kinh: [Tâm, Phế]\nnguon:\n  - Sách A · tr. 1\n---\nNội dung');
  assert.equal(data.ten, 'Cam thảo');
  assert.deepEqual(data.quy_kinh, ['Tâm', 'Phế']);
  assert.deepEqual(data.nguon, ['Sách A · tr. 1']);
  assert.equal(body, 'Nội dung');
});

test('Markdown không cho chèn HTML hay link javascript', () => {
  const html = renderMarkdown('<script>alert(1)</script> [x](javascript:alert(1)) **đậm** [[ty-hu]]');
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('javascript:'));
  assert.ok(html.includes('<strong>đậm</strong>'));
  assert.ok(html.includes('href="#/m/ty-hu"'));
});

function tempProject() {
  const dir = mkdtempSync(join(tmpdir(), 'medai-'));
  cpSync(join(ROOT, 'rules'), join(dir, 'rules'), { recursive: true });
  cpSync(join(ROOT, 'content', '_data'), join(dir, 'content', '_data'), { recursive: true });
  mkdirSync(join(dir, 'content', 'vi-thuoc'), { recursive: true });
  return dir;
}

test('Bài "đã đối chiếu" thiếu nguồn bị chặn', () => {
  const dir = tempProject();
  writeFileSync(join(dir, 'content', 'vi-thuoc', 'bach-truat.md'),
    '---\nten: Bạch truật\ntinh: Ôn\nvi: Ngọt, đắng\nquy_kinh: [Tỳ, Vị]\ntom_tat: Kiện Tỳ\nmuc_an_toan: vang\ntrang_thai: da-doi-chieu\n---\n');
  const { errors } = build({ root: dir, write: false, log: quiet });
  rmSync(dir, { recursive: true, force: true });
  assert.ok(errors.some((e) => e.includes('ít nhất 1 nguồn')));
});

test('Vị rất độc mà không để mức đỏ bị chặn', () => {
  const dir = tempProject();
  writeFileSync(join(dir, 'content', 'vi-thuoc', 'ma-tien.md'),
    '---\nten: Mã tiền\ntinh: Hàn\nvi: Đắng\nquy_kinh: [Can, Tỳ]\ntom_tat: Thử\nmuc_an_toan: vang\n---\n');
  const { errors } = build({ root: dir, write: false, log: quiet });
  rmSync(dir, { recursive: true, force: true });
  assert.ok(errors.some((e) => e.includes('muc_an_toan: do')));
});
