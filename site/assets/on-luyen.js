// Ôn luyện: thẻ ghi nhớ và câu đố, tự sinh từ dữ liệu sổ cái.
// Tiến độ "đã nhớ" lưu trong trình duyệt của người học (localStorage).

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const pick = (arr, n) => shuffle(arr).slice(0, n);

function decks(ctx) {
  const { DB, BY_ID, stripTags, esc } = ctx;
  const of = (loai) => DB.entries.filter((e) => e.loai === loai);
  const names = (ids) => (ids ?? []).map((id) => BY_ID.get(id)?.ten).filter(Boolean).join(', ');
  return {
    chu: {
      ten: 'Chữ Hán',
      cards: Object.values(DB.chu).map((c) => ({
        id: c.chu, front: `<span class="han flash-han">${c.chu}</span>`,
        back: `<p class="flash-big">${esc(c.am)}</p><p>${esc(c.nghia)}</p>${c.nghia_y ? `<p class="muted">Trong y học: ${esc(c.nghia_y)}</p>` : ''}`,
        link: `#/chu/${encodeURIComponent(c.chu)}`,
      })),
    },
    'vi-thuoc': {
      ten: 'Vị thuốc',
      cards: of('vi-thuoc').map((e) => ({
        id: e.id, front: `<p class="flash-big">${esc(e.ten)}</p><span class="han">${esc(e.ten_han)}</span>`,
        back: `<p><strong>${[e.facet.tinh?.[0], (e.facet.vi ?? []).join(', ')].filter(Boolean).join(' · ')}</strong></p><p>Quy kinh: ${(e.facet.quy_kinh ?? []).join(', ')}</p><p class="muted">${esc(e.tom_tat)}</p>`,
        link: `#/m/${e.id}`,
      })),
    },
    'bai-thuoc': {
      ten: 'Bài thuốc',
      cards: of('bai-thuoc').map((e) => ({
        id: e.id, front: `<p class="flash-big">${esc(e.ten)}</p><span class="han">${esc(e.ten_han)}</span>`,
        back: `<p><strong>Quân:</strong> ${e.thanh_phan.filter((x) => x.vai === 'quân').map((x) => x.ten).join(', ') || '—'}</p><p><strong>Phép trị:</strong> ${esc(names(e.refs.phep_tri)) || '—'}</p><p class="muted">${esc(e.tom_tat)}</p>`,
        link: `#/m/${e.id}`,
      })),
    },
    chung: {
      ten: 'Chứng → phép trị',
      cards: of('chung').map((e) => ({
        id: e.id, front: `<p class="flash-big">${esc(e.ten)}</p><span class="han">${esc(e.ten_han)}</span>`,
        back: `<p><strong>Phép trị:</strong> ${esc(names(e.refs.phep_tri)) || '—'}</p><p><strong>Bài:</strong> ${esc(names(e.refs.bai_thuoc)) || '—'}</p><p class="muted">${esc(e.tom_tat)}</p>`,
        link: `#/m/${e.id}`,
      })),
    },
    benh: {
      ten: 'Bệnh → Đông y',
      cards: of('benh').map((e) => ({
        id: e.id, front: `<p class="flash-big">${esc(e.ten)}</p>`,
        back: `<p><strong>Đông y:</strong> ${stripTags(e.yhct)}</p><p><strong>Các thể:</strong> ${e.the_benh.map((t) => t.ten).join('; ')}</p>`,
        link: `#/m/${e.id}`,
      })),
    },
  };
}

