// MEDAI — ứng dụng web một trang, không framework.
// Dữ liệu: data/db.json (do tools/build.mjs tạo). Định tuyến bằng #/...

import { normalizeText, buildRuleIndex, checkHerbs, splitHerbList, slugify } from './core.js';
import { pageLearn, pageTongue, mountTongue, pageThuyHoa, mountThuyHoa, pageDragon, mountDragon } from './hoc.js';

let $main = document.getElementById('main');
let DB = null;
let RULES = null;
let BY_ID = new Map();

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const SAFETY = {
  xanh: { label: 'Tự áp dụng được', note: 'Dưỡng sinh, ăn uống, dùng lành tính.' },
  vang: { label: 'Cần xác định đúng thể bệnh', note: 'Cùng một bệnh, khác thể thì khác bài. Đọc kỹ phần chủ trị và kiêng kỵ trước khi dùng.' },
  do: { label: 'Không tự dùng', note: 'Có vị độc hoặc nguy cơ cao. Chỉ để học và nghiên cứu; dùng phải có thầy thuốc theo dõi.' },
};
const STATUS = {
  nhap: { label: 'Bản nháp', note: 'Chưa đối chiếu xong với trang gốc. Dùng để tham khảo, chưa nên dựa vào.' },
  'da-doi-chieu': { label: 'Đã đối chiếu nguồn', note: 'Từng ý đã được so với danh thư ghi ở mục Nguồn.' },
};
const FIELD_LABELS = {
  ten_khoa_hoc: 'Tên khoa học', bo_phan_dung: 'Bộ phận dùng', tinh: 'Tính', vi: 'Vị', quy_kinh: 'Quy kinh',
  cong_nang: 'Công năng', chu_tri: 'Chủ trị', lieu: 'Liều dùng', bao_che: 'Bào chế', cach_dung: 'Cách dùng',
  kieng_ky: 'Kiêng kỵ', doc_tinh: 'Độc tính', xuat_xu: 'Xuất xứ', phap_tri: 'Pháp trị', gia_giam: 'Gia giảm',
  doi_tuong: 'Đối tượng', thoi_diem: 'Thời điểm',
  trieu_chung_chinh: 'Triệu chứng chính', trieu_chung_phu: 'Triệu chứng kèm', luoi: 'Lưỡi', mach: 'Mạch',
  o_dau: 'Ở đâu', cai_gi: 'Cái gì', the_nao: 'Thế nào', dong_tu: 'Động từ', dung_khi: 'Dùng khi', ghi_chu: 'Ghi chú',
};
const ROLE_ORDER = ['quân', 'thần', 'tá', 'sứ', ''];
const RED_FLAGS = [
  'Đau thắt ngực, khó thở, vã mồ hôi lạnh',
  'Méo miệng, yếu hoặc tê liệt nửa người, nói khó đột ngột',
  'Nôn ra máu, đi ngoài phân đen, ho ra máu',
  'Sốt cao ở trẻ nhỏ, co giật, li bì khó đánh thức',
  'Đau bụng dữ dội, bụng cứng',
  'Ngộ độc sau khi uống thuốc: tê môi lưỡi, buồn nôn, tim đập loạn (thường gặp với Phụ tử, Ô đầu)',
];

function store(key, value) {
  try {
    if (value === undefined) return localStorage.getItem(key);
    localStorage.setItem(key, value);
  } catch { /* trình duyệt chặn lưu trữ: bỏ qua */ }
  return null;
}

function setTitle(t) {
  document.title = t ? `${t} · MEDAI` : 'MEDAI · Sổ cái Y học cổ truyền';
}

function badge(text, kind) {
  return `<span class="badge badge-${kind}">${esc(text)}</span>`;
}

function entryCard(e) {
  const safety = e.muc_an_toan ? badge(SAFETY[e.muc_an_toan].label, e.muc_an_toan) : '';
  const draft = e.trang_thai === 'nhap' ? badge('Bản nháp', 'nhap') : '';
  return `<a class="card" href="#/m/${esc(e.id)}">
    <span class="card-type">${esc(DB.types[e.loai])}</span>
    <span class="card-title">${esc(e.ten)} ${e.ten_han ? `<span class="han">${esc(e.ten_han)}</span>` : ''}</span>
    <span class="card-sum">${esc(e.tom_tat)}</span>
    <span class="card-badges">${safety}${draft}</span>
  </a>`;
}

