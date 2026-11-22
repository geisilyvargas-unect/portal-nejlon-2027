import Link from 'next/link';
import {getDeliberations} from '@/lib/queries';
import {requireViewer} from '@/lib/auth';
import {createDeliberation} from '@/app/actions';
import {formatDate} from '@/lib/constants';
import {ScenarioBuilder} from '@/components/scenario-builder';
import {PfDeliberationWizard} from '@/components/pf-deliberation-wizard';

const brDate=(date:string)=>date.split('-').reverse().join('/');
export default async function Deliberations(){
  const viewer=await requireViewer();
  const items=await getDeliberations();
  const current=items.filter(d=>!d.is_historical);
  const historical=items.filter(d=>d.is_historical).sort((a,b)=>(b.historical_data?.period_end||'').localeCompare(a.historical_data?.period_end||''));
  return <div className="stack">
    <div><div className="eyebrow">Governança • Conselho</div><h1>Deliberações</h1>
      <p className="muted">Votações atuais, demonstrações e acervo histórico de decisões da Rede.</p>
    </div>
    {viewer.role==='prescon'&&<details className="panel" open><summary>+ Criar deliberação automaticamente a partir do PF</summary><PfDeliberationWizard/></details>}
    {viewer.role==='prescon'&&<details className="panel">
      <summary>+ Criar nova deliberação</summary>
      <form action={createDeliberation} className="fieldset" style={{marginTop:20}}>
        <label>Título<input name="title" required minLength={3} maxLength={250}/></label>
        <label>Contexto geral / orientações<textarea name="description" rows={4} placeholder="Explique o objetivo e o período da deliberação."/></label>
        <ScenarioBuilder/>
        <div className="form-grid">
          <label>Prazo para resposta<input name="due_at" type="datetime-local" required/></label>
          <label>Situação<select name="status"><option value="open">Publicar agora</option><option value="draft">Salvar rascunho</option></select></label>
        </div>
        <label className="inline-check"><input type="checkbox" name="direx_visible"/> Permitir que as DIREX visualizem</label>
        <button className="primary" type="submit">Salvar deliberação</button>
      </form>
    </details>}
    <section className="panel">
      <h2>Deliberações atuais</h2>
      {current.map(d=><div key={d.id} className="list-card">
        <div><div className="action-row"><h3 style={{margin:0}}>{d.title}</h3>
          <span className={'badge '+(d.is_demo?'blue':d.status==='open'?'lime':'red')}>
            {d.is_demo?'DEMONSTRAÇÃO':d.status==='open'?'ABERTA':d.status==='closed'?'ENCERRADA':'RASCUNHO'}
          </span></div>
          <p className="muted small" style={{margin:'7px 0'}}>{d.description.length>200?d.description.slice(0,200)+'…':d.description}</p>
          <span className="muted small">Prazo: {formatDate(d.due_at)}</span>
        </div>
        <Link href={'/deliberacoes/'+d.id} className="button outline">Acessar</Link>
      </div>)}
      {current.length===0&&<p className="muted">Nenhuma deliberação atual disponível para seu perfil.</p>}
    </section>
    <section className="panel">
      <div className="toolbar"><div><div className="eyebrow">Acervo institucional</div><h2 style={{margin:'8px 0'}}>Histórico de deliberações — 2026</h2>
        <p className="muted small" style={{margin:0}}>Resultados consolidados dos relatórios originais, sem gerar pendências ou votos artificiais.</p>
      </div><span className="badge">{historical.length} relatórios</span></div>
      {historical.map(d=><div key={d.id} className="list-card">
        <div><div className="action-row"><h3 style={{margin:0}}>{d.title}</h3><span className="badge">HISTÓRICO</span></div>
          <div className="muted small" style={{marginTop:9}}>
            {d.historical_data?.period_start&&d.historical_data?.period_end?
              brDate(d.historical_data.period_start)+' a '+brDate(d.historical_data.period_end):'2026'}
            {' · '}{d.historical_data?.voters??'—'} EJs votantes
            {' · '}{d.historical_data?.scenario_results.length??0} assunto(s)
          </div>
        </div><Link href={'/deliberacoes/'+d.id} className="button outline">Ver histórico</Link>
      </div>)}
      {historical.length===0&&<p className="muted">Nenhum relatório histórico importado.</p>}
    </section>
  </div>;
}