// Mỗi bộ sinh câu hỏi trả về {hoi, dung, sai[], giai, link} hoặc null nếu không đủ dữ liệu
function questionMakers(ctx) {
  const { DB, BY_ID, stripTags, esc } = ctx;
  const of = (loai) => DB.entries.filter((e) => e.loai === loai);
  const chu = Object.values(DB.chu);
  const herbs = of('vi-thuoc');
  const formulas = of('bai-thuoc');
  const chung = of('chung').filter((e) => e.refs.phep_tri?.length);
  const phep = of('phep-tri');
  const benh = of('benh');
  const others = (pool, correct, n = 3) => pick([...new Set(pool.filter((x) => x && x !== correct))], n);
  return [
    () => {
      const c = pick(chu, 1)[0];
      return { hoi: `Chữ <span class="han">${c.chu}</span> đọc âm Hán Việt là gì?`, dung: c.am, sai: others(chu.map((x) => x.am), c.am), giai: `${c.chu} — ${esc(c.am)}: ${esc(c.nghia)}`, link: `#/chu/${encodeURIComponent(c.chu)}` };
    },
    () => {
      const c = pick(chu.filter((x) => x.nghia_y), 1)[0];
      return c && { hoi: `Trong y học, chữ <span class="han">${c.chu}</span> (${esc(c.am)}) mang nghĩa gì?`, dung: c.nghia_y, sai: others(chu.map((x) => x.nghia_y), c.nghia_y), giai: c.bay || `Nghĩa thường ngày: ${esc(c.nghia)}`, link: `#/chu/${encodeURIComponent(c.chu)}` };
    },
    () => {
      const h = pick(herbs.filter((x) => x.facet.tinh?.length), 1)[0];
      return h && { hoi: `Vị <strong>${esc(h.ten)}</strong> có tính gì?`, dung: h.facet.tinh[0], sai: others(['Lạnh (hàn)', 'Mát (lương)', 'Bình', 'Ấm (ôn)', 'Nóng (nhiệt)'], h.facet.tinh[0]), giai: h.tom_tat, link: `#/m/${h.id}` };
    },
    () => {
      const h = pick(herbs.filter((x) => x.nhom), 1)[0];
      return h && { hoi: `Vị <strong>${esc(h.ten)}</strong> thuộc nhóm công năng nào?`, dung: h.nhom, sai: others(herbs.map((x) => x.nhom), h.nhom), giai: h.tom_tat, link: `#/m/${h.id}` };
    },
    () => {
      const f = pick(formulas.filter((x) => x.thanh_phan.some((i) => i.vai === 'quân')), 1)[0];
      if (!f) return null;
      const quan = f.thanh_phan.filter((i) => i.vai === 'quân');
      const answer = quan[0].ten;
      const inFormula = new Set(f.thanh_phan.map((i) => i.ten));
      const pool = formulas.flatMap((x) => x.thanh_phan.map((i) => i.ten)).filter((t) => !inFormula.has(t));
      return { hoi: `Vị nào làm <strong>Quân</strong> trong bài <strong>${esc(f.ten)}</strong>?`, dung: answer, sai: others(pool, answer), giai: `${answer}: ${stripTags(quan[0].viec)}`, link: `#/m/${f.id}` };
    },
    () => {
      const c = pick(chung, 1)[0];
      if (!c) return null;
      const answer = BY_ID.get(c.refs.phep_tri[0])?.ten;
      return answer && { hoi: `Chứng <strong>${esc(c.ten)}</strong> chữa theo phép nào?`, dung: answer, sai: others(phep.map((x) => x.ten), answer), giai: c.tom_tat, link: `#/m/${c.id}` };
    },
    () => {
      const b = pick(benh, 1)[0];
      if (!b) return null;
      const name = (x) => stripTags(x.yhct).split(' — ')[0];
      return { hoi: `Đông y xếp bệnh <strong>${esc(b.ten)}</strong> vào chứng nào?`, dung: name(b), sai: others(benh.map(name), name(b)), giai: b.tom_tat, link: `#/m/${b.id}` };
    },
  ];
}

function makeQuiz(ctx, n = 10) {
  const makers = questionMakers(ctx);
  const qs = [];
  let guard = 0;
  while (qs.length < n && guard++ < 200) {
    const q = makers[Math.floor(Math.random() * makers.length)]();
    if (!q || !q.dung || q.sai.length < 3 || qs.some((x) => x.hoi === q.hoi)) continue;
    qs.push({ ...q, lua_chon: shuffle([q.dung, ...q.sai]) });
  }
  return qs;
}

export function pageQuiz() {
  return `<h1>Ôn luyện</h1>
    <p class="lead">Kho Đông y rất rộng; ôn từng chút mỗi ngày sẽ nhớ lâu. Thẻ và câu hỏi đều tự sinh từ sổ cái, nên sổ cái càng đầy thì bài ôn càng phong phú.</p>
    <div class="mode-tabs" role="tablist">
      <button type="button" role="tab" data-mode="the" aria-selected="true">Thẻ ghi nhớ</button>
      <button type="button" role="tab" data-mode="do" aria-selected="false">Câu đố 10 câu</button>
    </div>
    <section id="quiz-area" aria-live="polite"></section>`;
}

