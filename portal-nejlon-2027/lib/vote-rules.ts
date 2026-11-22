import type {Position} from '@/lib/constants';

/**
 * Aplicação das cinco escolhas descritas no Formulário de Deliberação de 2026.
 *
 * Só a PRESCON pode registrar a aceitação/rejeição de ressalvas.
 * Estes resultados são consolidações informativas: sem quórum nem
 * aprovação institucional automática (depende do Regimento Interno).
 */
export type ManualReviewDecision='under_review'|'accepted'|'rejected';
export type EffectivePosition='approved'|'rejected'|'pending'|'abstention';

export function effectivePosition(
 position:Position,
 caveatDecision?:ManualReviewDecision|null
):EffectivePosition{
 if(position==='favorable'||position==='suggestions')return 'approved';
 if(position==='against')return 'rejected';
 if(position==='abstention')return 'abstention';
 if(caveatDecision==='accepted')return 'approved';
 if(caveatDecision==='rejected')return 'rejected';
 return 'pending';
}

export type ManualVotingSummary={
 received:number;approved:number;rejected:number;
 pending:number;abstentions:number;
 // Dados para acompanhamento, NÃO resultado formal da deliberação.
 reviewed:number;resolved:boolean
};

export function summarizeManualVotes(
 entries:readonly {position:Position;caveatDecision?:ManualReviewDecision|null}[]
):ManualVotingSummary{
 const result:ManualVotingSummary={
  received:entries.length,approved:0,rejected:0,pending:0,
  abstentions:0,reviewed:0,resolved:false
 };
 for(const vote of entries){
  const effective=effectivePosition(vote.position,vote.caveatDecision);
  if(effective==='approved')result.approved++;
  if(effective==='rejected')result.rejected++;
  if(effective==='pending')result.pending++;
  if(effective==='abstention')result.abstentions++;
  if(vote.position==='qualified'&&(vote.caveatDecision==='accepted'||vote.caveatDecision==='rejected'))result.reviewed++;
 }
 result.resolved=result.pending===0;
 return result;
}
