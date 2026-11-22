'use client';
import {useEffect,useState} from 'react';
type Sheet={name:string;rows:string[][]};
declare global{interface Window{XLSX?:{read:(buf:ArrayBuffer,options:{type:string})=>{SheetNames:string[];Sheets:Record<string,unknown>};utils:{sheet_to_json:(sheet:unknown,opts:Record<string,unknown>)=>unknown[][]}}}}
function parseCsv(text:string){const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/);return lines.filter(Boolean).map(line=>line.split(/[;,\t]/).map(v=>v.trim()));}
export function PfWorkbookViewer({fileUrl,fileName}:{fileUrl:string;fileName:string}){
 const [sheets,setSheets]=useState<Sheet[]>([]),[active,setActive]=useState(0),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 useEffect(()=>{let cancelled=false;
 async function load(){
  try{
   const response=await fetch(fileUrl,{credentials:'same-origin',cache:'no-store'});
   if(!response.ok)throw Error('Não foi possível carregar o PF. Verifique seu acesso.');
   const buffer=await response.arrayBuffer();let result:Sheet[];
   if(fileName.toLowerCase().endsWith('.csv'))result=[{name:'Planilha CSV',rows:parseCsv(new TextDecoder().decode(buffer))}];
   else{
    if(!window.XLSX)await new Promise<void>((resolve,reject)=>{const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';script.onload=()=>resolve();script.onerror=()=>reject(Error('Biblioteca XLSX indisponível. Baixe o arquivo original.'));document.head.append(script)});
    if(!window.XLSX)throw Error('Leitor de planilhas indisponível.');
    const wb=window.XLSX.read(buffer,{type:'array'});
    result=wb.SheetNames.map(name=>({name,rows:window.XLSX!.utils.sheet_to_json(wb.Sheets[name],{header:1,defval:'',raw:false}).map(row=>row.map(v=>String(v??'')))}));
   }
   if(!cancelled){setSheets(result);setLoading(false)}
  }catch(e){if(!cancelled){setError(e instanceof Error?e.message:'Erro ao abrir planilha');setLoading(false)}}
 }
 load();return()=>{cancelled=true};
 },[fileUrl,fileName]);
 const sheet=sheets[active],rows=sheet?.rows||[],cols=Math.max(0,...rows.map(r=>r.length));
 const letter=(n:number)=>{let s='';for(n++;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s};
 return <section className="panel"><h2>Visualizar a planilha do PF</h2><p className="muted">Navegue pelas abas, linhas e colunas. A visualização não permite editar ou enviar votos.</p>{loading&&<p>Carregando planilha...</p>}{error&&<p role="alert">{error}</p>}{sheet&&<><div className="action-row" role="tablist" aria-label="Abas da planilha">{sheets.map((sh,i)=><button type="button" role="tab" aria-selected={i===active} key={i} className={i===active?'primary':'button outline'} onClick={()=>setActive(i)}>{sh.name}</button>)}</div><div style={{maxHeight:'65vh',overflow:'auto',marginTop:16}} tabIndex={0} role="region" aria-label={'Planilha '+sheet.name}><table><thead><tr><th></th>{Array.from({length:cols},(_,i)=><th key={i}>{letter(i)}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={i}><th>{i+1}</th>{Array.from({length:cols},(_,j)=><td key={j}>{row[j]||''}</td>)}</tr>)}</tbody></table></div><p className="muted small">A grade mostra valores das células, mas não reproduz necessariamente fórmulas, gráficos, mesclagens e formatação do Excel. Baixe o XLSX para consultar o original.</p></>}</section>;
}
