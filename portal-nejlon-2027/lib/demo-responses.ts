import {EJS_DEMO} from '@/lib/demo-ejs';
/** Registros FICTÍCIOS e públicos da demonstração. Nunca contam como votos oficiais. */
export type DemoDeliberationId='financeiro'|'calendario'|'encerramento';
export type DemoPosition='favorable'|'suggestions'|'qualified'|'against'|'abstention';
export type DemoVote={slug:string;position:DemoPosition;note:string};
export const DEMO_POSITIONS:Record<DemoPosition,{label:string;color:string}>={
 favorable:{label:'Aprovo',color:'#3976d0'},
 suggestions:{label:'Aprovo com sugestões',color:'#ee8758'},
 qualified:{label:'Aprovo com ressalvas',color:'#edbd42'},
 against:{label:'Reprovo',color:'#d34b53'},
 abstention:{label:'Abstenho',color:'#9c6cd9'}
};
export const DEMO_DELIBERATIONS=[
 {id:'financeiro',title:'Planejamento Financeiro 2027 — 1º ciclo',open:true,direxVisible:true},
 {id:'calendario',title:'Aprovação do Calendário Eleitoral',open:true,direxVisible:false},
 {id:'encerramento',title:'Relatório de Encerramento de Ciclo',open:false,direxVisible:true}
] as const;
export const DEMO_VOTES:Record<DemoDeliberationId,readonly DemoVote[]> = {
 financeiro:[
  {slug:"unect",position:"favorable" as DemoPosition,note:"A UNECT apoia a proposta de planejamento e a transparência dos critérios apresentados."},
  {slug:"3e",position:"qualified" as DemoPosition,note:"A 3E solicita detalhamento das despesas antes da aprovação definitiva."},
  {slug:"aprimora",position:"suggestions" as DemoPosition,note:"A APRIMORA sugere incluir prestação de contas trimestral e indicadores de execução."},
  {slug:"artus",position:"favorable" as DemoPosition,note:"A ARTUS entende que o planejamento contribui para maior previsibilidade."},
  {slug:"bioma",position:"against" as DemoPosition,note:"A BIOMA considera que o cronograma apresentado precisa ser refeito."},
  {slug:"boson",position:"favorable" as DemoPosition,note:"A BÓSON é favorável aos objetivos e ao acompanhamento por metas."},
  {slug:"business",position:"favorable" as DemoPosition,note:"A BUSINESS concorda com a proposta financeira apresentada."},
  {slug:"catecz",position:"suggestions" as DemoPosition,note:"A CATEC’Z sugere uma reserva para atividades formativas do Conselho."},
  {slug:"consoagro",position:"favorable" as DemoPosition,note:"A CONSOAGRO aprova as diretrizes gerais do planejamento."},
  {slug:"cotton",position:"qualified" as DemoPosition,note:"A COTTON solicita estabelecer limite para despesas não previstas."},
  {slug:"ecae",position:"favorable" as DemoPosition,note:"A ECAE considera os critérios objetivos."},
  {slug:"elo",position:"favorable" as DemoPosition,note:"A ELO apoia a construção conjunta do calendário financeiro."},
  {slug:"fertfield",position:"abstention" as DemoPosition,note:"A FERTFIELD optou por não se posicionar nesta simulação."},
  {slug:"gaia",position:"suggestions" as DemoPosition,note:"A GAIA sugere publicar um resumo financeiro a cada ciclo."},
  {slug:"kinase",position:"favorable" as DemoPosition,note:"A KINASE considera a proposta adequada para o período."},
  {slug:"lex",position:"favorable" as DemoPosition,note:"A LEX manifesta apoio ao planejamento."},
  {slug:"lion",position:"qualified" as DemoPosition,note:"A LION solicita explicitar os responsáveis por cada etapa."},
  {slug:"meca",position:"favorable" as DemoPosition,note:"A MECA aprova a organização das despesas por prioridade."},
  {slug:"notton",position:"against" as DemoPosition,note:"A NOTTON entende que alguns custos precisam ser reavaliados."},
  {slug:"paracelso",position:"favorable" as DemoPosition,note:"A PARACELSO aprova as metas propostas."},
  {slug:"pegasus",position:"suggestions" as DemoPosition,note:"A PEGASUS sugere criar indicadores de custo-benefício."},
  {slug:"select",position:"favorable" as DemoPosition,note:"A SELECT apoia a proposta com acompanhamento mensal."},
  {slug:"sete",position:"favorable" as DemoPosition,note:"A SETE considera o planejamento aplicável à Rede."},
 ],
 calendario:[
  {slug:"unect",position:"favorable" as DemoPosition,note:"A UNECT apoia o calendário proposto para garantir previsibilidade."},
  {slug:"3e",position:"favorable" as DemoPosition,note:"A 3E concorda com a distribuição das datas."},
  {slug:"aprimora",position:"qualified" as DemoPosition,note:"A APRIMORA recomenda evitar sobreposição com eventos regionais."},
  {slug:"artus",position:"favorable" as DemoPosition,note:"A ARTUS aprova as datas propostas."},
  {slug:"bioma",position:"suggestions" as DemoPosition,note:"A BIOMA sugere compartilhar os materiais de convocação com antecedência."},
  {slug:"boson",position:"abstention" as DemoPosition,note:"A BÓSON se abstém neste exemplo de deliberação."},
  {slug:"business",position:"favorable" as DemoPosition,note:"A BUSINESS aprova o calendário apresentado."},
  {slug:"catecz",position:"favorable" as DemoPosition,note:"A CATEC’Z concorda com as etapas previstas."},
  {slug:"consoagro",position:"against" as DemoPosition,note:"A CONSOAGRO considera necessário revisar o prazo entre as etapas."},
  {slug:"cotton",position:"favorable" as DemoPosition,note:"A COTTON apoia o planejamento antecipado."},
  {slug:"ecae",position:"favorable" as DemoPosition,note:"A ECAE está de acordo com o cronograma."},
  {slug:"elo",position:"suggestions" as DemoPosition,note:"A ELO propõe divulgar lembretes antes das reuniões."},
  {slug:"gaia",position:"favorable" as DemoPosition,note:"A GAIA apoia a organização anual dos encontros."},
  {slug:"lex",position:"favorable" as DemoPosition,note:"A LEX considera o calendário viável."},
  {slug:"lion",position:"favorable" as DemoPosition,note:"A LION aprova as datas de referência."},
  {slug:"meca",position:"qualified" as DemoPosition,note:"A MECA pede que haja flexibilidade para mudanças justificadas."},
  {slug:"sete",position:"favorable" as DemoPosition,note:"A SETE aprova a organização proposta."},
  {slug:"tcp",position:"favorable" as DemoPosition,note:"A TCP concorda com o calendário."},
  {slug:"vetjr",position:"suggestions" as DemoPosition,note:"A VET JR sugere reservar horários alternativos para EJs mais distantes."},
 ],
 encerramento:[
  {slug:"unect",position:"favorable" as DemoPosition,note:"A UNECT aprovou o encaminhamento registrado no cenário fictício."},
  {slug:"3e",position:"qualified" as DemoPosition,note:"A 3E solicitou explicitar o responsável pelo acompanhamento."},
  {slug:"aprimora",position:"favorable" as DemoPosition,note:"A APRIMORA aprovou as entregas registradas."},
  {slug:"artus",position:"favorable" as DemoPosition,note:"A ARTUS concordou com o encerramento do ciclo."},
  {slug:"bioma",position:"favorable" as DemoPosition,note:"A BIOMA concordou com as conclusões."},
  {slug:"boson",position:"favorable" as DemoPosition,note:"A BÓSON apoiou o relatório final."},
  {slug:"business",position:"suggestions" as DemoPosition,note:"A BUSINESS propôs melhorar a organização dos anexos."},
  {slug:"catecz",position:"favorable" as DemoPosition,note:"A CATEC’Z concordou com os resultados."},
  {slug:"consoagro",position:"favorable" as DemoPosition,note:"A CONSOAGRO aprovou o registro das entregas."},
  {slug:"cotton",position:"favorable" as DemoPosition,note:"A COTTON considerou adequado o encaminhamento."},
  {slug:"ecae",position:"abstention" as DemoPosition,note:"A ECAE não registrou posicionamento de mérito nesta simulação."},
  {slug:"elo",position:"favorable" as DemoPosition,note:"A ELO aprovou a conclusão do ciclo."},
  {slug:"fertfield",position:"favorable" as DemoPosition,note:"A FERTFIELD apoiou o encerramento."},
  {slug:"gaia",position:"favorable" as DemoPosition,note:"A GAIA aprovou o registro final."},
  {slug:"kinase",position:"qualified" as DemoPosition,note:"A KINASE solicitou documentação complementar para uma entrega."},
  {slug:"lex",position:"favorable" as DemoPosition,note:"A LEX concordou com o parecer."},
  {slug:"lion",position:"favorable" as DemoPosition,note:"A LION aprovou os encaminhamentos."},
  {slug:"meca",position:"favorable" as DemoPosition,note:"A MECA apoiou a apresentação dos resultados."},
  {slug:"notton",position:"against" as DemoPosition,note:"A NOTTON apontou inconsistências nos prazos declarados."},
  {slug:"paracelso",position:"favorable" as DemoPosition,note:"A PARACELSO aprovou a conclusão."},
  {slug:"pegasus",position:"suggestions" as DemoPosition,note:"A PEGASUS recomendou padronizar os relatórios do próximo ciclo."},
  {slug:"select",position:"favorable" as DemoPosition,note:"A SELECT aprovou o relatório."},
  {slug:"sete",position:"favorable" as DemoPosition,note:"A SETE apoiou a prestação de contas."},
  {slug:"smartmec",position:"favorable" as DemoPosition,note:"A SMARTMEC concordou com os próximos passos."},
  {slug:"vetjr",position:"favorable" as DemoPosition,note:"A VET JR apoiou o encerramento do período."},
 ],
};
export const DEMO_EJ_BY_SLUG=new Map<string,string>(EJS_DEMO.map(e=>[e.slug,e.name]));
export function demoVotesFor(id:DemoDeliberationId){return DEMO_VOTES[id];}
export function demoPendingFor(id:DemoDeliberationId){
 const answered=new Set(DEMO_VOTES[id].map(x=>x.slug));
 return EJS_DEMO.filter(e=>!answered.has(e.slug));
}
export function demoCountsFor(id:DemoDeliberationId){
 const votes=DEMO_VOTES[id];
 return (Object.keys(DEMO_POSITIONS) as DemoPosition[]).map(key=>({key,label:DEMO_POSITIONS[key].label,color:DEMO_POSITIONS[key].color,value:votes.filter(v=>v.position===key).length}));
}
export function demoSummary(id:DemoDeliberationId){
 const votes=demoVotesFor(id); const total=EJS_DEMO.length;
 return {received:votes.length,pending:total-votes.length,participation:total?Math.round(votes.length*100/total):0};
}

