/* NEJLON UI: controle de aparência coerente entre todas as páginas. */
(() => {
'use strict';
const storageKey='nejlon.ui.theme.v1';
const root=document.documentElement;
const query=window.matchMedia?.('(prefers-color-scheme: dark)');
let preference='dark';
try {const v=localStorage.getItem(storageKey);if(['light','dark','red'].includes(v))preference=v;}catch{}
const resolved=()=>preference;
const names={light:'Branco',dark:'Preto',red:'Vermelho'};
function apply(){
 const theme=resolved();root.dataset.theme=theme;
 root.style.colorScheme=theme==='light'?'light':'dark';
 document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#000000':theme==='red'?'#ff0000':'#ffffff');
 document.querySelectorAll('.ux-theme-switch').forEach(b=>{
  b.innerHTML='<span class="ux-theme-icon" aria-hidden="true">◐</span><span>Aparência: '+names[preference]+'</span>';
  b.setAttribute('aria-label','Aparência: '+names[preference]+'. Clique para alternar entre claro e escuro.');
  b.setAttribute('title','Alterar tema; preferência atual: '+names[preference]);
  b.setAttribute('data-active-theme',theme);
  document.querySelectorAll('[data-theme-choice]').forEach(choice=>{choice.setAttribute('aria-pressed',String(choice.dataset.themeChoice===theme));choice.classList.toggle('selected',choice.dataset.themeChoice===theme)});
 });
}
function toggle(){
 preference=preference==='light'?'dark':'light';
 try{localStorage.setItem(storageKey,preference);}catch{}
 apply();
}
function mount(){
 const control=document.createElement('button');
 control.type='button';control.className='ux-theme-switch';
 control.setAttribute('aria-haspopup','true');
 control.setAttribute('aria-expanded','false');
 const picker=document.createElement('div');picker.className='ux-theme-picker';picker.hidden=true;picker.setAttribute('role','group');picker.setAttribute('aria-label','Escolha a aparência do portal');
 picker.innerHTML=[['dark','Preto','☾'],['light','Branco','☀'],['red','Vermelho','●']].map(([key,label,icon])=>'<button type="button" class="ux-theme-choice" data-theme-choice="'+key+'">'+icon+' '+label+'</button>').join('');
 control.addEventListener('click',()=>{picker.hidden=!picker.hidden;control.setAttribute('aria-expanded',String(!picker.hidden))});
 picker.addEventListener('keydown',event=>{if(event.key==='Escape'){picker.hidden=true;control.setAttribute('aria-expanded','false');control.focus()}});
 picker.addEventListener('click',event=>{const key=event.target.closest('[data-theme-choice]')?.dataset.themeChoice;if(!['dark','light','red'].includes(key))return;preference=key;try{localStorage.setItem(storageKey,key)}catch{}apply();picker.hidden=true;control.setAttribute('aria-expanded','false')});
 document.addEventListener('click',event=>{if(!control.contains(event.target)&&!picker.contains(event.target)){picker.hidden=true;control.setAttribute('aria-expanded','false')}});
 const top=document.querySelector('.top-actions');
 const utility=document.querySelector('.i-top,.wa-nav,.idealize-top,.automation-top');
 const wrapper=document.createElement('div');wrapper.className='ux-theme-container';wrapper.append(control,picker);
 if(top){top.prepend(wrapper)}
 else if(utility){utility.append(wrapper)}
 else{document.body.prepend(wrapper)}
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

window.addEventListener('storage',event=>{if(event.key===storageKey){preference=['light','dark','red'].includes(event.newValue)?event.newValue:'dark';apply()}});
})();