// Học bằng hình: Lưỡi tự dựng và Nồi nước – Bếp lửa.
// Hình vẽ bằng SVG, không dùng ảnh ngoài; chạy được khi mất mạng.
// Mọi ý nghĩa ở đây là kiến thức phổ biến, đang chờ đối chiếu với danh thư.

const SVGNS = 'http://www.w3.org/2000/svg';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a, b, t) {
  const x = hexToRgb(a), y = hexToRgb(b);
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
const $ = (root, sel) => root.querySelector(sel);
const attr = (el, obj) => { for (const [k, v] of Object.entries(obj)) el.setAttribute(k, v); return el; };

function chips(group, options, active) {
  return `<div class="chips" role="group" data-group="${group}">${options.map((o) =>
    `<button type="button" class="chip" data-value="${o.id}" aria-pressed="${o.id === active}">${o.mau ? `<span class="swatch swatch-${o.id}"></span>` : ''}${esc(o.ten)}</button>`).join('')}</div>`;
}

// =====================================================================
// LƯỠI TỰ DỰNG
// =====================================================================
const CHAT = [
  { id: 'nhat', ten: 'Nhạt', mau: '#e9b9b2', y: 'Khí huyết không đủ, hoặc dương hư sinh hàn. Thường thấy ở người mệt mỏi, sợ lạnh, sắc mặt nhợt.' },
  { id: 'hong', ten: 'Hồng nhạt', mau: '#e58f8c', y: 'Màu lưỡi bình thường: khí huyết điều hòa.' },
  { id: 'do', ten: 'Đỏ', mau: '#d84c4b', y: 'Có nhiệt. Đỏ mà rêu vàng thường là thực nhiệt; đỏ mà ít rêu thường là âm hư sinh nhiệt.' },
  { id: 'do-tham', ten: 'Đỏ thẫm', mau: '#a5242e', y: 'Nhiệt nặng, đã vào sâu phần doanh huyết; hoặc âm hư hỏa vượng lâu ngày.' },
  { id: 'tim', ten: 'Tím', mau: '#8f4f7d', y: 'Huyết lưu thông không thông suốt (huyết ứ). Cần xét thêm: tím khô thiên về nhiệt, tím ướt thiên về hàn.' },
  { id: 'tim-tai', ten: 'Tím tái', mau: '#6f5a8e', y: 'Hàn ngưng làm huyết ứ trệ; thường kèm sợ lạnh, tay chân lạnh, đau cố định.' },
];
const REU = [
  { id: 'khong', ten: 'Không rêu, bóng', y: 'Lưỡi bóng như gương: âm dịch (phần nước) bị tổn thương, thường gặp khi âm hư hoặc Vị âm hư.' },
  { id: 'trang-mong', ten: 'Trắng mỏng', y: 'Rêu bình thường; cũng gặp khi bệnh còn ở ngoài (biểu chứng), chưa vào sâu.' },
  { id: 'trang-day', ten: 'Trắng dày', y: 'Hàn thấp hoặc đàm thấp ứ lại bên trong; thường kèm đầy bụng, ăn kém.' },
  { id: 'vang', ten: 'Vàng', y: 'Có nhiệt ở bên trong; vàng càng đậm nhiệt càng nặng.' },
  { id: 'vang-nhot', ten: 'Vàng nhớt', y: 'Thấp nhiệt: vừa nóng vừa ẩm đọng; thường kèm miệng đắng, nặng nề, tiểu vàng.' },
  { id: 'den', ten: 'Đen', y: 'Bệnh đã nặng: hàn cực hoặc nhiệt cực, phải xét độ khô ướt. Nên đi khám.' },
];
const HINH = [
  { id: 'binh-thuong', ten: 'Bình thường', y: 'Lưỡi mềm mại, vừa vặn.' },
  { id: 'beu', ten: 'Bệu, có dấu răng', y: 'Lưỡi to bệu, mép hằn dấu răng: Tỳ hư, thấp (nước) ứ lại.' },
  { id: 'gay', ten: 'Gầy mỏng', y: 'Lưỡi nhỏ mỏng: khí huyết hư, hoặc âm hư không nuôi dưỡng được.' },
  { id: 'nut', ten: 'Có vết nứt', y: 'Thường là âm huyết hư. Lưu ý: có người nứt lưỡi bẩm sinh mà không có bệnh.' },
];

const SHAPES = {
  'binh-thuong': 'M96 50 Q150 42 204 50 C254 80 266 150 258 210 C248 270 204 300 150 300 C96 300 52 270 42 210 C34 150 46 80 96 50 Z',
  beu: 'M88 48 Q150 40 212 48 C268 80 284 150 276 214 C266 278 214 306 150 306 C86 306 34 278 24 214 C16 150 32 80 88 48 Z',
  gay: 'M106 52 Q150 46 194 52 C232 84 240 150 234 206 C226 264 192 292 150 292 C108 292 74 264 66 206 C60 150 68 84 106 52 Z',
  nut: 'M96 50 Q150 42 204 50 C254 80 266 150 258 210 C248 270 204 300 150 300 C96 300 52 270 42 210 C34 150 46 80 96 50 Z',
};
const COAT = 'M150 66 C202 66 226 104 226 160 C226 214 196 244 150 246 C104 244 74 214 74 160 C74 104 98 66 150 66 Z';

function combo(chat, reu, hinh) {
  if (reu === 'den') return { t: 'Rêu đen là dấu hiệu bệnh nặng. Nên đi khám, không tự dùng thuốc.', link: null, kind: 'do' };
  if ((chat === 'do' || chat === 'do-tham') && reu === 'khong') return { t: 'Lưỡi đỏ mà không rêu: hình ảnh điển hình của âm hư hỏa vượng — “nồi cạn nên sôi sùng sục”.', link: ['#/hoc/thuy-hoa?s=am-hu', 'Xem trên Nồi nước – Bếp lửa'], kind: 'vang' };
  if ((chat === 'do' || chat === 'do-tham') && (reu === 'vang' || reu === 'vang-nhot')) return { t: reu === 'vang-nhot' ? 'Lưỡi đỏ, rêu vàng nhớt: thường là thấp nhiệt.' : 'Lưỡi đỏ, rêu vàng: thường là thực nhiệt — “lửa quá to”.', link: ['#/hoc/thuy-hoa?s=thuc-nhiet', 'Xem trên Nồi nước – Bếp lửa'], kind: 'vang' };
  if (chat === 'nhat' && (hinh === 'beu' || reu === 'trang-day')) return { t: 'Lưỡi nhạt, bệu hoặc rêu trắng dày: thường là Tỳ hư, thấp ứ lại; nếu kèm sợ lạnh là dương hư.', link: ['#/m/ty-hu', 'Đọc về Tỳ hư'], kind: 'vang' };
  if (chat === 'nhat') return { t: 'Lưỡi nhạt: thiên về hư hàn — “bếp tàn, nồi nguội”.', link: ['#/hoc/thuy-hoa?s=duong-hu', 'Xem trên Nồi nước – Bếp lửa'], kind: 'vang' };
  if (chat === 'tim' || chat === 'tim-tai') return { t: 'Lưỡi tím: có huyết ứ. Cần xét thêm hàn hay nhiệt qua rêu và độ khô ướt.', link: null, kind: 'vang' };
  if (chat === 'hong' && reu === 'trang-mong' && hinh === 'binh-thuong') return { t: 'Lưỡi hồng nhạt, rêu trắng mỏng, hình dáng bình thường: chiếc lưỡi của người khỏe.', link: null, kind: 'xanh' };
  return { t: 'Kết hợp từng phần ở trên để đọc; một dấu hiệu riêng lẻ chưa đủ để kết luận.', link: null, kind: 'vang' };
}

export function pageTongue() {
  return `<p class="crumbs"><a href="#/hoc">Học bằng hình</a></p>
  <h1>Lưỡi tự dựng</h1>
  <p class="lead">Chọn màu chất lưỡi, rêu lưỡi và hình dáng. Chiếc lưỡi đổi theo, kèm cách Đông y đọc nó.</p>
  <div class="lab">
    <figure class="lab-figure">
      <svg id="tongue" viewBox="0 0 300 320" role="img" aria-label="Hình chiếc lưỡi"></svg>
      <label class="toggle"><input type="checkbox" id="tongue-map"> Hiện bản đồ vùng lưỡi</label>
    </figure>
    <div class="lab-controls">
      <h2>Màu chất lưỡi</h2>${chips('chat', CHAT, 'hong')}
      <h2>Rêu lưỡi</h2>${chips('reu', REU, 'trang-mong')}
      <h2>Hình dáng</h2>${chips('hinh', HINH, 'binh-thuong')}
    </div>
  </div>
  <section class="reading" id="tongue-reading" aria-live="polite"></section>
  <div class="notice notice-nhap">Bản mẫu. Ý nghĩa là kiến thức phổ biến, đang chờ đối chiếu với danh thư. Xem lưỡi thật cần ánh sáng tự nhiên, không ngay sau khi ăn uống đồ có màu.</div>`;
}

function buildTongueSvg(svg) {
  svg.innerHTML = `
  <defs>
    <radialGradient id="tg-body" cx="50%" cy="45%" r="60%"><stop offset="0%" id="tg-c0"/><stop offset="70%" id="tg-c1"/><stop offset="100%" id="tg-c2"/></radialGradient>
    <radialGradient id="tg-lip" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#2a1012"/><stop offset="100%" stop-color="#4a1d20"/></radialGradient>
    <linearGradient id="tg-lipc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#d99a92"/><stop offset="100%" stop-color="#b9706a"/></linearGradient>
    <pattern id="tg-papillae" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="0.9" fill="#000" opacity="0.10"/><circle cx="5.5" cy="5" r="0.7" fill="#fff" opacity="0.12"/></pattern>
    <pattern id="tg-fur" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1.2" fill="#fff" opacity="0.5"/><circle cx="4" cy="3.8" r="1" fill="#fff" opacity="0.35"/></pattern>
    <filter id="tg-soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="6"/></filter>
    <mask id="tg-teeth"><rect width="300" height="320" fill="#fff"/><g id="tg-bites" fill="#000"></g></mask>
  </defs>
  <path d="M40 58 Q150 112 260 58 Q150 92 40 58 Z" fill="url(#tg-lipc)"/>
  <ellipse cx="150" cy="60" rx="108" ry="22" fill="url(#tg-lip)"/>
  <g mask="url(#tg-teeth)">
    <path id="tg-shape" fill="url(#tg-body)"/>
    <path id="tg-tex" fill="url(#tg-papillae)"/>
    <path id="tg-coat" d="${COAT}" filter="url(#tg-soft)"/>
    <path id="tg-coat-tex" d="${COAT}" fill="url(#tg-fur)" filter="url(#tg-soft)"/>
    <path id="tg-groove" d="M150 74 C147 130 153 190 150 238" fill="none" stroke="#000" stroke-opacity="0.18" stroke-width="4" stroke-linecap="round"/>
    <g id="tg-cracks" fill="none" stroke="#5a1a1e" stroke-opacity="0.45" stroke-width="2.2" stroke-linecap="round">
      <path d="M150 110 l-22 10 l-8 16"/><path d="M150 140 l24 8 l10 18"/><path d="M150 176 l-26 6 l-6 20"/><path d="M150 200 l20 14"/><path d="M128 120 l-14 -6"/>
    </g>
    <g id="tg-gloss" fill="#fff"><ellipse cx="116" cy="146" rx="22" ry="36" opacity="0.28"/><ellipse cx="186" cy="196" rx="13" ry="22" opacity="0.18"/></g>
  </g>
  <path id="tg-edge" fill="none" stroke="#000" stroke-opacity="0.12" stroke-width="2"/>
  <path d="M36 58 Q90 26 150 46 Q210 26 264 58 Q150 80 36 58 Z" fill="url(#tg-lipc)"/>
  <path d="M44 58 Q150 74 256 58" fill="none" stroke="#8e4a46" stroke-opacity="0.5" stroke-width="1.5"/>
  <g id="tg-map" class="tg-map">
    <path d="M50 112 H250 M58 236 H242" stroke="#fff" stroke-width="1.5" stroke-dasharray="5 4" fill="none"/>
    <path d="M100 112 V236 M200 112 V236" stroke="#fff" stroke-width="1.5" stroke-dasharray="5 4" fill="none"/>
    <text x="150" y="100" class="tg-label">Thận</text>
    <text x="150" y="178" class="tg-label">Tỳ · Vị</text>
    <text x="72" y="178" class="tg-label">Can</text>
    <text x="228" y="178" class="tg-label">Đởm</text>
    <text x="150" y="272" class="tg-label">Tâm · Phế</text>
  </g>`;
}

function renderTongue(root, st) {
  const c = CHAT.find((x) => x.id === st.chat);
  const r = REU.find((x) => x.id === st.reu);
  const h = HINH.find((x) => x.id === st.hinh);
  const svg = $(root, '#tongue');
  const d = SHAPES[st.hinh];
  for (const id of ['#tg-shape', '#tg-tex', '#tg-edge']) attr($(svg, id), { d });
  attr($(svg, '#tg-c0'), { 'stop-color': mix(c.mau, '#ffffff', 0.18) });
  attr($(svg, '#tg-c1'), { 'stop-color': c.mau });
  attr($(svg, '#tg-c2'), { 'stop-color': mix(c.mau, '#000000', 0.22) });

  const coat = {
    khong: ['#ffffff', 0, 0],
    'trang-mong': ['#f4f1ea', 0.38, 0],
    'trang-day': ['#f7f4ee', 0.82, 0.9],
    vang: ['#e8c25a', 0.62, 0.3],
    'vang-nhot': ['#cfa53a', 0.85, 0.75],
    den: ['#3a3230', 0.78, 0.4],
  }[st.reu];
  attr($(svg, '#tg-coat'), { fill: coat[0], opacity: coat[1] });
  attr($(svg, '#tg-coat-tex'), { opacity: coat[2] });
  $(svg, '#tg-gloss').setAttribute('opacity', st.reu === 'khong' ? 1 : st.reu === 'vang-nhot' ? 0.6 : 0.25);
  $(svg, '#tg-cracks').setAttribute('opacity', st.hinh === 'nut' ? 1 : 0);

  const bites = $(svg, '#tg-bites');
  bites.innerHTML = '';
  if (st.hinh === 'beu') {
    const edge = [[110, 34], [140, 27], [170, 24], [200, 25], [230, 32], [260, 46]];
    for (const [y, x] of edge) {
      for (const cx of [x, 300 - x]) bites.appendChild(attr(document.createElementNS(SVGNS, 'circle'), { cx, cy: y, r: 7 }));
    }
  }
  $(svg, '#tg-map').setAttribute('opacity', st.map ? 1 : 0);
  svg.setAttribute('aria-label', `Lưỡi ${c.ten.toLowerCase()}, rêu ${r.ten.toLowerCase()}, ${h.ten.toLowerCase()}`);

  const cb = combo(st.chat, st.reu, st.hinh);
  $(root, '#tongue-reading').innerHTML = `<h2>Đọc chiếc lưỡi này</h2>
    <dl class="readlist">
      <dt>Chất lưỡi · ${esc(c.ten)}</dt><dd>${esc(c.y)}</dd>
      <dt>Rêu · ${esc(r.ten)}</dt><dd>${esc(r.y)}</dd>
      <dt>Hình · ${esc(h.ten)}</dt><dd>${esc(h.y)}</dd>
    </dl>
    <div class="notice notice-${cb.kind}"><strong>Gợi ý kết hợp:</strong> ${esc(cb.t)}${cb.link ? ` <a href="${cb.link[0]}">${esc(cb.link[1])} →</a>` : ''}</div>`;
}

export function mountTongue(root) {
  const st = { chat: 'hong', reu: 'trang-mong', hinh: 'binh-thuong', map: false };
  buildTongueSvg($(root, '#tongue'));
  root.addEventListener('click', (ev) => {
    const b = ev.target.closest('.chip');
    if (!b) return;
    const g = b.closest('[data-group]');
    st[g.dataset.group] = b.dataset.value;
    g.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    renderTongue(root, st);
  });
  $(root, '#tongue-map').addEventListener('change', (ev) => { st.map = ev.target.checked; renderTongue(root, st); });
  renderTongue(root, st);
}

// =====================================================================
// NỒI NƯỚC – BẾP LỬA (Thủy – Hỏa)
// =====================================================================
const STATES = {
  binh: { ten: 'Bình — Thủy Hỏa ký tế 水火既濟', hinh: 'Nước vừa đủ, lửa vừa phải: nồi ấm đều, không trào không cạn.', bieu_hien: 'Ăn ngủ điều hòa, không nóng không lạnh bất thường.', phap: 'Giữ gìn bằng dưỡng sinh.', vi_du: '', kind: 'xanh', preset: [60, 55] },
  'duong-hu': { ten: 'Lửa yếu · Dương hư (hàn)', hinh: 'Bếp tàn, nồi nước nguội lạnh.', bieu_hien: 'Sợ lạnh, tay chân lạnh, mệt mỏi, tiểu trong và nhiều, phân lỏng.', phap: 'Ôn dương, bổ hỏa — thêm lửa.', vi_du: 'Vị ví dụ: Phụ tử, Nhục quế (Phụ tử là vị độc, không tự dùng). Khi dưới lạnh mà lửa lại bốc lên trên, xem trang “Rồng về ổ”.', kind: 'vang', preset: [65, 18] },
  'thuc-nhiet': { ten: 'Lửa to · Thực nhiệt', hinh: 'Lửa quá to, nước sôi trào ra ngoài.', bieu_hien: 'Sốt cao, mặt đỏ, khát nước nhiều, táo bón, lưỡi đỏ rêu vàng.', phap: 'Thanh nhiệt, tả hỏa — bớt lửa.', vi_du: 'Vị ví dụ: Hoàng liên, Thạch cao.', kind: 'vang', preset: [62, 92] },
  'am-hu': { ten: 'Nồi cạn · Âm hư hỏa vượng', hinh: 'Lửa không to, nhưng nước cạn nên đáy nồi nóng rực, sôi sùng sục.', bieu_hien: 'Nóng về chiều, ra mồ hôi trộm, lòng bàn tay chân nóng, miệng họng khô, lưỡi đỏ ít rêu.', phap: 'Tư âm giáng hỏa — thêm nước, đừng dập lửa.', vi_du: 'Bài ví dụ: Lục vị địa hoàng, Tri bá địa hoàng.', kind: 'vang', preset: [20, 58] },
  'luong-hu': { ten: 'Nồi cạn, bếp tàn · Âm dương đều hư', hinh: 'Nước đã ít, lửa cũng yếu.', bieu_hien: 'Vừa mệt, sợ lạnh, vừa khô miệng, người gầy yếu.', phap: 'Bổ cả âm lẫn dương.', vi_du: 'Bài ví dụ: Bát vị (Lục vị thêm Quế, Phụ).', kind: 'vang', preset: [22, 20] },
};

function classify(w, f) {
  if (w < 40 && f < 38) return 'luong-hu';
  if (w < 40) return 'am-hu';
  if (f < 38) return 'duong-hu';
  if (f > 74) return 'thuc-nhiet';
  return 'binh';
}

export function pageThuyHoa() {
  return `<p class="crumbs"><a href="#/hoc">Học bằng hình</a></p>
  <h1>Nồi nước – Bếp lửa</h1>
  <p class="lead">Hải Thượng Lãn Ông bàn rất sâu về Thủy – Hỏa: Thận thủy như nước trong nồi, Mệnh môn hỏa như lửa dưới bếp. Kéo hai thanh để thấy trạng thái cơ thể và phép chữa đổi theo.</p>
  <div class="lab">
    <figure class="lab-figure">
      <svg id="pot" viewBox="0 0 420 350" role="img" aria-label="Nồi nước trên bếp lửa"></svg>
    </figure>
    <div class="lab-controls">
      <label class="slider"><span>Nước (âm) · Thận thủy</span><input type="range" id="sl-water" min="0" max="100" value="60"><output id="out-water"></output></label>
      <label class="slider"><span>Lửa (dương) · Mệnh môn hỏa</span><input type="range" id="sl-fire" min="0" max="100" value="55"><output id="out-fire"></output></label>
      <h2>Thử nhanh</h2>
      <div class="chips" role="group">${Object.entries(STATES).map(([k, s]) => `<button type="button" class="chip" data-preset="${k}">${esc(s.ten.split(' ·')[0].split(' —')[0])}</button>`).join('')}</div>
    </div>
  </div>
  <section class="reading" id="pot-reading" aria-live="polite"></section>
  <div class="notice notice-nhap">Bản mẫu. Đây là <strong>hình ảnh để hiểu</strong> do MEDAI dùng để giảng, không phải lời nguyên văn của danh y; các biểu hiện và ví dụ đang chờ đối chiếu với các thiên Lãn Ông bàn về Thủy Hỏa.</div>`;
}

function buildPotSvg(svg) {
  svg.innerHTML = `
  <defs>
    <linearGradient id="pt-water-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7cc3e6"/><stop offset="100%" stop-color="#2f7fb3"/></linearGradient>
    <linearGradient id="pt-metal" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#5b6168"/><stop offset="45%" stop-color="#9aa1a8"/><stop offset="100%" stop-color="#4a4f55"/></linearGradient>
    <linearGradient id="pt-flame" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#d9381e"/><stop offset="55%" stop-color="#f28c28"/><stop offset="100%" stop-color="#ffd257"/></linearGradient>
    <linearGradient id="pt-flame-in" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#ffb347"/><stop offset="100%" stop-color="#fff3b0"/></linearGradient>
    <radialGradient id="pt-glow" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#ff5a2a" stop-opacity="0.9"/><stop offset="100%" stop-color="#ff5a2a" stop-opacity="0"/></radialGradient>
    <clipPath id="pt-inside"><path d="M96 112 H264 V206 C264 222 250 232 234 232 H126 C110 232 96 222 96 206 Z"/></clipPath>
  </defs>
  <g id="pt-steam" fill="none" stroke="#9aa6ad" stroke-width="3" stroke-linecap="round">
    <path class="steam s1" d="M140 96 c-10 -14 10 -22 0 -38 c-8 -12 8 -20 2 -30"/>
    <path class="steam s2" d="M180 92 c-10 -14 10 -22 0 -38 c-8 -12 8 -20 2 -30"/>
    <path class="steam s3" d="M220 96 c-10 -14 10 -22 0 -38 c-8 -12 8 -20 2 -30"/>
  </g>
  <g id="pt-fire" transform="translate(180 290) scale(1 0.6)">
    <g class="flame f1"><path d="M-46 0 C-58 -26 -40 -44 -34 -66 C-26 -44 -16 -40 -18 0 Z" fill="url(#pt-flame)"/></g>
    <g class="flame f2"><path d="M-22 0 C-36 -36 -12 -58 -2 -88 C10 -58 30 -40 20 0 Z" fill="url(#pt-flame)"/><path d="M-10 0 C-16 -22 -4 -36 0 -50 C8 -34 14 -22 10 0 Z" fill="url(#pt-flame-in)"/></g>
    <g class="flame f3"><path d="M22 0 C14 -30 30 -46 38 -70 C44 -48 58 -32 48 0 Z" fill="url(#pt-flame)"/></g>
  </g>
  <g clip-path="url(#pt-inside)">
    <rect x="90" y="100" width="180" height="140" fill="#2c3136"/>
    <rect id="pt-water" x="90" y="150" width="180" height="100" fill="url(#pt-water-grad)"/>
    <path id="pt-surface" fill="#bfe6f7" opacity="0.7"/>
    <g id="pt-bubbles" fill="#e8f7ff" opacity="0.85"></g>
    <ellipse id="pt-hot" cx="180" cy="232" rx="90" ry="22" fill="url(#pt-glow)"/>
  </g>
  <path d="M90 108 H270 V206 C270 226 254 238 234 238 H126 C106 238 90 226 90 206 Z" fill="none" stroke="url(#pt-metal)" stroke-width="8"/>
  <rect x="78" y="100" width="204" height="12" rx="6" fill="url(#pt-metal)"/>
  <rect x="52" y="130" width="34" height="10" rx="5" fill="#4a4f55"/><rect x="274" y="130" width="34" height="10" rx="5" fill="#4a4f55"/>
  <rect x="118" y="238" width="8" height="54" fill="#5c5650"/><rect x="234" y="238" width="8" height="54" fill="#5c5650"/>
  <rect x="96" y="288" width="168" height="12" rx="4" fill="#5c5650"/>
  <rect x="70" y="298" width="220" height="30" rx="8" fill="#3d3a37"/>
  <path d="M274 180 H312" stroke="#7a8288" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="316" y="184" class="pt-label">Thận thủy</text>
  <path d="M222 268 L312 272" stroke="#7a8288" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="316" y="276" class="pt-label">Mệnh môn hỏa</text>`;
}

function renderPot(root, w, f) {
  const svg = $(root, '#pot');
  const top = 226 - (w / 100) * 106; // mặt nước: 226 (cạn sát đáy) → 120 (đầy)
  attr($(svg, '#pt-water'), { y: top, height: 240 - top });
  const boil = Math.min(1, (f / 100) * (1.25 - w / 160));
  const amp = 1.5 + boil * 6;
  $(svg, '#pt-surface').setAttribute('d', `M90 ${top} q22.5 ${-amp} 45 0 t45 0 t45 0 t45 0 V${top + 5} H90 Z`);
  const fireScale = 0.1 + (f / 100) * 0.9; // lửa liếm lên đáy nồi, nồi che phần trên
  $(svg, '#pt-fire').setAttribute('transform', `translate(180 290) scale(${0.65 + f / 280} ${fireScale.toFixed(2)})`);
  $(svg, '#pt-hot').setAttribute('opacity', w < 40 ? Math.min(1, (f / 100) * (1 - w / 40) * 1.6).toFixed(2) : 0);

  const bubbles = $(svg, '#pt-bubbles');
  bubbles.innerHTML = '';
  const n = Math.round(boil * 12);
  for (let i = 0; i < n; i++) {
    const cx = 108 + ((i * 37) % 146);
    const cy = Math.max(top + 6, 226 - ((i * 23) % 70));
    if (cy > 230) continue;
    bubbles.appendChild(attr(document.createElementNS(SVGNS, 'circle'), { cx, cy, r: 2 + (i % 3), class: `bubble b${i % 4}` }));
  }
  $(svg, '#pt-steam').setAttribute('opacity', Math.max(0, boil - 0.25).toFixed(2));

  const key = classify(w, f);
  const s = STATES[key];
  $(root, '#out-water').textContent = w < 40 ? 'cạn' : w > 80 ? 'đầy' : 'vừa';
  $(root, '#out-fire').textContent = f < 38 ? 'yếu' : f > 74 ? 'rất to' : 'vừa';
  svg.setAttribute('aria-label', `Nồi nước: nước ${$(root, '#out-water').textContent}, lửa ${$(root, '#out-fire').textContent}. ${s.ten}`);
  $(root, '#pot-reading').innerHTML = `<h2>${esc(s.ten)}</h2>
    <dl class="readlist">
      <dt>Hình ảnh</dt><dd>${esc(s.hinh)}</dd>
      <dt>Biểu hiện thường gặp</dt><dd>${esc(s.bieu_hien)}</dd>
      <dt>Phép chữa</dt><dd><strong>${esc(s.phap)}</strong></dd>
      ${s.vi_du ? `<dt>Ví dụ</dt><dd>${esc(s.vi_du)}</dd>` : ''}
    </dl>
    ${key === 'am-hu' || key === 'thuc-nhiet' ? `<div class="notice notice-${s.kind}">Hai trạng thái “Lửa to” và “Nồi cạn” đều làm người thấy nóng, nhưng cách chữa ngược nhau: một bên bớt lửa, một bên thêm nước. Nhầm là dùng sai thuốc.</div>` : ''}`;
}

export function mountThuyHoa(root, params) {
  const water = $(root, '#sl-water');
  const fire = $(root, '#sl-fire');
  buildPotSvg($(root, '#pot'));
  const preset = STATES[params.get('s')];
  if (preset) [water.value, fire.value] = preset.preset;
  const update = () => renderPot(root, Number(water.value), Number(fire.value));
  water.addEventListener('input', update);
  fire.addEventListener('input', update);
  root.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-preset]');
    if (!b) return;
    [water.value, fire.value] = STATES[b.dataset.preset].preset;
    update();
  });
  update();
}

