// Dựng dữ liệu cho web: đọc content/ và rules/, kiểm tra, ghi site/data/db.json.
// Chạy: node tools/build.mjs          (dựng)
//       node tools/build.mjs --check  (chỉ kiểm tra, không ghi file)
// Có lỗi → thoát mã 1, GitHub Actions sẽ không đưa bản lỗi lên web.

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join, basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from './lib/frontmatter.mjs';
import { renderMarkdown, renderInline, plainText } from './lib/markdown.mjs';
import { slugify, buildRuleIndex, checkHerbs } from '../site/assets/core.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export const TYPES = {
  benh: { label: 'Bệnh thường gặp', required: ['ten', 'tom_tat', 'yhct', 'nhom', 'cap_cuu'] },
  'thuat-ngu': { label: 'Thuật ngữ', required: ['ten', 'tom_tat'] },
  chung: { label: 'Chứng bệnh', required: ['ten', 'tom_tat'] },
  'phep-tri': { label: 'Phép trị', required: ['ten', 'tom_tat'] },
  'bai-thuoc': { label: 'Bài thuốc', required: ['ten', 'thanh_phan', 'tom_tat', 'muc_an_toan'] },
  'vi-thuoc': { label: 'Vị thuốc', required: ['ten', 'tinh', 'vi', 'quy_kinh', 'tom_tat', 'muc_an_toan'] },
  'duong-sinh': { label: 'Dưỡng sinh', required: ['ten', 'tom_tat'] },
  'so-tay': { label: 'Sổ tay nghiên cứu', required: ['ten', 'tom_tat'] },
};
const STATUS = ['nhap', 'da-doi-chieu'];
const SAFETY = ['xanh', 'vang', 'do'];
export const ROLES = ['quân', 'thần', 'tá', 'sứ'];
const LIST_FIELDS = [
  'ten_khac', 'quy_kinh', 'nguon', 'lien_quan', 'thanh_phan', 'kieng_ky', 'cong_nang', 'chu_tri',
  'trieu_chung_chinh', 'trieu_chung_phu', 'phep_tri', 'bai_thuoc', 'chung', 'gia_giam', 'bo_vi', 'dong_tu',
  'the_benh', 'cap_cuu', 'duong_sinh',
];
// Trường chứa mã trang khác → web hiện thành liên kết
const ID_FIELDS = ['phep_tri', 'bai_thuoc', 'chung', 'ho', 'nguoc_lai'];
// Trường được xử lý riêng, không đưa vào bảng thông tin chung
const SPECIAL = ['ten', 'ten_han', 'ten_khac', 'tom_tat', 'trang_thai', 'muc_an_toan', 'nguon', 'lien_quan', 'thanh_phan', 'bo_vi', 'hinh_anh', 'nhom',
  'yhct', 'the_benh', 'cap_cuu', 'duong_sinh', 'phoi_hop', ...ID_FIELDS];

/** Gom tính của vị thuốc về 5 mức để lọc: "Hơi ôn" → "Ấm (ôn)" */
export function tinhGroup(tinh) {
  const t = String(tinh ?? '').toLowerCase();
  if (!t) return '';
  if (t.includes('nhiệt')) return 'Nóng (nhiệt)';
  if (t.includes('ôn')) return 'Ấm (ôn)';
  if (t.includes('bình')) return 'Bình';
  if (t.includes('lương') || t.includes('hơi hàn')) return 'Mát (lương)';
  if (t.includes('hàn')) return 'Lạnh (hàn)';
  return '';
}
/** "Ngọt (cam), nhạt" → ["Ngọt", "Nhạt"] */
export function viList(vi) {
  return String(vi ?? '').split(/[,;]/).map((s) => s.replace(/\(.*?\)/g, '').trim().replace(/^hơi\s+/i, '')).filter(Boolean)
    .map((s) => s[0].toUpperCase() + s.slice(1).toLowerCase());
}

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const splitPipe = (line) => line.split('|').map((s) => s.trim());

export function loadRules(root = ROOT) {
  return {
    phanUy: readJson(join(root, 'rules', 'phan-uy.json')),
    thaiKy: readJson(join(root, 'rules', 'thai-ky.json')),
    viDoc: readJson(join(root, 'rules', 'vi-doc.json')),
  };
}

