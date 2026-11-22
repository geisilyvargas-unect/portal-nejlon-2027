import Link from 'next/link';
import {notFound} from 'next/navigation';
import {requireRole} from '@/lib/auth';
import {getEjs,getResponses} from '@/lib/queries';
import {createClient} from '@/lib/supabase/server';
import {getPendingEjs} from '@/lib/pending';
import {POSITIONS,formatDate,type Deliberation,type Position,type ResponseRow,type DeliberationScenario} from '@/lib/constants';
import {answersOf,scenariosOf} from '@/lib/deliberation-form';
import {ReportActions} from '@/components/clipboard';
import {CsvExport} from '@/components/csv-export';
import {saveReportNotes,saveResponseReview} from '@/app/actions';
import {HistoricalReport} from '@/components/historical-deliberation';
import {summarizeManualVotes,effectivePosition} from '@/lib/vote-rules';

type Review={
  id:string;response_id:string;scenario_key:string;aspect:'rejection'|'suggestion'|'caveat';
  decision:'under_review'|'accepted'|'rejected';comment:string;updated_at:string;
};
const colors:Record<Position,string>={
  favorable:'#3976d0',suggestions:'#ee8758',qualified:'#edbd42',against:'#d34b53',abstention:'#9c6cd9'
};
const decisionName:Record<Review['decision'],string>={
  under_review:'Em análise',accepted:'Acatado',rejected:'Não acatado'
};
const aspects=[
  {key:'rejection' as const,title:'PONTOS QUE LEVARAM À REPROVAÇÃO'},
  {key:'suggestion' as const,title:'SUGESTÕES'},
  {key:'caveat' as const,title:'RESSALVAS'}
];

function VotingChart({votes}:{votes:Position[]}){
  const keys=Object.keys(POSITIONS) as Position[];
  const counts=keys.map(key=>({key,label:POSITIONS[key],count:votes.filter(v=>v===key).length}));
  let accumulated=0;
  const slices=counts.filter(c=>c.count).map(c=>{
    const start=accumulated;
    accumulated+=c.count/votes.length*100;
    return colors[c.key]+' '+start.toFixed(3)+'% '+accumulated.toFixed(3)+'%';
  });
  const gradient=votes.length?'conic-gradient('+slices.join(', ')+')':'conic-gradient(#333 0% 100%)';
  return <div className="report-chart-row">
    <div className="report-pie" style={{background:gradient}} role="img" aria-label={counts.map(c=>c.label+': '+c.count).join(', ')}>
      <div className="report-pie-core"><strong>{votes.length}</strong><span>votos</span></div>
    </div>
    <div className="report-legend">{counts.map(c=><div key={c.key} className="report-legend-row">
      <span className="report-legend-color" style={{background:colors[c.key]}}/>
      <span>{c.label}</span><strong>{c.count}</strong>
      <span className="muted small">{votes.length?Math.round(c.count/votes.length*100):0}%</span>
    </div>)}</div>
  </div>;
}

