import {ArrowRight,BookOpen,Check,ClipboardCheck,FileText,ShieldCheck} from 'lucide-react';
import {POSITIONS,type Position} from '@/lib/constants';
import {VOTE_DESCRIPTIONS} from '@/lib/deliberation-form';

const RULES:[
 Position,string,string
][]=[
 ['favorable','APROVAÇÃO DIRETA','Conta como aprovação'],
 ['suggestions','APROVAÇÃO COM IDEIAS','Conta como aprovação; sugestões vão para análise'],
 ['qualified','AGUARDA PRESCON','Depende da decisão sobre as ressalvas'],
 ['against','REPROVAÇÃO','Motivos enviados para análise'],
 ['abstention','ABSTENÇÃO','Registrada separadamente do resultado']
];

/** Manual contextual baseado nas cinco definições do Forms NEJLON 2026.
 * Quórum e validação formal continuam sujeitos ao Regimento Interno.
 */
export function VotingManual({compact=false,selected}:{
 compact?:boolean;selected?:Position|''
}){
 return <section className={'voting-manual'+(compact?' compact':'')} aria-label="Manual integrado de deliberação">
  <header className="voting-manual-header">
   <div className="voting-manual-copy">
    <div className="eyebrow"><BookOpen size={15}/> MANUAL DE DELIBERAÇÃO • NEJLON</div>
    <h2>VOTAR FICOU <span>MAIS SIMPLES.</span></h2>
    <p>O portal mostra as regras na hora certa, prepara os campos e consolida os votos. A Presidência do Conselho decide sobre as ressalvas.</p>
    <a href="https://canva.link/r1ejljffrfu6xu2" target="_blank" rel="noopener noreferrer" className="manual-original-link">
      <FileText size={16}/> Consultar manual original
    </a>
   </div>
   <div className="voting-manual-number" aria-hidden="true"><strong>05</strong><span>FORMAS<br/>DE VOTAR</span></div>
  </header>
  <div className="voting-manual-body">
   <div className="manual-steps" aria-label="Etapas de uma deliberação">
    <div><span>01</span><strong>Analise o material</strong><small>Leia os cenários e documentos</small></div>
    <ArrowRight className="manual-step-arrow" size={18} aria-hidden/>
    <div><span>02</span><strong>Escolha o voto</strong><small>Campos aparecem conforme a escolha</small></div>
    <ArrowRight className="manual-step-arrow" size={18} aria-hidden/>
    <div><span>03</span><strong>PRESCON avalia</strong><small>Ressalvas vão para parecer</small></div>
   </div>
   <div className="manual-rule-grid">
    {RULES.map(([key,signal,result],i)=><article
     key={key}
     className={'manual-rule rule-'+key+(selected===key?' selected':'')}>
     <span className="manual-rule-index">0{i+1}</span>
     <h3>{POSITIONS[key]}</h3>
     <p>{VOTE_DESCRIPTIONS[key]}</p>
     <div className="manual-rule-result"><Check size={14} aria-hidden/>{signal}</div>
     {!compact&&<small>{result}</small>}
    </article>)}
   </div>
   <div className="manual-flow-note">
    <div className="manual-flow-icon"><ShieldCheck size={21} aria-hidden/></div>
    <div>
     <strong>Como funciona o “Aprovo com ressalvas”?</strong>
     <p><span>Ressalva acatada</span> → conta como aprovação. <span>Ressalva não acatada</span> → conta como reprovação. Enquanto estiver em análise, permanece pendente de decisão.</p>
    </div>
   </div>
   {!compact&&<div className="manual-privacy-note"><ClipboardCheck size={17} aria-hidden/>
    O resultado final não é proclamado automaticamente. Quórum, aprovação formal e demais requisitos dependem das normas institucionais aplicáveis.
   </div>}
  </div>
 </section>;
}
