// Phần lõi dùng chung cho trình duyệt và script dựng web (tools/build.mjs).
// Không phụ thuộc thư viện ngoài.

/** Bỏ dấu tiếng Việt, đổi đ → d, chữ thường. Giữ nguyên chữ Hán. */
export function normalizeText(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** "Cam thảo" → "cam-thao". Dùng làm mã định danh cho vị thuốc, bài thuốc, thuật ngữ. */
export function slugify(text) {
  return normalizeText(text)
    .replace(/[^a-z0-9㐀-鿿]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function pairKey(a, b) {
  return [a, b].sort().join('|');
}

/**
 * Dựng chỉ mục quy tắc cấm kỵ từ dữ liệu trong rules/.
 * rules = { phanUy: {phan:[{vi, ky:[...]}], uy:[[a,b],...]}, thaiKy: {cam:[...], than_trong:[...]}, viDoc: {rat_doc:[...], co_doc:[...]} }
 */
export function buildRuleIndex(rules) {
  const names = new Map();
  const remember = (name) => {
    const id = slugify(name);
    if (!names.has(id)) names.set(id, name);
    return id;
  };
  const phan = new Set();
  for (const group of rules.phanUy?.phan ?? []) {
    const a = remember(group.vi);
    for (const other of group.ky) phan.add(pairKey(a, remember(other)));
  }
  const uy = new Set();
  for (const [x, y] of rules.phanUy?.uy ?? []) uy.add(pairKey(remember(x), remember(y)));

  const thai = new Map();
  for (const n of rules.thaiKy?.cam ?? []) thai.set(remember(n), 'cam');
  for (const n of rules.thaiKy?.than_trong ?? []) if (!thai.has(slugify(n))) thai.set(remember(n), 'than-trong');

  const doc = new Map();
  for (const n of rules.viDoc?.rat_doc ?? []) doc.set(remember(n), 'rat-doc');
  for (const n of rules.viDoc?.co_doc ?? []) if (!doc.has(slugify(n))) doc.set(remember(n), 'co-doc');

  return { phan, uy, thai, doc, names };
}

/**
 * Kiểm tra một nhóm vị thuốc theo Thập bát phản, Thập cửu úy, thai kỵ, độc tính.
 * herbs: mảng tên hoặc mã (slug). Trả về danh sách cảnh báo.
 */
export function checkHerbs(herbs, index) {
  const ids = [...new Set(herbs.map((h) => slugify(h)).filter(Boolean))];
  const name = (id) => index.names.get(id) ?? id;
  const pairs = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const key = pairKey(ids[i], ids[j]);
      if (index.phan.has(key)) pairs.push({ loai: 'phan', a: name(ids[i]), b: name(ids[j]) });
      if (index.uy.has(key)) pairs.push({ loai: 'uy', a: name(ids[i]), b: name(ids[j]) });
    }
  }
  const thai = ids.filter((id) => index.thai.has(id)).map((id) => ({ vi: name(id), muc: index.thai.get(id) }));
  const doc = ids.filter((id) => index.doc.has(id)).map((id) => ({ vi: name(id), muc: index.doc.get(id) }));
  return { pairs, thai, doc, ok: pairs.length === 0 && thai.length === 0 && doc.length === 0 };
}

/** Tách danh sách vị thuốc người dùng gõ: phẩy, chấm phẩy, xuống dòng, dấu cộng. */
export function splitHerbList(text) {
  return String(text ?? '')
    .split(/[,;\n+、，]+/)
    .map((s) => s
      .replace(/\s*\d+([.,]\d+)?\s*(gam|gr|g|chỉ|chi|lạng|lang)(?=\s|$)/gi, '')
      .replace(/\s+\d+([.,]\d+)?\s*$/, '')
      .trim())
    .filter(Boolean);
}
