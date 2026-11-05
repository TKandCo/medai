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

test('Đội hình: cột "việc", vai trò ở các bài, họ bài thuốc', () => {
  const { db } = build({ write: false, log: quiet });
  const byId = new Map(db.entries.map((e) => [e.id, e]));
  const lucVi = byId.get('luc-vi-dia-hoang-hoan');
  const thucDia = lucVi.thanh_phan.find((x) => x.id === 'thuc-dia');
  assert.equal(thucDia.vai, 'quân');
  assert.ok(thucDia.viec.length > 0);
  // Bát vị là con của Lục vị: thêm Phụ tử, Nhục quế, không bớt vị nào
  const batVi = byId.get('bat-vi-hoan');
  assert.deepEqual(batVi.so_voi_goc.them.map((x) => x.id).sort(), ['nhuc-que', 'phu-tu']);
  assert.equal(batVi.so_voi_goc.bot.length, 0);
  assert.ok(lucVi.ho_con.includes('bat-vi-hoan'));
  // Thục địa biết mình là Quân ở Lục vị, Thần ở Bát vị
  const vai = byId.get('thuc-dia').vai_tro;
  assert.ok(vai.some((v) => v.bai === 'luc-vi-dia-hoang-hoan' && v.vai === 'quân'));
  assert.ok(vai.some((v) => v.bai === 'bat-vi-hoan' && v.vai === 'thần'));
  // Bát vị có Phụ tử → cảnh báo vị độc
  assert.ok(batVi.canh_bao.doc.some((d) => d.vi === 'Phụ tử'));
});

test('Chuỗi Chứng → Phép → Bài: trang được nhắc tới biết ai nhắc mình', () => {
  const { db } = build({ write: false, log: quiet });
  const phep = db.entries.find((e) => e.id === 'tu-am-giang-hoa');
  assert.ok(phep.duoc_nhac.chung.includes('am-hu-hoa-vuong'));
  assert.ok(phep.duoc_nhac['bai-thuoc'].includes('tri-ba-dia-hoang-hoan'));
});

test('Giải chữ: hanChars tách đúng chữ Hán, bỏ chữ Latin', async () => {
  const { hanChars } = await import('../tools/build.mjs');
  assert.deepEqual(hanChars('滋陰降火 (tư âm)'), ['滋', '陰', '降', '火']);
});

test('Vai trò sai chính tả bị chặn', () => {
  const dir = tempProject();
  mkdirSync(join(dir, 'content', 'bai-thuoc'), { recursive: true });
  writeFileSync(join(dir, 'content', 'bai-thuoc', 'thu.md'),
    '---\nten: Thử\ntom_tat: Thử\nmuc_an_toan: vang\nthanh_phan:\n  - Cam thảo | vua | 4g | điều hòa\n---\n');
  const { errors } = build({ root: dir, write: false, log: quiet });
  rmSync(dir, { recursive: true, force: true });
  assert.ok(errors.some((e) => e.includes('quân, thần, tá hoặc sứ')));
});
