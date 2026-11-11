// Trang "Kiểm chứng & phân tích bài thuốc": nhập danh sách vị (gõ, dán, hoặc nhìn ảnh đơn thuốc),
// MEDAI suy ra công năng, tính chung, quy kinh, nhận diện bài gần giống, và kiểm tra cấm kỵ.
// Ảnh chỉ hiển thị trên máy người dùng, không gửi đi đâu.

import { analyzeFormula } from './phan-tich-core.js';

const SAMPLE = 'Nhân sâm 12g\nBạch truật 12g\nPhục linh 12g\nChích thảo 6g\nThục địa 16g\nĐương quy 12g\nBạch thược 12g\nXuyên khung 8g\nSinh khương 3 lát\nĐại táo 5 quả';
const AI_PROMPT = 'Hãy đọc đơn thuốc Đông y trong ảnh đính kèm. Liệt kê mỗi dòng một vị thuốc theo dạng: Tên vị thuốc (âm Hán Việt, tiếng Việt có dấu) rồi liều, giữ đơn vị như trong đơn. Nếu đơn viết bằng chữ Hán, hãy chuyển tên vị sang âm Hán Việt. Chữ nào không đọc được thì ghi [không rõ]. Chỉ trả về danh sách, không giải thích.';

const pct = (x) => `${Math.round(x * 100)}%`;
const escHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function pageAnalyze(ctx) {
  const last = ctx.store('medai-kiem-chung') ?? '';
  return `<h1>Kiểm chứng &amp; phân tích bài thuốc</h1>
    <p class="lead">Đưa vào một bài thuốc — gõ, dán, hoặc nhìn ảnh đơn thuốc. MEDAI cho biết bài thuốc thiên về công năng gì, tính chung nóng hay lạnh, tác động vào tạng nào, giống bài cổ phương nào, và có phạm cấm kỵ không.</p>
    <div class="analyze-input">
      <section class="photo-box">
        <h2>Ảnh đơn thuốc</h2>
        <label class="upload-btn"><input type="file" id="photo-input" accept="image/*" capture="environment">Chụp hoặc chọn ảnh</label>
        <figure class="photo-frame" id="photo-frame" hidden><img id="photo" alt="Ảnh đơn thuốc bạn vừa chọn"></figure>
        <p class="muted small">Ảnh chỉ hiển thị trên máy bạn để đối chiếu khi gõ, <strong>không gửi đi đâu</strong>.</p>
        <details class="ai-help">
          <summary>Nhờ trợ lý AI bạn đang dùng đọc ảnh</summary>
          <p class="small">Mở trợ lý AI quen dùng (trên điện thoại hoặc máy tính), gửi ảnh đơn thuốc kèm lời nhắn dưới đây, rồi dán danh sách nhận được vào ô bên cạnh.</p>
          <textarea id="ai-prompt" rows="5" readonly>${ctx.esc(AI_PROMPT)}</textarea>
          <button type="button" class="ghost" id="copy-prompt">Chép lời nhắn</button>
          <span class="small muted" id="copy-msg" aria-live="polite"></span>
        </details>
      </section>
      <form id="analyze-form" class="analyze-form">
        <h2>Danh sách vị thuốc</h2>
        <label for="herbs" class="small muted">Mỗi dòng một vị, có thể kèm liều: 12g, 3 chỉ, 1 lạng, 3 lát…</label>
        <textarea id="herbs" name="herbs" rows="11" placeholder="Ví dụ:&#10;Nhân sâm 12g&#10;Bạch truật 12g&#10;Phục linh 12g&#10;Chích thảo 6g">${ctx.esc(last)}</textarea>
        <div class="form-actions">
          <button type="submit">Phân tích</button>
          <button type="button" class="ghost" id="use-sample">Thử với bài mẫu</button>
        </div>
      </form>
    </div>
    <section id="analyze-result" aria-live="polite"></section>
    <div class="notice notice-vang">Phân tích dựa trên dữ liệu trong sổ cái (tính, vị, quy kinh, nhóm công năng của từng vị và các bài thuốc đã có). Nó giúp hiểu bài thuốc, <strong>không cho biết bài thuốc có hợp với bạn không</strong> — điều đó còn tùy thể bệnh. Vị chưa có trong sổ cái thì chưa được tính.</div>`;
}

function bars(list, n = 6) {
  return `<ul class="bars">${list.slice(0, n).map((x) => `<li><span class="bar-label">${escHtml(x.ten)}</span><span class="bar-track"><span class="bar-fill" data-w="${Math.round(x.ti_le * 100)}"></span></span><span class="bar-val">${pct(x.ti_le)}</span></li>`).join('')}</ul>`;
}

