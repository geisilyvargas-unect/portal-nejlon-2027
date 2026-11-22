import Link from 'next/link';
import {notFound} from 'next/navigation';
import {requireRole} from '@/lib/auth';
import {createClient} from '@/lib/supabase/server';
import {POSITIONS,formatDate,type Position} from '@/lib/constants';
import {PublishedReportPrint} from '@/components/published-report-print';

type Scenario={title:string;votes:number;counts:Record<string,number>};
type Content={description:string;status:string;due_at:string;total_ejs:number;voters:number;scenarios:Scenario[];privacy:string};
export default async function PublishedReport({params}:{params:Promise<{id:string}>}){
 await requireRole(['prescon','counselor']);
 const {id}=await params;
 if(!/^[0-9a-f-]{36}$/i.test(id))notFound();
 const db=await createClient();
 const {data,error}=await db.from('published_deliberation_reports').select('id,title,version,published_at,content').eq('id',id).maybeSingle();
 if(error||!data)notFound();
 const content=data.content as Content;
 const total=Number(content.total_ejs)||0,voters=Number(content.voters)||0;
 return <div className="stack report-document">
  <div className="no-print"><Link href="/deliberacoes" className="link">← Deliberações</Link></div>
  <header className="panel report-heading"><div className="eyebrow">NEJLON · RELATÓRIO PUBLICADO</div><h1>{data.title}</h1>
  <p className="muted">Versão {data.version} · Publicado em {formatDate(data.published_at)} · Link permanente restrito ao Conselho</p>
  <PublishedReportPrint url={'/relatorios/publicado/'+id}/></header>
  <section className="panel"><h2>1. Panorama geral</h2><p>{content.description}</p>
   <div className="kpi-grid"><div className="report-kpi"><span>EJs da Rede</span><strong>{total}</strong></div><div className="report-kpi"><span>EJs votantes</span><strong>{voters}</strong></div><div className="report-kpi"><span>Representatividade</span><strong>{total?(voters/total*100).toFixed(1):'0'}%</strong></div><div className="report-kpi"><span>EJs pendentes</span><strong>{Math.max(0,total-voters)}</strong></div></div>
  </section>
  {(content.scenarios||[]).map((scenario,i)=><section className="panel" key={i}><div className="eyebrow">CENÁRIO {i+1}</div><h2>{i+2}. {scenario.title}</h2>
   <h3>Resultado dos posicionamentos</h3><div className="report-legend">{(Object.keys(POSITIONS) as Position[]).map(position=><div className="report-legend-row" key={position}><span>{POSITIONS[position]}</span><strong>{scenario.counts?.[position]||0}</strong><span className="muted small">{scenario.votes?((scenario.counts?.[position]||0)/scenario.votes*100).toFixed(1):'0'}%</span></div>)}</div>
   <p className="muted small">As ressalvas dependem de análise institucional. Este resumo não representa homologação automática.</p>
  </section>)}
  <section className="panel"><h2>Privacidade e publicação</h2><p>Esta versão contém apenas resultados agregados. Identidades das EJs, comentários individuais e manifestações nominais não são divulgados.</p><p className="muted small">O endereço permanece o mesmo para esta versão; futuras atualizações exigem nova publicação pela PRESCON.</p></section>
 </div>;
}