// ---------- Tìm kiếm ----------
let SEARCH = [];
function indexSearch() {
  SEARCH = DB.entries.map((e) => ({
    e,
    title: normalizeText([e.ten, ...e.ten_khac].join(' ')),
    han: e.ten_han,
    // Bọc bằng dấu cách để chỉ khớp ở đầu chữ ("hu" không khớp vào giữa "phu")
    text: ` ${normalizeText(e.search).replace(/[^a-z0-9㐀-鿿]+/g, ' ')} `,
  }));
}
function search(q) {
  const nq = normalizeText(q);
  if (!nq) return [];
  const tokens = nq.split(' ');
  return SEARCH.map((s) => {
    let score = 0;
    if (s.title === nq) score += 200;
    else if (s.title.startsWith(nq)) score += 120;
    else if (s.title.includes(nq)) score += 80;
    if (s.han && q.trim() && s.han.includes(q.trim())) score += 150;
    const has = (t) => s.text.includes(` ${t}`) || /[㐀-鿿]/.test(t) && s.text.includes(t);
    for (const t of tokens) if (has(t)) score += 10;
    if (tokens.length > 1 && s.text.includes(` ${nq} `)) score += 40; // đúng cả cụm
    if (!tokens.every((t) => has(t) || s.title.includes(t))) score = Math.min(score, 0);
    return { e: s.e, score };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.e);
}

// ---------- Các trang ----------
function pageHome() {
  setTitle('');
  const counts = Object.entries(DB.types).map(([k, label]) => {
    const n = DB.entries.filter((e) => e.loai === k).length;
    return `<a class="stat" href="#/muc/${k}"><strong>${n}</strong><span>${esc(label)}</span></a>`;
  }).join('');
  return `<section class="hero">
      <h1>Sổ cái Y học cổ truyền</h1>
      <p class="lead">Mỗi dòng trong sổ đều dẫn về danh thư gốc — lấy <em>Hải Thượng Y Tông Tâm Lĩnh</em> của Hải Thượng Lãn Ông Lê Hữu Trác làm trục. Đọc để hiểu thân thể, hiểu thuốc, rồi dùng thuốc có căn cứ.</p>
      <form class="bigsearch" id="bigsearch" role="search">
        <input type="search" name="q" placeholder="Ví dụ: cam thảo, tỳ hư, 四君子湯, đau dạ dày" aria-label="Tìm trong sổ cái" autocomplete="off">
        <button type="submit">Tìm</button>
      </form>
    </section>
    <section class="stats">${counts}</section>
    <section class="tiles">
      <a class="tile" href="#/hoc"><h2>Học bằng hình</h2><p>Nồi nước – Bếp lửa để hiểu hàn nhiệt hư thực; Lưỡi tự dựng để hiểu thiệt chẩn.</p></a>
      <a class="tile" href="#/kiem-chung"><h2>Kiểm chứng lời đồn</h2><p>Dán một bài thuốc nghe được trên mạng. MEDAI đối chiếu với Thập bát phản, Thập cửu úy, thai kỵ và vị có độc.</p></a>
      <a class="tile" href="#/muc/thuat-ngu"><h2>Học từ gốc</h2><p>Mỗi thuật ngữ có 3 tầng giải thích: bình dân, học viên, chuyên sâu kèm nguyên văn.</p></a>
      <a class="tile" href="#/nguon"><h2>Danh thư</h2><p>Các bộ sách làm nền cho sổ cái và nơi đọc bản số hóa miễn phí.</p></a>
    </section>
    <section class="levels">
      <h2>Ba mức an toàn</h2>
      <ul>
        <li>${badge(SAFETY.xanh.label, 'xanh')} ${esc(SAFETY.xanh.note)}</li>
        <li>${badge(SAFETY.vang.label, 'vang')} ${esc(SAFETY.vang.note)}</li>
        <li>${badge(SAFETY.do.label, 'do')} ${esc(SAFETY.do.note)}</li>
      </ul>
    </section>`;
}

function pageList(loai) {
  const label = DB.types[loai];
  if (!label) return pageNotFound();
  setTitle(label);
  const items = DB.entries.filter((e) => e.loai === loai).sort((a, b) => a.ten.localeCompare(b.ten, 'vi'));
  return `<h1>${esc(label)}</h1>
    <p class="muted">${items.length} mục. Mục mang nhãn “Bản nháp” chưa đối chiếu xong với trang gốc.</p>
    <div class="cards">${items.map(entryCard).join('') || '<p>Chưa có mục nào.</p>'}</div>`;
}

function pageSearch(q) {
  setTitle(`Tìm: ${q}`);
  const results = search(q);
  return `<h1>Kết quả cho “${esc(q)}”</h1>
    <p class="muted">${results.length} mục. Gõ không dấu hoặc chữ Hán đều được.</p>
    <div class="cards">${results.map(entryCard).join('') || '<p>Chưa có trong sổ cái. Có thể đề xuất thêm qua GitHub.</p>'}</div>`;
}

function warningsHtml(cb) {
  if (!cb) return '';
  const parts = [];
  for (const p of cb.pairs) parts.push(`<li><strong>${p.loai === 'phan' ? 'Tương phản' : 'Tương úy'}:</strong> ${esc(p.a)} – ${esc(p.b)} (${p.loai === 'phan' ? 'Thập bát phản' : 'Thập cửu úy'})</li>`);
  for (const t of cb.thai) parts.push(`<li><strong>${t.muc === 'cam' ? 'Cấm dùng khi có thai' : 'Thận trọng khi có thai'}:</strong> ${esc(t.vi)}</li>`);
  for (const d of cb.doc) parts.push(`<li><strong>${d.muc === 'rat-doc' ? 'Vị rất độc' : 'Vị có độc'}:</strong> ${esc(d.vi)} — phải bào chế đúng phép, không tự dùng</li>`);
  return parts.length ? `<ul class="warnlist">${parts.join('')}</ul>` : '';
}

function fieldsHtml(fields) {
  const rows = Object.entries(fields).map(([k, v]) => {
    const value = Array.isArray(v) ? (v.length > 1 ? `<ul>${v.map((x) => `<li>${x}</li>`).join('')}</ul>` : v.join('')) : v;
    return `<tr><th scope="row">${esc(FIELD_LABELS[k] ?? k.replace(/_/g, ' '))}</th><td>${value}</td></tr>`;
  });
  return rows.length ? `<table class="facts"><tbody>${rows.join('')}</tbody></table>` : '';
}

const ROLE_INFO = {
  'quân': ['Quân', 'Vị chủ lực, giải quyết vấn đề chính'],
  'thần': ['Thần', 'Giúp Quân, hoặc lo chứng kèm quan trọng'],
  'tá': ['Tá', 'Giúp thêm, hoặc kiềm bớt tác dụng phụ'],
  'sứ': ['Sứ', 'Dẫn thuốc tới nơi, điều hòa các vị'],
  '': ['Khác', 'Chưa ghi vai trò'],
};
const hanChars = (s) => [...new Set([...String(s ?? '')].filter((c) => /[㐀-鿿豈-﫿]/.test(c)))];
const link = (id) => (BY_ID.has(id) ? `<a href="#/m/${esc(id)}">${esc(BY_ID.get(id).ten)}</a>` : `<span class="muted">${esc(id)}</span>`);
const linkList = (ids) => ids.map(link).join(', ');

function giaiChuHtml(e) {
  const chars = hanChars(e.ten_han);
  if (!chars.length) return '';
  const rows = chars.map((c) => {
    const x = DB.chu[c];
    if (!x) return `<tr><td class="han big">${esc(c)}</td><td colspan="4" class="muted">Chưa giải nghĩa</td></tr>`;
    return `<tr><td><a class="han big" href="#/chu/${encodeURIComponent(c)}">${esc(c)}</a></td><td><strong>${esc(x.am)}</strong></td>
      <td>${esc(x.bo ?? '')}${x.bo_ten ? ` <span class="muted">${esc(x.bo_ten)}</span>` : ''}</td><td>${esc(x.nghia)}</td><td>${esc(x.nghia_y ?? '')}</td></tr>`;
  }).join('');
  return `<details class="giai-chu" open><summary>Giải chữ · ${esc(e.ten_han)}</summary>
    <div class="table-wrap"><table><thead><tr><th>Chữ</th><th>Âm</th><th>Bộ thủ</th><th>Nghĩa thường ngày</th><th>Nghĩa trong y học</th></tr></thead><tbody>${rows}</tbody></table></div>
  </details>`;
}

function chainHtml(e) {
  const nhac = e.duoc_nhac ?? {};
  let steps = [];
  if (e.loai === 'bai-thuoc') {
    const quan = e.thanh_phan.filter((x) => x.vai === 'quân').map((x) => x.id);
    steps = [['Chứng', e.refs.chung ?? []], ['Phép trị', e.refs.phep_tri ?? []], ['Bài', [e.id]], ['Vị chủ lực', quan]];
  } else if (e.loai === 'chung') {
    steps = [['Chứng', [e.id]], ['Phép trị', e.refs.phep_tri ?? []], ['Bài', [...(e.refs.bai_thuoc ?? []), ...(nhac['bai-thuoc'] ?? [])]]];
  } else if (e.loai === 'phep-tri') {
    steps = [['Chứng', [...(e.refs.chung ?? []), ...(nhac.chung ?? [])]], ['Phép trị', [e.id]], ['Bài', [...(e.refs.bai_thuoc ?? []), ...(nhac['bai-thuoc'] ?? [])]]];
  } else return '';
  steps = steps.map(([t, ids]) => [t, [...new Set(ids)]]);
  if (steps.filter(([, ids]) => ids.length).length < 2) return '';
  return `<nav class="chain" aria-label="Chuỗi lý luận">${steps.map(([t, ids]) => `<div class="chain-step${ids.includes(e.id) ? ' here' : ''}">
      <span class="chain-label">${esc(t)}</span><span>${ids.length ? ids.map((id) => (id === e.id ? `<strong>${esc(e.ten)}</strong>` : link(id))).join('<br>') : '<span class="muted">—</span>'}</span></div>`).join('<span class="chain-arrow" aria-hidden="true">→</span>')}</nav>`;
}

function teamHtml(list) {
  const groups = ['quân', 'thần', 'tá', 'sứ', ''].map((r) => [r, list.filter((x) => (ROLE_INFO[x.vai] ? x.vai : '') === r)]).filter(([, xs]) => xs.length);
  return `<h2>Đội hình</h2>
    <div class="team">${groups.map(([r, xs]) => `<section class="team-col team-${esc(slugify(r) || 'khac')}">
      <h3>${esc(ROLE_INFO[r][0])}<small>${esc(ROLE_INFO[r][1])}</small></h3>
      ${xs.map((x) => `<div class="member"><div class="member-name">${x.co_trong_so_cai ? `<a href="#/m/${esc(x.id)}">${esc(x.ten)}</a>` : esc(x.ten)}${x.lieu ? `<span class="dose">${esc(x.lieu)}</span>` : ''}</div>${x.viec ? `<div class="member-job">${x.viec}</div>` : ''}</div>`).join('')}
    </section>`).join('')}</div>`;
}

function boViHtml(list) {
  if (!list?.length) return '';
  return `<h2>Bỏ vị này thì sao?</h2><div class="drop-list">${list.map((x) => `<details><summary>Bỏ <strong>${esc(x.ten)}</strong></summary><p>${x.hau_qua}</p></details>`).join('')}</div>`;
}

function familyHtml(e) {
  const parts = [];
  if (e.so_voi_goc) {
    const s = e.so_voi_goc;
    const name = (x) => (BY_ID.has(x.id) ? link(x.id) : esc(x.ten));
    parts.push(`<p>Bài gốc: ${link(s.goc)}${s.them.length ? ` · <span class="plus">thêm ${s.them.map(name).join(', ')}</span>` : ''}${s.bot.length ? ` · <span class="minus">bớt ${s.bot.map(name).join(', ')}</span>` : ''}</p>`);
  }
  if (e.ho_con?.length) {
    parts.push(`<ul class="family">${e.ho_con.map((id) => {
      const c = BY_ID.get(id);
      const s = c.so_voi_goc;
      return `<li>${link(id)} — ${s.them.length ? `<span class="plus">thêm ${s.them.map((x) => esc(x.ten)).join(', ')}</span>` : ''}${s.bot.length ? ` <span class="minus">bớt ${s.bot.map((x) => esc(x.ten)).join(', ')}</span>` : ''}<br><span class="muted small">${esc(c.tom_tat)}</span></li>`;
    }).join('')}</ul>`);
  }
  return parts.length ? `<h2>Họ bài thuốc</h2>${parts.join('')}` : '';
}

function vaiTroHtml(e) {
  if (!e.vai_tro?.length) return '';
  return `<h2>Vị này đóng vai gì ở các bài</h2><div class="table-wrap"><table><thead><tr><th>Bài thuốc</th><th>Vai</th><th>Việc trong bài</th></tr></thead><tbody>${e.vai_tro.map((v) => `<tr><td>${link(v.bai)}</td><td>${v.vai ? `<span class="role role-${esc(slugify(v.vai))}">${esc(ROLE_INFO[v.vai]?.[0] ?? v.vai)}</span>` : ''}</td><td>${v.viec || '<span class="muted">chưa ghi</span>'}</td></tr>`).join('')}</tbody></table></div>
    <p class="muted small">Quân, Thần, Tá, Sứ là việc được giao trong một bài, không phải bản chất cố định của vị thuốc.</p>`;
}

function refsHtml(e) {
  if (e.loai !== 'chung' && e.loai !== 'phep-tri') return '';
  const nhac = e.duoc_nhac ?? {};
  const rows = [];
  if (e.refs.nguoc_lai) rows.push(['Phép ngược lại', e.refs.nguoc_lai]);
  if (e.refs.ho) rows.push(['Thuộc nhóm', e.refs.ho]);
  return rows.length ? `<table class="facts"><tbody>${rows.map(([t, ids]) => `<tr><th scope="row">${esc(t)}</th><td>${linkList(ids)}</td></tr>`).join('')}</tbody></table>` : '';
}

function tiersHtml(e) {
  if (!e.tang.length) return '';
  const saved = Number(store('medai-tang') ?? 0);
  const active = saved < e.tang.length ? saved : 0;
  return `<div class="tiers">
    <div class="tier-tabs" role="tablist">${e.tang.map((t, i) => `<button role="tab" type="button" data-tier="${i}" aria-selected="${i === active}">${esc(t.title)}</button>`).join('')}</div>
    ${e.tang.map((t, i) => `<div class="tier-panel" role="tabpanel" data-panel="${i}"${i === active ? '' : ' hidden'}>${t.html}</div>`).join('')}
  </div>`;
}

function pageEntry(id) {
  const e = BY_ID.get(id);
  if (!e) return pageNotFound();
  setTitle(e.ten);
  const repo = DB.site.repo;
  const st = STATUS[e.trang_thai];
  const safety = e.muc_an_toan ? SAFETY[e.muc_an_toan] : null;
  const warn = warningsHtml(e.canh_bao);
  const kyVoi = e.ky_voi?.length
    ? `<h2>Kỵ phối hợp với</h2><ul>${e.ky_voi.map((k) => `<li>${BY_ID.has(k.id) ? `<a href="#/m/${esc(k.id)}">${esc(k.ten)}</a>` : esc(k.ten)} (${k.loai === 'phan' ? 'tương phản' : 'tương úy'})</li>`).join('')}</ul>`
    : '';
  const related = e.lien_quan.filter((x) => BY_ID.has(x));
  return `<article class="entry">
    <p class="crumbs"><a href="#/muc/${esc(e.loai)}">${esc(DB.types[e.loai])}</a></p>
    <h1>${esc(e.ten)} ${e.ten_han ? `<span class="han">${esc(e.ten_han)}</span>` : ''}</h1>
    ${e.ten_khac.length ? `<p class="muted">Tên khác: ${esc(e.ten_khac.join(', '))}</p>` : ''}
    <p class="lead">${esc(e.tom_tat)}</p>
    <p class="card-badges">${safety ? badge(safety.label, e.muc_an_toan) : ''}${badge(st.label, e.trang_thai)}</p>
    ${e.trang_thai === 'nhap' ? `<div class="notice notice-nhap">${esc(st.note)}</div>` : ''}
    ${safety && e.muc_an_toan !== 'xanh' ? `<div class="notice notice-${e.muc_an_toan}">${esc(safety.note)}</div>` : ''}
    ${warn ? `<div class="notice notice-do"><strong>Cảnh báo theo quy tắc cổ điển</strong>${warn}</div>` : ''}
    ${chainHtml(e)}
    ${giaiChuHtml(e)}
    ${e.hinh_anh ? `<div class="picture-note"><span class="picture-tag">Hình ảnh để hiểu</span><p>${e.hinh_anh}</p></div>` : ''}
    ${fieldsHtml(e.fields)}
    ${refsHtml(e)}
    ${e.thanh_phan ? teamHtml(e.thanh_phan) : ''}
    ${boViHtml(e.bo_vi)}
    ${familyHtml(e)}
    ${tiersHtml(e)}
    <div class="prose">${e.html}</div>
    ${vaiTroHtml(e)}
    ${kyVoi}
    ${related.length ? `<h2>Liên quan</h2><ul>${related.map((x) => `<li><a href="#/m/${esc(x)}">${esc(BY_ID.get(x).ten)}</a></li>`).join('')}</ul>` : ''}
    <h2>Nguồn</h2>
    ${e.nguon.length ? `<ol class="sources">${e.nguon.map((s) => `<li>${esc(s.label)}${s.url ? ` — <a href="${esc(s.url)}" target="_blank" rel="noopener">xem trang gốc</a>` : ''}</li>`).join('')}</ol>` : '<p class="muted">Chưa ghi nguồn.</p>'}
    <p class="edit-links small">
      <a href="${esc(repo)}/blob/main/${esc(e.path)}" target="_blank" rel="noopener">Xem bản gốc của trang này</a> ·
      <a href="${esc(repo)}/issues/new?title=${encodeURIComponent(`Góp ý: ${e.ten}`)}&body=${encodeURIComponent(`Trang: ${e.path}\n\nNội dung cần sửa:\n\nNguồn đối chiếu (sách, quyển, trang):\n`)}" target="_blank" rel="noopener">Báo sai sót</a>
    </p>
  </article>`;
}

function pageChu(c) {
  const x = DB.chu[c];
  if (!x) return pageNotFound();
  setTitle(`Chữ ${c} · ${x.am}`);
  const used = DB.entries.filter((e) => e.ten_han.includes(c));
  const sameRadical = Object.values(DB.chu).filter((y) => y.bo && y.bo === x.bo && y.chu !== c);
  return `<p class="crumbs"><a href="#/hoc/ngu-phap">Đọc tên chứng</a></p>
    <div class="chu-head"><span class="han huge">${esc(c)}</span><div><h1>${esc(x.am)}</h1><p class="lead">${esc(x.nghia)}</p></div></div>
    <table class="facts"><tbody>
      <tr><th scope="row">Bộ thủ</th><td><span class="han">${esc(x.bo ?? '')}</span> ${esc(x.bo_ten ?? '')}</td></tr>
      ${x.hinh ? `<tr><th scope="row">Hình gốc của chữ</th><td>${esc(x.hinh)}</td></tr>` : ''}
      ${x.nghia_y ? `<tr><th scope="row">Nghĩa trong y học</th><td>${esc(x.nghia_y)}</td></tr>` : ''}
    </tbody></table>
    ${x.bay ? `<div class="notice notice-vang"><strong>Bẫy nghĩa:</strong> ${esc(x.bay)}</div>` : ''}
    <h2>Có trong các trang</h2>
    ${used.length ? `<div class="cards">${used.map(entryCard).join('')}</div>` : '<p class="muted">Chưa có trang nào.</p>'}
    ${sameRadical.length ? `<h2>Cùng bộ ${esc(x.bo)}</h2><p class="chu-row">${sameRadical.map((y) => `<a class="han chu-chip" href="#/chu/${encodeURIComponent(y.chu)}" title="${esc(y.am)}">${esc(y.chu)}<small>${esc(y.am)}</small></a>`).join('')}</p>` : ''}
    <p class="muted small">Nghĩa chữ đang chờ đối chiếu với Hán Việt tự điển (Thiều Chửu).</p>`;
}

const GRAMMAR = {
  o_dau: [
    ['Tâm', 'Tâm', 'vua trong triều đình tạng phủ; chủ thần minh (tinh thần, giấc ngủ) và huyết mạch'],
    ['Can', 'Can', 'tướng quân; tàng huyết, giữ cho khí lưu thông thư thái'],
    ['Tỳ', 'Tỳ', 'quan giữ kho lương; tiêu hóa, biến thức ăn thành khí huyết'],
    ['Phế', 'Phế', 'quan phụ tá; chủ khí, hơi thở, da lông'],
    ['Thận', 'Thận', 'gốc của âm dương; tàng tinh, chứa nước (thủy) và lửa Mệnh môn'],
  ],
  cai_gi: [
    ['khí', 'khí', 'sức vận hành, sức đẩy'],
    ['huyết', 'huyết', 'máu, phần nuôi dưỡng'],

    ['âm', 'âm', 'phần nước, phần mát, phần tĩnh'],
    ['dương', 'dương', 'phần lửa, phần ấm, phần động'],
  ],
  the_nao: [
    ['hư', 'hư', 'thiếu, yếu đi', { 'khí': 'Ích khí (thêm khí)', 'huyết': 'Dưỡng huyết (nuôi huyết)', 'âm': 'Tư âm (tưới thêm nước)', 'dương': 'Ôn dương (sưởi ấm)' }],
    ['uất', 'uất', 'bị bó lại, không lưu thông', { 'khí': 'Sơ / Lý khí (khơi thông)', 'huyết': 'Hoạt huyết', 'âm': '—', 'dương': '—' }],
    ['ứ', 'ứ', 'đọng lại một chỗ', { 'khí': 'Lý khí', 'huyết': 'Hoạt huyết, hóa ứ', 'âm': '—', 'dương': '—' }],
    ['vượng', 'vượng', 'quá mạnh, bốc lên', { 'khí': 'Giáng khí', 'huyết': 'Lương huyết', 'âm': '—', 'dương': 'Bình / Tiềm dương' }],
  ],
};

function pageGrammar() {
  setTitle('Đọc tên chứng');
  const group = (key, title, def) => `<h2>${esc(title)}</h2><div class="chips" role="group" data-gram="${key}">${GRAMMAR[key].map(([id, ten]) => `<button type="button" class="chip" data-value="${esc(id)}" aria-pressed="${id === def}">${esc(ten)}</button>`).join('')}</div>`;
  return `<p class="crumbs"><a href="#/hoc">Học bằng hình</a></p>
    <h1>Đọc tên chứng</h1>
    <p class="lead">Tên chứng trong Đông y ghép theo một khuôn: <strong>Ở đâu + Cái gì + Thế nào</strong>. Chọn từng phần để ghép tên và đọc nghĩa của nó.</p>
    <div class="lab">
      <div class="lab-controls">
        ${group('o_dau', '1 · Ở đâu (tạng phủ)', 'Thận')}
        ${group('cai_gi', '2 · Cái gì', 'âm')}
        ${group('the_nao', '3 · Thế nào', 'hư')}
      </div>
      <section class="gram-result" id="gram-result" aria-live="polite"></section>
    </div>
    <div class="notice notice-vang">Không phải tổ hợp nào cũng là một chứng có trong sách. Phép trị ở đây là gợi ý theo ngữ pháp để hiểu tên gọi, không thay việc biện chứng.</div>`;
}

function mountGrammar(root) {
  const st = { o_dau: 'Thận', cai_gi: 'âm', the_nao: 'hư' };
  const render = () => {
    const o = GRAMMAR.o_dau.find((x) => x[0] === st.o_dau);
    const c = GRAMMAR.cai_gi.find((x) => x[0] === st.cai_gi);
    const t = GRAMMAR.the_nao.find((x) => x[0] === st.the_nao);
    const name = `${o[1]} ${c[1]} ${t[1]}`;
    const page = BY_ID.get(slugify(name));
    const phap = t[3][c[0]];
    const chars = [o[1], c[1], t[1]].map((w) => Object.values(DB.chu).find((x) => normalizeText(x.am) === normalizeText(w)));
    root.querySelector('#gram-result').innerHTML = `
      <p class="gram-name"><span class="g1">${esc(o[1])}</span> <span class="g2">${esc(c[1])}</span> <span class="g3">${esc(t[1])}</span></p>
      <p class="han gram-han">${chars.map((x) => (x ? `<a href="#/chu/${encodeURIComponent(x.chu)}">${esc(x.chu)}</a>` : '')).join('')}</p>
      <p><strong>Đọc là:</strong> <em>${esc(c[2])}</em> của <strong>${esc(o[1])}</strong> (${esc(o[2])}) đang <em>${esc(t[2])}</em>.</p>
      ${phap && phap !== '—' ? `<p><strong>Phép trị theo ngữ pháp:</strong> ${esc(phap)} ${esc(o[1])}.</p>` : '<p class="muted">Tổ hợp này ít gặp trong sách.</p>'}
      ${page ? `<p><a class="tile-link" href="#/m/${esc(page.id)}">Đọc trang “${esc(page.ten)}” trong sổ cái →</a></p>` : '<p class="muted small">Sổ cái chưa có trang cho tên này.</p>'}`;
  };
  root.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-gram] .chip');
    if (!b) return;
    const g = b.closest('[data-gram]');
    st[g.dataset.gram] = b.dataset.value;
    g.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    render();
  });
  render();
}

