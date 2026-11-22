'use client';
import {useEffect,useMemo,useState} from 'react';
import {useRouter} from 'next/navigation';
import {createClient} from '@/lib/supabase/browser';
import {BarChart3,Building2,CheckCircle2,Clock3,Search,TrendingUp} from 'lucide-react';
import type {EngagementSnapshot,EngagementStatus} from '@/lib/engagement';

type Filter='all'|EngagementStatus;
export function NetworkEngagement({snapshot,demo=false}:{
 snapshot:EngagementSnapshot;demo?:boolean
}){
 const router=useRouter();
 useEffect(()=>{
  if(demo)return;
  const db=createClient();
  const channel=db.channel('prescon-network-live').on('postgres_changes',
   {event:'*',schema:'public',table:'responses'},()=>router.refresh()).subscribe();
  const onFocus=()=>router.refresh();
  window.addEventListener('focus',onFocus);
  const poll=window.setInterval(()=>router.refresh(),60000);
  return ()=>{
   window.removeEventListener('focus',onFocus);
   window.clearInterval(poll);
   void db.removeChannel(channel);
  };
 },[demo,router]);
 const [query,setQuery]=useState('');
 const [filter,setFilter]=useState<Filter>('all');
 const [selectedId,setSelectedId]=useState<string|null>(
  snapshot.cards.find(e=>e.slug==='unect')?.id||snapshot.cards[0]?.id||null
 );
 const filtered=useMemo(()=>snapshot.cards.filter(e=>{
  const matches=e.name.toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR'))||
    e.slug.includes(query.trim().toLowerCase());
  return matches&&(filter==='all'||filter===e.status);
 }),[snapshot.cards,filter,query]);
 const selected=snapshot.cards.find(e=>e.id===selectedId)||null;
 const noData=snapshot.deliberations===0;
 const statusCount=(status:EngagementStatus)=>snapshot.cards.filter(e=>e.status===status).length;
 const filters:ReadonlyArray<{value:Filter;text:string;count:number}>=[
  {value:'all',text:'Todas',count:snapshot.totalEjs},
  {value:'high',text:'80–100%',count:statusCount('high')},
  {value:'medium',text:'50–79%',count:statusCount('medium')},
  {value:'low',text:'0–49%',count:statusCount('low')},
  {value:'none',text:'Sem dados',count:statusCount('none')}
 ];
 return <section className={'network-engagement '+(demo?'network-demo':'')} aria-label="Mapa de participação da Rede NEJLON">
  <div className="network-heading">
   <div>
    <div className="eyebrow">PRESCON • VISÃO DA REDE</div>
    <h2>Radar de engajamento das EJs</h2>
    <p className="muted small">Mapa de calor com acompanhamento automático da participação nas deliberações {demo?'fictícias':'oficiais'}.</p>
   </div>
   <span className={'badge '+(demo?'blue':'lime')}>{demo?'DADOS FICTÍCIOS':'DADOS DO SUPABASE'}</span>
  </div>
  <div className="network-overview">
   <div className="network-metric">
    <span className="network-metric-icon"><Building2 size={20}/></span>
    <span className="muted small">EJs na rede</span>
    <strong>{snapshot.totalEjs}</strong>
    <span className="muted small">monitoradas</span>
   </div>
   <div className="network-metric">
    <span className="network-metric-icon"><BarChart3 size={20}/></span>
    <span className="muted small">Participação geral</span>
    <strong>{snapshot.overallRate===null?'—':snapshot.overallRate+'%'}</strong>
    <span className="muted small">{snapshot.responded} de {snapshot.possible} respostas possíveis</span>
   </div>
   <div className="network-metric">
    <span className="network-metric-icon"><CheckCircle2 size={20}/></span>
    <span className="muted small">EJs com tudo respondido</span>
    <strong>{noData?'—':snapshot.allDone}</strong>
    <span className="muted small">de {snapshot.totalEjs} empresas</span>
   </div>
   <div className="network-metric">
    <span className="network-metric-icon"><Clock3 size={20}/></span>
    <span className="muted small">EJs com pendências</span>
    <strong>{noData?'—':snapshot.withPending}</strong>
    <span className="muted small">em {snapshot.deliberations} deliberações</span>
   </div>
  </div>
  {noData&&<div className="notice network-no-data" role="status">
   Ainda não existem deliberações oficiais abertas ou encerradas para medir participação.
   O mapa aparece sem classificação até os primeiros registros. Não interpretamos ausência de dados como baixa participação.
  </div>}
  <div className="network-content-grid">
   <div className="panel network-heatmap-panel">
    <div className="network-panel-heading">
     <div><h3>Mapa de calor • 29 EJs</h3><p className="muted small">Selecione uma empresa para conhecer seus indicadores.</p></div>
    </div>
    <div className="network-controls">
     <label className="network-search"><Search size={17} aria-hidden="true"/>
      <span className="sr-only">Buscar empresa júnior</span>
      <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar EJ..." aria-label="Buscar empresa júnior"/>
     </label>
     <div className="network-filters" role="group" aria-label="Filtrar nível de participação">
      {filters.map(x=><button type="button" key={x.value}
        className={'network-filter '+(filter===x.value?'active':'')}
        onClick={()=>setFilter(x.value)} aria-pressed={filter===x.value}>
        {x.text} <span>{x.count}</span>
      </button>)}
     </div>
    </div>
    <div className="network-heatmap" aria-label="Mapa de participação das empresas">
     {filtered.map(e=><button type="button" key={e.id}
       className={'network-ej-cell network-'+e.status+(selected?.id===e.id?' selected':'')}
       onClick={()=>setSelectedId(e.id)}
       aria-pressed={selected?.id===e.id}
       title={e.name+': '+(e.rate===null?'sem dados':e.rate+'% de respostas')}>
       <span className="network-cell-name">{e.name}</span>
       <span className="network-cell-score">{e.rate===null?'—':e.rate+'%'}</span>
      </button>)}
    </div>
    {filtered.length===0&&<p className="muted small">Nenhuma EJ corresponde aos filtros escolhidos.</p>}
    <div className="network-legend">
     <span><i className="network-swatch network-high"/>80–100%</span>
     <span><i className="network-swatch network-medium"/>50–79%</span>
     <span><i className="network-swatch network-low"/>0–49%</span>
     <span><i className="network-swatch network-none"/>Sem dados</span>
    </div>
    <p className="muted network-method">As faixas são apenas um auxílio visual configurável. A participação considera a proporção de deliberações com resposta, inclusive abstenções; não é uma avaliação de qualidade ou comprometimento da EJ.</p>
   </div>
   <div className="panel network-ej-profile">
    <div className="network-profile-title">
     <div className="network-profile-icon"><Building2 size={25}/></div>
     <div><div className="eyebrow">Ficha da EJ</div><h3>{selected?.name||'Selecione uma EJ'}</h3></div>
    </div>
    {selected&&<>
     <div className="network-profile-value">
      <strong>{selected.rate===null?'—':selected.rate+'%'}</strong>
      <span className="muted small">de participação nas deliberações</span>
     </div>
     <div className="network-track" role="progressbar" aria-label={'Participação da '+selected.name}
       aria-valuemin={0} aria-valuemax={100} aria-valuenow={selected.rate??0}
       aria-valuetext={selected.rate===null?'Sem dados':selected.rate+' por cento'}>
       <span className={'network-progress network-'+selected.status} style={{width:(selected.rate??0)+'%'}}/>
     </div>
     <div className="network-detail-stats">
      <div><strong>{selected.answered}</strong><span>Respondidas</span></div>
      <div><strong>{selected.expected?selected.missing:'—'}</strong><span>Pendentes</span></div>
      <div><strong>{selected.expected}</strong><span>Deliberações</span></div>
     </div>
     {selected.expected===0?
      <p className="muted small">Os indicadores desta EJ aparecerão após o cadastro de deliberações oficiais.</p>:
      <div className="network-profile-lists">
       <div><h4><CheckCircle2 size={16}/> Com resposta</h4>
        {selected.answeredTitles.length?
         <ul>{selected.answeredTitles.map((s,i)=><li key={s+i}>{s}</li>)}</ul>:
         <p className="muted small">Nenhuma resposta registrada.</p>}
       </div>
       <div><h4><Clock3 size={16}/> Sem resposta</h4>
        {selected.missingTitles.length?
         <ul>{selected.missingTitles.map((s,i)=><li key={s+i}>{s}</li>)}</ul>:
         <p className="muted small">Tudo respondido!</p>}
       </div>
      </div>}
    </>}
   </div>
  </div>
  <div className="panel network-trend-panel">
   <div className="network-panel-heading">
    <div><div className="eyebrow"><TrendingUp size={15} aria-hidden="true"/> ENGAJAMENTO</div>
     <h3>Evolução das respostas por deliberação</h3>
     <p className="muted small">Percentual de EJs que responderam a cada deliberação, nas últimas seis por prazo. Calculado com os mesmos votos do mapa.</p>
    </div>
    <span className="badge">{snapshot.trend.length} deliberações</span>
   </div>
   {snapshot.trend.length?
    <div className="network-chart" role="group" aria-label="Gráfico de participação por deliberação">
     <div className="network-chart-lines" aria-hidden="true"><span>100%</span><span>50%</span><span>0%</span></div>
     <div className="network-bars">
      {snapshot.trend.map(point=><div className="network-bar-item" key={point.id}>
       <strong className="network-bar-value">{point.rate}%</strong>
       <div className="network-bar-track">
        <span className="network-bar-fill" style={{height:point.rate+'%'}}/>
       </div>
       <span className="network-bar-label" title={point.title}>{point.title}</span>
       <span className="muted network-bar-count">{point.answered}/{point.expected} EJs</span>
      </div>)}
     </div>
    </div>:
    <div className="network-empty"><BarChart3 size={33}/><p>Nenhuma deliberação disponível para construir o gráfico. Os dados aparecerão automaticamente após as primeiras respostas.</p></div>}
  </div>
 </section>;
}
