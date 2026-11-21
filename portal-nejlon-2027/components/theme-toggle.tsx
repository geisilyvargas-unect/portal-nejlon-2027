'use client';
import {useEffect,useState} from 'react';
import {Moon,Sun} from 'lucide-react';
export function ThemeToggle(){
 const [theme,setTheme]=useState<'dark'|'light'>('dark');
 useEffect(()=>{
   setTheme(document.documentElement.dataset.theme==='light'?'light':'dark');
 },[]);
 function toggle(){
  const next=theme==='dark'?'light':'dark';
  document.documentElement.dataset.theme=next;
  localStorage.setItem('nejlon-theme',next);
  setTheme(next);
 }
 return <button type="button" className="theme-toggle outline" onClick={toggle}
  aria-label={'Ativar modo '+(theme==='dark'?'claro':'escuro')} title={'Mudar para modo '+(theme==='dark'?'claro':'escuro')}>
  {theme==='dark'?<Sun size={16} aria-hidden/>:<Moon size={16} aria-hidden/>}
  <span>Modo {theme==='dark'?'claro':'escuro'}</span>
 </button>;
}