function pageCheck() {
  setTitle('Kiểm chứng lời đồn');
  const last = store('medai-kiem-chung') ?? '';
  return `<h1>Kiểm chứng lời đồn</h1>
    <p class="lead">Dán danh sách vị thuốc của một bài thuốc bạn nghe được. MEDAI đối chiếu với các quy tắc cấm kỵ cổ điển và cho biết vị nào đã có trong sổ cái.</p>
    <form id="checkform" class="checkform">
      <label for="herbs">Các vị thuốc (ngăn bằng dấu phẩy hoặc xuống dòng; có thể kèm liều)</label>
      <textarea id="herbs" name="herbs" rows="5" placeholder="Ví dụ: Nhân sâm 10g, Ngũ linh chi 8g, Cam thảo 4g">${esc(last)}</textarea>
      <button type="submit">Kiểm tra</button>
    </form>
    <div id="checkresult" aria-live="polite"></div>
    <div class="notice notice-vang">Công cụ chỉ kiểm tra theo Thập bát phản, Thập cửu úy, danh sách thai kỵ và vị có độc trong sổ cái. “Không thấy cảnh báo” chưa có nghĩa bài thuốc hợp với bạn: còn phải đúng thể bệnh.</div>
    ${redFlagsHtml()}`;
}

function runCheck(text) {
  store('medai-kiem-chung', text);
  const herbs = splitHerbList(text);
  const box = document.getElementById('checkresult');
  if (!herbs.length) { box.innerHTML = ''; return; }
  const findEntry = (h) => {
    const id = slugify(h);
    return BY_ID.get(id) ?? DB.entries.find((x) => x.ten_khac.some((t) => slugify(t) === id));
  };
  const cb = checkHerbs(herbs.map((h) => findEntry(h)?.id ?? h), RULES);
  const known = herbs.map((h) => {
    const e = findEntry(h);
    return e ? `<li><a href="#/m/${esc(e.id)}">${esc(e.ten)}</a> — ${esc(e.tom_tat)}</li>` : `<li>${esc(h)} — <span class="muted">chưa có trang trong sổ cái</span></li>`;
  });
  box.innerHTML = `<h2>Kết quả</h2>
    ${cb.ok ? '<div class="notice notice-xanh">Không phát hiện cặp phản/úy, vị thai kỵ hay vị có độc trong danh sách.</div>' : `<div class="notice notice-do"><strong>Có điểm cần chú ý</strong>${warningsHtml(cb)}</div>`}
    <h3>Các vị đã nhận ra</h3><ul>${known.join('')}</ul>`;
}

