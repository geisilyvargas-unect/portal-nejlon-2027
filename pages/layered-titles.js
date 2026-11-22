/* Sincroniza o texto duplicado de títulos dinâmicos sem modificar seu conteúdo. */
(()=>{'use strict';const selector='.intro h1,.workhead h2,.panel h3,.ej-directory-card h3,.wa-panel h2,.idealize-shell h2';
function sync(){document.querySelectorAll(selector).forEach(el=>{const label=(el.innerText||el.textContent||'').trim().replace(/\s+/g,' ').toLocaleUpperCase('pt-BR');if(!label)return;el.classList.add('nejlon-layer-title');if(el.dataset.titleLayer!==label)el.dataset.titleLayer=label})}
let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;sync()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
function start(){sync();const observer=new MutationObserver(schedule);observer.observe(document.body,{childList:true,subtree:true,characterData:true});}
})();