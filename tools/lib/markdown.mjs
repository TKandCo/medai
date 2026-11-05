// Bộ chuyển Markdown → HTML tối giản, an toàn (mọi HTML trong bài đều bị vô hiệu).
// Hỗ trợ: tiêu đề, đoạn, danh sách, trích dẫn, bảng, đường kẻ, **đậm**, *nghiêng*, `mã`,
// [chữ](https://...), và liên kết nội bộ [[ma-muc]] hoặc [[ma-muc|chữ hiển thị]].

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export function renderInline(text, ctx = {}) {
  let s = escapeHtml(text);
  const codes = [];
  s = s.replace(/`([^`]+)`/g, (_, c) => {
    codes.push(`<code>${c}</code>`);
    return `\u0000${codes.length - 1}\u0000`;
  });
  s = s.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, id, label) => {
    const target = id.trim();
    ctx.links?.add(target);
    return `<a href="#/m/${target}" class="xref">${label ?? ctx.titleOf?.(target) ?? target}</a>`;
  });
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, url) => {
    const safe = /^(https?:\/\/|#)/.test(url) ? url : null;
    if (!safe) return label;
    const ext = safe.startsWith('http') ? ' target="_blank" rel="noopener"' : '';
    return `<a href="${safe}"${ext}>${label}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => codes[Number(i)]);
  return s;
}

function renderTable(lines, ctx) {
  const cells = (line) => line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());
  const head = cells(lines[0]);
  const rows = lines.slice(2).map(cells);
  return (
    '<div class="table-wrap"><table><thead><tr>' +
    head.map((h) => `<th>${renderInline(h, ctx)}</th>`).join('') +
    '</tr></thead><tbody>' +
    rows.map((r) => '<tr>' + r.map((c) => `<td>${renderInline(c, ctx)}</td>`).join('') + '</tr>').join('') +
    '</tbody></table></div>'
  );
}

export function renderMarkdown(source, ctx = {}) {
  const lines = String(source).replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const level = Math.min(h[1].length + 1, 5);
      out.push(`<h${level}>${renderInline(h[2], ctx)}</h${level}>`);
      i++;
      continue;
    }
    if (/^\s*(---|\*\*\*)\s*$/.test(line)) { out.push('<hr>'); i++; continue; }
    if (/^\s*\|/.test(line) && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1] ?? '')) {
      const block = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) block.push(lines[i++]);
      out.push(renderTable(block, ctx));
      continue;
    }
    if (/^>\s?/.test(line)) {
      const block = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) block.push(lines[i++].replace(/^>\s?/, ''));
      out.push(`<blockquote>${renderMarkdown(block.join('\n'), ctx)}</blockquote>`);
      continue;
    }
    const listMatch = line.match(/^\s*([-*]|\d+\.)\s+/);
    if (listMatch) {
      const ordered = /\d/.test(listMatch[1]);
      const items = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, ''));
        i++;
      }
      const tag = ordered ? 'ol' : 'ul';
      out.push(`<${tag}>${items.map((it) => `<li>${renderInline(it, ctx)}</li>`).join('')}</${tag}>`);
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|>|\s*([-*]|\d+\.)\s|\s*\|)/.test(lines[i])) para.push(lines[i++]);
    if (para.length === 0) para.push(lines[i++]);
    out.push(`<p>${renderInline(para.join(' '), ctx)}</p>`);
  }
  return out.join('\n');
}

/** Bỏ ký hiệu Markdown để lấy chữ thuần (dùng cho tìm kiếm). */
export function plainText(source) {
  return String(source)
    .replace(/\[\[([^\]|]+)\|?([^\]]*)\]\]/g, (_, id, label) => label || id)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#>*`|_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