function redFlagsHtml() {
  return `<section class="redflags"><h2>Đi khám hoặc gọi 115 ngay khi có</h2><ul>${RED_FLAGS.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></section>`;
}

function pageSources() {
  setTitle('Danh thư');
  const rows = DB.danhThu.map((b) => `<tr>
      <td><strong>${esc(b.ten)}</strong>${b.ten_han ? `<br><span class="han">${esc(b.ten_han)}</span>` : ''}</td>
      <td>${esc(b.tac_gia ?? '')}</td>
      <td>${esc(b.vong ?? '')}</td>
      <td>${(b.ban_so_hoa ?? []).map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.ten)}</a>`).join('<br>') || '<span class="muted">chưa tìm thấy bản miễn phí</span>'}</td>
      <td>${esc(b.ghi_chu ?? '')}</td></tr>`).join('');
  return `<h1>Danh thư</h1>
    <p class="lead">Các bộ sách làm nền cho sổ cái. Nguyên văn chữ Hán thuộc phạm vi công cộng; các bản dịch hiện đại còn bản quyền nên chỉ dùng để tham khảo, không chép lại.</p>
    <div class="table-wrap"><table><thead><tr><th>Sách</th><th>Tác giả</th><th>Vòng</th><th>Bản số hóa</th><th>Ghi chú</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function pageAbout() {
  setTitle('Giới thiệu');
  return `<article class="prose">
    <h1>Giới thiệu MEDAI</h1>
    <p>MEDAI là sổ cái Y học cổ truyền: công khai, miễn phí, phi thương mại. Mỗi mục ghi rõ sách, quyển, trang và đường dẫn tới bản gốc để ai cũng tự kiểm lại được. Độ tin cậy đến từ sự minh bạch nguồn.</p>
    <h2>Cách đọc một trang</h2>
    <ul>
      <li>${badge('Đã đối chiếu nguồn', 'da-doi-chieu')} từng ý đã được so với danh thư ghi ở mục Nguồn.</li>
      <li>${badge('Bản nháp', 'nhap')} chưa đối chiếu xong, chỉ để tham khảo.</li>
      <li>Nguyên văn và phần diễn giải luôn tách riêng. Chỗ các danh y nói khác nhau thì ghi cả hai.</li>
    </ul>
    <h2>Ba mức an toàn</h2>
    <ul>${Object.entries(SAFETY).map(([k, v]) => `<li>${badge(v.label, k)} ${esc(v.note)}</li>`).join('')}</ul>
    <h2>Thông tin, không thay người khám</h2>
    <p>MEDAI giúp bạn hiểu và tự chăm sóc có hiểu biết. Đông y chẩn bệnh bằng vọng, văn, vấn, thiết; một trang web không bắt mạch được. Khi chưa rõ thể bệnh, hoặc bệnh không đỡ, hãy đi khám.</p>
    ${redFlagsHtml()}
    <h2>Góp ý và sửa sai</h2>
    <p>Toàn bộ nội dung nằm trên GitHub. Thấy sai, hãy bấm “Báo sai sót” ở cuối mỗi trang và ghi nguồn đối chiếu.</p>
    <p>Nội dung: <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.vi" target="_blank" rel="noopener">CC BY-SA 4.0</a>. Mã nguồn: MIT. <a href="${esc(DB.site.repo)}" target="_blank" rel="noopener">Kho mã nguồn</a>.</p>
  </article>`;
}

