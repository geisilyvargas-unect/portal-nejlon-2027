'use client';
import {useState} from 'react';
import Link from 'next/link';
import {
  BookOpen,Building2,CalendarDays,CheckCircle2,ChevronRight,
  ClipboardList,FileText,LayoutDashboard,ListTodo,LockKeyhole,
  ShieldCheck,Users
} from 'lucide-react';
import {EJS_DEMO,DEMO_ROLES,expectedEmail,type DemoRole} from '@/lib/demo-ejs';
import {ThemeToggle} from '@/components/theme-toggle';

type Section='painel'|'deliberacoes'|'pendencias'|'relatorios'|'acessos'|'calendario'|'demandas'|'jornada'|'rede';
const NAV:ReadonlyArray<{id:Section;name:string;icon:typeof LayoutDashboard}>= [
 {id:'painel',name:'Visão geral',icon:LayoutDashboard},
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
 prescon:['painel','deliberacoes','pendencias','relatorios','acessos','demandas','calendario','jornada','rede'],
 counselor:['painel','deliberacoes','calendario','jornada','rede'],
 ej_direx:['painel','deliberacoes','demandas','calendario','rede'],
 nucleus_direx:['painel','deliberacoes','demandas','calendario','rede']
};
const SAMPLE_DELIBS=[
 {name:'Planejamento Financeiro 2027 — 1º ciclo',detail:'Deliberação de exemplo • acesso liberado à DIREX',pending:true,open:true,ejVisible:true},
 {name:'Aprovação do Calendário Eleitoral',detail:'Material restrito ao Conselho e à PRESCON',pending:false,open:true,ejVisible:false},
 {name:'Relatório de Encerramento de Ciclo',detail:'Deliberação de exemplo • já encerrada',pending:false,open:false,ejVisible:true}
];
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
 const roleDef=DEMO_ROLES.find(x=>x.value===role)!;
 const ej=EJS_DEMO.find(x=>x.slug===ejSlug)||EJS_DEMO[0];
 const email=expectedEmail(role,ejSlug);
 const sections=VISIBLE[role];
 const name=role==='prescon'?'Presidência do Conselho':role==='nucleus_direx'?'DIREX do Núcleo':role==='counselor'?'Conselho da '+ej.name:'DIREX da '+ej.name;
 const isPrescon=role==='prescon',isCouncil=role==='counselor',isDirex=role==='ej_direx';
 const viewDelibs=SAMPLE_DELIBS.filter(x=>!isDirex||x.ejVisible);
 const viewEvents=SAMPLE_EVENTS.filter(x=>!isDirex||x.direx);
 const navigate=(page:Section)=>{setSection(page);setShowVoteNote(false);};
 const changeRole=(value:DemoRole)=>{setRole(value);setSection('painel');setShowVoteNote(false);};
 const changeEj=(value:string)=>{setEjSlug(value);setShowVoteNote(false);};
 return <div className="demo-landing">
   <div className="demo-top">
    <div className="demo-brand"><span className="eyebrow">PROPOSTA • 2027</span><strong>NEJ<span>LON</span></strong></div>
    <div className="demo-top-actions"><ThemeToggle/><Link href="/login" className="button outline">Entrar com e-mail <ChevronRight size={16} aria-hidden/></Link></div>
   </div>
   <div className="demo-welcome">
    <div>
     <span className="demo-tag"><ShieldCheck size={15}/> APRESENTAÇÃO INTERATIVA</span>
     <h1>Explore o portal sem precisar entrar.</h1>
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
     <div className="demo-access-example"><span>O e-mail individual deste perfil seria:</span><code>{email}</code></div>
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
       <Stat label="Deliberações" value={isDirex?'1':'2'} detail="Exemplos disponíveis"/>
       <Stat label={isPrescon?'Respostas recebidas':isCouncil?'Respostas da EJ':'Demandas'} value={isPrescon?'17':isCouncil?'1':'2'} detail="Dados simulados"/>
       <Stat label={isPrescon?'EJs pendentes':isCouncil?'Suas pendências':'Eventos'} value={isPrescon?'12':isCouncil?'1':'2'} detail="Acompanhamento fictício"/>
      </div>
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
     {section==='deliberacoes'&&<>
      <TitleBlock eyebrow="Governança • Deliberações" title="Deliberações"
       description={isPrescon?'A PRESCON acompanha e organiza os resultados.':isCouncil?'O Conselho responde em nome da própria EJ.':'Esta visão apenas consulta deliberações autorizadas, sem votar.'}/>
      <SampleList items={viewDelibs.map(item=>({heading:item.name,caption:item.detail,status:item.open?'Aberta':'Encerrada'}))}/>
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
       description="Identifique as EJs que ainda não deliberaram e prepare cobranças por e-mail ou WhatsApp."/>
      <div className="kpi-grid">
       <Stat label="EJs da Rede" value="29" detail="Contas independentes"/>
       <Stat label="Responderam" value="17" detail="Dados simulados"/>
       <Stat label="Ainda pendentes" value="12" detail="Dados simulados"/>
       <Stat label="Representatividade" value="59%" detail="Exemplo de cálculo"/>
      </div>
      <SampleList items={[
       {heading:'BÓSON',caption:'Não respondeu ao PF 2027',status:'Pendente'},
       {heading:'UNECT',caption:'Não respondeu ao PF 2027',status:'Pendente'},
       {heading:'3E',caption:'Resposta recebida no exemplo',status:'Concluída'}
      ]}/>
     </>}
     {section==='relatorios'&&<>
      <TitleBlock eyebrow="PRESCON • Consolidação" title="Relatórios institucionais"
        description="Resultados, posicionamentos, sugestões, ressalvas e encaminhamentos."/>
      <div className="kpi-grid">
       <Stat label="EJs votantes" value="17" detail="Exemplo de relatório"/>
       <Stat label="Aprovação" value="82%" detail="Exemplo de resultado"/>
       <Stat label="Ressalvas" value="3" detail="Aguardando análise"/>
       <Stat label="Sugestões" value="6" detail="Aguardando encaminhamento"/>
      </div>
      <div className="panel"><h3>Pareceres da PRESCON</h3>
       <p className="muted">A presidência analisa as manifestações e registra aceitação ou rejeição, justificativas e próximos passos.</p>
       <span className="badge blue">Relatório demonstrativo, sem dados reais</span></div>
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
    <div><strong>Gostou de conhecer o portal?</strong><p className="muted">Na operação real, cada pessoa entra com seu e-mail e vê somente o que seu perfil permite.</p></div>
    <Link href="/login" className="button primary">Ir para login institucional <ChevronRight size={18} aria-hidden/></Link>
   </div>
 </div>;
}
