'use strict';
// Ask an already-installed legacy worker to update; never register a new worker.
if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then(registrations => {
  for (const registration of registrations) {
    const worker = registration.active || registration.waiting || registration.installing;
    if (worker && new URL(worker.scriptURL).pathname === '/sw.js') registration.update().catch(() => {});
  }
}).catch(() => {});
const toc = document.querySelector('#post-toc');
if (toc) {
  document.querySelectorAll('#post-content h1, #post-content h2, #post-content h3').forEach((heading, i) => {
    if (!heading.id) heading.id = `section-${i}`;
    const link = document.createElement('a'); link.href = `#${encodeURIComponent(heading.id)}`;
    link.textContent = heading.textContent; link.className = `depth-${heading.tagName.slice(1)}`; toc.append(link);
  });
  if (!toc.children.length) toc.closest('aside').hidden = true;
}
const input = document.querySelector('#blog-search');
if (input) {
  const all = document.querySelector('#all-posts'), results = document.querySelector('#search-results'), status = document.querySelector('#search-status');
  let indexPromise, sequence = 0;
  input.addEventListener('input', async () => {
    const current = ++sequence, query = input.value.trim().toLocaleLowerCase();
    results.replaceChildren(); results.hidden = true; all.hidden = false;
    if (!query) { status.textContent = '输入关键词进行全文搜索'; return; }
    status.textContent = '正在搜索…';
    try {
      indexPromise ||= fetch(input.dataset.index).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).catch(e => { indexPromise = null; throw e; });
      const posts = await indexPromise; if (sequence !== current) return;
      const words = query.split(/\s+/);
      const matches = posts.filter(post => words.every(word => `${post.title} ${post.content} ${post.tags.join(' ')} ${post.categories.join(' ')}`.toLocaleLowerCase().includes(word)));
      for (const post of matches) {
        const row = document.createElement('article'); row.className = 'post-row';
        const meta = document.createElement('p'); meta.className = 'eyebrow'; meta.textContent = post.date;
        const title = document.createElement('h2'), link = document.createElement('a'); link.href = post.url; link.textContent = post.title; title.append(link);
        const excerpt = document.createElement('p'); const start = Math.max(0, post.content.toLocaleLowerCase().indexOf(words[0]) - 45); excerpt.textContent = `${start ? '…' : ''}${post.content.slice(start, start + 190)}…`;
        row.append(meta, title, excerpt); results.append(row);
      }
      all.hidden = true; results.hidden = false; status.textContent = matches.length ? `找到 ${matches.length} 篇文章` : '没有匹配文章，试试其他关键词。';
    } catch { if (sequence === current) status.textContent = '搜索暂时不可用，请浏览下方完整文章列表。'; }
  });
}
