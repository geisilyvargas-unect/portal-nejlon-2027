/* Portfólio NEJLON: camadas reais, frente acima do relevo vermelho. */
(()=>{'use strict';
const selector='h1,h2,h3,.page-title,.section-title';
function sync(){
 document.querySelectorAll(selector).forEach(el=>{
  if(el.closest('.nejlon-title-back,.nejlon-title-front,.sr-only,[aria-hidden="true"],nav,button'))return;
  if(el.classList.contains('sr-only'))return;
  let front=el.querySelector(':scope > .nejlon-title-front');
  if(!front){
   front=document.createElement('span');front.className='nejlon-title-front';
   while(el.firstChild)front.appendChild(el.firstChild);
   el.appendChild(front);el.classList.add('nejlon-layer-title');
  }
  const html=front.innerHTML;
  if(!html.trim())return;
  let back=el.querySelector(':scope > .nejlon-title-back');
  if(!back){back=document.createElement('span');back.className='nejlon-title-back';back.setAttribute('aria-hidden','true');el.insertBefore(back,front)}
  if(back.dataset.source!==html){back.dataset.source=html;back.innerHTML=html}
 });
}
let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;sync()})}
function start(){sync();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,characterData:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();