/**
 * Estrutura opcional do PF anexa a UM assunto deliberado.
 * A projeção pessimista/realista/otimista NÃO representa uma votação.
 * A decisão institucional continua sendo registrada pelo formulário de voto.
 */
export const PROJECTION_KEYS=['pessimistic','realistic','optimistic'] as const;
export type ProjectionKey=typeof PROJECTION_KEYS[number];
export const PROJECTION_LABELS:Record<ProjectionKey,string>={
 pessimistic:'Pessimista',realistic:'Realista',optimistic:'Otimista'
};
export type FinancialProjection={
 attendees:number|null;expenses:number|null;
 revenue:number|null;revenueWithRateio:number|null;
};
export type FinancialAlternative={
 name:string;projections:Record<ProjectionKey,FinancialProjection>
};
export type FinancialMeasure={
 cost:number|null;revenue:number|null;balance:number|null;
 participants:number|null;
};
export function projectedBalance(expenses:number|null,revenue:number|null){
 if(expenses===null||revenue===null)return null;
 return Math.round((revenue-expenses)*100)/100;
}
export function financialMeasure(option:FinancialAlternative,key:ProjectionKey,rateio:boolean):FinancialMeasure{
 const data=option.projections[key];
 const rev=rateio?data.revenueWithRateio:data.revenue;
 return {cost:data.expenses,revenue:rev,balance:projectedBalance(data.expenses,rev),participants:data.attendees};
}
export function money(value:number|null){
 return value===null?'Não informado':
  new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value);
}
