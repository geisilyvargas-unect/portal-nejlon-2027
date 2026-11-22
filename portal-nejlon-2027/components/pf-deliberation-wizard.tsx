'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {createDeliberationFromPf} from '@/app/actions';
type Scenario={title:string;description:string;material_url:string};
declare global{interface Window{XLSX?:{read:(buffer:ArrayBuffer,options:{type:string})=>{SheetNames:string[];Sheets:Record<string,unknown>};utils:{sheet_to_json:(sheet:unknown,opts:Record<string,unknown>)=>unknown[][]}}}}
export function PfDeliberationWizard(){
 const router=useRouter();
 const [file,setFile]=useState<File|null>(null),[scenarios,setScenarios]=useState<Scenario[]>([]),[title,setTitle]=useState(''),[due,setDue]=useState(''),[loading,setLoading]=useState(false),[error,setError]=useState(''),[ready,setReady]=useState(false);
 async function readFile(selected:File){
  setFile(selected);setError('');setReady(false);setScenarios([]);
  if(selected.size>15*1024*1024||!(/\.(xlsx|xls|csv)$/i.test(selected.name))){setError('Envie XLSX, XLS ou CSV com até 15 MB.');return}
  setLoading(true);
  try{
   const buffer=await selected.arrayBuffer();let tabs:{name:string;rows:string[][]}[]=[];
   if(selected.name.toLowerCase().endsWith('.csv'))tabs=[{name:'Planejamento',rows:new TextDecoder().decode(buffer).split(/\r?\n/).map(l=>l.split(/[;,\t]/))}];
   else{
    if(!window.XLSX)await new Promise<void>((resolve,reject)=>{const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';script.onload=()=>resolve();script.onerror=()=>reject(Error('Não foi possível carregar o leitor XLSX.'));document.head.append(script)});
    if(!window.XLSX)throw Error('Leitor XLSX indisponível.');
    const wb=window.XLSX.read(buffer,{type:'array'});
    tabs=wb.SheetNames.map(name=>({name,rows:window.XLSX!.utils.sheet_to_json(wb.Sheets[name],{header:1,defval:'',raw:false}).map(row=>row.map(c=>String(c??'')))}));
   }
   const candidates=tabs.filter(tab=>/cen[aá]rio|(^|\W)c\s*\d+|rateio|proposta|op[cç][aã]o/i.test(tab.name));
   const selectedTabs=candidates.length?candidates:tabs.filter(tab=>tab.rows.some(r=>r.some(c=>c.trim())));
   if(!selectedTabs.length)throw Error('A planilha não contém dados legíveis.');
   setScenarios(selectedTabs.slice(0,12).map((tab,i)=>({title:tab.name.length>=3?tab.name.slice(0,180):'Cenário '+(i+1),description:'Analise a aba '+tab.name+' do Planejamento Financeiro antes de votar.',material_url:''})));
   setTitle(selected.name.replace(/\.(xlsx|xls|csv)$/i,'').replace(/[_-]/g,' ').slice(0,250));
   setReady(true);
  }catch(e){setError(e instanceof Error?e.message:'Erro ao ler arquivo')}finally{setLoading(false)}
 }
 function change(index:number,key:keyof Scenario,value:string){setScenarios(old=>old.map((s,i)=>i===index?{...s,[key]:value}:s))}
 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(!file||!ready||!scenarios.length)return;
  setLoading(true);setError('');
  const form=new FormData();form.set('pf_file',file);form.set('title',title);form.set('due_at',due);form.set('scenarios_json',JSON.stringify(scenarios));
  try{const result=await createDeliberationFromPf(form);if(result?.id)router.push('/deliberacoes/'+result.id);else setError('Não foi possível criar a deliberação.')}catch(e){setError(e instanceof Error?e.message:'Erro ao salvar deliberação')}finally{setLoading(false)}
 }
 return <form className="fieldset" onSubmit={submit}><p className="muted">Envie a planilha recebida da organização. O portal sugere perguntas a partir das abas e você confere tudo antes de disponibilizar o link.</p>
 <label>1. Adicionar Planejamento Financeiro (XLSX, XLS ou CSV)<input type="file" accept=".xlsx,.xls,.csv" required onChange={e=>{const f=e.target.files?.[0];if(f)void readFile(f)}}/></label>
 {loading&&<p role="status">Processando...</p>}{error&&<p role="alert" style={{color:'#c33237'}}>{error}</p>}
 {ready&&<><label>2. Título da deliberação<input value={title} onChange={e=>setTitle(e.target.value)} required minLength={3} maxLength={250}/></label>
 <label>Prazo de resposta<input type="datetime-local" value={due} onChange={e=>setDue(e.target.value)} required/></label>
 <div><strong>3. Revise as perguntas geradas ({scenarios.length})</strong><p className="muted">O sistema identificou abas relevantes. Confira se cada aba representa um item que deve ser votado. Projeções pessimista, realista e otimista não são votos.</p>
 {scenarios.map((s,i)=><div key={i} style={{border:'1px solid #ccd',borderRadius:10,padding:14,margin:'12px 0'}}><label>Cenário {i+1}<input required minLength={3} maxLength={180} value={s.title} onChange={e=>change(i,'title',e.target.value)}/></label><label>Contexto da pergunta<textarea rows={2} value={s.description} onChange={e=>change(i,'description',e.target.value)}/></label><button type="button" onClick={()=>setScenarios(old=>old.filter((_,j)=>j!==i))}>Remover cenário</button></div>)}
 <button type="button" onClick={()=>setScenarios(old=>[...old,{title:'Novo cenário',description:'',material_url:''}])} disabled={scenarios.length>=12}>+ Adicionar cenário</button></div>
 <p className="muted">A deliberação será criada como rascunho. A PRESCON publica depois da conferência; o relatório será calculado a partir dos votos recebidos.</p>
 <button className="primary" disabled={loading||!scenarios.length||!due} type="submit">Criar deliberação e anexar PF</button></>}
 </form>;
}