function renderResult(r, ctx) {
  const { esc, BY_ID } = ctx;
  const link = (id, ten) => (BY_ID.has(id) ? `<a href="#/m/${esc(id)}">${esc(ten)}</a>` : esc(ten));
  if (!r.vi.length && !r.unknown.length) return '<p class="empty">Chưa có vị nào. Hãy gõ mỗi dòng một vị thuốc.</p>';
  if (!r.vi.length) return `<p class="empty">Chưa nhận ra vị nào: ${esc(r.unknown.map((v) => v.ten).join(', '))}. Thử kiểm tra chính tả, hoặc sổ cái chưa có các vị này.</p>`;

  const top = r.nhom.slice(0, 3).map((x) => `<strong>${esc(x.ten)}</strong> (${pct(x.ti_le)})`).join(', ');
  const best = r.best;
  const cb = r.canh_bao;
  const warn = [
    ...cb.pairs.map((p) => `<li><strong>${p.loai === 'phan' ? 'Tương phản' : 'Tương úy'}:</strong> ${esc(p.a)} – ${esc(p.b)} (${p.loai === 'phan' ? 'Thập bát phản' : 'Thập cửu úy'})</li>`),
    ...cb.thai.map((t) => `<li><strong>${t.muc === 'cam' ? 'Cấm dùng khi có thai' : 'Thận trọng khi có thai'}:</strong> ${esc(t.vi)}</li>`),
    ...cb.doc.map((d) => `<li><strong>${d.muc === 'rat-doc' ? 'Vị rất độc' : 'Vị có độc'}:</strong> ${esc(d.vi)} — phải bào chế đúng phép, không tự dùng</li>`),
  ];
  const guessed = r.vi.filter((v) => v.cach === 'doan');

  return `<h2>Kết quả phân tích</h2>
    <article class="result-summary">
      <h3>Công năng suy ra</h3>
      <ul>
        ${top ? `<li>Hướng chính: ${top}.</li>` : ''}
        ${r.tinh ? `<li>Tính chung của bài: <strong>${esc(r.tinh.nhan)}</strong>.</li>` : ''}
        ${r.quy.length ? `<li>Tác động nhiều nhất vào: <strong>${esc(r.quy.slice(0, 3).map((q) => q.ten).join(', '))}</strong>.</li>` : ''}
        ${best ? `<li>Gần với ${link(best.id, best.ten)} (trùng ${best.trung}/${best.tong} vị)${best.phep_tri.length ? ` — phép trị <strong>${esc(best.phep_tri.join(', '))}</strong>` : ''}${best.chung_benh.length ? `, dùng cho ${esc(best.chung_benh.join(', '))}` : ''}.</li>` : ''}
        ${best && (best.them.length || best.thieu.length) ? `<li>So với bài gốc: ${best.them.length ? `<span class="plus">thêm ${esc(best.them.join(', '))}</span>` : ''}${best.them.length && best.thieu.length ? '; ' : ''}${best.thieu.length ? `<span class="minus">thiếu ${esc(best.thieu.join(', '))}</span>` : ''}.</li>` : ''}
        ${!best ? `<li>Chưa nhận ra bài cổ phương nào trong sổ cái khớp rõ; công năng trên suy ra từ từng vị.</li>` : ''}
      </ul>
      <p class="muted small">Tỷ lệ tính theo ${r.allDosed ? 'liều của từng vị' : 'số vị (chưa đủ liều cho mọi vị nên coi các vị ngang nhau)'}; dựa trên ${r.so_vi_co_du_lieu} vị có dữ liệu trong sổ cái.</p>
    </article>

    ${warn.length ? `<div class="notice notice-do"><strong>Cảnh báo theo quy tắc cổ điển</strong><ul class="warnlist">${warn.join('')}</ul></div>` : '<div class="notice notice-xanh">Không phát hiện cặp phản/úy, vị thai kỵ hay vị có độc trong các vị đã nhận ra.</div>'}

    <div class="result-grid">
      ${r.tinh ? `<section class="result-card"><h3>Cân bằng hàn – nhiệt</h3>
        <div class="meter"><span class="meter-mark" data-pos="${Math.round(((r.tinh.diem + 2) / 4) * 100)}"></span></div>
        <div class="meter-scale"><span>Lạnh</span><span>Mát</span><span>Bình</span><span>Ấm</span><span>Nóng</span></div>
        <p class="small muted">Xem thêm: <a href="#/hoc/thuy-hoa">Nồi nước – Bếp lửa</a></p></section>` : ''}
      ${r.nhom.length ? `<section class="result-card"><h3>Nhóm công năng</h3>${bars(r.nhom)}</section>` : ''}
      ${r.quy.length ? `<section class="result-card"><h3>Quy kinh (tạng phủ)</h3>${bars(r.quy)}</section>` : ''}
      ${r.vi5.length ? `<section class="result-card"><h3>Ngũ vị</h3>${bars(r.vi5)}</section>` : ''}
    </div>

    <h3>Các vị đã nhận ra</h3>
    ${guessed.length ? `<p class="small muted">Đã hiểu: ${guessed.map((v) => `“${esc(v.ten)}” là <strong>${esc(v.ten_chuan)}</strong>`).join('; ')}. Nếu sai, hãy sửa lại tên trong ô nhập.</p>` : ''}
    <div class="table-wrap"><table class="herb-table"><thead><tr><th>Vị thuốc</th><th>Liều</th><th>Vai</th><th>Nhóm</th><th>Tính · Vị</th><th>Quy kinh</th></tr></thead><tbody>
      ${r.vi.map((v) => {
        const e = v.entry;
        const vai = v.vai ? `<span class="role role-${esc(v.vai.normalize('NFD').replace(/[̀-ͯ]/g, '').replace('đ', 'd'))}">${esc(v.vai[0].toUpperCase() + v.vai.slice(1))}</span>` : v.lieu_cao_nhat ? '<span class="muted small">liều cao nhất</span>' : '';
        return `<tr><td>${link(v.id, v.ten_chuan)}</td><td>${esc(v.lieu_text || '')}</td><td>${vai}</td>
          <td>${e ? esc(e.nhom) : '<span class="muted small">chưa có trang, chỉ có trong quy tắc cấm kỵ</span>'}</td>
          <td>${e ? esc([e.facet.tinh?.[0], (e.facet.vi ?? []).join(', ')].filter(Boolean).join(' · ')) : ''}</td>
          <td>${e ? esc((e.facet.quy_kinh ?? []).join(', ')) : ''}</td></tr>`;
      }).join('')}
    </tbody></table></div>
    ${best ? '<p class="small muted">Cột “Vai” lấy theo bài gốc đã nhận ra.</p>' : r.allDosed ? '<p class="small muted">Chưa nhận ra bài gốc nên chưa phân được vai; vị liều cao nhất thường (không phải luôn luôn) là vị Quân.</p>' : ''}
    ${r.unknown.length ? `<p><strong>Chưa nhận ra:</strong> ${esc(r.unknown.map((v) => v.ten + (v.lieu_text ? ` (${v.lieu_text})` : '')).join(', '))}. Có thể sổ cái chưa có các vị này, hoặc tên được viết khác.</p>` : ''}

    ${r.giong.length > (best ? 1 : 0) ? `<h3>Có nét giống</h3><ul>${r.giong.slice(best ? 1 : 0).map((g) => `<li>${link(g.id, g.ten)} — trùng ${g.trung}/${g.tong} vị${g.thieu.length ? `, thiếu ${esc(g.thieu.join(', '))}` : ''}</li>`).join('')}</ul>` : ''}`;
}

