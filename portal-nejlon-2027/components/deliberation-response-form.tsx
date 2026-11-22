'use client';
import {useState} from 'react';
import {submitResponse} from '@/app/actions';
import {POSITIONS,type DeliberationScenario,type Position,type ResponseRow,type ScenarioAnswer} from '@/lib/constants';
import {answersOf,VOTE_DESCRIPTIONS} from '@/lib/deliberation-form';
import {VotingManual} from '@/components/voting-manual';

type Field='position'|'justification'|'caveats'|'suggestions';
export function DeliberationResponseForm({deliberationId,scenarios,previous}:{deliberationId:string;scenarios:DeliberationScenario[];previous?:ResponseRow}){
  const [answers,setAnswers]=useState<ScenarioAnswer[]>(()=>answersOf(previous,scenarios).map(a=>previous?a:{...a,position:'' as ScenarioAnswer['position']}));
  const change=(key:string,field:Field,value:string)=>setAnswers(old=>old.map(a=>{
    if(a.scenario_key!==key)return a;
    if(field!=='position')return {...a,[field]:value};
    // Uma escolha não deve carregar ressalvas/sugestões de outro posicionamento.
    if(value==='abstention')return {...a,position:value as Position,justification:'',suggestions:'',caveats:''};
    return {
      ...a,position:value as Position,
      suggestions:value==='suggestions'?a.suggestions:'',
      caveats:value==='qualified'?a.caveats:''
    };
  }));
  const complete=answers.filter(a=>Boolean(a.position)&&
    (a.position!=='against'||Boolean(a.justification.trim()))&&
    (a.position!=='suggestions'||Boolean(a.suggestions.trim()))&&
    (a.position!=='qualified'||Boolean(a.caveats.trim()))).length;
  const feedback=previous?.final_feedback||{};
  return <form action={submitResponse} className="fieldset">
    <input type="hidden" name="deliberation_id" value={deliberationId}/>
    <input type="hidden" name="answers_json" value={JSON.stringify(answers)}/>
    <div className="voting-wizard-head">
      <span className="eyebrow">VOTAÇÃO INSTITUCIONAL • CONSELHO DELIBERATIVO</span>
      <h2>Seu voto, passo a passo</h2>
      <p>Analise cada assunto, escolha uma opção e preencha somente os campos correspondentes. O sistema identifica sua EJ pelo login.</p>
      <div className="voting-wizard-stats" aria-label="Progresso das respostas">
        <strong>{complete} / {scenarios.length}</strong>
        <span>cenários concluídos</span>
        <div className="voting-wizard-track" role="progressbar" aria-valuenow={complete} aria-valuemin={0}
          aria-valuemax={scenarios.length}><span style={{width:(complete/scenarios.length*100)+'%'}}/></div>
      </div>
    </div>
    <VotingManual compact/>
    <div className="notice">Seu voto será registrado <strong>uma única vez, em nome da sua EJ</strong>. O envio só é concluído após responder todos os cenários e as perguntas finais.</div>
    {scenarios.map((scenario,index)=>{
      const answer=answers.find(a=>a.scenario_key===scenario.key);
      if(!answer)return null;
      return <section key={scenario.key} className="vote-scenario">
        <div className="eyebrow">ETAPA {index+1} DE {scenarios.length} • CENÁRIO PARA DELIBERAÇÃO</div>
        <h3>{scenario.title}</h3>
        {scenario.description&&<p className="muted whitespace">{scenario.description}</p>}
        {scenario.material_url&&<p><a href={scenario.material_url} target="_blank" rel="noopener noreferrer" className="link">Consultar material para deliberação ↗</a></p>}
        <fieldset className="vote-position-group">
          <legend>Sobre o [C{index+1}] CENÁRIO {index+1}, você... *</legend>
          <div className="vote-position-options">
            {(Object.keys(POSITIONS) as Position[]).map(key=><label key={key} className={answer.position===key?'active':''}>
              <input type="radio" name={'position-'+scenario.key} value={key} required
                checked={answer.position===key} onChange={()=>change(scenario.key,'position',key)}/>
              <span>{POSITIONS[key]}</span>
            </label>)}
          </div>
        </fieldset>
        <p className="small muted vote-hint" style={{margin:0}}>{answer.position?VOTE_DESCRIPTIONS[answer.position]: 'Selecione a opção que representa o posicionamento da sua EJ.'}</p>
        {answer.position==='qualified'&&<div className="vote-manual-warning">Ressalva condicionada: a PRESCON avaliará sua condição antes que ela conte como aprovação ou reprovação.</div>}
        {answer.position==='suggestions'&&<div className="vote-manual-success">Esta opção já conta como aprovação; suas sugestões serão encaminhadas para análise.</div>}
        {answer.position&&answer.position!=='abstention'&&<label>Justifique sua decisão {answer.position==='against'?'*':'(opcional)'}
          <textarea required={answer.position==='against'} value={answer.justification} onChange={e=>change(scenario.key,'justification',e.target.value)} placeholder="Quais são os pontos que fundamentam seu posicionamento?"/>
        </label>}
        {answer.position==='suggestions'&&<label>Sugestões de melhoria {answer.position==='suggestions'?'*':'(opcional)'}
          <textarea required={answer.position==='suggestions'} value={answer.suggestions} onChange={e=>change(scenario.key,'suggestions',e.target.value)} placeholder="Quais melhorias você propõe?"/>
        </label>}
        {answer.position==='qualified'&&<label>Ressalvas / condições para aprovação {answer.position==='qualified'?'*':'(opcional)'}
          <textarea required={answer.position==='qualified'} value={answer.caveats} onChange={e=>change(scenario.key,'caveats',e.target.value)} placeholder="Qual condição precisa ser atendida para que a proposta seja aprovada?"/>
        </label>}
      </section>;
    })}
    <section className="vote-scenario">
      <div className="eyebrow">Seção final</div>
      <h3>Considerações finais</h3>
      <div className="form-grid">
        <label>O quão claro ficou as opções e as formas de votação? *
          <select name="clarity" required defaultValue={feedback.clarity===undefined?'':String(feedback.clarity)}>
            <option value="" disabled>Selecione</option>
            {[0,1,2,3,4,5].map(n=><option key={n} value={n}>{n}{n===0?' — Nada claro':n===5?' — Muito claro':''}</option>)}
          </select>
        </label>
        <label>O quanto você sentiu dificuldade na deliberação *
          <select name="difficulty" required defaultValue={feedback.difficulty===undefined?'':String(feedback.difficulty)}>
            <option value="" disabled>Selecione</option>
            {[0,1,2,3,4,5].map(n=><option key={n} value={n}>{n}{n===0?' — Sem dificuldade':n===5?' — Muita dificuldade':''}</option>)}
          </select>
        </label>
      </div>
      <label>Como podemos melhorar? *
        <textarea name="improvements" required maxLength={2000} defaultValue={feedback.improvements||''} placeholder="Escreva uma sugestão ou informe 'Sem sugestões'."/>
      </label>
      <p className="muted small">Se não houver sugestões adicionais, escreva “Sem sugestões”.</p>
    </section>
    <button type="submit" className="primary">{previous?'Atualizar minha resposta':'Enviar deliberação completa'}</button>
    <p className="muted small">Só há uma resposta vigente por EJ. Se atualizar dentro do prazo, a resposta anterior será substituída e a PRESCON precisará rever eventuais ressalvas.</p>
  </form>;
}
