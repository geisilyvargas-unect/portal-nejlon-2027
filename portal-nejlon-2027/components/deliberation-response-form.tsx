'use client';
import {useState} from 'react';
import {submitResponse} from '@/app/actions';
import {POSITIONS,type DeliberationScenario,type Position,type ResponseRow,type ScenarioAnswer} from '@/lib/constants';
import {answersOf,VOTE_DESCRIPTIONS} from '@/lib/deliberation-form';

type Field='position'|'justification'|'caveats'|'suggestions';
export function DeliberationResponseForm({deliberationId,scenarios,previous}:{deliberationId:string;scenarios:DeliberationScenario[];previous?:ResponseRow}){
  const [answers,setAnswers]=useState<ScenarioAnswer[]>(()=>answersOf(previous,scenarios).map(a=>previous?a:{...a,position:'' as ScenarioAnswer['position']}));
  const change=(key:string,field:Field,value:string)=>setAnswers(old=>old.map(a=>a.scenario_key===key?{...a,[field]:value}:a));
  const feedback=previous?.final_feedback||{};
  return <form action={submitResponse} className="fieldset">
    <input type="hidden" name="deliberation_id" value={deliberationId}/>
    <input type="hidden" name="answers_json" value={JSON.stringify(answers)}/>
    <div className="notice">Seu voto é registrado em nome da sua EJ. Preencha <strong>todos os cenários</strong> para concluir o formulário.</div>
    <details className="vote-instructions">
      <summary>Conheça as cinco possibilidades de votação</summary>
      <div className="stack" style={{marginTop:14}}>
        {(Object.keys(POSITIONS) as Position[]).map(k=><div key={k}><strong>{POSITIONS[k]}</strong><p className="muted small" style={{margin:'4px 0 0'}}>{VOTE_DESCRIPTIONS[k]}</p></div>)}
      </div>
    </details>
    {scenarios.map((scenario,index)=>{
      const answer=answers.find(a=>a.scenario_key===scenario.key);
      if(!answer)return null;
      return <section key={scenario.key} className="vote-scenario">
        <div className="eyebrow">Cenário {index+1} de {scenarios.length}</div>
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
        <p className="small muted" style={{margin:0}}>{answer.position?VOTE_DESCRIPTIONS[answer.position]: 'Escolha uma das cinco possibilidades de votação.'}</p>
        {answer.position!=='abstention'&&<label>Justifique sua decisão {answer.position==='against'?'*':'(opcional)'}
          <textarea required={answer.position==='against'} value={answer.justification} onChange={e=>change(scenario.key,'justification',e.target.value)} placeholder="Quais são os pontos que fundamentam seu posicionamento?"/>
        </label>}
        {(answer.position==='suggestions'||answer.suggestions)&&<label>Sugestões de melhoria {answer.position==='suggestions'?'*':'(opcional)'}
          <textarea required={answer.position==='suggestions'} value={answer.suggestions} onChange={e=>change(scenario.key,'suggestions',e.target.value)} placeholder="Quais melhorias você propõe?"/>
        </label>}
        {(answer.position==='qualified'||answer.caveats)&&<label>Ressalvas / condições para aprovação {answer.position==='qualified'?'*':'(opcional)'}
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
      <label>Como podemos melhorar? (opcional)
        <textarea name="improvements" maxLength={2000} defaultValue={feedback.improvements||''} placeholder="Sua sugestão de melhoria, se houver."/>
      </label>
    </section>
    <button type="submit" className="primary">{previous?'Atualizar minha resposta':'Enviar deliberação completa'}</button>
    <p className="muted small">Só há uma resposta vigente por EJ. Se atualizar dentro do prazo, a resposta anterior será substituída e a PRESCON precisará rever eventuais ressalvas.</p>
  </form>;
}