function parseSource(line) {
  const [label, url] = splitPipe(line);
  return { label, url: url && /^https?:\/\//.test(url) ? url : null };
}

/** "Thục địa | quân | 8 phần | tư Thận âm" → {ten, id, vai, lieu, viec} */
export function parseIngredient(line) {
  const [ten, vai = '', lieu = '', viec = ''] = splitPipe(line);
  return { ten, id: slugify(ten), vai: vai.toLowerCase(), lieu, viec };
}

function splitTiers(body) {
  const parts = body.split(/^##\s+(Tầng\s+\d[^\n]*)$/m);
  if (parts.length < 3) return { intro: body, tiers: [] };
  const tiers = [];
  for (let i = 1; i < parts.length; i += 2) tiers.push({ title: parts[i].trim(), body: parts[i + 1] ?? '' });
  return { intro: parts[0], tiers };
}

/** Các chữ Hán (CJK) trong một chuỗi, theo thứ tự, không trùng */
export function hanChars(text) {
  return [...new Set([...String(text ?? '')].filter((c) => /[㐀-鿿豈-﫿]/.test(c)))];
}

export function loadEntries(root = ROOT) {
  const entries = [];
  const errors = [];
  for (const loai of Object.keys(TYPES)) {
    const dir = join(root, 'content', loai);
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.md') && !f.startsWith('_')).sort()) {
      const path = `content/${loai}/${file}`;
      const id = basename(file, '.md');
      try {
        const { data, body } = parseFrontmatter(readFileSync(join(dir, file), 'utf8'));
        for (const f of LIST_FIELDS) if (typeof data[f] === 'string') data[f] = [data[f]];
        entries.push({ id, loai, path, data, body });
      } catch (e) {
        errors.push(`${path}: ${e.message}`);
      }
    }
  }
  return { entries, errors };
}

function loadChu(root) {
  const p = join(root, 'content', '_data', 'chu.json');
  return existsSync(p) ? readJson(p) : [];
}

export function build({ root = ROOT, write = true, log = console.log } = {}) {
  const rules = loadRules(root);
  const index = buildRuleIndex(rules);
  const { entries, errors } = loadEntries(root);
  const warnings = [];
  const byId = new Map();

  const chuList = loadChu(root);
  const chu = {};
  for (const c of chuList) {
    if (chu[c.chu]) errors.push(`content/_data/chu.json: chữ ${c.chu} bị khai báo hai lần`);
    if (!c.am || !c.nghia) errors.push(`content/_data/chu.json: chữ ${c.chu} thiếu "am" hoặc "nghia"`);
    chu[c.chu] = c;
  }

  for (const e of entries) {
    const where = e.path;
    if (e.id !== slugify(e.id)) errors.push(`${where}: tên file phải viết thường, không dấu, nối bằng "-" (gợi ý: ${slugify(e.id)}.md)`);
    if (byId.has(e.id)) errors.push(`${where}: trùng mã "${e.id}" với ${byId.get(e.id).path}`);
    byId.set(e.id, e);
    for (const f of TYPES[e.loai].required) {
      const v = e.data[f];
      if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) errors.push(`${where}: thiếu trường "${f}"`);
    }
    e.data.trang_thai ??= 'nhap';
    if (!STATUS.includes(e.data.trang_thai)) errors.push(`${where}: trang_thai phải là ${STATUS.join(' hoặc ')}`);
    if (e.data.muc_an_toan && !SAFETY.includes(e.data.muc_an_toan)) errors.push(`${where}: muc_an_toan phải là ${SAFETY.join(', ')}`);
    const sources = (e.data.nguon ?? []).map(parseSource);
    if (e.data.trang_thai === 'da-doi-chieu') {
      if (sources.length === 0) errors.push(`${where}: bài "đã đối chiếu" phải có ít nhất 1 nguồn`);
      for (const s of sources) {
        if (!s.url && !/(tr\.|trang|q\.|quyển|tờ)/i.test(s.label)) errors.push(`${where}: nguồn "${s.label}" cần ghi quyển/trang hoặc đường dẫn`);
      }
    }
    if (e.loai === 'vi-thuoc') {
      const doc = index.doc.get(e.id);
      if (doc === 'rat-doc' && e.data.muc_an_toan !== 'do') errors.push(`${where}: vị rất độc phải có muc_an_toan: do`);
      if (doc && e.data.trang_thai === 'da-doi-chieu' && (!e.data.lieu || !e.data.bao_che)) errors.push(`${where}: vị có độc phải ghi "lieu" và "bao_che"`);
    }
    if (e.loai === 'bai-thuoc') {
      for (const line of e.data.thanh_phan ?? []) {
        const ing = parseIngredient(line);
        if (ing.vai && !ROLES.includes(ing.vai)) errors.push(`${where}: vai trò "${ing.vai}" của ${ing.ten} phải là quân, thần, tá hoặc sứ`);
        if (e.data.trang_thai === 'da-doi-chieu' && !ing.viec) errors.push(`${where}: bài đã đối chiếu phải ghi "việc" (cột thứ tư) cho ${ing.ten}`);
      }
    }
  }

  // Tên khác (ví dụ "Chích cam thảo") → mã trang chính ("cam-thao")
  const alias = new Map();
  for (const e of entries) for (const t of e.data.ten_khac ?? []) if (!byId.has(slugify(t))) alias.set(slugify(t), e.id);
  const canonical = (id) => (byId.has(id) ? id : alias.get(id) ?? id);
  const titleOf = (id) => byId.get(id)?.data.ten;
  const missingChu = new Set();

  const out = [];
  for (const e of entries) {
    const links = new Set();
    const ctx = { links, titleOf };
    const d = e.data;
    const item = {
      id: e.id,
      loai: e.loai,
      ten: d.ten,
      ten_han: d.ten_han ?? '',
      ten_khac: d.ten_khac ?? [],
      tom_tat: d.tom_tat ?? '',
      trang_thai: d.trang_thai,
      muc_an_toan: d.muc_an_toan ?? null,
      nguon: (d.nguon ?? []).map(parseSource),
      lien_quan: d.lien_quan ?? [],
      hinh_anh: d.hinh_anh ? renderInline(d.hinh_anh, ctx) : '',
      nhom: d.nhom ?? '',
      facet: {},
      refs: {},
      path: e.path,
      fields: {},
    };
    for (const f of ID_FIELDS) {
      if (d[f] === undefined) continue;
      const ids = (Array.isArray(d[f]) ? d[f] : [d[f]]).map((x) => canonical(slugify(x)));
      item.refs[f] = ids;
      for (const id of ids) if (!byId.has(id)) warnings.push(`${e.path}: "${f}" trỏ tới "${id}" chưa có trang`);
    }
    for (const [k, v] of Object.entries(d)) {
      if (SPECIAL.includes(k)) continue;
      item.fields[k] = Array.isArray(v) ? v.map((x) => renderInline(x, ctx)) : renderInline(v, ctx);
    }
    const { intro, tiers } = splitTiers(e.body);
    item.html = renderMarkdown(intro, ctx);
    item.tang = tiers.map((t) => ({ title: t.title, html: renderMarkdown(t.body, ctx) }));
    for (const c of hanChars(item.ten_han)) if (!chu[c]) missingChu.add(c);

    if (e.loai === 'benh') {
      item.yhct = renderInline(d.yhct ?? '', ctx);
      item.cap_cuu = (d.cap_cuu ?? []).map((x) => renderInline(x, ctx));
      item.duong_sinh = (d.duong_sinh ?? []).map((x) => renderInline(x, ctx));
      item.phoi_hop = d.phoi_hop ? renderInline(d.phoi_hop, ctx) : '';
      // Mỗi thể: "Tên thể | biểu hiện chính | phép trị | bài thuốc (ngăn bằng dấu phẩy)"
      const ref = (name) => {
        const id = canonical(slugify(name));
        return { ten: name, id: byId.has(id) ? id : null };
      };
      item.the_benh = (d.the_benh ?? []).map((line) => {
        const [ten, bieu_hien = '', phep = '', bai = ''] = splitPipe(line);
        return {
          ...ref(ten),
          bieu_hien: renderInline(bieu_hien, ctx),
          phep: phep ? ref(phep) : null,
          bai: bai.split(',').map((s) => s.trim()).filter(Boolean).map(ref),
        };
      });
    }
    if (e.loai === 'vi-thuoc') {
      item.facet = { tinh: [tinhGroup(d.tinh)].filter(Boolean), vi: viList(d.vi), quy_kinh: d.quy_kinh ?? [] };
      item.canh_bao = checkHerbs([e.id], index);
      item.ky_voi = [...index.phan, ...index.uy]
        .map((k) => k.split('|'))
        .filter((p) => p.includes(e.id))
        .map((p) => {
          const other = p[0] === e.id ? p[1] : p[0];
          return { id: other, ten: index.names.get(other) ?? other, loai: index.phan.has([e.id, other].sort().join('|')) ? 'phan' : 'uy' };
        });
      item.vai_tro = [];
    }
    if (e.loai === 'bai-thuoc') {
      item.thanh_phan = (d.thanh_phan ?? []).map(parseIngredient);
      for (const ing of item.thanh_phan) {
        ing.id = canonical(ing.id);
        ing.co_trong_so_cai = byId.has(ing.id);
        if (!ing.co_trong_so_cai) warnings.push(`${e.path}: vị "${ing.ten}" chưa có trang trong sổ cái`);
        ing.viec = renderInline(ing.viec, ctx);
      }
      item.bo_vi = (d.bo_vi ?? []).map((line) => {
        const [ten, hau_qua = ''] = splitPipe(line);
        return { ten, id: canonical(slugify(ten)), hau_qua: renderInline(hau_qua, ctx) };
      });
      item.canh_bao = checkHerbs(item.thanh_phan.map((x) => x.id), index);
      if (item.canh_bao.pairs.length) warnings.push(`${e.path}: có cặp phản/úy: ${item.canh_bao.pairs.map((p) => `${p.a}–${p.b}`).join(', ')}`);
    }
    if (!item.nhom) warnings.push(`${e.path}: chưa có "nhom" (dùng để chia nhóm trong danh sách)`);
    for (const id of [...links, ...item.lien_quan]) if (!byId.has(id)) warnings.push(`${e.path}: liên kết tới "${id}" chưa có trang`);
    item.search = [d.ten, d.ten_han, ...(d.ten_khac ?? []), d.tom_tat, plainText(e.body), ...Object.values(d).flat()].filter(Boolean).join(' ');
    out.push(item);
  }

  // Quan hệ tính từ toàn bộ sổ cái
  const itemById = new Map(out.map((x) => [x.id, x]));
  for (const f of out.filter((x) => x.loai === 'bai-thuoc')) {
    // Vai trò của vị ở các bài
    for (const ing of f.thanh_phan) {
      const herb = itemById.get(ing.id);
      if (herb?.vai_tro) herb.vai_tro.push({ bai: f.id, ten_bai: f.ten, vai: ing.vai, viec: ing.viec });
    }
    // Họ bài thuốc: bài con khai báo "ho: bai-goc"; tự tính vị thêm/bớt so với bài gốc
    const goc = f.refs.ho?.[0] && itemById.get(f.refs.ho[0]);
    if (goc?.thanh_phan) {
      const base = new Set(goc.thanh_phan.map((x) => x.id));
      const mine = new Set(f.thanh_phan.map((x) => x.id));
      f.so_voi_goc = {
        goc: goc.id,
        them: f.thanh_phan.filter((x) => !base.has(x.id)).map((x) => ({ id: x.id, ten: x.ten })),
        bot: goc.thanh_phan.filter((x) => !mine.has(x.id)).map((x) => ({ id: x.id, ten: x.ten })),
      };
      (goc.ho_con ??= []).push(f.id);
    }
  }
  // Ngược lại: chứng ↔ phép trị ↔ bài thuốc (để mỗi trang thấy những trang trỏ về nó)
  for (const x of out) {
    for (const f of ['phep_tri', 'bai_thuoc', 'chung']) {
      for (const id of x.refs[f] ?? []) {
        const target = itemById.get(id);
        if (!target || target.id === x.id) continue;
        const list = ((target.duoc_nhac ??= {})[x.loai] ??= []);
        if (!list.includes(x.id)) list.push(x.id);
      }
    }
  }
  if (missingChu.size) warnings.push(`content/_data/chu.json: chưa giải nghĩa ${missingChu.size} chữ: ${[...missingChu].join(' ')}`);

  const site = readJson(join(root, 'content', '_data', 'site.json'));
  const danhThu = readJson(join(root, 'content', '_data', 'danh-thu.json'));
  const db = {
    version: 2,
    generatedAt: new Date().toISOString(),
    site,
    types: Object.fromEntries(Object.entries(TYPES).map(([k, v]) => [k, v.label])),
    entries: out,
    chu,
    danhThu,
    rules,
  };

  for (const w of warnings) log(`  cảnh báo: ${w}`);
  for (const er of errors) log(`  LỖI: ${er}`);
  log(`MEDAI: ${out.length} mục, ${Object.keys(chu).length} chữ, ${warnings.length} cảnh báo, ${errors.length} lỗi.`);

  if (write && errors.length === 0) {
    mkdirSync(join(root, 'site', 'data'), { recursive: true });
    writeFileSync(join(root, 'site', 'data', 'db.json'), JSON.stringify(db));
    log('Đã ghi site/data/db.json');
  }
  return { db, errors, warnings };
}

const isMain = process.argv[1] && resolve(fileURLToPath(import.meta.url)).toLowerCase() === resolve(process.argv[1]).toLowerCase();
if (isMain) {
  const { errors } = build({ write: !process.argv.includes('--check') });
  process.exit(errors.length ? 1 : 0);
}
