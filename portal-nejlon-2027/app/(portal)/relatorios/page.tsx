import Link from 'next/link';
import {requireRole} from '@/lib/auth';
import {getDeliberations} from '@/lib/queries';
import {formatDate} from '@/lib/constants';

export default async function Reports(){
  await requireRole(['prescon']);
  const db=await (await import('@/lib/supabase/server')).createClient();
  const {data:published}=await db.from('published_deliberation_reports').select('id,title,version,published_at').order('published_at',{ascending:false}).limit(100);
  const all=(await getDeliberations()).filter(d=>!d.is_demo);
  const current=all.filter(d=>!d.is_historical);
  const historical=all.filter(d=>d.is_historical);
  return <div className="stack">
    <div><div className="eyebrow">PRESCON • Consolidação</div><h1>Relatórios</h1>
      <p className="muted">Resultados atuais e registros históricos de 2026 preservados separadamente.</p></div>
    <div className="panel">
      <h2>Relatórios de deliberações atuais</h2>
      {current.map(d=><div className="list-card" key={d.id}><div><h3>{d.title}</h3>
        <div className="small muted">{formatDate(d.due_at)} • {d.status}</div></div>
        <Link className="button outline" href={'/relatorios/'+d.id}>Abrir relatório</Link></div>)}
      {current.length===0&&<p className="muted">Nenhum relatório atual disponível.</p>}
    </div>
    <div className="panel">
      <div className="toolbar"><h2>Acervo de relatórios — 2026</h2><span className="badge">{historical.length} documentos</span></div>
      {historical.map(d=><div className="list-card" key={d.id}><div><h3>{d.title}</h3>
        <div className="small muted">Histórico encerrado • {d.historical_data?.voters??'—'} EJs votantes •
          {' '}{d.historical_data?.scenario_results.length??0} cenários</div></div>
        <Link className="button outline" href={'/relatorios/'+d.id}>Ver documento</Link>
      </div>)}
      {historical.length===0&&<p className="muted">Nenhum documento histórico disponível.</p>}
    </div>
  </div>;
}
