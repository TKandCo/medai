// Bộ máy phân tích bài thuốc — chỉ gồm hàm thuần, chạy được cả trên trình duyệt lẫn Node (để kiểm thử).
// Mọi kết luận đều suy ra từ dữ liệu sổ cái: tính, vị, quy kinh, nhóm công năng của từng vị,
// các bài thuốc đã có, và quy tắc cấm kỵ. Không có dữ liệu thì nói là không biết.

import { normalizeText, slugify, buildRuleIndex, checkHerbs } from './core.js';

// Đổi đơn vị cũ sang gam (xấp xỉ theo cân ta: 1 lạng = 10 chỉ ≈ 37,5 g)
const UNIT_TO_G = { mg: 0.001, g: 1, gr: 1, gam: 1, gram: 1, 'chỉ': 3.75, chi: 3.75, 'lạng': 37.5, lang: 37.5, 'phân': 0.375 };

/** Tách văn bản đơn thuốc thành từng vị: "1. Nhân sâm 10g" → {ten: "Nhân sâm", lieu_g: 10} */
export function parseFormulaText(text) {
  const pieces = String(text ?? '')
    .replace(/\r/g, '')
    .split(/[\n;+、，]+|,(?!\d)/) // không tách dấu phẩy thập phân như "0,1 g"
    .map((s) => s.trim())
    .filter(Boolean);
  const out = [];
  for (const raw of pieces) {
    let s = raw.replace(/^\s*(\d+\s*[.)]|[-–•*·])\s*/, '').trim(); // bỏ số thứ tự, gạch đầu dòng
    let lieu_g = null;
    let lieu_text = '';
    const m = s.match(/(\d+(?:[.,]\d+)?)\s*(mg|gram|gam|gr|g|chỉ|chi|lạng|lang|phân)?\s*\.?$/i);
    if (m) {
      const n = parseFloat(m[1].replace(',', '.'));
      const unit = (m[2] || 'g').toLowerCase();
      lieu_g = Math.round(n * (UNIT_TO_G[unit] ?? 1) * 10) / 10;
      lieu_text = m[0].trim();
      s = s.slice(0, m.index);
    } else {
      // Liều đếm theo cái, không đổi được ra gam: "Sinh khương 3 lát", "Đại táo 5 quả"
      const c = s.match(/(\d+)\s*(lát|quả|trái|củ|nhánh|miếng|cái|tép)\s*$/i);
      if (c) { lieu_text = c[0].trim(); s = s.slice(0, c.index); }
    }
    const ten = s.replace(/[:\-–=]+\s*$/, '').replace(/\s+/g, ' ').trim();
    if (ten && /\p{L}/u.test(ten)) out.push({ raw, ten, lieu_g, lieu_text });
  }
  return out;
}

