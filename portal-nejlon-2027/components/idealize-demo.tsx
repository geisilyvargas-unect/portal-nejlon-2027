'use client';
import {useMemo,useState} from 'react';
import Link from 'next/link';
import {CalendarDays,ChevronDown,Download,FileSpreadsheet,Info,MessageSquareText,Send} from 'lucide-react';
import {EJS_DEMO} from '@/lib/demo-ejs';
import {financialMeasure,money,PROJECTION_KEYS,PROJECTION_LABELS,type ProjectionKey,type FinancialAlternative} from '@/lib/financial-plan';
import idealizeRaw from '@/lib/idealize-data.json';
import votesRaw from '@/lib/idealize-responses.json';

type DetailAlternative=FinancialAlternative&{
 id:string;scenarioKey:string;label:string;venue:string;title:string;
 ticketPrices:number[];ticketCounts:Record<ProjectionKey,number[]>;
 rates:{city:string;km:number;rate:number}[];
 rateioPrices:number[][];
 expenseLines:{coordination:string;description:string;details:string;unitValue:number|null;values:number[]}[];
};
type Answer={position:string;justification:string;suggestions:string;caveats:string};
const plan=idealizeRaw as {title:string;source:string;alternatives:DetailAlternative[]};
const votes=votesRaw as ReadonlyArray<{
 ej:string;fullName:string;updatedAt:string;
 answers:ReadonlyArray<{scenarioKey:string;position:string;justification:string;suggestions:string;caveats:string}>;
 clarity:number;difficulty:number;improvements:string;
}>;
const choices=[
 {value:'favorable',label:'Aprova',desc:'Concordo integralmente com o que foi apresentado.'},
 {value:'suggestions',label:'Aprova com sugestões',desc:'Concordo com a proposta e sugiro melhorias. Conta como aprovação.'},
 {value:'qualified',label:'Aprova com ressalvas',desc:'Aprovo desde que determinadas condições sejam atendidas. A PRESCON avaliará as ressalvas.'},
 {value:'against',label:'Reprova',desc:'Não aprovo a proposta; os motivos devem ser apresentados.'},
 {value:'abstention',label:'Abstem',desc:'Opto por não votar neste cenário.'}
] as const;
const initial=():Record<string,Answer>=>Object.fromEntries(plan.alternatives.map(a=>[a.scenarioKey,{position:'',justification:'',suggestions:'',caveats:''}]));
const countPosition=(key:string,p:string)=>votes.filter(v=>v.answers.some(a=>a.scenarioKey===key&&a.position===p)).length;
const makeCsv=(data:unknown[][])=>{
 const sanitize=(value:unknown)=>{
  const str=String(value??'');
  const guarded=/^[=+\-@\t\r]/.test(str)?"'"+str:str;
  return '"'+guarded.replace(/"/g,'""')+'"';
 };
 return '\uFEFF'+data.map(row=>row.map(sanitize).join(';')).join('\r\n')+'\r\n';
};
const outputCsv=(name:string,rows:unknown[][])=>{
 const url=URL.createObjectURL(new Blob([makeCsv(rows)],{type:'text/csv;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download=name;a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
};

export function IdealizeDemo(){
 const [projection,setProjection]=useState<ProjectionKey>('realistic');
 const [rateio,setRateio]=useState(true);
 const [name,setName]=useState('');
 const [ej,setEj]=useState('unect');
 const [answers,setAnswers]=useState<Record<string,Answer>>(initial);
 const [clarity,setClarity]=useState('');
 const [difficulty,setDifficulty]=useState('');
 const [improvements,setImprovements]=useState('');
 const [submitted,setSubmitted]=useState(false);
 const [lastSubmission,setLastSubmission]=useState<null|{name:string;ej:string;answers:Record<string,Answer>;clarity:string;difficulty:string;improvements:string;timestamp:string}>(null);
 const selected=useMemo(()=>plan.alternatives.map(a=>({a,...financialMeasure(a,projection,rateio)})),[projection,rateio]);
 const change=(key:string,field:keyof Answer,value:string)=>{setSubmitted(false);setAnswers(prev=>({...prev,[key]:{...prev[key],[field]:value}}));};
 const downloadVoteCsv=()=>{
  const header=['Carimbo de data/hora','Nome Completo','EJ','Sobre o [C1] CENÁRIO 1, você...',
   'Justifique a sua decisão e insira seus pontos: [C1]','Sugestões [C1]','Ressalvas [C1]',
   'Sobre o [C2] CENÁRIO 2, você...','Justifique a sua decisão e insira seus pontos: [C2]','Sugestões [C2]','Ressalvas [C2]',
   'O quão claro ficou as opções e as formas de votação?','O quanto você sentiu dificuldade na deliberação',
   'Como podemos melhorar?','Tipo de registro'];
  const labels=Object.fromEntries(choices.map(c=>[c.value,c.label]));
  const row=(item:{name:string;ej:string;answers:Record<string,Answer>;clarity:string|number;difficulty:string|number;improvements:string;timestamp:string})=>{
   const one=item.answers.c1,two=item.answers.c2;
   return [item.timestamp,item.name,item.ej,labels[one.position]||'',one.justification,one.suggestions,one.caveats,
    labels[two.position]||'',two.justification,two.suggestions,two.caveats,item.clarity,item.difficulty,item.improvements,
    'FICTÍCIO — DEMONSTRAÇÃO'];
  };
  const all=votes.map(v=>row({
   name:v.fullName,ej:v.ej,timestamp:v.updatedAt,clarity:v.clarity,difficulty:v.difficulty,improvements:v.improvements,
   answers:Object.fromEntries(v.answers.map(a=>[a.scenarioKey,a]))
  }));
  if(lastSubmission)all.push(row(lastSubmission));
  outputCsv('idealize-2026-respostas-ficticias.csv',[header,...all]);
 };
 return <div className="idealize-demo">
  <div className="idealize-hero">
   <div className="eyebrow">NEJLON 2027 • DELIBERAÇÃO ABERTA DE DEMONSTRAÇÃO</div>
   <h1>Planejamento Financeiro<br/><span>IDEALIZE 2026</span></h1>
   <p>Analise as duas propostas e conheça o formulário de votação do Conselho. Esta demonstração não envia votos institucionais.</p>
   <Link href="/login" className="button outline">← Voltar para a demonstração</Link>
  </div>
  <div className="notice">DADOS FICTÍCIOS: as {votes.length} respostas ilustrativas não representam posicionamentos reais. Os valores financeiros foram extraídos da planilha do IDEALIZE enviada.</div>
  <section className="panel idealize-panel">
   <div className="toolbar"><div>
    <div className="eyebrow">PROJEÇÕES FINANCEIRAS</div><h2>Comparativo de propostas</h2>
    <p className="muted small">Troque a projeção e a forma de cobrança. Os saldos são calculados automaticamente, sem alterar a votação.</p>
   </div><a href="/idealize-financial.csv" download className="button outline"><FileSpreadsheet size={16}/> Planilha em CSV</a></div>
   <div className="idealize-options">
    <div role="group" aria-label="Projeção financeira">{PROJECTION_KEYS.map(key=><button type="button" key={key}
      className={'idealize-option '+(key===projection?'active':'')}
      aria-pressed={key===projection} onClick={()=>setProjection(key)}>{PROJECTION_LABELS[key]}</button>)}</div>
    <label className="idealize-rateio"><input type="checkbox" checked={rateio} onChange={e=>setRateio(e.target.checked)}/> Considerar rateio dos ingressos</label>
   </div>
   <div className="idealize-comparison">
    {selected.map(({a,cost,revenue,balance,participants})=><article className="idealize-alternative" key={a.id}>
      <div className="idealize-alt-tag">{a.label}</div><h3>{a.venue}</h3>
      <div className="idealize-metrics">
       <div><span>Congressistas projetados</span><strong>{participants??'—'}</strong></div>
       <div><span>Despesas</span><strong>{money(cost)}</strong></div>
       <div><span>Entradas {rateio?'com':'sem'} rateio</span><strong>{money(revenue)}</strong></div>
       <div className={balance===null?'':balance<0?'negative':'positive'}><span>Saldo projetado</span><strong>{money(balance)}</strong></div>
      </div>
      <details className="idealize-details"><summary>Ver despesas e ingressos detalhados <ChevronDown size={14}/></summary>
       <div className="idealize-table-scroll"><table><thead><tr><th>Coordenação</th><th>Despesa</th><th>{PROJECTION_LABELS[projection]}</th></tr></thead>
        <tbody>{a.expenseLines.map((line,i)=><tr key={i}><td>{line.coordination}</td><td>{line.description}<small>{line.details}</small></td><td>{money(line.values[PROJECTION_KEYS.indexOf(projection)])}</td></tr>)}</tbody></table></div>
       <h4>Ingressos por lote (sem rateio)</h4>
       <div className="idealize-table-scroll"><table><thead><tr><th>Lote</th><th>Preço</th><th>Quantidade</th></tr></thead>
        <tbody>{a.ticketPrices.map((price,i)=><tr key={i}><td>{['Lote 1','Lote 2','Extra'][i]}</td><td>{money(price)}</td><td>{a.ticketCounts[projection][i]}</td></tr>)}</tbody></table></div>
       <h4>Rateio por localidade</h4>
       <div className="idealize-table-scroll"><table><thead><tr><th>Núcleo</th><th>Distância</th><th>Rateio da planilha</th><th>Ingresso 1º lote</th></tr></thead>
        <tbody>{a.rates.map((r,i)=><tr key={r.city}><td>{r.city}</td><td>{r.km} km</td><td>{(r.rate*100).toLocaleString('pt-BR',{maximumFractionDigits:2})}%</td><td>{money(a.rateioPrices[i][0])}</td></tr>)}</tbody></table></div>
      </details>
     </article>)}
   </div>
  </section>
  <section className="panel idealize-panel">
   <div className="toolbar"><div><div className="eyebrow">MODELO DE FORMULÁRIO 2026</div><h2>Deliberação do IDEALIZE</h2>
    <p className="muted small">Falaaaa, conselheiro pé vermelho! 👣❤️ Este formulário simula o modelo oficial de deliberação, com as cinco opções de voto.</p>
   </div><span className="badge blue"><CalendarDays size={14}/> ABERTA PARA SIMULAÇÃO</span></div>
   <details className="idealize-instructions" open><summary>Conheça as cinco possibilidades de votação</summary>
    <div className="idealize-guide">{choices.map(c=><div key={c.value}><strong>{c.label.toUpperCase()}</strong><p>{c.desc}</p></div>)}</div>
   </details>
   <form onSubmit={e=>{
    e.preventDefault();
    if(!plan.alternatives.every(a=>Boolean(answers[a.scenarioKey]?.position)))return;
    const snapshot={name,ej,answers:structuredClone(answers),clarity,difficulty,improvements,timestamp:new Date().toISOString()};
    setLastSubmission(snapshot);setSubmitted(true);
   }} className="idealize-form">
    <div className="idealize-form-grid"><label>Nome Completo *<input required value={name} onChange={e=>setName(e.target.value)} placeholder="Somente nome fictício para teste"/></label>
     <label>EJ *<select required value={ej} onChange={e=>setEj(e.target.value)}>{EJS_DEMO.map(e=><option value={e.slug} key={e.slug}>{e.name}</option>)}</select></label>
    </div>
    {plan.alternatives.map((alternative,index)=>{
     const ans=answers[alternative.scenarioKey];
     return <section className="idealize-vote-section" key={alternative.id}>
      <div className="eyebrow">[C{index+1}] CENÁRIO {index+1}</div><h3>{alternative.title}</h3>
      <p className="muted small">Considere as informações e despesas da alternativa {alternative.venue} apresentadas acima. Faça um posicionamento para este cenário.</p>
      <fieldset className="idealize-choice-field"><legend>Sobre o [C{index+1}] CENÁRIO {index+1}, você... *</legend>
       <div className="idealize-choice-grid">{choices.map(c=><label key={c.value} className={ans.position===c.value?'chosen':''}>
        <input type="radio" name={'vote-'+alternative.scenarioKey} required checked={ans.position===c.value} onChange={()=>change(alternative.scenarioKey,'position',c.value)}/>
        <span>{c.label}</span></label>)}</div>
      </fieldset>
      {ans.position&&ans.position!=='abstention'&&<label>Justifique a sua decisão e insira seus pontos: {ans.position==='against'?'*':'(opcional)'}
       <textarea required={ans.position==='against'} rows={3} value={ans.justification} onChange={e=>change(alternative.scenarioKey,'justification',e.target.value)}/></label>}
      {ans.position==='suggestions'&&<label>Sugestões de melhoria *<textarea required rows={3} value={ans.suggestions} onChange={e=>change(alternative.scenarioKey,'suggestions',e.target.value)} placeholder="Quais sugestões você gostaria que a PRESCON avaliasse?"/></label>}
      {ans.position==='qualified'&&<label>Ressalvas / condições para aprovação *<textarea required rows={3} value={ans.caveats} onChange={e=>change(alternative.scenarioKey,'caveats',e.target.value)} placeholder="Aprovo, desde que..."/></label>}
     </section>;
    })}
    <section className="idealize-vote-section"><div className="eyebrow">CONSIDERAÇÕES FINAIS</div><h3>Considerações finais</h3>
     <div className="idealize-form-grid"><label>O quão claro ficou as opções e as formas de votação? *
      <select required value={clarity} onChange={e=>setClarity(e.target.value)}><option value="">Selecione</option>{[0,1,2,3,4,5].map(n=><option key={n} value={n}>{n}{n===0?' — Nada claro':n===5?' — Muito claro':''}</option>)}</select></label>
      <label>O quanto você sentiu dificuldade na deliberação *
       <select required value={difficulty} onChange={e=>setDifficulty(e.target.value)}><option value="">Selecione</option>{[0,1,2,3,4,5].map(n=><option key={n} value={n}>{n}{n===0?' — Sem dificuldade':n===5?' — Muita dificuldade':''}</option>)}</select></label>
     </div>
     <label>Como podemos melhorar? (opcional)<textarea value={improvements} onChange={e=>setImprovements(e.target.value)} rows={3} maxLength={2000}/></label>
    </section>
    <div className="idealize-submit">
     <button type="submit" className="button primary"><Send size={16}/> Enviar voto de demonstração</button>
     <button type="button" className="button outline" onClick={downloadVoteCsv}><Download size={16}/> Exportar respostas CSV</button>
    </div>
    {submitted&&<div role="status" className="notice">
      <strong>Simulação concluída!</strong> As escolhas não foram enviadas ao Supabase. Use “Exportar respostas CSV” para baixar os {votes.length} registros fictícios e a sua simulação.</div>}
   </form>
  </section>
  <section className="panel idealize-panel">
   <div className="toolbar"><div><div className="eyebrow">VISÃO PRESCON • DADOS FICTÍCIOS</div><h2>Respostas recebidas</h2>
    <p className="muted small">17 EJs responderam a ambos os cenários nesta demonstração. Outras 12 permanecem pendentes.</p>
   </div><button className="button outline" onClick={downloadVoteCsv}><Download size={15}/> Baixar CSV</button></div>
   <div className="idealize-sample-metrics">
    <div><strong>{votes.length}</strong><span>EJs votantes</span></div><div><strong>{EJS_DEMO.length-votes.length}</strong><span>EJs pendentes</span></div><div><strong>{Math.round(votes.length/EJS_DEMO.length*100)}%</strong><span>Representatividade</span></div>
   </div>
   <div className="idealize-results-grid">{plan.alternatives.map(a=><div key={a.id} className="idealize-result">
    <h3>{a.label}</h3>
    {choices.map(c=><div className="idealize-result-row" key={c.value}><span>{c.label}</span><div><span style={{width:(countPosition(a.scenarioKey,c.value)/votes.length*100)+'%'}}/></div><b>{countPosition(a.scenarioKey,c.value)}</b></div>)}
   </div>)}</div>
   <p className="muted small"><Info size={14} style={{verticalAlign:'middle'}}/> Ninguém é classificado automaticamente; a avaliação de ressalvas continua sendo uma decisão da PRESCON.</p>
  </section>
 </div>;
}