export function mountAnalyze(root, ctx) {
  const form = root.querySelector('#analyze-form');
  const textarea = root.querySelector('#herbs');
  const out = root.querySelector('#analyze-result');
  const run = () => {
    const text = textarea.value;
    ctx.store('medai-kiem-chung', text);
    if (!text.trim()) { out.innerHTML = ''; return; }
    out.innerHTML = renderResult(analyzeFormula(text, ctx.DB), ctx);
    // Chiều dài thanh và vị trí kim đặt qua CSSOM vì trang chặn style nội tuyến
    out.querySelectorAll('[data-w]').forEach((el) => { el.style.width = `${el.dataset.w}%`; });
    out.querySelectorAll('[data-pos]').forEach((el) => { el.style.left = `${el.dataset.pos}%`; });
  };
  form.addEventListener('submit', (ev) => { ev.preventDefault(); run(); out.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  root.querySelector('#use-sample').addEventListener('click', () => { textarea.value = SAMPLE; run(); });

  let lastUrl = null;
  root.querySelector('#photo-input').addEventListener('change', (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    if (lastUrl) URL.revokeObjectURL(lastUrl);
    lastUrl = URL.createObjectURL(file);
    root.querySelector('#photo').src = lastUrl;
    root.querySelector('#photo-frame').hidden = false;
    textarea.focus();
  });
  root.querySelector('#copy-prompt').addEventListener('click', async () => {
    const msg = root.querySelector('#copy-msg');
    try {
      await navigator.clipboard.writeText(AI_PROMPT);
      msg.textContent = 'Đã chép. Dán vào trợ lý AI cùng với ảnh.';
    } catch {
      const ta = root.querySelector('#ai-prompt');
      ta.select();
      msg.textContent = 'Hãy bấm giữ để chép đoạn chữ đã chọn.';
    }
  });
  if (textarea.value.trim()) run();
}
