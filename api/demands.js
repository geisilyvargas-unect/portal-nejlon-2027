'use strict';
const G=require('./_shared');
const {json,fail,body,protect,db,userFromToken}=G;
const uuid=x=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(x||''));
const canExplain=role=>role==='counselor'||role==='ej_direx';
const clean=(v,max=2000)=>String(v??'').trim().slice(0,max);
const validDate=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(Date.parse(d+'T12:00:00Z'))?d:null;
const https=x=>{if(!x)return null;try{const u=new URL(String(x));if(u.protocol!=='https:')fail(400,'O link do comprovante deve começar com https://.');return u.href.slice(0,1800)}catch{fail(400,'Informe um link HTTPS válido para o comprovante.')}};
async function ejIds(){return db('ejs',{query:'select=id,name,slug&order=name.asc&limit=100'})}
async function findDemand(id){
 if(!uuid(id))fail(400,'Demanda inválida.');
 const rows=await db('demands',{query:'select=id,ej_id,title,description,due_at,status,responsible,created_at,created_by,updated_at,completed_at,template_key&id=eq.'+id+'&limit=1'});
 if(!rows.length)fail(404,'Demanda não encontrada.');return rows[0];
}
async function event({demand,actor,action,note='',details={}}){
 return db('portal_demand_events',{method:'POST',prefer:'return=minimal',data:{demand_id:demand,actor_id:actor.userId,actor_role:actor.role,action,note,details}});
}
async function list(user){
 const owner=user.role==='prescon';
 if(!owner&&!canExplain(user.role)&&user.role!=='nucleus_direx')fail(403,'Perfil sem acesso às demandas.');
 if(!owner&&user.role==='nucleus_direx')fail(403,'Acesso de gestão das demandas reservado à PRESCON. Consulte a gestão para permissões.');
 if(!owner&&!user.ej_id)fail(403,'Seu cadastro ainda não está vinculado a uma EJ.');
 const q=owner?'':'&ej_id=eq.'+user.ej_id;
 const demands=await db('demands',{query:'select=id,ej_id,title,description,due_at,status,responsible,created_at,created_by,updated_at,completed_at,template_key&order=created_at.desc&limit=1500'+q});
 const justifications=await db('portal_demand_justifications',{query:'select=id,demand_id,ej_id,submitted_by,reason_type,explanation,evidence_url,state,decision_note,decided_by,decided_at,created_at&order=created_at.desc&limit=3000'+q});
 let events=[];
 if(demands.length){
  const ids=demands.map(d=>d.id);
  for(let start=0;start<ids.length;start+=100){
   const part=ids.slice(start,start+100);
   const rows=await db('portal_demand_events',{query:'select=id,demand_id,actor_role,action,note,details,created_at&demand_id=in.('+part.join(',')+')&order=created_at.asc&limit=2500'});
   events=events.concat(rows);
  }
 }
 const ejs=owner?await ejIds():[];
 const summary={total:demands.length,
  waiting:demands.filter(d=>d.status==='pendente'||d.status==='em_andamento').length,
  justified:demands.filter(d=>d.status==='justificada').length,
  completed:demands.filter(d=>d.status==='concluida').length,
  pendingReview:justifications.filter(j=>j.state==='pending_review').length,
  overdue:demands.filter(d=>['pendente','em_andamento'].includes(d.status)&&d.due_at&&d.due_at<new Date().toISOString().slice(0,10)).length};
 return {demands,justifications,events,ejs,summary,limited:demands.length===1500||justifications.length===3000};
}
async function handler(req,res){
 const user=await userFromToken(req);
 const action=String(req.query?.action||'list');
 if(req.method==='GET'){
  if(action==='list')return json(res,200,await list(user));
  if(action==='summary'){
   if(user.role!=='prescon')fail(403,'Apenas a PRESCON pode consultar o panorama de toda a Rede.');
   const overview=await list(user);
   return json(res,200,{summary:overview.summary,pendingDecisions:overview.justifications.filter(j=>j.state==='pending_review').slice(0,15).map(j=>({id:j.id,demand_id:j.demand_id,created_at:j.created_at,ej_id:j.ej_id})),overdueDemands:overview.demands.filter(d=>['pendente','em_andamento'].includes(d.status)&&d.due_at&&d.due_at<new Date().toISOString().slice(0,10)).slice(0,15).map(d=>({id:d.id,title:d.title,ej_id:d.ej_id,due_at:d.due_at}))});
  }
  fail(404,'Operação de consulta não encontrada.');
 }
 if(req.method!=='POST')fail(405,'Método não permitido.');
 const data=body(req);
 if(action==='create'){
  if(user.role!=='prescon')fail(403,'Somente a PRESCON pode criar demandas.');
  const ids=[...new Set(Array.isArray(data.ejIds)?data.ejIds:[])];
  if(!ids.length||ids.length>50||ids.some(x=>!uuid(x)))fail(400,'Selecione de 1 a 50 EJs válidas.');
  const known=new Set((await ejIds()).map(e=>e.id));
  if(ids.some(id=>!known.has(id)))fail(400,'Uma das EJs selecionadas não está cadastrada.');
  const title=clean(data.title,180),description=clean(data.description,4000),responsible=clean(data.responsible,160);
  const due=validDate(data.dueAt);
  if(title.length<4||!due)fail(400,'Informe um título e uma data válida.');
  if(!description||description.length<8)fail(400,'Descreva a demanda para que a EJ entenda o que precisa fazer.');
  if(!responsible)fail(400,'Informe o responsável pela demanda.');
  const templateKey=clean(data.templateKey,80)||null;
  const created=[];
  for(const id of ids){
   const rows=await db('demands',{method:'POST',prefer:'return=representation',data:{
    ej_id:id,title,description,due_at:due,status:'pendente',responsible,created_by:user.userId,updated_at:new Date().toISOString(),template_key:templateKey
   }});
   const d=rows[0];if(!d)fail(500,'A demanda não foi confirmada pelo banco.');
   created.push(d);
   await event({demand:d.id,actor:user,action:'created',note:'Demanda cadastrada pela PRESCON.',details:{ej_id:id,title,due_at:due}});
  }
  return json(res,201,{ok:true,count:created.length,demands:created});
 }
 if(action==='justify'){
  if(!canExplain(user.role)||!user.ej_id)fail(403,'Somente Conselho ou DIREX da própria EJ podem justificar.');
  const demand=await findDemand(data.demandId);
  if(demand.ej_id!==user.ej_id)fail(403,'Esta demanda pertence a outra EJ.');
  if(!['pendente','em_andamento'].includes(demand.status))fail(409,'Esta demanda já foi encerrada ou justificada.');
  const reason=clean(data.reason,35),explanation=clean(data.explanation,5000);
  if(!['ausencia','prazo','dificuldade','impedimento','outro'].includes(reason))fail(400,'Selecione o motivo da justificativa.');
  if(explanation.length<10)fail(400,'Explique a situação em pelo menos 10 caracteres.');
  const earlier=await db('portal_demand_justifications',{query:'select=id,state&demand_id=eq.'+demand.id+'&state=in.(pending_review,accepted)&limit=1'});
  if(earlier.length)fail(409,'Já existe justificativa enviada ou aceita para esta demanda.');
  const evidence=https(clean(data.evidenceUrl,1800));
  const created=await db('portal_demand_justifications',{method:'POST',prefer:'return=representation',data:{
   demand_id:demand.id,ej_id:user.ej_id,submitted_by:user.userId,reason_type:reason,explanation,evidence_url:evidence,state:'pending_review'
  }});
  await event({demand:demand.id,actor:user,action:'justification_submitted',note:'A EJ enviou uma justificativa para análise.',details:{justification_id:created[0].id,reason_type:reason}});
  return json(res,201,{ok:true,justification:created[0],message:'Justificativa registrada e enviada para a PRESCON.'});
 }
 if(user.role!=='prescon')fail(403,'Decisões e alterações de demandas são exclusivas da PRESCON.');
 if(action==='decide'){
  const id=String(data.justificationId||'');if(!uuid(id))fail(400,'Justificativa inválida.');
  const decision=data.decision==='accepted'?'accepted':data.decision==='rejected'?'rejected':null;
  if(!decision)fail(400,'Escolha aceitar ou recusar.');
  const note=clean(data.note,3000);
  if(note.length<8)fail(400,'Registre o motivo da decisão com pelo menos 8 caracteres.');
  const rows=await db('portal_demand_justifications',{query:'select=id,demand_id,ej_id,state&id=eq.'+id+'&limit=1'});
  const j=rows[0];if(!j)fail(404,'Justificativa não encontrada.');
  if(j.state!=='pending_review')fail(409,'Esta justificativa já recebeu uma decisão.');
  const update=await db('portal_demand_justifications',{method:'PATCH',query:'id=eq.'+id+'&state=eq.pending_review',prefer:'return=representation',data:{
   state:decision,decision_note:note,decided_by:user.userId,decided_at:new Date().toISOString()
  }});
  if(!update.length)fail(409,'A justificativa foi analisada por outra sessão. Atualize a lista.');
  if(decision==='accepted'){
   const d=await findDemand(j.demand_id);
   if(['pendente','em_andamento'].includes(d.status))await db('demands',{method:'PATCH',query:'id=eq.'+d.id,data:{status:'justificada',updated_at:new Date().toISOString()}});
  }
  await event({demand:j.demand_id,actor:user,action:decision==='accepted'?'justification_accepted':'justification_rejected',note,details:{justification_id:j.id,decision}});
  return json(res,200,{ok:true,justification:update[0],message:decision==='accepted'?'Justificativa aceita. Demanda marcada como justificada.':'Justificativa recusada. Demanda permanece pendente.'});
 }
 if(action==='status'){
  const d=await findDemand(data.demandId);
  const status=clean(data.status,30),note=clean(data.note,2000);
  if(!['pendente','em_andamento','concluida'].includes(status))fail(400,'Situação inválida.');
  if(d.status==='justificada'&&note.length<8)fail(400,'Para reabrir uma demanda justificada, explique o motivo.');
  if(d.status==='concluida'&&status!=='concluida'&&note.length<8)fail(400,'Explique o motivo da reabertura.');
  if(d.status===status)return json(res,200,{ok:true,message:'A demanda já está com esta situação.'});
  await db('demands',{method:'PATCH',query:'id=eq.'+d.id,data:{status,updated_at:new Date().toISOString(),completed_at:status==='concluida'?new Date().toISOString():null}});
  await event({demand:d.id,actor:user,action:'status_updated',note:note||'Situação atualizada pela PRESCON.',details:{from:d.status,to:status}});
  return json(res,200,{ok:true,message:'Situação da demanda atualizada e registrada no histórico.'});
 }
 fail(404,'Operação desconhecida.');
}
module.exports=protect(handler);