// =====================================================================
// RỒNG VỀ Ổ — Long hỏa và phép dẫn hỏa quy nguyên
// Nguồn: Hải Thượng Y Tông Tâm Lĩnh — Châu ngọc cách ngôn (thiên thượng);
//        Huyền tẫn phát vi — Bàn về Long Lôi tướng hỏa.
// =====================================================================
const QUOTES = {
  ccn1: { t: 'Huyệt mệnh môn, nằm ở giữa hai quả thận, gọi là Long hỏa.', src: 'Châu ngọc cách ngôn' },
  ccn2: { t: 'long hỏa sợ lạnh mà bay lên, sinh ra các chứng “trên nhiệt dưới hàn”, cho nên phải uống Bát vị để sưởi ấm nơi sào huyệt để cho long hỏa trở về.', src: 'Châu ngọc cách ngôn' },
  ccn3: { t: 'Âm khí trong thận quá thịnh, rồng không có đất nương thân, sợ khí âm hàn mà bay bốc đi.', src: 'Châu ngọc cách ngôn' },
  ccn4: { t: 'chỉ thấy chứng nhiệt ở trên thì cho uống Lục vị để bổ thủy, thủy càng thịnh thì hàn càng tăng, hỏa bay đi rồi thì chân dương sẽ mất.', src: 'Châu ngọc cách ngôn' },
  ccn5: { t: 'Bởi đem Quế Phụ xen lẫn vào đội ngũ âm dược, khác gì khi nước cạn đá mới trơ ra.', src: 'Châu ngọc cách ngôn' },
  hp1: { t: 'Tướng hỏa là Long hỏa, gặp ướt thì bốc ngọn lên, gặp nước lại càng bùng cháy.', src: 'Huyền tẫn phát vi · Bàn về Long Lôi tướng hỏa' },
  hp2: { t: 'nếu dùng vị khổ hàn (đắng lạnh) chỉ tổ làm cho ngọn lửa cháy rực trời, đến lúc sức cùng mới tắt.', src: 'Huyền tẫn phát vi · Bàn về Long Lôi tướng hỏa' },
  hp3: { t: 'chỉ có bài Bát vị hoàn, Quế Phụ với hỏa cùng một khí, đi thẳng vào trong thân giữ lấy căn cứ của nó mà chiêu dụ nó trở về.', src: 'Huyền tẫn phát vi · Bàn về Long Lôi tướng hỏa' },
};
const quote = (k) => `<blockquote class="cite"><p>“${esc(QUOTES[k].t)}”</p><footer>— ${esc(QUOTES[k].src)}, Hải Thượng Y Tông Tâm Lĩnh</footer></blockquote>`;

