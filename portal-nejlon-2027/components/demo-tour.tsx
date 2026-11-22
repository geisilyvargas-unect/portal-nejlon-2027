'use client';
import {useState} from 'react';
import {
  BookOpen,Building2,CalendarDays,CheckCircle2,
  ClipboardList,FileText,LayoutDashboard,ListTodo,LockKeyhole,
  ShieldCheck,Users
} from 'lucide-react';
import {EJS_DEMO,DEMO_ROLES,expectedEmail,type DemoRole} from '@/lib/demo-ejs';
import {ThemeToggle} from '@/components/theme-toggle';
import {NetworkEngagement} from '@/components/network-engagement';
import {buildEngagement} from '@/lib/engagement';
import {DEMO_DELIBERATIONS,DEMO_POSITIONS,DEMO_EJ_BY_SLUG,demoVotesFor,demoPendingFor,demoCountsFor,demoSummary,type DemoDeliberationId} from '@/lib/demo-responses';

type Section='painel'|'engajamento'|'deliberacoes'|'pendencias'|'relatorios'|'acessos'|'calendario'|'demandas'|'jornada'|'rede';
const NAV:ReadonlyArray<{id:Section;name:string;icon:typeof LayoutDashboard}>= [
 {id:'painel',name:'Visão geral',icon:LayoutDashboard},
 {id:'engajamento',name:'Engajamento das EJs',icon:Building2},
 {id:'deliberacoes',name:'Deliberações',icon:ClipboardList},
 {id:'pendencias',name:'Pendências',icon:CheckCircle2},
 {id:'relatorios',name:'Relatórios',icon:FileText},
 {id:'acessos',name:'Gestão de acessos',icon:Users},
 {id:'demandas',name:'Demandas',icon:ListTodo},
 {id:'calendario',name:'Calendário',icon:CalendarDays},
 {id:'jornada',name:'Jornada do Conselho',icon:BookOpen},
 {id:'rede',name:'Rede de EJs',icon:Building2}
];
const VISIBLE:Record<DemoRole,Section[]>={
 prescon:['painel','engajamento','deliberacoes','pendencias','relatorios','acessos','demandas','calendario','jornada','rede'],
 counselor:['painel','deliberacoes','calendario','jornada','rede'],
 ej_direx:['painel','deliberacoes','demandas','calendario','rede'],
 nucleus_direx:['painel','deliberacoes','demandas','calendario','rede']
};
const DEMO_PERIODS:Record<DemoDeliberationId,string>={
 financeiro:'2027-01-15T12:00:00Z',calendario:'2027-02-15T12:00:00Z',encerramento:'2027-03-15T12:00:00Z'
};
const DEMO_NETWORK_SNAPSHOT=buildEngagement(
 EJS_DEMO.map(e=>({id:e.slug,name:e.name,slug:e.slug})),
 DEMO_DELIBERATIONS.map(d=>({
  id:d.id,title:d.title,due_at:DEMO_PERIODS[d.id],is_demo:true,
  status:d.open?'open' as const:'closed' as const
 })),
 DEMO_DELIBERATIONS.flatMap(d=>demoVotesFor(d.id).map(v=>({ej_id:v.slug,deliberation_id:d.id}))),
 {includeDemo:true}
);
const SAMPLE_EVENTS=[
 {name:'Reunião interna do Conselho',type:'Reunião',date:'15/03/2027',time:'19h',direx:false},
 {name:'Encontro da Rede NEJLON',type:'Institucional',date:'20/03/2027',time:'18h',direx:true},
 {name:'Imersão de Lideranças',type:'Formação',date:'27/03/2027',time:'14h',direx:true}
];