export function levenshtein(a, b) {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

/** Chỉ mục tên vị: tên chính, tên khác trong sổ cái, và tên trong quy tắc cấm kỵ */
export function buildHerbIndex(db, ruleIndex) {
  const names = [];
  for (const e of db.entries.filter((x) => x.loai === 'vi-thuoc')) {
    for (const t of [e.ten, ...(e.ten_khac ?? [])]) names.push({ key: normalizeText(t), id: e.id, ten: e.ten, inBook: true });
  }
  for (const [id, ten] of ruleIndex.names) {
    if (!names.some((n) => n.id === id)) names.push({ key: normalizeText(ten), id, ten, inBook: false });
  }
  const byKey = new Map(names.map((n) => [n.key, n]));
  return { names, byKey };
}

/** Nhận ra một tên vị; gõ sai một vài chữ (hay do máy đọc ảnh) vẫn đoán được */
export function resolveHerb(name, herbIndex) {
  const key = normalizeText(name);
  const exact = herbIndex.byKey.get(key);
  if (exact) return { ...exact, cach: 'dung' };
  // Đoán thận trọng: chữ cái đầu phải khớp, chỉ cho sai 1 chữ (tên dài từ 10 ký tự: 2 chữ).
  // Đoán nhầm vị thuốc nguy hiểm hơn là nói "chưa nhận ra".
  const limit = key.length >= 10 ? 2 : 1;
  let best = null;
  let tie = false;
  for (const n of herbIndex.names) {
    if (n.key[0] !== key[0]) continue;
    const d = levenshtein(key, n.key);
    if (d > limit) continue;
    if (!best || d < best.d) { best = { ...n, d }; tie = false; } else if (d === best.d && n.id !== best.id) tie = true;
  }
  return best && !tie ? { ...best, cach: 'doan' } : null;
}

const TINH_SCORE = { 'Lạnh (hàn)': -2, 'Mát (lương)': -1, 'Bình': 0, 'Ấm (ôn)': 1, 'Nóng (nhiệt)': 2 };
export function tinhLabel(score) {
  if (score <= -1.2) return 'lạnh (hàn)';
  if (score <= -0.4) return 'mát (lương)';
  if (score < 0.4) return 'bình hòa';
  if (score < 1.2) return 'ấm (ôn)';
  return 'nóng (nhiệt)';
}

function shareOf(items) {
  const total = items.reduce((s, [, w]) => s + w, 0) || 1;
  const map = new Map();
  for (const [k, w] of items) map.set(k, (map.get(k) ?? 0) + w);
  return [...map.entries()].map(([k, w]) => ({ ten: k, ti_le: w / total })).sort((a, b) => b.ti_le - a.ti_le);
}

/** Phân tích một bài thuốc từ văn bản. db = dữ liệu sổ cái (db.json). */
export function analyzeFormula(text, db) {
  const ruleIndex = buildRuleIndex(db.rules);
  const herbIndex = buildHerbIndex(db, ruleIndex);
  const byId = new Map(db.entries.map((e) => [e.id, e]));
  const lines = parseFormulaText(text);

  const vi = lines.map((l) => {
    const r = resolveHerb(l.ten, herbIndex);
    const entry = r?.inBook ? byId.get(r.id) : null;
    return { ...l, id: r?.id ?? null, ten_chuan: r?.ten ?? null, cach: r?.cach ?? null, entry };
  });
  // Gộp vị trùng (ví dụ ghi hai lần)
  const seen = new Set();
  const known = vi.filter((v) => v.id && !seen.has(v.id) && seen.add(v.id));
  const unknown = vi.filter((v) => !v.id);
  const withData = known.filter((v) => v.entry);
  const allDosed = withData.length > 0 && withData.every((v) => v.lieu_g);
  const w = (v) => (allDosed ? v.lieu_g : 1);

  const tinhItems = withData.filter((v) => v.entry.facet?.tinh?.length).map((v) => [TINH_SCORE[v.entry.facet.tinh[0]], w(v)]);
  const tinhWeight = tinhItems.reduce((s, [, x]) => s + x, 0);
  const tinhScore = tinhWeight ? tinhItems.reduce((s, [sc, x]) => s + sc * x, 0) / tinhWeight : null;

  const quy = shareOf(withData.flatMap((v) => (v.entry.facet?.quy_kinh ?? []).map((k) => [k, w(v) / (v.entry.facet.quy_kinh.length || 1)])));
  const nhom = shareOf(withData.filter((v) => v.entry.nhom).map((v) => [v.entry.nhom, w(v)]));
  const vi5 = shareOf(withData.flatMap((v) => (v.entry.facet?.vi ?? []).map((k) => [k, w(v) / (v.entry.facet.vi.length || 1)])));

  // Giống bài nào trong sổ cái
  const ids = new Set(known.map((v) => v.id));
  const giong = db.entries.filter((e) => e.loai === 'bai-thuoc').map((f) => {
    const fIds = new Set(f.thanh_phan.map((x) => x.id));
    const chung = [...ids].filter((id) => fIds.has(id));
    const union = new Set([...ids, ...fIds]).size;
    return {
      id: f.id, ten: f.ten, tom_tat: f.tom_tat,
      trung: chung.length, tong: fIds.size, do_giong: union ? chung.length / union : 0,
      them: known.filter((v) => !fIds.has(v.id)).map((v) => v.ten_chuan),
      thieu: f.thanh_phan.filter((x) => !ids.has(x.id)).map((x) => x.ten),
      phep_tri: (f.refs?.phep_tri ?? []).map((id) => byId.get(id)?.ten).filter(Boolean),
      chung_benh: (f.refs?.chung ?? []).map((id) => byId.get(id)?.ten).filter(Boolean),
      vai: Object.fromEntries(f.thanh_phan.map((x) => [x.id, x.vai])),
    };
  }).filter((g) => g.trung >= 2).sort((a, b) => b.do_giong - a.do_giong || b.trung - a.trung).slice(0, 3);
  const best = giong[0] && giong[0].do_giong >= 0.6 ? giong[0] : null;

  // Vai trò: theo bài gốc nếu nhận ra được bài, nếu không thì chỉ gợi ý vị liều cao nhất
  const maxDose = Math.max(0, ...known.map((v) => v.lieu_g ?? 0));
  for (const v of known) {
    v.vai = best?.vai[v.id] || '';
    v.lieu_cao_nhat = !best && allDosed && v.lieu_g === maxDose && maxDose > 0;
  }

  const canh_bao = checkHerbs(known.map((v) => v.id), ruleIndex);

  return {
    vi: known, unknown, allDosed,
    so_vi_co_du_lieu: withData.length,
    tinh: tinhScore === null ? null : { diem: tinhScore, nhan: tinhLabel(tinhScore) },
    quy, nhom, vi5, giong, best, canh_bao,
  };
}