export function mountQuiz(root, ctx) {
  const { esc, store } = ctx;
  const all = decks(ctx);
  const area = root.querySelector('#quiz-area');
  const state = { mode: 'the', deck: store('medai-on-bo') && all[store('medai-on-bo')] ? store('medai-on-bo') : 'chu' };
  const known = (deck) => { try { return new Set(JSON.parse(store(`medai-nho-${deck}`) || '[]')); } catch { return new Set(); } };
  const saveKnown = (deck, set) => store(`medai-nho-${deck}`, JSON.stringify([...set]));

  // ----- Thẻ ghi nhớ -----
  let queue = [];
  let flipped = false;
  const startDeck = () => {
    const k = known(state.deck);
    const cards = all[state.deck].cards;
    queue = [...shuffle(cards.filter((c) => !k.has(c.id))), ...shuffle(cards.filter((c) => k.has(c.id)))];
    flipped = false;
  };
  const renderCards = () => {
    const deck = all[state.deck];
    const k = known(state.deck);
    const card = queue[0];
    area.innerHTML = `<div class="chips deck-chips" role="group">${Object.entries(all).map(([id, d]) => `<button type="button" class="chip" data-deck="${id}" aria-pressed="${id === state.deck}">${esc(d.ten)} <span class="muted">${d.cards.length}</span></button>`).join('')}</div>
      <div class="progress"><div class="progress-bar" style-width="${deck.cards.length ? Math.round((k.size / deck.cards.length) * 100) : 0}"></div></div>
      <p class="muted small">Đã nhớ ${k.size} / ${deck.cards.length} thẻ</p>
      ${card ? `<button type="button" class="flashcard${flipped ? ' flipped' : ''}" id="flashcard" aria-label="Lật thẻ">
          <span class="flash-face">${flipped ? card.back : card.front}</span>
          <span class="flash-hint">${flipped ? `<a href="${card.link}">Đọc trang đầy đủ →</a>` : 'Bấm để lật thẻ'}</span>
        </button>
        <div class="flash-actions">
          <button type="button" class="ghost" data-act="chua">Chưa nhớ</button>
          <button type="button" data-act="nho">Đã nhớ</button>
        </div>` : '<p class="empty">Bộ thẻ này chưa có nội dung.</p>'}
      <p><button type="button" class="link-btn" data-act="reset">Học lại bộ này từ đầu</button></p>`;
    const bar = area.querySelector('.progress-bar');
    if (bar) bar.style.width = `${bar.getAttribute('style-width')}%`; // đặt bằng CSSOM vì trang chặn style nội tuyến
  };

  // ----- Câu đố -----
  let quiz = [];
  let qi = 0;
  let score = 0;
  let answered = null;
  const startQuiz = () => { quiz = makeQuiz(ctx); qi = 0; score = 0; answered = null; };
  const renderQuiz = () => {
    if (!quiz.length) { area.innerHTML = '<p class="empty">Sổ cái chưa đủ dữ liệu để ra câu hỏi.</p>'; return; }
    if (qi >= quiz.length) {
      area.innerHTML = `<div class="quiz-done"><p class="flash-big">${score} / ${quiz.length}</p>
        <p>${score === quiz.length ? 'Tuyệt vời — đúng hết!' : score >= quiz.length * 0.7 ? 'Rất tốt, ôn thêm vài chỗ là chắc.' : 'Mỗi lần ôn là một lần nhớ thêm. Làm lại nhé!'}</p>
        <button type="button" data-act="again">Làm bộ câu hỏi mới</button></div>`;
      return;
    }
    const q = quiz[qi];
    area.innerHTML = `<p class="muted small">Câu ${qi + 1} / ${quiz.length} · Đúng ${score}</p>
      <div class="question"><p class="q-text">${q.hoi}</p>
      <div class="options">${q.lua_chon.map((o, i) => {
        let cls = '';
        if (answered !== null) cls = o === q.dung ? ' correct' : i === answered ? ' wrong' : '';
        return `<button type="button" class="option${cls}" data-opt="${i}"${answered !== null ? ' disabled' : ''}>${esc(o)}</button>`;
      }).join('')}</div>
      ${answered !== null ? `<div class="notice notice-${q.lua_chon[answered] === q.dung ? 'xanh' : 'vang'}"><strong>${q.lua_chon[answered] === q.dung ? 'Đúng!' : `Đáp án: ${esc(q.dung)}`}</strong> ${q.giai ? esc(q.giai) : ''} <a href="${q.link}">Đọc thêm →</a></div>
        <button type="button" data-act="next">${qi + 1 < quiz.length ? 'Câu tiếp theo' : 'Xem kết quả'}</button>` : ''}
      </div>`;
  };

  const render = () => {
    root.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.mode === state.mode)));
    if (state.mode === 'the') renderCards(); else renderQuiz();
  };

  root.addEventListener('click', (ev) => {
    const t = ev.target;
    const mode = t.closest('[data-mode]');
    if (mode) { state.mode = mode.dataset.mode; if (state.mode === 'do') startQuiz(); render(); return; }
    const deck = t.closest('[data-deck]');
    if (deck) { state.deck = deck.dataset.deck; store('medai-on-bo', state.deck); startDeck(); render(); return; }
    if (t.closest('a')) return;
    if (t.closest('#flashcard')) { flipped = !flipped; render(); return; }
    const act = t.closest('[data-act]')?.dataset.act;
    if (act === 'nho' || act === 'chua') {
      const card = queue.shift();
      const k = known(state.deck);
      if (act === 'nho') { k.add(card.id); queue.push(card); } else { k.delete(card.id); queue.splice(Math.min(3, queue.length), 0, card); }
      saveKnown(state.deck, k);
      flipped = false;
      render();
    } else if (act === 'reset') { saveKnown(state.deck, new Set()); startDeck(); render(); }
    else if (act === 'next') { qi++; answered = null; render(); }
    else if (act === 'again') { startQuiz(); render(); }
    const opt = t.closest('[data-opt]');
    if (opt && answered === null) {
      answered = Number(opt.dataset.opt);
      if (quiz[qi].lua_chon[answered] === quiz[qi].dung) score++;
      render();
    }
  });
  startDeck();
  render();
}
