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
  'thuat-ngu': { label: 'Thuật ngữ', required: ['ten', 'tom_tat'] },
  'vi-thuoc': { label: 'Vị thuốc', required: ['ten', 'tinh', 'vi', 'quy_kinh', 'tom_tat', 'muc_an_toan'] },
  'bai-thuoc': { label: 'Bài thuốc', required: ['ten', 'thanh_phan', 'tom_tat', 'muc_an_toan'] },
  'duong-sinh': { label: 'Dưỡng sinh', required: ['ten', 'tom_tat'] },
  'so-tay': { label: 'Sổ tay nghiên cứu', required: ['ten', 'tom_tat'] },
};
const STATUS = ['nhap', 'da-doi-chieu'];
const SAFETY = ['xanh', 'vang', 'do'];
const LIST_FIELDS = ['ten_khac', 'quy_kinh', 'nguon', 'lien_quan', 'thanh_phan', 'kieng_ky', 'cong_nang', 'chu_tri'];

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

export function loadRules(root = ROOT) {
  return {
    phanUy: readJson(join(root, 'rules', 'phan-uy.json')),
    thaiKy: readJson(join(root, 'rules', 'thai-ky.json')),
    viDoc: readJson(join(root, 'rules', 'vi-doc.json')),
  };
}

function parseSource(line) {
  const [label, url] = line.split('|').map((s) => s.trim());
  return { label, url: url && /^https?:\/\//.test(url) ? url : null };
}

function parseIngredient(line) {
  const [ten, vai = '', lieu = ''] = line.split('|').map((s) => s.trim());
  return { ten, id: slugify(ten), vai: vai.toLowerCase(), lieu };
}

function splitTiers(body) {
  const parts = body.split(/^##\s+(Tầng\s+\d[^\n]*)$/m);
  if (parts.length < 3) return { intro: body, tiers: [] };
  const tiers = [];
  for (let i = 1; i < parts.length; i += 2) tiers.push({ title: parts[i].trim(), body: parts[i + 1] ?? '' });
  return { intro: parts[0], tiers };
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

export function build({ root = ROOT, write = true, log = console.log } = {}) {
  const rules = loadRules(root);
  const index = buildRuleIndex(rules);
  const { entries, errors } = loadEntries(root);
  const warnings = [];
  const byId = new Map();

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
  }

  // Tên khác (ví dụ "Chích cam thảo") → mã trang chính ("cam-thao")
  const alias = new Map();
  for (const e of entries) for (const t of e.data.ten_khac ?? []) if (!byId.has(slugify(t))) alias.set(slugify(t), e.id);
  const canonical = (id) => (byId.has(id) ? id : alias.get(id) ?? id);
  const titleOf = (id) => byId.get(id)?.data.ten;
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
      path: e.path,
      fields: {},
    };
    for (const [k, v] of Object.entries(d)) {
      if (['ten', 'ten_han', 'ten_khac', 'tom_tat', 'trang_thai', 'muc_an_toan', 'nguon', 'lien_quan', 'thanh_phan'].includes(k)) continue;
      item.fields[k] = Array.isArray(v) ? v.map((x) => renderInline(x, ctx)) : renderInline(v, ctx);
    }
    const { intro, tiers } = splitTiers(e.body);
    item.html = renderMarkdown(intro, ctx);
    item.tang = tiers.map((t) => ({ title: t.title, html: renderMarkdown(t.body, ctx) }));

    if (e.loai === 'vi-thuoc') {
      item.canh_bao = checkHerbs([e.id], index);
      item.ky_voi = [...index.phan, ...index.uy]
        .map((k) => k.split('|'))
        .filter((p) => p.includes(e.id))
        .map((p) => {
          const other = p[0] === e.id ? p[1] : p[0];
          return { id: other, ten: index.names.get(other) ?? other, loai: index.phan.has([e.id, other].sort().join('|')) ? 'phan' : 'uy' };
        });
    }
    if (e.loai === 'bai-thuoc') {
      item.thanh_phan = (d.thanh_phan ?? []).map(parseIngredient);
      for (const ing of item.thanh_phan) {
        ing.id = canonical(ing.id);
        ing.co_trong_so_cai = byId.has(ing.id);
        if (!ing.co_trong_so_cai) warnings.push(`${e.path}: vị "${ing.ten}" chưa có trang trong sổ cái`);
      }
      item.canh_bao = checkHerbs(item.thanh_phan.map((x) => x.id), index);
      if (item.canh_bao.pairs.length) warnings.push(`${e.path}: có cặp phản/úy: ${item.canh_bao.pairs.map((p) => `${p.a}–${p.b}`).join(', ')}`);
    }
    for (const id of [...links, ...item.lien_quan]) if (!byId.has(id)) warnings.push(`${e.path}: liên kết tới "${id}" chưa có trang`);
    item.search = [d.ten, d.ten_han, ...(d.ten_khac ?? []), d.tom_tat, plainText(e.body), ...Object.values(d).flat()].filter(Boolean).join(' ');
    out.push(item);
  }

  const site = readJson(join(root, 'content', '_data', 'site.json'));
  const danhThu = readJson(join(root, 'content', '_data', 'danh-thu.json'));
  const db = {
    version: 1,
    generatedAt: new Date().toISOString(),
    site,
    types: Object.fromEntries(Object.entries(TYPES).map(([k, v]) => [k, v.label])),
    entries: out,
    danhThu,
    rules,
  };

  for (const w of warnings) log(`  cảnh báo: ${w}`);
  for (const er of errors) log(`  LỖI: ${er}`);
  log(`MEDAI: ${out.length} mục, ${warnings.length} cảnh báo, ${errors.length} lỗi.`);

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
