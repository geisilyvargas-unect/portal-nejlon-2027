/* Dupla camada tipográfica: cópia visual fiel ao HTML, incluindo quebras de linha. */
(()=>{'use strict';
const selector='h1,h2,h3,.page-title,.section-title';
function sync(){
 document.querySelectorAll(selector).forEach(el=>{
  if(el.closest('.nejlon-title-back,.sr-only,[aria-hidden="true"]'))return;
  if(el.matches('.sr-only')||el.closest('svg,button,nav'))return;
  const existing=el.querySelector(':scope > .nejlon-title-back');
  const html=Array.from(el.childNodes).filter(n=>n!==existing).map(n=>n.nodeType===1?n.outerHTML:n.textContent).join('');
  if(!html.trim())return;
  el.classList.add('nejlon-layer-title');
  if(existing&&existing.dataset.source===html)return;
  const layer=existing||document.createElement('span');
  layer.className='nejlon-title-back';layer.setAttribute('aria-hidden','true');
  layer.dataset.source=html;layer.innerHTML=html;
  if(!existing)el.prepend(layer);
 });
}
let queued=false;
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;sync()})}
function start(){sync();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,characterData:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();