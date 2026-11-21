import type {Deliberation,DeliberationScenario,ResponseRow,ScenarioAnswer,Position} from '@/lib/constants';

export const VOTE_DESCRIPTIONS = {
  favorable: 'Concordo integralmente com a proposta apresentada.',
  suggestions: 'Concordo com a proposta e apresento sugestões. Conta como aprovação.',
  qualified: 'Concordo sob condições. A aprovação depende da análise das ressalvas pela PRESCON.',
  against: 'Não aprovo a proposta e apresento os motivos.',
  abstention: 'Optei por não votar neste cenário.',
} as const;

export function scenariosOf(d:Pick<Deliberation,'title'|'description'|'scenarios'>):DeliberationScenario[] {
  if(Array.isArray(d.scenarios)&&d.scenarios.length>0){
    const valid=d.scenarios.filter(s=>s&&typeof s.key==='string'&&typeof s.title==='string');
    if(valid.length)return valid;
  }
  return [{key:'principal',title:d.title,description:d.description||'',material_url:''}];
}
export function answersOf(response:ResponseRow|undefined,scenarios:DeliberationScenario[]):ScenarioAnswer[] {
  return scenarios.map((s,i)=>{
    const found=Array.isArray(response?.scenario_answers)
      ?response.scenario_answers.find(a=>a.scenario_key===s.key):undefined;
    if(found)return found;
    const legacy=i===0?response:undefined;
    return {scenario_key:s.key,position:legacy?.position||'favorable' as Position,
      justification:legacy?.justification||'',caveats:legacy?.caveats||'',suggestions:legacy?.suggestions||''};
  });
}
