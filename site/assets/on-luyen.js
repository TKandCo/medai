// Ôn luyện: rèn từ Hán Việt và kiến thức Đông y bằng tiếng Việt, dưới dạng trò chơi.
// Không dạy mặt chữ Hán — chỉ dùng âm và nghĩa tiếng Việt.
// Ba cách chơi: Ghép đôi, Thẻ ghi nhớ, Câu đố. Mọi dữ liệu tự sinh từ sổ cái.
// Tiến độ và kỷ lục lưu trong trình duyệt của người học (localStorage).

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const pick = (arr, n) => shuffle(arr).slice(0, n);
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** Từ Hán Việt có nghĩa y học riêng (bỏ các chữ chỉ là một phần tên cây, tên thuốc, con số) */
function meaningfulWords(DB) {
  return Object.values(DB.chu).filter((c) => c.nghia_y && !/^(tên |trong )/.test(c.nghia) && !/^trong /.test(c.nghia_y)
    && !['một', 'bốn', 'sáu', 'tám', 'mười', 'năm'].includes(c.nghia.split(',')[0]));
}
/** Các trang có tên chứa một chữ Hán (để lấy ví dụ bằng tiếng Việt) */
const examplesOf = (DB, ch, n = 3) => DB.entries.filter((e) => e.ten_han.includes(ch)).slice(0, n).map((e) => e.ten);

// ---------- Dữ liệu cho từng bộ ----------
function sets(ctx) {
  const { DB, BY_ID, stripTags } = ctx;
  const of = (...loai) => DB.entries.filter((e) => loai.includes(e.loai));
  const yhctShort = (e) => stripTags(e.yhct).split(' — ')[0];
  const words = meaningfulWords(DB);
  return {
    tu: {
      ten: 'Từ Hán Việt',
      mo_ta: 'Nghĩa của từng chữ trong thuật ngữ: bổ, tư, hư, thực…',
      pairs: words.map((c) => ({ id: c.chu, a: cap(c.am), b: cap(c.nghia_y), them: examplesOf(DB, c.chu), bay: c.bay })),
    },
    'thuat-ngu': {
      ten: 'Thuật ngữ, chứng, phép trị',
      mo_ta: 'Tư âm giáng hỏa, Tỳ khí hư… nghĩa là gì',
      pairs: of('thuat-ngu', 'chung', 'phep-tri').map((e) => ({ id: e.id, a: e.ten, b: e.tom_tat, link: `#/m/${e.id}` })),
    },
    'chung-phep': {
      ten: 'Chứng → phép trị',
      mo_ta: 'Gặp chứng này thì chữa theo hướng nào',
      pairs: of('chung').filter((e) => e.refs.phep_tri?.length).map((e) => ({ id: e.id, a: e.ten, b: BY_ID.get(e.refs.phep_tri[0])?.ten, link: `#/m/${e.id}` })).filter((p) => p.b),
    },
    'bai-quan': {
      ten: 'Bài thuốc → vị Quân',
      mo_ta: 'Vị chủ lực của mỗi bài',
      pairs: of('bai-thuoc').map((e) => ({ id: e.id, a: e.ten, b: e.thanh_phan.filter((x) => x.vai === 'quân').map((x) => x.ten).join(' + '), link: `#/m/${e.id}` })).filter((p) => p.b),
    },
    'vi-nhom': {
      ten: 'Vị thuốc → nhóm',
      mo_ta: 'Mỗi vị thuộc nhóm công năng nào',
      pairs: of('vi-thuoc').filter((e) => e.nhom).map((e) => ({ id: e.id, a: e.ten, b: e.nhom, link: `#/m/${e.id}` })),
    },
    benh: {
      ten: 'Bệnh → tên Đông y',
      mo_ta: 'Bệnh quen thuộc ngày nay, Đông y gọi là gì',
      pairs: of('benh').map((e) => ({ id: e.id, a: e.ten, b: yhctShort(e), link: `#/m/${e.id}` })),
    },
  };
}

