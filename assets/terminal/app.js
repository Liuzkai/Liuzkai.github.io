'use strict';
const $ = s => document.querySelector(s);
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const external = (url, label) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label}<span aria-hidden="true">↗</span></a>`;
function renderCard(p,i){
 const media = p.image ? `<button type="button" class="project-image" data-preview="${esc(p.name)}" aria-label="放大 ${esc(p.title)} 的预览"><img src="${esc(p.image)}" alt="${esc(p.imageAlt)}" loading="lazy" width="1165" height="747" style="object-position:${p.position||'top'}"><span class="preview-label">${esc(p.imageLabel)}</span><span class="expand-icon" aria-hidden="true">↗</span></button>` : `<div class="project-image"><div class="code-art ${p.name==='ClockNode'?'clock':''}"><span class="code-heading">${esc(p.artKicker)}</span><strong>${esc(p.artText)}</strong><p>${esc(p.artSub)}</p><div class="code-lines" aria-hidden="true">${'<i></i>'.repeat(10)}</div></div><span class="preview-label">项目字标 · 非界面截图</span></div>`;
 return `<article class="project-card reveal" data-category="${p.group}"><div class="card-topline"><span class="file-id">${String(i+1).padStart(2,'0')} / ${esc(p.name.toUpperCase())}</span><span class="file-type">${esc(p.group.toUpperCase())} ↗</span></div>${media}<div class="card-body"><div class="card-kicker"><span>${esc(p.category)}</span><span>${esc(p.status)}</span></div><h3>${esc(p.title)}</h3><p>${esc(p.cardDescription||p.descriptionZh)}</p><div class="card-links">${p.liveUrl?external(p.liveUrl,'打开作品'):''}${external(p.url,p.name==='GameDevEveryday'?'阅读笔记':'查看仓库')}</div></div></article>`;
}
$('#projects').innerHTML=SELECTED.map(renderCard).join('');
$('#total-count').textContent=SELECTED.length;
function applyFilter(filter){
 document.querySelectorAll('[data-filter]').forEach(b=>{const active=b.dataset.filter===filter;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
 let count=0;document.querySelectorAll('.project-card').forEach(card=>{card.hidden=filter!=='all'&&card.dataset.category!==filter;if(!card.hidden)count++;});
 $('.result-status').textContent=`显示 ${count} 个精选项目`;
}
document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>applyFilter(b.dataset.filter)));
document.querySelectorAll('[data-select]').forEach(a=>a.addEventListener('click',()=>applyFilter(a.dataset.select)));

const directory = [...PROJECTS].sort((a,b)=>{const order={'目录':0,'精选':1,'练习与归档':2};return order[a.tier]-order[b.tier]||a.name.localeCompare(b.name);});
function renderDirectory(){
 const q=$('#search').value.trim().toLocaleLowerCase();
 const rows=directory.filter(p=>`${p.name} ${p.descriptionZh} ${p.tags.join(' ')} ${p.category} ${p.status}`.toLocaleLowerCase().includes(q));
 $('#project-directory').innerHTML=rows.map((p,i)=>`<a class="directory-item" href="${esc(p.liveUrl||p.url)}" target="_blank" rel="noopener noreferrer"><span class="row-no" aria-hidden="true">${p.tier==='练习与归档'?'·':'⌑'}</span><h3>${esc(p.name)}</h3><p>${esc(p.descriptionZh)}</p><span class="row-category">${esc(p.status)}</span><span class="row-arrow" aria-hidden="true">↗</span></a>`).join('');
 $('#directory-count').textContent=`${String(rows.length).padStart(2,'0')} PROJECTS`;
 $('#no-results').hidden=rows.length>0;
}
$('#search').addEventListener('input',renderDirectory);renderDirectory();
const dialog=$('#preview-dialog');let lastPreviewButton;
document.querySelectorAll('[data-preview]').forEach(button=>button.addEventListener('click',()=>{
 const p=SELECTED.find(p=>p.name===button.dataset.preview);if(!p)return;
 lastPreviewButton=button;$('#preview-title').textContent=p.title;$('#preview-caption').textContent=p.imageLabel+' · 2026.10.11';$('#preview-image').src=p.image;$('#preview-image').alt=p.imageAlt;$('#preview-source').href=p.imageSource||p.url;dialog.showModal();document.body.classList.add('modal-open');$('#close-preview').focus();
}));
$('#close-preview').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
dialog.addEventListener('close',()=>{document.body.classList.remove('modal-open');lastPreviewButton?.focus();});

// Keyboard-first navigation, intentionally a navigator rather than a fake shell.
const commandDialog=$('#command-dialog');const commandInput=$('#command-input');let commandFocus=null;let commandIndex=0;
const commands=[{title:'博客 / 全文搜索',subtitle:'FIELD NOTES',url:'/blog/'},{title:'精选作品',subtitle:'SECTION 01',url:'#work'},{title:'项目索引',subtitle:'SECTION 02',url:'#directory'},{title:'关于 Zhongkai',subtitle:'SECTION 03',url:'#about'},...PROJECTS.map(p=>({title:p.name,subtitle:p.category,url:p.liveUrl||p.url,search:p.tags.join(' ')+' '+p.descriptionZh}))];
function renderCommands(){
 const q=commandInput.value.trim().toLowerCase();const results=commands.filter(c=>(c.title+' '+c.subtitle+' '+(c.search||'')).toLowerCase().includes(q)).slice(0,9);commandIndex=0;
 $('#command-results').innerHTML=results.length?results.map((c,i)=>`<a href="${esc(c.url)}" ${(c.url.startsWith('#')||c.url.startsWith('/'))?'':'target="_blank" rel="noopener noreferrer"'} class="${i===0?'selected':''}"><span>${esc(c.title)}</span><span>${esc(c.subtitle)} ↗</span></a>`).join(''):'<p class="command-empty">没有匹配的项目。</p>';
 $('#command-results').querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{commandDialog.close();}));
}
function openCommands(){if(dialog.open)dialog.close();commandFocus=document.activeElement;commandInput.value='';renderCommands();commandDialog.showModal();document.body.classList.add('modal-open');commandInput.focus();}
$('.command-trigger').addEventListener('click',openCommands);$('#close-command').addEventListener('click',()=>commandDialog.close());commandInput.addEventListener('input',renderCommands);
commandDialog.addEventListener('close',()=>{document.body.classList.remove('modal-open');commandFocus?.focus();});
commandDialog.addEventListener('click',e=>{if(e.target===commandDialog){const r=commandDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)commandDialog.close();}});
commandDialog.addEventListener('keydown',e=>{
 const links=[...$('#command-results').querySelectorAll('a')];if(!links.length)return;
 if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();commandIndex=(commandIndex+(e.key==='ArrowDown'?1:-1)+links.length)%links.length;links.forEach((a,i)=>a.classList.toggle('selected',i===commandIndex));links[commandIndex].scrollIntoView({block:'nearest'});}
 if(e.key==='Enter'&&e.target===commandInput){e.preventDefault();links[commandIndex].click();}
});
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(commandDialog.open)commandDialog.close();else openCommands();}});
let scrollPending=false;
function updateProgress(){const max=document.documentElement.scrollHeight-window.innerHeight;$('.scroll-progress').style.transform=`scaleX(${max>0?Math.min(1,Math.max(0,window.scrollY/max)):0})`;scrollPending=false;}
window.addEventListener('scroll',()=>{if(!scrollPending){scrollPending=true;requestAnimationFrame(updateProgress);}},{passive:true});window.addEventListener('resize',updateProgress,{passive:true});updateProgress();