const ACTIONS = {
  'kho-han': { ten: 'Dập lửa bằng thuốc đắng lạnh (Tri mẫu, Hoàng bá)', dWarm: -22, dWater: 0, flare: true, kq: 'Ổ càng lạnh, rồng càng bay cao; lửa ở trên bùng lên chứ không tắt.', q: 'hp2', kind: 'do' },
  'bo-thuy': { ten: 'Chỉ bổ thủy (Lục vị)', dWarm: -14, dWater: 22, flare: false, kq: 'Nước nhiều thêm mà ổ không ấm: hàn càng tăng, rồng không về.', q: 'ccn4', kind: 'do' },
  'suoi-o': { ten: 'Sưởi ấm ổ — dẫn hỏa quy nguyên (Bát vị: Lục vị thêm Quế, Phụ)', dWarm: 32, dWater: 6, flare: false, kq: 'Ổ ấm lại, rồng có chỗ nương thân nên tự về; nhiệt ở trên lắng xuống.', q: 'hp3', kind: 'xanh' },
};

export function pageDragon() {
  return `<p class="crumbs"><a href="#/hoc">Học bằng hình</a></p>
  <h1>Rồng về ổ</h1>
  <p class="lead">Hải Thượng Lãn Ông ví lửa Mệnh môn như con rồng nằm trong ổ giữa hai quả Thận. Ổ ấm thì rồng nằm yên; ổ lạnh thì rồng bay lên, gây chứng <strong>trên nhiệt dưới hàn</strong>. Hãy thử ba cách chữa để thấy vì sao Lãn Ông dặn phải <em>sưởi ấm ổ</em> chứ không dập lửa.</p>
  <div class="lab">
    <figure class="lab-figure">
      <svg id="dragon" viewBox="0 0 360 480" role="img" aria-label="Con rồng và ổ rồng trong cơ thể"></svg>
    </figure>
    <div class="lab-controls">
      <h2>Thử chữa</h2>
      <div class="actions">${Object.entries(ACTIONS).map(([k, a]) => `<button type="button" class="action action-${a.kind}" data-act="${k}">${esc(a.ten)}</button>`).join('')}</div>
      <button type="button" class="chip" data-reset>Làm lại từ đầu</button>
      <label class="slider"><span>Độ ấm của ổ rồng (chân dương ở Thận)</span><input type="range" id="sl-warm" min="0" max="100" value="22"><output id="out-warm"></output></label>
      <ol class="history" id="dragon-history"></ol>
    </div>
  </div>
  <section class="reading" id="dragon-reading" aria-live="polite"></section>
  <section class="reading">
    <h2>Lời Lãn Ông</h2>
    ${quote('ccn1')}${quote('ccn3')}${quote('hp1')}
    <h3>Đừng nhầm với “Nồi cạn”</h3>
    <p>Cùng là nóng ở trên, nhưng gốc bệnh khác hẳn. <strong>Rồng bay khỏi ổ</strong>: dưới lạnh (âm hàn thịnh) nên lửa bị đẩy lên — phải sưởi ấm ổ. <strong>Nồi cạn</strong> (<a href="#/hoc/thuy-hoa?s=am-hu">âm hư hỏa vượng</a>): nước thật sự thiếu nên lửa bốc — phải bổ thủy. Dùng nhầm Quế Phụ cho người nồi cạn thì càng hại:</p>
    ${quote('ccn5')}
  </section>
  <div class="notice notice-do">Bát vị có Phụ tử là vị độc. Phân biệt “rồng bay” với “nồi cạn” cần thầy thuốc xem mạch, xem lưỡi; trang này để hiểu lý, không để tự dùng.</div>
  <p class="muted small">Nguyên văn trích từ bản dịch đăng trên <a href="https://www.yhoccanban.com/2012/07/thien-thuong.html" target="_blank" rel="noopener">Y học căn bản — Châu ngọc cách ngôn</a> và <a href="https://www.yhoccanban.com/2012/07/ban-ve-long-loi-tuong-hoa.html" target="_blank" rel="noopener">Huyền tẫn phát vi — Bàn về Long Lôi tướng hỏa</a> (trang không ghi dịch giả); cần đối chiếu với bản Hán văn. Hình con rồng, ổ rồng là hình ảnh để hiểu do MEDAI vẽ.</p>`;
}

