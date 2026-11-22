/* NEJLON UI: controle de aparência coerente entre todas as páginas. */
(() => {
'use strict';
const storageKey='nejlon.ui.theme.v1';
const root=document.documentElement;
const query=window.matchMedia?.('(prefers-color-scheme: dark)');
let preference='dark';
try {const v=localStorage.getItem(storageKey);if(['light','dark','system'].includes(v))preference=v;}catch{}
const resolved=()=>preference==='system'?(query?.matches?'dark':'light'):preference;
const names={light:'Claro',dark:'Escuro',system:'Sistema'};
function apply(){
 const theme=resolved();root.dataset.theme=theme;
 root.style.colorScheme=theme;
 document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#19191b':'#f7f5f2');
 document.querySelectorAll('.ux-theme-switch').forEach(b=>{
  b.innerHTML='<span class="ux-theme-icon" aria-hidden="true">'+(theme==='dark'?'☾':'☀')+'</span><span>Tema '+names[preference]+'</span>';
  b.setAttribute('aria-label','Aparência: '+names[preference]+'. Clique para alternar entre claro e escuro.');
  b.setAttribute('title','Alterar tema; preferência atual: '+names[preference]);
  b.setAttribute('aria-pressed',String(theme==='dark'));
 });
}
function toggle(){
 preference=resolved()==='dark'?'light':'dark';
 try{localStorage.setItem(storageKey,preference);}catch{}
 apply();
}
function mount(){
 const control=document.createElement('button');
 control.type='button';control.className='ux-theme-switch';
 control.addEventListener('click',toggle);
 const top=document.querySelector('.top-actions');
 const utility=document.querySelector('.i-top,.wa-nav,.idealize-top');
 if(top){top.prepend(control)}
 else if(utility){utility.append(control)}
 else{document.body.prepend(control)}
 if(!document.querySelector('.ux-skip')){
  const target=document.querySelector('main');
  if(target){
   if(!target.id)target.id='conteudo';
   const skip=document.createElement('a');
   skip.className='ux-skip';skip.href='#'+target.id;skip.textContent='Pular para o conteúdo';
   document.body.prepend(skip);
  }
 }
 apply();
}
apply();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
query?.addEventListener?.('change',()=>{if(preference==='system')apply()});
window.addEventListener('storage',event=>{if(event.key===storageKey){preference=['light','dark','system'].includes(event.newValue)?event.newValue:'dark';apply()}});
})();