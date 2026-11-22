'use client';
import {useEffect,useState} from 'react';
import {Moon,Sun} from 'lucide-react';
type Theme='dark'|'light';
const options:{value:Theme;label:string}[]=[{value:'dark',label:'Preto'},{value:'light',label:'Branco'}];
export function ThemeToggle(){
 const [theme,setTheme]=useState<Theme>('dark');
 useEffect(()=>{const saved=document.documentElement.dataset.theme;setTheme(saved==='light'?'light':'dark');
 const sync=(event:StorageEvent)=>{if(event.key==='nejlon-theme'){const choice=event.newValue;setTheme(choice==='light'?'light':'dark');}};
 window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);},[]);
 function choose(next:Theme){document.documentElement.dataset.theme=next;localStorage.setItem('nejlon-theme',next);setTheme(next);}
 return <div className="theme-select" role="group" aria-label="Aparência do portal">
  {options.map(({value,label})=><button type="button" key={value} className={'theme-option'+(theme===value?' selected':'')} onClick={()=>choose(value)} aria-pressed={theme===value} title={'Tema '+label}>
   {value==='dark'?<Moon size={15} aria-hidden/>:<Sun size={15} aria-hidden/>}<span>{label}</span>
  </button>)}
 </div>;
}