export default async function ReportDetail({params}:{params:Promise<{id:string}>}){
  await requireRole(['prescon']);
  const {id}=await params;
  const db=await createClient();
  const [{data:raw},ejs,responses]=await Promise.all([
    db.from('deliberations').select('*').eq('id',id).eq('is_demo',false).maybeSingle(),
    getEjs(),getResponses([id])
  ]);
  if(!raw)notFound();
  const d=raw as Deliberation;
  if(d.is_historical)return <HistoricalReport d={d}/>;
  const scenarios=scenariosOf(d);
  const reviewResult=responses.length?await db.from('response_reviews').select('*').in('response_id',responses.map(r=>r.id)): {data:[],error:null};
  if(reviewResult.error)throw Error(reviewResult.error.message);
  const reviews=(reviewResult.data||[]) as Review[];
  const reviewFor=(r:ResponseRow,scenario:DeliberationScenario,aspect:Review['aspect'])=>
    reviews.find(review=>review.response_id===r.id&&review.scenario_key===scenario.key&&review.aspect===aspect);
  const ejName=(r:ResponseRow)=>ejs.find(e=>e.id===r.ej_id)?.name||r.ej_id;
  const pending=getPendingEjs(ejs,responses);
  const total=ejs.length;
  const turnout=total?Math.round(responses.length/total*10000)/100:0;
  const feedbacks=responses.map(r=>r.final_feedback||{});
  const average=(key:'clarity'|'difficulty')=>{
    const values=feedbacks.map(f=>f[key]).filter((n):n is number=>typeof n==='number'&&Number.isFinite(n));
    return values.length?(values.reduce((a,b)=>a+b,0)/values.length).toFixed(1):'—';
  };
  const textLines=[
    'RELATÓRIO DA DELIBERAÇÃO — NEJLON 2027','',d.title,
    'Descrição: '+(d.description||'—'),'Prazo: '+formatDate(d.due_at),
    'Gerado em: '+formatDate(new Date().toISOString()),
    '','1. PANORAMA GERAL',
    'EJs esperadas: '+total,'EJs votantes: '+responses.length,
    'Representatividade: '+turnout.toFixed(2)+'%',
    'EJs pendentes: '+pending.length
  ];
  for(const [index,scenario] of scenarios.entries()){
    const voters=responses.map(r=>({r,answer:answersOf(r,scenarios)[index]}));
    const positions=voters.map(x=>x.answer.position);
    const direct=voters.filter(x=>x.answer.position==='favorable'||x.answer.position==='suggestions').length;
    const conditional=voters.filter(x=>x.answer.position==='qualified').length;
    const manual=summarizeManualVotes(voters.map(({r,answer})=>({
      position:answer.position,caveatDecision:reviewFor(r,scenario,'caveat')?.decision
    })));
    textLines.push('',(index+2)+'. '+scenario.title.toUpperCase(),
      ...Object.entries(POSITIONS).map(([key,label])=>label+': '+positions.filter(v=>v===key).length),
      'Aprovação direta (sem ressalvas): '+(positions.length?Math.round(direct/positions.length*10000)/100:0)+'% dos votos recebidos',
      'Votos com ressalvas: '+conditional,
      'Manual aplicado — aprovações confirmadas: '+manual.approved,
      'Manual aplicado — reprovações confirmadas: '+manual.rejected,
      'Manual aplicado — ressalvas ainda pendentes: '+manual.pending,
      'Manual aplicado — abstenções: '+manual.abstentions,
      'A situação final continua sujeita à validação institucional.');
    for(const aspect of aspects){
      textLines.push('',aspect.title);
      let found=false;
      for(const {r,answer} of voters){
        const value=aspect.key==='rejection'?(answer.position==='against'?answer.justification:''):
          aspect.key==='suggestion'?answer.suggestions:answer.caveats;
        if(!value)continue;
        found=true;
        const review=reviewFor(r,scenario,aspect.key);
        textLines.push('• '+ejName(r)+': '+value,
          '  Parecer da PRESCON: '+(review?.comment||'Aguardando análise')+
          (review?' ('+decisionName[review.decision]+')':''));
      }
      if(!found)textLines.push('Não foram apresentados pontos.');
    }
  }
  textLines.push('','CONSIDERAÇÕES FINAIS',
    'Clareza média (0 a 5): '+average('clarity'),
    'Dificuldade média (0 a 5): '+average('difficulty'),
    ...responses.filter(r=>r.final_feedback?.improvements).map(r=>ejName(r)+': '+r.final_feedback?.improvements),
    '','EJs PENDENTES',...(pending.length?pending.map(x=>'• '+x.name):['Nenhuma']),
    '','CONSIDERAÇÕES DA PRESCON',d.report_notes||'—','',
    'ENCAMINHAMENTOS',d.report_followup||'—','',
    'Relatório informativo. A validade do resultado depende do Regimento Interno e da análise institucional das ressalvas.'
  );
  const exportText=textLines.join('\n');
  const csvRows:(string|number|null|undefined)[][]=[
    ['Data da resposta','EJ',...scenarios.flatMap((sc,index)=>[
      'Sobre o [C'+(index+1)+'] '+sc.title+', você...',
      'Justificativa ['+sc.key+']','Sugestões ['+sc.key+']','Ressalvas ['+sc.key+']',
      'Parecer da PRESCON — sugestões ['+sc.key+']','Parecer da PRESCON — ressalvas ['+sc.key+']',
      'Situação das ressalvas ['+sc.key+']','Contagem após análise ['+sc.key+']'
    ]),'Clareza (0–5)','Dificuldade (0–5)','Como podemos melhorar?'],
    ...responses.map(r=>[
      r.updated_at,ejName(r),
      ...answersOf(r,scenarios).flatMap((a,i)=>[
        POSITIONS[a.position],a.justification,a.suggestions,a.caveats,
        reviewFor(r,scenarios[i],'suggestion')?.comment||'',
        reviewFor(r,scenarios[i],'caveat')?.comment||'',
        a.position==='qualified'?(reviewFor(r,scenarios[i],'caveat')?.decision||'under_review'):'',
        ({approved:'Aprovação',rejected:'Reprovação',pending:'Aguardando PRESCON',abstention:'Abstenção'} as const)[
          effectivePosition(a.position,reviewFor(r,scenarios[i],'caveat')?.decision)
        ]
      ]),
      r.final_feedback?.clarity,r.final_feedback?.difficulty,r.final_feedback?.improvements
    ])
  ];


  return <div className="stack report-document">
    <div className="no-print"><Link href="/relatorios" className="link">← Relatórios</Link></div>
    <header className="panel report-heading">
      <div className="eyebrow">NEJ LONDRINA · PRESIDÊNCIA DO CONSELHO</div>
      <h1>Relatório da Deliberação</h1><h2>{d.title}</h2>
      <p className="muted">Documento de acompanhamento e transparência das respostas do Conselho Deliberativo.</p>
      <div className="action-row small muted"><span>Prazo: {formatDate(d.due_at)}</span><span>·</span><span>Gerado em: {formatDate(new Date().toISOString())}</span></div>
    </header>
    <CsvExport rows={csvRows} filename={'deliberacao-'+d.id+'-respostas.csv'}/>
      <ReportActions content={exportText} filename={'relatorio-nejlon-'+id.slice(0,8)+'.txt'}/>
    <section className="panel">
      <h2>1. Panorama geral</h2>
      <div className="kpi-grid">
        <div className="report-kpi"><span>EJs do Núcleo</span><strong>{total}</strong></div>
        <div className="report-kpi"><span>EJs votantes</span><strong>{responses.length}</strong></div>
        <div className="report-kpi"><span>Representatividade</span><strong>{turnout.toFixed(2)}%</strong></div>
        <div className="report-kpi"><span>Pendências</span><strong>{pending.length}</strong></div>
      </div>
      <p className="muted small" style={{marginTop:15}}>Representatividade calculada sobre as {total} EJs cadastradas. As aprovações condicionadas a ressalvas não são automaticamente consideradas aprovadas.</p>
    </section>
    {scenarios.map((scenario,index)=>{
      const entries=responses.map(r=>({r,answer:answersOf(r,scenarios)[index]}));
      const positions=entries.map(e=>e.answer.position);
      const direct=positions.filter(p=>p==='favorable'||p==='suggestions').length;
      const conditional=positions.filter(p=>p==='qualified').length;
      const manual=summarizeManualVotes(entries.map(({r,answer})=>({
        position:answer.position,caveatDecision:reviewFor(r,scenario,'caveat')?.decision
      })));
      return <section className="panel report-scenario" key={scenario.key}>
        <div className="eyebrow">Cenário {index+1}</div>
        <h2 style={{marginTop:8}}>{index+2}. {scenario.title}</h2>
        {scenario.description&&<p className="whitespace muted">{scenario.description}</p>}
        <h3>{index+2}.1. Resultado dos posicionamentos</h3>
        <VotingChart votes={positions}/>
        <div className="report-result-note">
          <strong>Aprovação direta: {positions.length?(direct/positions.length*100).toFixed(2):'0,00'}% dos votos recebidos</strong>
          <span className="muted small">{conditional} voto(s) com ressalvas. O resultado abaixo se atualiza após a manifestação da PRESCON.</span>
        </div>
        <div className="manual-accounting" aria-label="Consolidação automática segundo as opções do formulário">
          <div className="eyebrow">MANUAL APLICADO • APÓS A ANÁLISE DAS RESSALVAS</div>
          <div className="manual-accounting-grid">
            <div className="approved"><span>Aprovações confirmadas</span><strong>{manual.approved}</strong></div>
            <div className="rejected"><span>Reprovações confirmadas</span><strong>{manual.rejected}</strong></div>
            <div className="waiting"><span>Ressalvas em análise</span><strong>{manual.pending}</strong></div>
            <div className="abstentions"><span>Abstenções</span><strong>{manual.abstentions}</strong></div>
          </div>
          <p className="muted small">{manual.pending>0
            ?'Ainda há ressalvas aguardando a decisão da PRESCON; não é possível considerar a contagem consolidada.'
            :'Todas as ressalvas registradas receberam encaminhamento, mas a aprovação formal depende da análise institucional.'}</p>
        </div>
        {aspects.map((aspect,aspectIndex)=>{
          const notes=entries.map(({r,answer})=>({
            r,
            value:aspect.key==='rejection'?(answer.position==='against'?answer.justification:''):
              aspect.key==='suggestion'?answer.suggestions:answer.caveats
          })).filter(x=>x.value);
          return <div className="report-aspect" key={aspect.key}>
            <h3>{index+2}.{aspectIndex+2}. {aspect.title}</h3>
            {notes.length===0&&<p className="muted">Não foram apresentados pontos de {aspect.key==='rejection'?'reprovação':aspect.key==='suggestion'?'sugestão':'ressalva'}.</p>}
            {notes.map(({r,value})=>{
              const review=reviewFor(r,scenario,aspect.key);
              return <article className="report-remark" key={r.id+'-'+aspect.key}>
                <p><strong>{ejName(r)}</strong> · {value}</p>
                <div className="report-review"><strong>PRESCON: {review?decisionName[review.decision]:'Aguardando análise'}</strong>
                  <p className="whitespace">{review?.comment||'Sem manifestação cadastrada.'}</p>
                </div>
                <details className="no-print report-review-editor">
                  <summary>{review?'Editar manifestação da PRESCON':'+ Registrar manifestação da PRESCON'}</summary>
                  <form action={saveResponseReview} className="fieldset" style={{marginTop:12}}>
                    <input type="hidden" name="deliberation_id" value={id}/>
                    <input type="hidden" name="response_id" value={r.id}/>
                    <input type="hidden" name="scenario_key" value={scenario.key}/>
                    <input type="hidden" name="aspect" value={aspect.key}/>
                    <label>Encaminhamento<select name="decision" defaultValue={review?.decision||'under_review'}>
                      <option value="under_review">Em análise</option><option value="accepted">Acatado</option><option value="rejected">Não acatado</option>
                    </select></label>
                    <label>Resposta fundamentada<textarea name="comment" rows={3} defaultValue={review?.comment||''} placeholder="Posicionamento da PRESCON e encaminhamento dado ao ponto."/></label>
                    <button className="primary" type="submit">Salvar manifestação</button>
                  </form>
                </details>
              </article>;
            })}
          </div>;
        })}
      </section>;
    })}
    <section className="panel">
      <h2>{scenarios.length+2}. Considerações finais do formulário</h2>
      <div className="form-grid">
        <div className="report-kpi"><span>Clareza média (0–5)</span><strong>{average('clarity')}</strong></div>
        <div className="report-kpi"><span>Dificuldade média (0–5)</span><strong>{average('difficulty')}</strong></div>
      </div>
      <h3 style={{marginTop:18}}>Como podemos melhorar?</h3>
      {responses.filter(r=>r.final_feedback?.improvements).map(r=><div key={r.id} className="report-remark"><strong>{ejName(r)}</strong><p className="whitespace">{r.final_feedback?.improvements}</p></div>)}
      {!responses.some(r=>r.final_feedback?.improvements)&&<p className="muted">Nenhum feedback registrado.</p>}
    </section>
    <section className="panel"><h2>EJs pendentes ({pending.length})</h2>
      <div className="tag-group">{pending.map(e=><span className="badge red" key={e.id}>{e.name}</span>)}{pending.length===0&&<span className="badge lime">Todas as EJs responderam</span>}</div>
    </section>
    <section className="panel"><h2>Considerações e encaminhamentos da PRESCON</h2>
      <div><h3>Considerações</h3><p className="whitespace">{d.report_notes||'Aguardando preenchimento.'}</p>
        <h3>Encaminhamentos</h3><p className="whitespace">{d.report_followup||'Aguardando preenchimento.'}</p></div>
      <form action={saveReportNotes} className="fieldset no-print" style={{marginTop:18}}>
        <input type="hidden" name="id" value={id}/>
        <label>Editar considerações<textarea name="report_notes" rows={4} defaultValue={d.report_notes||''}/></label>
        <label>Editar encaminhamentos<textarea name="report_followup" rows={4} defaultValue={d.report_followup||''}/></label>
        <button className="primary" type="submit">Salvar considerações</button>
      </form>
    </section>
    <footer className="small muted">Relatório informativo. A validação formal dos resultados e o tratamento das ressalvas dependem do Regimento Interno e das regras institucionais aplicáveis.</footer>
  </div>;
}
