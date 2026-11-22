'use client';
import {useState} from 'react';
export function DeliberationLink({id}:{id:string}){
 const [copied,setCopied]=useState(false);
 const path='/deliberacoes/'+encodeURIComponent(id);
 const copy=async()=>{try{await navigator.clipboard.writeText(window.location.origin+path);setCopied(true)}catch{setCopied(false)}};
 return <div className="action-row"><code style={{overflowWrap:'anywhere'}}>{path}</code><button type="button" className="button outline" onClick={copy}>{copied?'Link copiado!':'Copiar link do formulário'}</button><a className="button outline" href={path} target="_blank" rel="noopener noreferrer">Abrir em nova aba</a></div>;
}