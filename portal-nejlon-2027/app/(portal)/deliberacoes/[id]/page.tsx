import Link from 'next/link';
import {notFound} from 'next/navigation';
import {requireViewer} from '@/lib/auth';
import {createClient} from '@/lib/supabase/server';
import {getEjs} from '@/lib/queries';
import {formatDate,POSITIONS,type Deliberation,type ResponseRow} from '@/lib/constants';
import {answersOf,scenariosOf} from '@/lib/deliberation-form';
import {DeliberationResponseForm} from '@/components/deliberation-response-form';
import {changeDeliberationStatus} from '@/app/actions';

export default async function DelibDetail({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const viewer=await requireViewer();
  const db=await createClient();
  const {data:row}=await db.from('deliberations').select('*').eq('id',id).maybeSingle();
  if(!row)notFound();
  const deliberation=row as Deliberation;
  const scenarios=scenariosOf(deliberation);
  const {data:rawResponses,error}=await db.from(deliberation.is_demo?'demo_responses':'responses').select('*').eq('deliberation_id',id);
  if(error)throw Error(error.message);
  const responses=(rawResponses||[]) as ResponseRow[];
  const ejs=await getEjs();
  const myVote=viewer.ej_id?responses.find(r=>r.ej_id===viewer.ej_id):undefined;
  const mayVote=viewer.role==='counselor'&&!deliberation.is_demo&&deliberation.status==='open'&&new Date(deliberation.due_at).getTime()>Date.now();

  return <div className="stack">
    <div><Link href="/deliberacoes" className="muted small">← Voltar para deliberações</Link>
      <div className="eyebrow" style={{marginTop:16}}>Conselho deliberativo · {scenarios.length} cenário(s)</div>
      <h1>{deliberation.title}</h1>
      <div className="action-row"><span className={'badge '+(deliberation.is_demo?'blue':deliberation.status==='open'?'lime':'red')}>{deliberation.is_demo?'DADOS FICTÍCIOS':deliberation.status==='open'?'ABERTA':deliberation.status==='closed'?'ENCERRADA':'RASCUNHO'}</span><span className="muted small">Prazo: {formatDate(deliberation.due_at)}</span></div>
    </div>
    <div className="panel"><h2>Orientações gerais</h2><p className="whitespace">{deliberation.description||'Analise os documentos de cada cenário e registre seu posicionamento.'}</p></div>
    {deliberation.is_demo&&<div className="notice">Simulação: respostas fictícias não contam para pendências nem relatórios oficiais.</div>}
    {scenarios.map((scenario,i)=><div className="panel" key={scenario.key}>
      <div className="eyebrow">Cenário {i+1}</div><h2 style={{marginTop:9}}>{scenario.title}</h2>
      {scenario.description&&<p className="whitespace muted">{scenario.description}</p>}
      {scenario.material_url&&<a className="link" href={scenario.material_url} target="_blank" rel="noopener noreferrer">Abrir material de apoio ↗</a>}
    </div>)}
    {viewer.role==='prescon'&&<div className="panel">
      <div className="toolbar"><h2>Acompanhamento das EJs</h2>{!deliberation.is_demo&&<Link className="button outline" href={'/relatorios/'+id}>Ver relatório consolidado</Link>}</div>
      <p><strong>{responses.length}</strong> de {ejs.length} EJs registraram posicionamento {deliberation.is_demo?'(demonstração)':''}.</p>
      {responses.map(r=><details key={r.id} className="review-ej">
        <summary>{ejs.find(e=>e.id===r.ej_id)?.name||'EJ'} · {scenarios.length>1?'Ver todos os cenários':POSITIONS[r.position]}</summary>
        <div className="stack" style={{marginTop:14}}>{answersOf(r,scenarios).map((answer,i)=><div key={answer.scenario_key}>
          <strong>{i+1}. {scenarios[i]?.title||'Cenário'} — {POSITIONS[answer.position]}</strong>
          {answer.justification&&<p className="whitespace small">Justificativa: {answer.justification}</p>}
          {answer.suggestions&&<p className="whitespace small">Sugestões: {answer.suggestions}</p>}
          {answer.caveats&&<p className="whitespace small">Ressalvas: {answer.caveats}</p>}
        </div>)}</div>
      </details>)}
      {responses.length===0&&<p className="muted">Nenhuma resposta registrada até o momento.</p>}
      {!deliberation.is_demo&&<form action={changeDeliberationStatus} className="action-row no-print" style={{marginTop:22}}>
        <input type="hidden" name="id" value={id}/>
        <label>Alterar situação<select name="status" defaultValue={deliberation.status}><option value="draft">Rascunho</option><option value="open">Aberta</option><option value="closed">Encerrada</option></select></label>
        <button type="submit">Salvar status</button>
      </form>}
    </div>}
    {mayVote&&<div className="panel">
      <h2>{myVote?'Atualize a resposta da sua EJ':'Deliberação oficial da sua EJ'}</h2>
      <DeliberationResponseForm deliberationId={id} scenarios={scenarios} previous={myVote}/>
    </div>}
    {viewer.role==='counselor'&&!mayVote&&!deliberation.is_demo&&<div className="panel"><h2>Prazo encerrado</h2><p className="muted">Esta deliberação não aceita mais respostas. {myVote?'O posicionamento da sua EJ está registrado.':'Nenhuma resposta foi enviada pela sua EJ.'}</p></div>}
    {viewer.role==='ej_direx'||viewer.role==='nucleus_direx'?<div className="notice">Seu perfil pode acompanhar esta deliberação, mas não registrar o voto oficial.</div>:null}
  </div>;
}