function buildDragonSvg(svg) {
  svg.innerHTML = `
  <defs>
    <linearGradient id="dr-body" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f6c84c"/><stop offset="55%" stop-color="#e2852b"/><stop offset="100%" stop-color="#b8461f"/></linearGradient>
    <radialGradient id="dr-heat-g" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#ff4d2a" stop-opacity="0.85"/><stop offset="100%" stop-color="#ff4d2a" stop-opacity="0"/></radialGradient>
    <radialGradient id="dr-nest-g" cx="50%" cy="50%" r="50%"><stop offset="0%" id="dr-nest-c" stop-color="#ff9a3c" stop-opacity="0.95"/><stop offset="100%" stop-color="#ff9a3c" stop-opacity="0"/></radialGradient>
    <radialGradient id="dr-frost-g" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#9fd8ff" stop-opacity="0.75"/><stop offset="100%" stop-color="#9fd8ff" stop-opacity="0"/></radialGradient>
  </defs>
  <g fill="#8aa39a" fill-opacity="0.14" stroke="#8aa39a" stroke-opacity="0.55" stroke-width="2">
    <circle cx="180" cy="64" r="38"/>
    <path d="M164 100 H196 V120 H164 Z"/>
    <path d="M96 140 Q180 112 264 140 L252 330 Q244 382 222 402 H138 Q116 382 108 330 Z"/>
    <path d="M140 400 H172 V470 H140 Z M188 400 H220 V470 H188 Z"/>
  </g>
  <ellipse id="dr-heat" cx="180" cy="70" rx="80" ry="64" fill="url(#dr-heat-g)" opacity="0"/>
  <ellipse id="dr-frost" cx="180" cy="430" rx="90" ry="60" fill="url(#dr-frost-g)" opacity="0"/>
  <g id="dr-snow" stroke="#d6f0ff" stroke-width="1.5" opacity="0">
    <path d="M150 440 h6 M153 437 v6 M150.8 437.8 l4.4 4.4 M155.2 437.8 l-4.4 4.4"/>
    <path d="M206 452 h6 M209 449 v6 M206.8 449.8 l4.4 4.4 M211.2 449.8 l-4.4 4.4"/>
    <path d="M178 466 h6 M181 463 v6 M178.8 463.8 l4.4 4.4 M183.2 463.8 l-4.4 4.4"/>
  </g>
  <path d="M140 284 C120 270 112 300 124 318 C134 334 156 326 156 308 C156 296 150 290 140 284 Z" fill="#9b5a52" opacity="0.85"/>
  <path d="M220 284 C240 270 248 300 236 318 C226 334 204 326 204 308 C204 296 210 290 220 284 Z" fill="#9b5a52" opacity="0.85"/>
  <ellipse id="dr-water" cx="180" cy="318" rx="30" ry="9" fill="#3d8fc4" opacity="0.6"/>
  <ellipse id="dr-nestglow" cx="180" cy="308" rx="40" ry="30" fill="url(#dr-nest-g)"/>
  <path d="M156 318 Q180 284 204 318 Z" fill="#3a2a22" opacity="0.85"/>
  <g id="dr-coiled" transform="translate(180 306)">
    <path d="M-20 4 C-24 -10 -6 -16 6 -12 C18 -8 18 6 6 8 C-4 10 -10 2 -4 -2" fill="none" stroke="url(#dr-body)" stroke-width="6" stroke-linecap="round"/>
    <circle cx="-20" cy="4" r="4.5" fill="#e2852b"/><circle cx="-21.5" cy="2.8" r="1" fill="#2a1406"/>
  </g>
  <g id="dr-fly" opacity="0">
    <g class="dr-wiggle">
      <path d="M0 0 C26 -22 -26 -48 0 -72 C26 -96 -26 -120 0 -144" fill="none" stroke="url(#dr-body)" stroke-width="13" stroke-linecap="round"/>
      <path d="M0 0 C26 -22 -26 -48 0 -72 C26 -96 -26 -120 0 -144" fill="none" stroke="#7a2e12" stroke-opacity="0.45" stroke-width="13" stroke-dasharray="2 5"/>
      <path d="M-2 -20 l-14 -6 l6 10 Z M2 -52 l14 -6 l-6 10 Z M-2 -92 l-14 -6 l6 10 Z M2 -124 l14 -6 l-6 10 Z" fill="#c4521f"/>
      <path d="M0 2 l-10 12 l10 -4 l10 4 Z" fill="#e2852b"/>
      <g transform="translate(0 -150)">
        <path d="M-12 6 C-14 -10 -4 -18 8 -16 C18 -14 22 -4 16 4 C12 10 -4 12 -12 6 Z" fill="#f2a33a" stroke="#b8461f" stroke-width="1.5"/>
        <path d="M-4 -14 l-8 -14 M6 -15 l6 -14" stroke="#b8461f" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M14 2 C26 0 32 8 40 4 M12 6 C22 10 28 18 36 16" fill="none" stroke="#f6c84c" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="6" cy="-6" r="2.4" fill="#2a1406"/>
        <path id="dr-breath" d="M18 -2 C30 -10 40 -4 46 -14 C44 -2 52 2 46 8 C38 6 28 6 18 2 Z" fill="#ff6a2a" opacity="0"/>
      </g>
    </g>
  </g>
  <text x="300" y="70" class="pt-label">Trên</text>
  <text x="300" y="440" class="pt-label">Dưới</text>
  <text x="180" y="352" class="pt-label dr-center">Ổ rồng · Mệnh môn</text>
  <text x="180" y="368" class="pt-label dr-center">giữa hai quả Thận</text>`;
}

