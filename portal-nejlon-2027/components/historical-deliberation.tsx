import Link from 'next/link';
import type {Deliberation,HistoricalScenario} from '@/lib/constants';
import {ReportActions} from '@/components/clipboard';

function formatHistoricalDate(iso:string) {
  const date=new Date(iso+'T12:00:00Z');
  return Number.isNaN(date.getTime())?iso:new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'long',year:'numeric',timeZone:'UTC'}).format(date);
}
function percentage(value:number) {
  return Number.isFinite(value)?value.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%':'—';
}
function HistoricalContent({d}:{d:Deliberation}){
  const h=d.historical_data;
  if(!h)return <div className="panel">Não há dados históricos vinculados a este registro.</div>;
  const scenarios=Array.isArray(h.scenario_results)?h.scenario_results:[];
  return <div className="stack history-report">
    <div className="notice history-notice">
      <strong>Registro histórico encerrado · 2026.</strong> Estes resultados foram importados de um relatório consolidado.
      Não representam votos individuais cadastrados no portal e não geram pendências.
    </div>
    <div className="panel">
      <h2>1. Panorama geral</h2>
      <p className="muted">Votação de {formatHistoricalDate(h.period_start)} até {formatHistoricalDate(h.period_end)}.</p>
      <div className="kpi-grid">
        <div className="report-kpi"><span>EJs votantes (relatório)</span><strong>{h.voters}</strong></div>
        <div className="report-kpi"><span>Representatividade informada</span><strong>{percentage(h.representation_percent)}</strong></div>
        <div className="report-kpi"><span>Assuntos deliberados</span><strong>{scenarios.length}</strong></div>
      </div>
      <p className="small muted" style={{marginTop:16}}>
        A representatividade corresponde ao universo de EJs com conselheiros considerado no documento original de 2026,
        não às 29 EJs atualmente cadastradas no portal.
      </p>
    </div>
    {scenarios.map((scenario:HistoricalScenario,i:number)=><section className="panel history-scenario" key={scenario.key}>
      <div className="eyebrow">Assunto {i+1} de {scenarios.length}</div>
      <h2 style={{marginTop:8}}>{scenario.title}</h2>
      <div className="history-rate">
        <div><span className="muted small">Aprovação consolidada informada</span>
          <div className="history-percent">{percentage(scenario.approval_percent)}</div>
        </div>
        <div className="history-rate-track" aria-label={'Aprovação informada: '+percentage(scenario.approval_percent)}>
          <span style={{width:Math.max(0,Math.min(100,scenario.approval_percent))+'%'}}/>
        </div>
      </div>
      <details className="history-text-detail">
        <summary>Ver pontos levantados, sugestões, ressalvas e manifestações da PRESCON</summary>
        <div className="history-report-text">{scenario.section_text||'Esta seção não apresenta texto adicional no arquivo fornecido.'}</div>
      </details>
    </section>)}
    {(h.additional_metrics?.length??0)>0&&<section className="panel">
      <h2>Resultados complementares</h2>
      {h.additional_metrics?.map((m,i)=><div className="list-card" key={i}>
        <span>{m.label}</span><strong>{percentage(m.percentage)}</strong>
      </div>)}
    </section>}
    <section className="panel">
      <h2>Documento de origem</h2>
      <p><strong>Arquivo:</strong> {h.source_filename}</p>
      <p><strong>Presidência do Conselho:</strong> {h.report_author}</p>
      {h.source_note&&<div className="notice"><strong>Nota de transcrição:</strong> {h.source_note}</div>}
      <details className="history-text-detail">
        <summary>Consultar transcrição integral do relatório</summary>
        <div className="history-report-text">{d.historical_report_text||'Texto não disponível.'}</div>
      </details>
      <p className="small muted" style={{marginTop:14}}>Texto extraído do PDF enviado. Os gráficos originais foram representados pelos percentuais declarados no panorama do relatório; não houve atribuição de votos a EJs específicas.</p>
    </section>
  </div>;
}
export function HistoricalDetail({d,showReportLink=false}:{d:Deliberation;showReportLink?:boolean}){
  return <div className="stack">
    <div><Link href="/deliberacoes" className="link">← Deliberações</Link>
      <div className="eyebrow" style={{marginTop:18}}>Acervo histórico · Conselho Deliberativo · 2026</div>
      <h1>{d.title}</h1>
      <div className="action-row"><span className="badge">HISTÓRICO ENCERRADO</span>
        {showReportLink&&<Link className="button outline" href={'/relatorios/'+d.id}>Exportar relatório</Link>}
      </div>
    </div>
    <HistoricalContent d={d}/>
  </div>;
}
export function HistoricalReport({d}:{d:Deliberation}){
  return <div className="stack">
    <div className="no-print"><Link href="/relatorios" className="link">← Relatórios</Link></div>
    <header className="panel report-heading"><div className="eyebrow">NEJ LONDRINA · ACERVO DO CONSELHO 2026</div>
      <h1>{d.title}</h1>
      <p className="muted">Histórico de resultados consolidados, conforme documento original.</p>
    </header>
    <ReportActions content={d.historical_report_text||''} filename={'relatorio-historico-'+(d.historical_source_id||d.id)+'.txt'}/>
    <HistoricalContent d={d}/>
  </div>;
}
