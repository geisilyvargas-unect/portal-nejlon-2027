/* Títulos dinâmicos: mantém a camada gráfica sincronizada sem copiar espaços do layout. */
(()=>{'use strict';const selector='.intro h1,.i-hero h1,.idealize-banner h1,.wa-hero h1,.workhead h2,.panel h2,.panel h3,.ej-directory-card h3,.wa-panel h2,.idealize-shell h2,.i-section h2,.main h1,.main h2,.main h3';
function sync(){document.querySelectorAll(selector).forEach(el=>{const label=(el.innerText||el.textContent||'').trim().replace(/\s+/g,' ').toLocaleUpperCase('pt-BR');if(!label)return;el.classList.add('nejlon-layer-title');if(el.dataset.titleLayer!==label)el.dataset.titleLayer=label})}
let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;sync()})}
function start(){sync();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,characterData:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();