import {type ReactNode} from 'react';

type AccessView={heading:string,account:string,description:string,points:string[]};
const views:AccessView[]=[
  {heading:'Visão PRESCON',account:'presconteste@nejlondrina.com (conta já ativa)',description:'Administração geral do Conselho e da rede.',points:[
    'Cria e acompanha deliberações; analisa sugestões e ressalvas.',
    'Visualiza os votos das EJs, relatórios e Central de Pendências.',
    'Gerencia acessos, Jornada, biblioteca, calendário e demandas.'
  ]},
  {heading:'Visão Conselho',account:'conselho[nomedaej]@nejlondrina.com',description:'Acesso deliberativo vinculado à própria EJ.',points:[
    'Vota em nome da sua EJ nas deliberações abertas.',
    'Consulta as próprias respostas, a agenda e os materiais liberados.',
    'Não visualiza votos privados de outras EJs nem administra usuários.'
  ]},
  {heading:'Visão DIREX da EJ',account:'direx[nomedaej]@nejlondrina.com',description:'Acompanhamento executivo da sua empresa júnior.',points:[
    'Acompanha as deliberações liberadas para as diretorias, sem votar.',
    'Visualiza demandas vinculadas à EJ e o calendário do núcleo.',
    'Não consulta os relatórios restritos nem a gestão da PRESCON.'
  ]},
  {heading:'Visão DIREX do Núcleo',account:'direx@nejlondrina.com',description:'Gestão de tarefas e eventos no âmbito do núcleo.',points:[
    'Acompanha deliberações liberadas para as diretorias, sem votar.',
    'Cadastra e acompanha demandas e eventos do calendário.',
    'Não vota nem gerencia contas ou relatórios reservados à PRESCON.'
  ]}
];
export function AccessGuide({compact=false}:{compact?:boolean}){
  return <section className={'access-guide '+(compact?'access-guide-compact':'')}>
    <div className="access-guide-heading"><div className="eyebrow">Entenda os acessos</div>
      <h2>O que cada perfil consegue visualizar?</h2>
      <p className="muted small">A permissão é vinculada ao e-mail e ao perfil cadastrado no banco. Cada conta é independente, mesmo que duas contas sejam da mesma EJ.</p>
    </div>
    <div className="access-guide-grid">
      {views.map(view=><article className="access-guide-card" key={view.heading}>
        <h3>{view.heading}</h3>
        <p className="muted small">{view.description}</p>
        <code className="access-guide-account">{view.account}</code>
        <ul>{view.points.map(point=><li key={point}>{point}</li>)}</ul>
      </article>)}
    </div>
  </section>;
}