function TitleBlock({eyebrow,title,description}:{eyebrow:string;title:string;description:string}){
 return <header className="demo-content-heading">
   <div className="eyebrow">{eyebrow}</div>
   <h2>{title}</h2><p className="muted">{description}</p>
 </header>;
}
function Stat({label,value,detail}:{label:string;value:string;detail:string}){
 return <div className="panel demo-stat"><div className="muted small">{label}</div>
  <strong className="stat">{value}</strong><div className="small">{detail}</div>
 </div>;
}
function SampleList({items}:{items:ReadonlyArray<{heading:string;caption:string;status?:string}>}){
 return <div className="panel demo-sample-list">
  {items.map(item=><div className="list-card" key={item.heading}><div>
   <strong>{item.heading}</strong><p className="muted small" style={{margin:'7px 0 0'}}>{item.caption}</p></div>
   {item.status&&<span className="badge">{item.status}</span>}
  </div>)}
 </div>;
}
export function DemoTour(){
 const [role,setRole]=useState<DemoRole>('prescon');
 const [ejSlug,setEjSlug]=useState('unect');
 const [section,setSection]=useState<Section>('painel');
 const [demoPosition,setDemoPosition]=useState('favorable');
 const [showVoteNote,setShowVoteNote]=useState(false);
 const [selectedDelib,setSelectedDelib]=useState<DemoDeliberationId>('financeiro');
 const roleDef=DEMO_ROLES.find(x=>x.value===role)!;
 const ej=EJS_DEMO.find(x=>x.slug===ejSlug)||EJS_DEMO[0];
 const email=expectedEmail(role,ejSlug);
 const sections=VISIBLE[role];
 const name=role==='prescon'?'Presidência do Conselho':role==='nucleus_direx'?'DIREX do Núcleo':role==='counselor'?'Conselho da '+ej.name:'DIREX da '+ej.name;
 const isPrescon=role==='prescon',isCouncil=role==='counselor',isDirex=role==='ej_direx';
 const viewDelibs=DEMO_DELIBERATIONS.filter(x=>!isDirex||x.direxVisible);
 const votes=demoVotesFor(selectedDelib);
 const missing=demoPendingFor(selectedDelib);
 const counts=demoCountsFor(selectedDelib);
 const summary=demoSummary(selectedDelib);
 const currentDelib=DEMO_DELIBERATIONS.find(d=>d.id===selectedDelib)!;
 const directApproval=votes.filter(v=>v.position==='favorable'||v.position==='suggestions').length;
 const flaggedVotes=votes.filter(v=>v.position==='suggestions'||v.position==='qualified'||v.position==='against');
 let accumulated=0;
 const chartColors=counts.filter(c=>c.value).map(c=>{
  const start=accumulated;
  accumulated+=c.value/Math.max(votes.length,1)*100;
  return c.color+' '+start.toFixed(3)+'% '+accumulated.toFixed(3)+'%';
 }).join(', ');
 const chartBackground=votes.length?'conic-gradient('+chartColors+')':'var(--surface2)';
 const selectDelib=<label>Deliberação demonstrativa
   <select value={selectedDelib} onChange={e=>setSelectedDelib(e.target.value as DemoDeliberationId)}>
    {DEMO_DELIBERATIONS.map(d=><option key={d.id} value={d.id}>{d.title}</option>)}
   </select>
 </label>;
 const chart=<div className="report-chart-row demo-report-chart">
  <div className="report-pie" style={{background:chartBackground}} role="img" aria-label={counts.map(c=>c.label+': '+c.value).join(', ')}>
   <div className="report-pie-core"><strong>{votes.length}</strong><span>votos fictícios</span></div>
  </div>
  <div className="report-legend">{counts.map(c=><div key={c.key} className="report-legend-row">
    <span className="report-legend-color" style={{background:c.color}}/><span>{c.label}</span><strong>{c.value}</strong>
    <span className="muted small">{votes.length?Math.round(c.value/votes.length*100):0}%</span>
  </div>)}</div>
 </div>;
 const viewEvents=SAMPLE_EVENTS.filter(x=>!isDirex||x.direx);
 const navigate=(page:Section)=>{setSection(page);setShowVoteNote(false);};
 const changeRole=(value:DemoRole)=>{setRole(value);setSection('painel');setShowVoteNote(false);};
 const changeEj=(value:string)=>{setEjSlug(value);setShowVoteNote(false);};
 return <div className="demo-landing">
   <div className="demo-top">
    <div className="demo-brand"><span className="eyebrow">PROPOSTA • 2027</span><strong>NEJ<span>LON</span></strong></div>
    <div className="demo-top-actions"><ThemeToggle/></div>
   </div>
   <div className="demo-welcome">
    <div>
     <span className="demo-tag"><ShieldCheck size={15}/> APRESENTAÇÃO INTERATIVA</span>
     <h1>Conheça o Portal NEJLON 2027.</h1>
     <p>Escolha uma visão e conheça as funcionalidades previstas para cada perfil. É uma <strong>simulação com informações fictícias</strong>: nada aqui registra votos, cria contas ou altera dados do NEJLON.</p>
    </div>
    <div className="demo-selector">
     <div className="demo-role-picker" role="group" aria-label="Escolha a visão que deseja conhecer">
      {DEMO_ROLES.map(x=><button key={x.value} type="button"
        className={'demo-role-button '+(role===x.value?'active':'')}
        aria-pressed={role===x.value}
        onClick={()=>changeRole(x.value)}>
        {x.name}
      </button>)}
     </div>
     {(isCouncil||isDirex)&&<label>Empresa júnior de exemplo
       <select value={ejSlug} onChange={e=>changeEj(e.target.value)}>
        {EJS_DEMO.map(x=><option value={x.slug} key={x.slug}>{x.name}</option>)}
       </select>
      </label>}
     <div className="demo-access-example"><span>E-mail institucional previsto para este perfil:</span><code>{email}</code></div>
    </div>
   </div>
   <div className="demo-preview-frame">
    <aside className="demo-preview-sidebar">
     <div className="demo-preview-identity">
      <div className="eyebrow">Prévia da interface</div>
      <strong>{name}</strong>
      <span className="muted small">{roleDef.description}</span>
     </div>
     <nav className="demo-nav" aria-label="Navegação da demonstração">
      {NAV.filter(item=>sections.includes(item.id)).map(({id,name:label,icon:Icon})=>
       <button key={id} type="button" className={'demo-nav-item '+(section===id?'active':'')}
         onClick={()=>navigate(id)} aria-current={section===id?'page':undefined}>
         <Icon size={17} aria-hidden/>{label}
       </button>)}
     </nav>
    </aside>
    <div className="demo-preview-main">
     <div className="demo-preview-status"><span><span className="demo-pulse"/> Modo demonstração • dados fictícios</span>
      <span>Perfil: <strong>{roleDef.name}</strong></span>
     </div>
     {section==='painel'&&<>
      <div className="hero"><div className="eyebrow">Portal de Governança • 2027</div>
       <h2>Juntos pela excelência.</h2><p className="muted" style={{marginBottom:0}}>Bem-vindo(a), {name}.</p>
      </div>
      <div className="kpi-grid">
       <Stat label="Empresas juniores" value="29" detail="Da Rede NEJLON"/>
       <Stat label="Deliberações" value={String(viewDelibs.length)} detail="Exemplos disponíveis"/>
       <Stat label={isPrescon?'Respostas recebidas':isCouncil?'Posicionamento da EJ':'Demandas'} value={isPrescon?String(demoSummary('financeiro').received):isCouncil?(demoVotesFor('financeiro').some(v=>v.slug===ejSlug)?'1':'0'):'2'} detail={isPrescon?'Exemplo financeiro':isCouncil?'Exemplo financeiro':'Dados simulados'}/>
       <Stat label={isPrescon?'EJs pendentes':isCouncil?'Suas pendências':'Eventos'} value={isPrescon?String(demoSummary('financeiro').pending):isCouncil?(demoVotesFor('financeiro').some(v=>v.slug===ejSlug)?'0':'1'):'2'} detail={isPrescon?'Exemplo financeiro':isCouncil?'Exemplo financeiro':'Dados simulados'}/>
      </div>
      {isPrescon&&<NetworkEngagement snapshot={DEMO_NETWORK_SNAPSHOT} demo/>}
      <div className="panel">
       <h3>O que este perfil pode fazer?</h3>
       <div className="demo-feature-grid">
        {(isPrescon?[
         ['Deliberações','Criar, acompanhar e consolidar votações.'],
         ['Gestão de acessos','Organizar os 59 e-mails institucionais.'],
         ['Pendências','Identificar EJs que ainda não responderam.']
        ]:isCouncil?[
         ['Deliberar','Registrar o posicionamento da própria EJ.'],
         ['Minhas respostas','Acompanhar as deliberações realizadas.'],
         ['Agenda','Consultar reuniões do Conselho.']
        ]:isDirex?[
         ['Acompanhar','Ver apenas deliberações liberadas para DIREX.'],
         ['Demandas','Acompanhar compromissos da própria EJ.'],
         ['Eventos públicos','Consultar somente os eventos autorizados.']
        ]:[
         ['Agenda','Organizar reuniões e eventos do Núcleo.'],
         ['Demandas','Acompanhar entregas e responsáveis.'],
         ['Deliberações','Consultar o que estiver autorizado.']
        ]).map(([title,body])=><div className="demo-feature" key={title}><strong>{title}</strong><p className="muted small">{body}</p></div>)}
       </div>
      </div>
     </>}
     {section==='engajamento'&&isPrescon&&<NetworkEngagement snapshot={DEMO_NETWORK_SNAPSHOT} demo/>}
     {section==='deliberacoes'&&<>
      <TitleBlock eyebrow="Governança • Deliberações" title="Deliberações"
       description={isPrescon?'A PRESCON acompanha e organiza os resultados.':isCouncil?'O Conselho responde em nome da própria EJ.':'Esta visão apenas consulta deliberações autorizadas, sem votar.'}/>
      <SampleList items={viewDelibs.map(item=>({heading:item.title,caption:(item.direxVisible?'Visível para DIREX':'Restrita ao Conselho')+' • '+demoSummary(item.id).received+' respostas fictícias',status:item.open?'Aberta':'Encerrada'}))}/>
      {isPrescon&&<div className="panel">
       <h3>Respostas recebidas por EJ</h3>
       {selectDelib}
       <div className="kpi-grid" style={{marginTop:14}}>
        <Stat label="Responderam" value={String(summary.received)} detail="EJs fictícias"/>
        <Stat label="Pendentes" value={String(summary.pending)} detail="EJs fictícias"/>
        <Stat label="Representatividade" value={summary.participation+'%'} detail="Calculada automaticamente"/>
       </div>
       {chart}
       <div className="demo-vote-records">
        {votes.map(v=><details key={v.slug} className="demo-vote-record">
         <summary><strong>{DEMO_EJ_BY_SLUG.get(v.slug)||v.slug.toUpperCase()}</strong><span className="badge">{DEMO_POSITIONS[v.position].label}</span></summary>
         <p className="muted small">{v.note}</p>
         <small className="muted">Resposta fictícia • somente apresentação</small>
        </details>)}
       </div>
      </div>}
      {isCouncil&&<div className="panel">
       <h3>Posicionamento demonstrativo da {ej.name}</h3>
       {(()=>{const vote=demoVotesFor('financeiro').find(v=>v.slug===ejSlug);
        return vote?<><span className="badge blue">{DEMO_POSITIONS[vote.position].label}</span><p className="muted small">{vote.note}</p></>
          :<p className="muted">Esta EJ ainda aparece como pendente no exemplo financeiro. Você pode simular um voto abaixo.</p>;
       })()}
      </div>}
      {isCouncil&&<div className="panel">
       <h3>Exemplo de formulário de voto</h3>
       <p className="muted small">Planejamento Financeiro 2027 • cenário ilustrativo</p>
       <label>Posicionamento
        <select value={demoPosition} onChange={e=>setDemoPosition(e.target.value)}>
         <option value="favorable">Aprovo</option>
         <option value="suggestions">Aprovo com sugestões</option>
         <option value="qualified">Aprovo com ressalvas</option>
         <option value="against">Reprovo</option>
         <option value="abstention">Abstenho</option>
        </select>
       </label>
       <button type="button" className="primary" style={{marginTop:12}} onClick={()=>setShowVoteNote(true)}>
        Simular envio de voto
       </button>
       {showVoteNote&&<div className="notice" style={{marginTop:12}}>Simulação concluída: nenhum voto foi registrado. Na versão real, cada e-mail de Conselho representa sua própria EJ.</div>}
      </div>}
      {isPrescon&&<div className="notice">A PRESCON cria formulários, acompanha os resultados e analisa cada sugestão e ressalva; não vota no lugar das EJs.</div>}
     </>}
     {section==='pendencias'&&<>
      <TitleBlock eyebrow="Acompanhamento exclusivo da PRESCON" title="Central de Pendências"
       description="As EJs pendentes são identificadas automaticamente a partir das respostas fictícias da deliberação selecionada."/>
      <div className="panel">{selectDelib}</div>
      <div className="kpi-grid">
       <Stat label="EJs da Rede" value={String(EJS_DEMO.length)} detail="Empresas cadastradas"/>
       <Stat label="Responderam" value={String(summary.received)} detail="Respostas fictícias"/>
       <Stat label="Ainda pendentes" value={String(summary.pending)} detail="Calculado automaticamente"/>
       <Stat label="Representatividade" value={summary.participation+'%'} detail="Exemplo de cálculo"/>
      </div>
      <SampleList items={missing.map(item=>({heading:item.name,caption:'Ainda não respondeu a '+currentDelib.title,status:'Pendente'}))}/>
      <div className="notice">São pendências simuladas. Nenhuma cobrança será enviada e nenhuma EJ real será marcada como inadimplente.</div>
     </>}
     {section==='relatorios'&&<>
      <TitleBlock eyebrow="PRESCON • Consolidação" title="Relatórios institucionais"
        description="Resultados e pareceres demonstrativos calculados a partir dos posicionamentos das EJs."/>
      <div className="panel">{selectDelib}</div>
      <div className="kpi-grid">
       <Stat label="EJs votantes" value={String(summary.received)} detail="Exemplo"/>
       <Stat label="Aprovação direta" value={(votes.length?Math.round(directApproval*100/votes.length):0)+'%'} detail="Dos votos recebidos"/>
       <Stat label="Ressalvas" value={String(counts.find(c=>c.key==='qualified')?.value||0)} detail="Para análise da PRESCON"/>
       <Stat label="Sugestões" value={String(counts.find(c=>c.key==='suggestions')?.value||0)} detail="Para encaminhamento"/>
      </div>
      <div className="panel"><h3>Distribuição dos posicionamentos</h3>{chart}</div>
      <div className="panel">
       <h3>Pareceres que precisam da PRESCON</h3>
       <p className="muted small">Os registros abaixo são exemplos. Aceitar ou rejeitar sugestões e ressalvas é sempre uma decisão da PRESCON, nunca do gráfico.</p>
       {flaggedVotes.map(v=><details key={v.slug} className="demo-vote-record">
        <summary><strong>{DEMO_EJ_BY_SLUG.get(v.slug)||v.slug.toUpperCase()}</strong><span className="badge">{DEMO_POSITIONS[v.position].label}</span></summary>
        <p className="muted small">{v.note}</p><span className="badge">Aguardando avaliação (fictícia)</span>
       </details>)}
      </div>
      <span className="badge blue">Relatório demonstrativo, sem votos oficiais</span>
     </>}
     {section==='acessos'&&<>
      <TitleBlock eyebrow="PRESCON • Administração" title="Gestão dos acessos"
       description="Cada e-mail é uma conta independente: 29 Conselhos, 29 DIREX de EJs e a DIREX do Núcleo."/>
      <div className="kpi-grid">
       <Stat label="Contas previstas" value="59" detail="Visões específicas"/>
       <Stat label="Conselhos" value="29" detail="Um por EJ"/>
       <Stat label="DIREX das EJs" value="29" detail="Um por EJ"/>
       <Stat label="DIREX do Núcleo" value="1" detail="Conta do núcleo"/>
      </div>
      <SampleList items={[
       {heading:'conselhounect@nejlondrina.com',caption:'Perfil Conselho • UNECT',status:'E-mail previsto'},
       {heading:'direxunect@nejlondrina.com',caption:'Perfil DIREX • UNECT',status:'E-mail previsto'},
       {heading:'conselho3e@nejlondrina.com',caption:'Perfil Conselho • 3E',status:'E-mail previsto'},
       {heading:'direx@nejlondrina.com',caption:'Perfil DIREX • Núcleo',status:'E-mail previsto'}
      ]}/>
      <p className="muted small">Estes e-mails são exemplos do catálogo. A criação efetiva e as senhas são administradas na área PRESCON autenticada.</p>
     </>}
     {section==='calendario'&&<>
      <TitleBlock eyebrow="Governança • Agenda" title="Calendário institucional"
       description={isDirex?'A DIREX da EJ só vê eventos explicitamente liberados.':'Reuniões do Conselho e compromissos da Rede, respeitando a visibilidade.'}/>
      <div className="panel demo-events">
       {viewEvents.map(e=><div className="demo-event" key={e.name}>
        <div className="demo-event-date"><strong>{e.date.slice(0,2)}</strong><span>MAR</span></div>
        <div><strong>{e.name}</strong><p className="muted small" style={{margin:'5px 0'}}>{e.date} · {e.time} · {e.type}</p>
         <span className="muted small">{e.direx?'Visível para DIREX de EJ':'Evento reservado ao Conselho'}</span>
        </div>
       </div>)}
      </div>
      {isDirex&&<div className="notice">Eventos internos do Conselho não aparecem para a DIREX das EJs. O acesso real é bloqueado no banco, não apenas na interface.</div>}
     </>}
     {section==='demandas'&&<>
      <TitleBlock eyebrow="Gestão • Demandas" title={isDirex?'Demandas da sua EJ':'Acompanhamento de demandas'}
       description="Prazo, responsável e situação organizados em um só lugar."/>
      <SampleList items={[
       {heading:'Atualizar cadastro institucional',caption:'Prazo demonstrativo: 12/03/2027',status:'Em andamento'},
       {heading:'Confirmar presença na reunião',caption:'Prazo demonstrativo: 15/03/2027',status:'Pendente'},
       {heading:'Enviar relatório mensal',caption:'Prazo demonstrativo: 25/03/2027',status:'Concluída'}
      ]}/>
     </>}
     {section==='jornada'&&<>
      <TitleBlock eyebrow="Desenvolvimento • Conselho" title="Jornada do Conselheiro"
       description="Formações, materiais, sessões e acompanhamento do progresso."/>
      <SampleList items={[
       {heading:'Introdução à Governança do NEJLON',caption:'Material e atividade introdutória',status:'Concluída'},
       {heading:'Como analisar uma deliberação',caption:'Trilha de formação',status:'Em andamento'},
       {heading:'Boas práticas de participação',caption:'Encontro formativo',status:'A iniciar'}
      ]}/>
     </>}
     {section==='rede'&&<>
      <TitleBlock eyebrow="Rede • Empresas juniores" title="Rede NEJLON"
       description="Conheça as EJs cadastradas e mantenha os contatos institucionais organizados."/>
      <div className="demo-ej-grid">
       {EJS_DEMO.slice(0,12).map(item=><div className="demo-ej-card" key={item.slug}>
        <Building2 size={17} aria-hidden/><strong>{item.name}</strong>
       </div>)}
      </div>
      <p className="muted small" style={{marginTop:12}}>E outras {EJS_DEMO.length-12} empresas juniores.</p>
     </>}
     <div className="demo-footer"><LockKeyhole size={17} aria-hidden/>
      <span>Esta apresentação não autentica usuários, não exibe dados privados e não envia alterações ao Supabase.</span>
     </div>
    </div>
   </div>
   <div className="demo-bottom">
    <div><strong>Gostou de conhecer o portal?</strong><p className="muted">O ambiente institucional permanece separado e exige autorização da PRESCON. Os e-mails das EJs continuam vinculados a seus próprios perfis.</p></div>
    <span className="badge lime">Explore sem cadastro</span>
   </div>
 </div>;
}
