'use client';
import {Download} from 'lucide-react';
/** Exportar dados que já passaram pela autorização de acesso do servidor. */
export function CsvExport({filename,rows}:{filename:string;rows:(string|number|null|undefined)[][]}){
 const download=()=>{
  const cell=(v:string|number|null|undefined)=>{
   const s=String(v??'');
   const guarded=/^[=+\-@\t\r]/.test(s)?"'"+s:s;
   return '"'+guarded.replace(/"/g,'""')+'"';
  };
  const csv='\uFEFF'+rows.map(row=>row.map(cell).join(';')).join('\r\n')+'\r\n';
  const uri=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=uri;a.download=filename;a.click();
  setTimeout(()=>URL.revokeObjectURL(uri),1000);
 };
 return <button type="button" onClick={download} className="button outline">
  <Download size={16}/> Exportar respostas CSV
 </button>;
}
