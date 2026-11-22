/* NEJLON: títulos sem cópias decorativas. Mantém o texto original e a semântica. */
(()=>{'use strict';
function clean(){
 document.querySelectorAll('.nejlon-layer-title').forEach(el=>{
  el.querySelectorAll(':scope > .nejlon-title-back').forEach(back=>back.remove());
  const front=el.querySelector(':scope > .nejlon-title-front');
  if(front)front.replaceWith(...Array.from(front.childNodes));
  el.classList.remove('nejlon-layer-title');
  el.removeAttribute('data-title-layer');
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',clean,{once:true});else clean();
})();