// ---------- Câu đố ----------
function questionMakers(ctx) {
  const { DB, BY_ID, stripTags, esc } = ctx;
  const of = (loai) => DB.entries.filter((e) => e.loai === loai);
  const words = meaningfulWords(DB).filter((c) => examplesOf(DB, c.chu, 1).length);
  const herbs = of('vi-thuoc');
  const formulas = of('bai-thuoc');
  const chung = of('chung');
  const phep = of('phep-tri');
  const benh = of('benh');
  const others = (pool, correct, n = 3) => pick([...new Set(pool.filter((x) => x && x !== correct))], n);
  return [
    () => {
      const c = pick(words, 1)[0];
      if (!c) return null;
      const ex = examplesOf(DB, c.chu, 1)[0];
      return { hoi: `Chữ <strong>“${esc(c.am)}”</strong> trong <em>${esc(ex)}</em> nghĩa là gì?`, dung: cap(c.nghia_y), sai: others(words.map((x) => cap(x.nghia_y)), cap(c.nghia_y)), giai: c.bay || `Nghĩa thường ngày: ${c.nghia}.`, link: `#/m/${DB.entries.find((e) => e.ten === ex)?.id}` };
    },
    () => {
      const c = pick(chung, 1)[0];
      return c && { hoi: `<strong>${esc(c.ten)}</strong> nghĩa là gì?`, dung: c.tom_tat, sai: others(chung.map((x) => x.tom_tat), c.tom_tat), giai: '', link: `#/m/${c.id}` };
    },
    () => {
      const p = pick(phep, 1)[0];
      return p && { hoi: `Phép trị <strong>${esc(p.ten)}</strong> dùng để làm gì?`, dung: p.tom_tat, sai: others(phep.map((x) => x.tom_tat), p.tom_tat), giai: '', link: `#/m/${p.id}` };
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
      const inFormula = new Set(f.thanh_phan.map((i) => i.ten));
      const pool = formulas.flatMap((x) => x.thanh_phan.map((i) => i.ten)).filter((t) => !inFormula.has(t));
      return { hoi: `Vị nào làm <strong>Quân</strong> trong bài <strong>${esc(f.ten)}</strong>?`, dung: quan[0].ten, sai: others(pool, quan[0].ten), giai: `${quan[0].ten}: ${stripTags(quan[0].viec)}`, link: `#/m/${f.id}` };
    },
    () => {
      const c = pick(chung.filter((x) => x.refs.phep_tri?.length), 1)[0];
      const answer = c && BY_ID.get(c.refs.phep_tri[0])?.ten;
      return answer && { hoi: `Gặp chứng <strong>${esc(c.ten)}</strong>, chữa theo phép nào?`, dung: answer, sai: others(phep.map((x) => x.ten), answer), giai: c.tom_tat, link: `#/m/${c.id}` };
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
  while (qs.length < n && guard++ < 300) {
    const q = makers[Math.floor(Math.random() * makers.length)]();
    if (!q || !q.dung || q.sai.length < 3 || qs.some((x) => x.hoi === q.hoi)) continue;
    qs.push({ ...q, lua_chon: shuffle([q.dung, ...q.sai]) });
  }
  return qs;
}

/** Chọn n cặp mà vế phải không trùng nhau (để ghép đôi chỉ có một đáp án) */
function uniquePairs(pairs, n) {
  const seen = new Set();
  const out = [];
  for (const p of shuffle(pairs)) {
    if (!p.b || seen.has(p.b)) continue;
    seen.add(p.b);
    out.push(p);
    if (out.length === n) break;
  }
  return out;
}

export function pageQuiz() {
  return `<h1>Ôn luyện</h1>
    <p class="lead">Rèn hiểu từ Hán Việt và kiến thức Đông y bằng trò chơi ngắn. Mọi câu hỏi tự sinh từ sổ cái, nên sổ cái càng đầy thì trò chơi càng phong phú.</p>
    <div class="mode-tabs" role="tablist">
      <button type="button" role="tab" data-mode="ghep" aria-selected="true">Ghép đôi</button>
      <button type="button" role="tab" data-mode="the" aria-selected="false">Thẻ ghi nhớ</button>
      <button type="button" role="tab" data-mode="do" aria-selected="false">Câu đố 10 câu</button>
    </div>
    <section id="quiz-area" aria-live="polite"></section>`;
}

export function mountQuiz(root, ctx) {
  const { esc, store } = ctx;
  const all = sets(ctx);
  const area = root.querySelector('#quiz-area');
  const saved = store('medai-on-bo');
  const state = { mode: 'ghep', set: saved && all[saved] ? saved : 'tu' };
  const readJSON = (key, fallback) => { try { return JSON.parse(store(key) || '') ?? fallback; } catch { return fallback; } };
  const known = (s) => new Set(readJSON(`medai-nho-${s}`, []));
  const saveKnown = (s, set) => store(`medai-nho-${s}`, JSON.stringify([...set]));

  const setChips = (minPairs) => `<div class="chips deck-chips" role="group" aria-label="Chọn bộ">${Object.entries(all).map(([id, d]) => {
    const ok = d.pairs.length >= minPairs;
    return `<button type="button" class="chip" data-set="${id}" aria-pressed="${id === state.set}"${ok ? '' : ' disabled'} title="${esc(d.mo_ta)}">${esc(d.ten)} <span class="muted">${d.pairs.length}</span></button>`;
  }).join('')}</div>`;

  // ===== Ghép đôi =====
  const ROUND = 5;
  let game = null;
  const newGame = () => {
    const chosen = uniquePairs(all[state.set].pairs, ROUND);
    game = { pairs: chosen, right: shuffle(chosen.map((p) => p.id)), sel: null, done: new Set(), wrong: null, misses: 0, start: Date.now(), end: 0 };
  };
  const renderMatch = () => {
    if (!all[state.set] || all[state.set].pairs.length < 3) state.set = 'tu';
    if (!game) newGame();
    const best = readJSON('medai-ky-luc', {})[state.set];
    const byId = new Map(game.pairs.map((p) => [p.id, p]));
    const finished = game.done.size === game.pairs.length;
    const secs = Math.round(((game.end || Date.now()) - game.start) / 1000);
    area.innerHTML = `${setChips(3)}
      <p class="muted small">Bấm một ô bên trái rồi bấm nghĩa đúng bên phải. ${best ? `Kỷ lục bộ này: ${best.s} giây, ${best.m} lần nhầm.` : ''}</p>
      <div class="match">
        <div class="match-col">${game.pairs.map((p) => `<button type="button" class="tile-btn left${game.done.has(p.id) ? ' matched' : ''}${game.sel === p.id ? ' selected' : ''}${game.wrong?.[0] === p.id ? ' shake' : ''}" data-left="${esc(p.id)}"${game.done.has(p.id) ? ' disabled' : ''}>${esc(p.a)}</button>`).join('')}</div>
        <div class="match-col">${game.right.map((id) => `<button type="button" class="tile-btn right${game.done.has(id) ? ' matched' : ''}${game.wrong?.[1] === id ? ' shake' : ''}" data-right="${esc(id)}"${game.done.has(id) ? ' disabled' : ''}>${esc(byId.get(id).b)}</button>`).join('')}</div>
      </div>
      ${finished ? `<div class="match-done"><p class="flash-big">Hoàn thành!</p>
        <p>${secs} giây · ${game.misses} lần nhầm${game.newBest ? ' · <strong>Kỷ lục mới!</strong>' : ''}</p>
        <ul class="recap">${game.pairs.map((p) => `<li><strong>${esc(p.a)}</strong>: ${esc(p.b)}${p.them?.length ? ` <span class="muted">— có trong ${esc(p.them.join(', '))}</span>` : ''}${p.link ? ` <a href="${p.link}">đọc thêm</a>` : ''}</li>`).join('')}</ul>
        <button type="button" data-act="new-game">Ván mới</button></div>` : ''}`;
  };
  const onMatch = (t) => {
    const left = t.closest('[data-left]');
    const right = t.closest('[data-right]');
    if (left) { game.sel = left.dataset.left; game.wrong = null; renderMatch(); return true; }
    if (right && game.sel) {
      const id = right.dataset.right;
      if (id === game.sel) {
        game.done.add(id);
        game.sel = null;
        game.wrong = null;
        if (game.done.size === game.pairs.length) {
          game.end = Date.now();
          const secs = Math.round((game.end - game.start) / 1000);
          const rec = readJSON('medai-ky-luc', {});
          const old = rec[state.set];
          if (!old || game.misses < old.m || (game.misses === old.m && secs < old.s)) {
            rec[state.set] = { s: secs, m: game.misses };
            store('medai-ky-luc', JSON.stringify(rec));
            game.newBest = true;
          }
        }
      } else {
        game.misses++;
        game.wrong = [game.sel, id];
      }
      renderMatch();
      return true;
    }
    return false;
  };

  // ===== Thẻ ghi nhớ =====
  let queue = [];
  let flipped = false;
  const startDeck = () => {
    const k = known(state.set);
    const cards = all[state.set].pairs;
    queue = [...shuffle(cards.filter((c) => !k.has(c.id))), ...shuffle(cards.filter((c) => k.has(c.id)))];
    flipped = false;
  };
  const renderCards = () => {
    const deck = all[state.set];
    if (!queue.length || !deck.pairs.some((p) => p.id === queue[0]?.id)) startDeck();
    const k = known(state.set);
    const card = queue[0];
    area.innerHTML = `${setChips(1)}
      <div class="progress"><div class="progress-bar" data-pct="${deck.pairs.length ? Math.round((k.size / deck.pairs.length) * 100) : 0}"></div></div>
      <p class="muted small">Đã nhớ ${k.size} / ${deck.pairs.length} thẻ</p>
      ${card ? `<button type="button" class="flashcard${flipped ? ' flipped' : ''}" id="flashcard" aria-label="Lật thẻ">
          ${flipped
            ? `<span class="flash-face"><p class="flash-mid">${esc(card.b)}</p>${card.them?.length ? `<p class="muted">Có trong: ${esc(card.them.join(', '))}</p>` : ''}${card.bay ? `<p class="flash-note">Bẫy nghĩa: ${esc(card.bay)}</p>` : ''}</span>`
            : `<span class="flash-face"><p class="flash-big">${esc(card.a)}</p>${card.them?.length ? `<p class="muted">như trong: ${esc(card.them.join(', '))}</p>` : ''}</span>`}
          <span class="flash-hint">${flipped ? (card.link ? `<a href="${card.link}">Đọc trang đầy đủ →</a>` : '') : 'Nghĩ câu trả lời, rồi bấm để lật thẻ'}</span>
        </button>
        <div class="flash-actions">
          <button type="button" class="ghost" data-act="chua">Chưa nhớ</button>
          <button type="button" data-act="nho">Đã nhớ</button>
        </div>` : '<p class="empty">Bộ thẻ này chưa có nội dung.</p>'}
      <p><button type="button" class="link-btn" data-act="reset">Học lại bộ này từ đầu</button></p>`;
    const bar = area.querySelector('.progress-bar');
    if (bar) bar.style.width = `${bar.dataset.pct}%`; // đặt qua CSSOM vì trang chặn style nội tuyến
  };

  // ===== Câu đố =====
  let quiz = [];
  let qi = 0;
  let score = 0;
  let answered = null;
  let streak = 0;
  const startQuiz = () => { quiz = makeQuiz(ctx); qi = 0; score = 0; answered = null; streak = 0; };
  const renderQuiz = () => {
    if (!quiz.length) { area.innerHTML = '<p class="empty">Sổ cái chưa đủ dữ liệu để ra câu hỏi.</p>'; return; }
    if (qi >= quiz.length) {
      area.innerHTML = `<div class="quiz-done"><p class="flash-big">${score} / ${quiz.length}</p>
        <p>${score === quiz.length ? 'Tuyệt vời — đúng hết!' : score >= quiz.length * 0.7 ? 'Rất tốt, ôn thêm vài chỗ là chắc.' : 'Mỗi lần ôn là một lần nhớ thêm. Làm lại nhé!'}</p>
        <button type="button" data-act="again">Làm bộ câu hỏi mới</button></div>`;
      return;
    }
    const q = quiz[qi];
    area.innerHTML = `<div class="quiz-bar"><span>Câu ${qi + 1} / ${quiz.length}</span><span>Đúng ${score}</span>${streak >= 2 ? `<span class="streak">Chuỗi đúng ${streak}</span>` : ''}</div>
      <div class="question"><p class="q-text">${q.hoi}</p>
      <div class="options">${q.lua_chon.map((o, i) => {
        let cls = '';
        if (answered !== null) cls = o === q.dung ? ' correct' : i === answered ? ' wrong' : '';
        return `<button type="button" class="option${cls}" data-opt="${i}"${answered !== null ? ' disabled' : ''}>${esc(o)}</button>`;
      }).join('')}</div>
      ${answered !== null ? `<div class="notice notice-${q.lua_chon[answered] === q.dung ? 'xanh' : 'vang'}"><strong>${q.lua_chon[answered] === q.dung ? 'Đúng!' : `Đáp án: ${esc(q.dung)}`}</strong> ${q.giai ? esc(q.giai) : ''} ${q.link && !q.link.endsWith('undefined') ? `<a href="${q.link}">Đọc thêm →</a>` : ''}</div>
        <button type="button" data-act="next">${qi + 1 < quiz.length ? 'Câu tiếp theo' : 'Xem kết quả'}</button>` : ''}
      </div>`;
  };

  const render = () => {
    root.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.mode === state.mode)));
    if (state.mode === 'ghep') renderMatch();
    else if (state.mode === 'the') renderCards();
    else renderQuiz();
  };

  root.addEventListener('click', (ev) => {
    const t = ev.target;
    const mode = t.closest('[data-mode]');
    if (mode) {
      state.mode = mode.dataset.mode;
      if (state.mode === 'do') startQuiz();
      if (state.mode === 'ghep') newGame();
      render();
      return;
    }
    const s = t.closest('[data-set]');
    if (s && !s.disabled) {
      state.set = s.dataset.set;
      store('medai-on-bo', state.set);
      newGame();
      startDeck();
      render();
      return;
    }
    if (t.closest('a')) return;
    if (state.mode === 'ghep' && onMatch(t)) return;
    if (t.closest('#flashcard')) { flipped = !flipped; render(); return; }
    const act = t.closest('[data-act]')?.dataset.act;
    if (act === 'new-game') { newGame(); render(); }
    else if (act === 'nho' || act === 'chua') {
      const card = queue.shift();
      const k = known(state.set);
      if (act === 'nho') { k.add(card.id); queue.push(card); } else { k.delete(card.id); queue.splice(Math.min(3, queue.length), 0, card); }
      saveKnown(state.set, k);
      flipped = false;
      render();
    } else if (act === 'reset') { saveKnown(state.set, new Set()); startDeck(); render(); }
    else if (act === 'next') { qi++; answered = null; render(); }
    else if (act === 'again') { startQuiz(); render(); }
    const opt = t.closest('[data-opt]');
    if (opt && answered === null) {
      answered = Number(opt.dataset.opt);
      if (quiz[qi].lua_chon[answered] === quiz[qi].dung) { score++; streak++; } else streak = 0;
      render();
    }
  });
  newGame();
  render();
}
