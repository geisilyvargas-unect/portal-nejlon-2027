import type {CSSProperties} from 'react';
import {directoryBySlug} from '@/lib/ej-directory';
/** Sprite das 29 logos extraído diretamente do Portfólio Unificado NEJLON. */
export function EjBrand({slug,name,large=false}:{
 slug:string;name:string;large?:boolean
}){
 const e=directoryBySlug.get(slug);
 if(!e)return <span className="ej-identity-icon" aria-label={'Empresa júnior '+name}>{name.slice(0,3)}</span>;
 const c=e.logoIndex%5,r=Math.floor(e.logoIndex/5);
 const style:CSSProperties={
  backgroundImage:"url('/ej-logos.webp')",
  backgroundSize:'500% 600%',
  backgroundPosition:(c*25)+'% '+(r*20)+'%'
 };
 return <span className={'ej-identity-icon'+(large?' large':'')} style={style}
  role="img" aria-label={'Logo da '+name}/>;
}