function renderDragon(root, st) {
  const svg = $(root, '#dragon');
  const w = st.warm;
  const t = Math.max(0, Math.min(1, (60 - w) / 50)); // 0 = nằm yên trong ổ, 1 = bay tới đầu
  const fly = $(svg, '#dr-fly');
  const tail = 318 - t * 120;
  const s = 0.55 + t * 0.35;
  fly.setAttribute('transform', `translate(180 ${tail.toFixed(1)}) scale(${s.toFixed(2)})`);
  fly.setAttribute('opacity', t > 0.02 ? 1 : 0);
  $(svg, '#dr-coiled').setAttribute('opacity', t > 0.02 ? 0 : 1);
  const heat = Math.min(1, t * 1.1 + (st.flare ? 0.35 : 0));
  $(svg, '#dr-heat').setAttribute('opacity', heat.toFixed(2));
  $(svg, '#dr-breath').setAttribute('opacity', st.flare ? 0.95 : t > 0.6 ? 0.5 : 0);
  const cold = Math.max(0, Math.min(1, (55 - w) / 45));
  $(svg, '#dr-frost').setAttribute('opacity', cold.toFixed(2));
  $(svg, '#dr-snow').setAttribute('opacity', cold > 0.4 ? cold.toFixed(2) : 0);
  $(svg, '#dr-nest-c').setAttribute('stop-color', mix('#5aa7d6', '#ff9a3c', w / 100));
  $(svg, '#dr-nestglow').setAttribute('opacity', (0.35 + w / 160).toFixed(2));
  attr($(svg, '#dr-water'), { rx: (20 + st.water * 0.3).toFixed(1), ry: (6 + st.water * 0.08).toFixed(1) });

  const home = t <= 0.02;
  $(root, '#out-warm').textContent = w < 30 ? 'lạnh' : w < 60 ? 'chưa đủ ấm' : 'ấm';
  svg.setAttribute('aria-label', home ? 'Rồng nằm yên trong ổ giữa hai quả Thận' : 'Rồng bay khỏi ổ lên phía trên: trên nóng, dưới lạnh');
  const last = st.history.at(-1);
  $(root, '#dragon-reading').innerHTML = home
    ? `<h2>Rồng đã về ổ</h2><p>Ổ ấm, rồng có chỗ nương thân nên nằm yên: lửa ở trên lắng xuống, phần dưới ấm lại. Đây là ý “dẫn hỏa quy nguyên” — đưa lửa về đúng nguồn của nó.</p>${quote('ccn2')}`
    : `<h2>Rồng bay khỏi ổ · trên nhiệt, dưới hàn</h2><p>Ổ ${w < 30 ? 'lạnh' : 'chưa đủ ấm'}, rồng không có chỗ nương thân nên bay lên trên. Người bệnh thấy nóng ở phần trên, trong khi phần dưới lại lạnh.</p>${last ? `<div class="notice notice-${ACTIONS[last].kind}"><strong>Vừa dùng:</strong> ${esc(ACTIONS[last].ten)}. ${esc(ACTIONS[last].kq)}</div>${quote(ACTIONS[last].q)}` : '<p class="muted">Hãy chọn một cách chữa ở bên cạnh.</p>'}`;
  $(root, '#dragon-history').innerHTML = st.history.map((k) => `<li>${esc(ACTIONS[k].ten)}</li>`).join('');
}

