'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {useEffect} from 'react';
import {createClient} from '@/lib/supabase/browser';
export function CopyButton({value,label='Copiar',className='copy'}:{value:string;label?:string;className?:string}){
 const [copied,setCopied]=useState(false);
 async function copy(){try{await navigator.clipboard.writeText(value);setCopied(true);}catch{window.prompt('Copie o texto:',value);}}
 return <button type="button" className={className} onClick={copy}>{copied?'Copiado ✓':label}</button>;
}
export function ReportActions({content,filename}:{content:string;filename:string}){
 function download(){const blob=new Blob([content],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);}
 return <div className="action-row no-print"><CopyButton value={content} label="Copiar relatório"/><button type="button" onClick={download}>Exportar .txt</button><button className="primary" type="button" onClick={()=>window.print()}>Salvar em PDF / imprimir</button></div>;
}
/** Escuta novas respostas para a PRESCON não precisar recarregar as pendências manualmente. */
export function RealtimePending(){const router=useRouter();useEffect(()=>{const supabase=createClient(); const channel=supabase.channel('pendencias-live').on('postgres_changes',{event:'*',schema:'public',table:'responses'},()=>router.refresh()).subscribe();const refresh=()=>router.refresh();window.addEventListener('focus',refresh);const interval=window.setInterval(refresh,30000);return()=>{window.clearInterval(interval);window.removeEventListener('focus',refresh);supabase.removeChannel(channel);};},[router]);return <span className="badge lime">Atualização automática ativa</span>;}