function pageNotFound() {
  setTitle('Không tìm thấy');
  return `<h1>Không tìm thấy trang</h1><p><a href="#/">Về trang chủ</a></p>`;
}

// ---------- Định tuyến ----------
function route() {
  if (!DB) return;
  const hash = decodeURIComponent(location.hash.replace(/^#/, '')) || '/';
  const [path, query = ''] = hash.split('?');
  const parts = path.split('/').filter(Boolean);
  const params = new URLSearchParams(query);
  let html;
  let mount = null;
  if (parts.length === 0) html = pageHome();
  else if (parts[0] === 'hoc' && parts[1] === 'luoi') { setTitle('Lưỡi tự dựng'); html = pageTongue(); mount = mountTongue; }
  else if (parts[0] === 'hoc' && parts[1] === 'thuy-hoa') { setTitle('Nồi nước – Bếp lửa'); html = pageThuyHoa(); mount = mountThuyHoa; }
  else if (parts[0] === 'hoc' && parts[1] === 'ngu-phap') { html = pageGrammar(); mount = mountGrammar; }
  else if (parts[0] === 'chu') html = pageChu(parts[1] ?? '');
  else if (parts[0] === 'hoc' && parts[1] === 'rong') { setTitle('Rồng về ổ'); html = pageDragon(); mount = mountDragon; }
  else if (parts[0] === 'hoc') { setTitle('Học bằng hình'); html = pageLearn(); }
  else if (parts[0] === 'muc') html = pageList(parts[1]);
  else if (parts[0] === 'm') html = pageEntry(parts[1]);
  else if (parts[0] === 'tim') html = pageSearch(params.get('q') ?? '');
  else if (parts[0] === 'kiem-chung') html = pageCheck();
  else if (parts[0] === 'nguon') html = pageSources();
  else if (parts[0] === 'gioi-thieu') html = pageAbout();
  else html = pageNotFound();
  // Thay cả khối main để các trình nghe sự kiện của trang trước không dồn lại
  const fresh = $main.cloneNode(false);
  $main.replaceWith(fresh);
  $main = fresh;
  $main.innerHTML = html;
  if (mount) mount($main, params);
  document.querySelectorAll('.mainnav a').forEach((a) => a.toggleAttribute('aria-current', location.hash.startsWith(a.getAttribute('href'))));
  window.scrollTo(0, 0);
  $main.focus({ preventScroll: true });
}

function goSearch(q) {
  if (q.trim()) location.hash = `#/tim?q=${encodeURIComponent(q.trim())}`;
}

document.addEventListener('submit', (ev) => {
  const form = ev.target;
  if (form.id === 'topsearch' || form.id === 'bigsearch') {
    ev.preventDefault();
    goSearch(form.q.value);
  } else if (form.id === 'checkform') {
    ev.preventDefault();
    runCheck(form.herbs.value);
  }
});

document.addEventListener('click', (ev) => {
  const tab = ev.target.closest('[data-tier]');
  if (!tab) return;
  const i = tab.dataset.tier;
  const box = tab.closest('.tiers');
  box.querySelectorAll('[data-tier]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tier === i)));
  box.querySelectorAll('[data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== i; });
  store('medai-tang', i);
});

window.addEventListener('hashchange', route);

async function init() {
  try {
    const res = await fetch('data/db.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.status);
    DB = await res.json();
  } catch {
    $main.innerHTML = '<h1>Chưa mở được sổ cái</h1><p>Không tải được dữ liệu. Kiểm tra kết nối mạng rồi tải lại trang.</p>';
    return;
  }
  BY_ID = new Map(DB.entries.map((e) => [e.id, e]));
  RULES = buildRuleIndex(DB.rules);
  indexSearch();
  const repoLink = document.getElementById('repo-link');
  repoLink.href = DB.site.repo;
  repoLink.target = '_blank';
  repoLink.rel = 'noopener';
  route();
  if (location.hash.startsWith('#/kiem-chung')) {
    const t = document.getElementById('herbs');
    if (t?.value) runCheck(t.value);
  }
}

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

init();