export function mountDragon(root) {
  const st = { warm: 22, water: 50, flare: false, history: [] };
  const slider = $(root, '#sl-warm');
  buildDragonSvg($(root, '#dragon'));
  const sync = () => { slider.value = st.warm; renderDragon(root, st); };
  slider.addEventListener('input', () => { st.warm = Number(slider.value); st.flare = false; renderDragon(root, st); });
  root.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-act], [data-reset]');
    if (!b) return;
    if (b.hasAttribute('data-reset')) Object.assign(st, { warm: 22, water: 50, flare: false, history: [] });
    else {
      const a = ACTIONS[b.dataset.act];
      st.warm = Math.max(0, Math.min(100, st.warm + a.dWarm));
      st.water = Math.max(0, Math.min(100, st.water + a.dWater));
      st.flare = a.flare;
      st.history.push(b.dataset.act);
    }
    sync();
  });
  sync();
}

// =====================================================================
export function pageLearn() {
  return `<h1>Học bằng hình</h1>
  <p class="lead">Những điều sách chỉ tả bằng chữ, ở đây bạn nhìn và thử được.</p>
  <div class="tiles">
    <a class="tile" href="#/hoc/thuy-hoa"><h2>Nồi nước – Bếp lửa</h2><p>Âm dương, hàn nhiệt, hư thực qua hình ảnh Thủy – Hỏa của Lãn Ông. Vì sao cùng “nóng” mà có người cần thuốc mát, có người cần thuốc bổ âm.</p></a>
    <a class="tile" href="#/hoc/rong"><h2>Rồng về ổ</h2><p>Hình ảnh Long hỏa của Lãn Ông: vì sao ổ lạnh thì rồng bay lên, và vì sao phải sưởi ấm ổ chứ không dập lửa.</p></a>
    <a class="tile" href="#/hoc/luoi"><h2>Lưỡi tự dựng</h2><p>Chọn màu lưỡi, rêu, hình dáng để thấy chiếc lưỡi và cách Đông y đọc nó.</p></a>
  </div>
  <p class="muted">Sắp có: sóng mạch (máy rung theo nhịp), vòng Ngũ hành, bản đồ kinh lạc.</p>`;
}
