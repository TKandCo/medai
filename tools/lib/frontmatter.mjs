// Đọc phần đầu bài (frontmatter) dạng YAML rút gọn:
//   khoa: giá trị
//   danh_sach: [a, b, c]
//   danh_sach_dai:
//     - mục 1
//     - mục 2

function cleanValue(raw) {
  const v = raw.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
  return v;
}

export function parseFrontmatter(source) {
  const text = source.replace(/^﻿/, '').replace(/\r\n/g, '\n');
  if (!text.startsWith('---\n')) return { data: {}, body: text };
  const end = text.indexOf('\n---', 4);
  if (end === -1) throw new Error('Thiếu dòng "---" đóng phần đầu bài');
  const head = text.slice(4, end);
  const body = text.slice(end + 4).replace(/^\n/, '');
  const data = {};
  let listKey = null;
  head.split('\n').forEach((line, i) => {
    if (!line.trim() || line.trim().startsWith('#')) return;
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item) {
      if (!listKey) throw new Error(`Dòng ${i + 2}: mục "- ..." không thuộc khóa nào`);
      data[listKey].push(cleanValue(item[1]));
      return;
    }
    const kv = line.match(/^([A-Za-z_][\w]*)\s*:\s*(.*)$/);
    if (!kv) throw new Error(`Dòng ${i + 2}: không đọc được "${line}"`);
    const [, key, rawValue] = kv;
    const value = rawValue.trim();
    if (value === '') {
      data[key] = [];
      listKey = key;
    } else if (value.startsWith('[') && value.endsWith(']')) {
      data[key] = value.slice(1, -1).split(',').map(cleanValue).filter(Boolean);
      listKey = null;
    } else {
      data[key] = cleanValue(value);
      listKey = null;
    }
  });
  return { data, body };
}
