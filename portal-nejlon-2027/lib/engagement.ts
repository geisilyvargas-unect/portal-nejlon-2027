/** Indicadores calculados somente a partir das deliberações e respostas fornecidas.
 * Não interpreta ausência de resposta como desengajamento quando não há deliberações oficiais.
 */
export type EngagementEj={id:string;name:string;slug:string};
export type EngagementDeliberation={
 id:string;title:string;due_at:string;
 status:'draft'|'open'|'closed';is_demo:boolean;is_historical?:boolean;
};
export type EngagementResponse={ej_id:string;deliberation_id:string};
export type EngagementStatus='high'|'medium'|'low'|'none';
export type EngagementCard={
 id:string;name:string;slug:string;
 answered:number;expected:number;missing:number;rate:number|null;
 status:EngagementStatus;answeredTitles:string[];missingTitles:string[];
};
export type EngagementPoint={
 id:string;title:string;due_at:string;answered:number;
 expected:number;rate:number;
};
export type EngagementSnapshot={
 totalEjs:number;deliberations:number;responded:number;possible:number;
 overallRate:number|null;allDone:number;withPending:number;
 cards:EngagementCard[];trend:EngagementPoint[];
};
export function engagementStatus(rate:number|null):EngagementStatus{
 if(rate===null)return 'none';
 if(rate>=80)return 'high';
 if(rate>=50)return 'medium';
 return 'low';
}
export function buildEngagement(
 ejs:readonly EngagementEj[],
 deliberations:readonly EngagementDeliberation[],
 responses:readonly EngagementResponse[],
 options:{includeDemo?:boolean}={}
):EngagementSnapshot{
 const official=deliberations.filter(d=>
  (!d.is_demo||options.includeDemo===true)&&!d.is_historical&&(d.status==='open'||d.status==='closed')
 );
 const votes=new Set(
  responses
   .filter(r=>ejs.some(e=>e.id===r.ej_id)&&official.some(d=>d.id===r.deliberation_id))
   .map(r=>r.deliberation_id+'|'+r.ej_id)
 );
 const cards=ejs.map(e=>{
  const answered=official.filter(d=>votes.has(d.id+'|'+e.id));
  const missing=official.filter(d=>!votes.has(d.id+'|'+e.id));
  const rate=official.length?Math.round(answered.length*100/official.length):null;
  return {
   id:e.id,name:e.name,slug:e.slug,answered:answered.length,
   expected:official.length,missing:missing.length,rate,
   status:engagementStatus(rate),
   answeredTitles:answered.map(d=>d.title),
   missingTitles:missing.map(d=>d.title)
  };
 }).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
 const trend=official.slice().sort((a,b)=>
   a.due_at.localeCompare(b.due_at)||a.title.localeCompare(b.title,'pt-BR')
 ).slice(-6).map(d=>{
  const answered=ejs.filter(e=>votes.has(d.id+'|'+e.id)).length;
  return {id:d.id,title:d.title,due_at:d.due_at,answered,expected:ejs.length,
   rate:ejs.length?Math.round(answered*100/ejs.length):0};
 });
 const responded=cards.reduce((sum,e)=>sum+e.answered,0);
 const possible=ejs.length*official.length;
 return {
  totalEjs:ejs.length,deliberations:official.length,responded,possible,
  overallRate:possible?Math.round(responded*100/possible):null,
  allDone:official.length?cards.filter(e=>e.missing===0).length:0,
  withPending:official.length?cards.filter(e=>e.missing>0).length:0,
  cards,trend
 };
}
