'use strict';
const G=require('./_shared');
const {json,fail,body,protect,db,prescon,userFromToken,accessToken,google}=G;
const uuid=x=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(x||''));
const positions=['Aprovo','Aprovo com sugestões','Aprovo com ressalvas','Reprovo','Abstenho'];
const presetPf=()=>[
 {id:'rateio',label:'Sistema de rateios',type:'vote',required:true,options:positions},
 {id:'c1',label:'C1 — Cenário 1',type:'vote',required:true,options:positions},
 {id:'c2',label:'C2 — Cenário 2',type:'vote',required:true,options:positions},
 {id:'feedback',label:'Observações finais',type:'text',required:false}
];
function normalizeQuestions(questions,kind){
 const source=kind==='pf'?(Array.isArray(questions)&&questions.length?questions:presetPf()):questions;
 if(!Array.isArray(source)||source.length<1||source.length>30)fail(400,'Informe de 1 a 30 perguntas.');
 if(kind==='pf'&&!source.some(q=>q.type==='vote'))fail(400,'Um PF precisa conter ao menos uma pergunta de votação.');
 const ids=new Set();
 return source.map((q,i)=>{
  const id=String(q.id||'q'+(i+1)).trim().replace(/[^a-z0-9_-]/gi,'').slice(0,45);
  const label=String(q.label||'').trim().slice(0,250);
  const type=q.type==='vote'?'vote':q.type==='choice'?'choice':'text';
  const options=type==='vote'?positions:type==='choice'?Array.isArray(q.options)?q.options.map(v=>String(v).trim().slice(0,150)).filter(Boolean).slice(0,15):[]:[];
  if(!id||ids.has(id)||label.length<3||(type==='choice'&&options.length<2))fail(400,'Pergunta inválida ou com identificador duplicado.');
  ids.add(id);return{id,label,type,required:q.required!==false,options};
 });
}
function googleItem(q){
 const required=q.required;
 const question=q.type==='text'?{required,textQuestion:{paragraph:true}}:{required,choiceQuestion:{type:'RADIO',options:q.options.map(value=>({value}))}};
 return {title:q.label,questionItem:{question}};
}
async function createGoogleForm(token,title,description,questions){
 const form=await google('https://forms.googleapis.com/v1/forms',token,{method:'POST',data:{info:{title}}});
 if(!form.formId)fail(502,'O Google Forms não retornou um ID de formulário.');
 const full=[
 {id:'ej',label:'Qual é a sua empresa júnior?',type:'text',required:true},
 {id:'respondent',label:'Seu nome completo',type:'text',required:true},
 ...questions
 ];
 const requests=full.map((q,i)=>({createItem:{item:googleItem(q),location:{index:i}}}));
 if(description)requests.push({updateFormInfo:{info:{description},updateMask:'description'}});
 await google('https://forms.googleapis.com/v1/forms/'+encodeURIComponent(form.formId)+':batchUpdate',token,{method:'POST',data:{requests}});
 const detail=await google('https://forms.googleapis.com/v1/forms/'+encodeURIComponent(form.formId),token);
 const map={};
 (detail.items||[]).forEach((item,i)=>{const questionId=item.questionItem?.question?.questionId;if(questionId)map[questionId]=full[i]?.id||questionId});
 return {formId:form.formId,responderUrl:detail.responderUri||null,map};
}
async function overview(user){
 const prescon=user.role==='prescon';
 const oversight=user.role==='nucleus_direx';
 // DIREX de EJ não recebe formulários, manuais, arquivos nem links.
 if(!prescon&&!oversight&&user.role!=='counselor')return [];
 const fields=prescon?'id,title,description,questions,kind,status,audience,google_form_id,google_responder_url,created_at,updated_at,due_at':'id,title,description,questions,kind,status,audience,google_responder_url,created_at,updated_at,due_at';
 const forms=await db('portal_forms',{query:'select='+fields+'&'+(prescon||oversight?'':'status=eq.open&')+'order=created_at.desc&limit=100'});
 return prescon||oversight?forms:forms.filter(f=>f.audience==='all_members'||user.role==='counselor');
}
async function syncGoogle(user,formId){
 const [record]=await db('portal_forms',{query:'select=id,google_form_id,google_question_map,status,audience,due_at&'+(formId?'id=eq.'+formId+'&':'google_form_id=not.is.null&')+'limit=1'});
 if(!record?.google_form_id)fail(404,'Formulário Google não vinculado.');
 if(record.audience==='counselor'&&(record.status!=='open'||(record.due_at&&Date.parse(record.due_at)<=Date.now())))fail(409,'Sincronização de votação encerrada não permitida.');
 const token=await accessToken(user.userId);
 const roster=record.audience==='counselor'?await eligibleRoster(record,[]):null;
 let pageToken='',pages=0,created=0,skipped=0;
 do{
  const qs=new URLSearchParams({pageSize:'1000'});
  if(pageToken)qs.set('pageToken',pageToken);
  const response=await google('https://forms.googleapis.com/v1/forms/'+encodeURIComponent(record.google_form_id)+'/responses?'+qs,token);
  for(const r of response.responses||[]){
   const existing=await db('portal_form_submissions',{query:'select=id&form_id=eq.'+record.id+'&google_response_id=eq.'+encodeURIComponent(r.responseId)+'&limit=1'});
   if(existing.length){skipped++;continue}
   if(roster&&(!r.lastSubmittedTime||(record.due_at&&Date.parse(r.lastSubmittedTime)>Date.parse(record.due_at)))){skipped++;continue}
   const answerMap={};
   for(const [googleQuestionId,value] of Object.entries(r.answers||{})){
    const key=record.google_question_map?.[googleQuestionId]||googleQuestionId;
    answerMap[key]=value.textAnswers?.answers?.map(a=>a.value).join(', ')||'';
   }
   let ejId=null;const ejName=String(answerMap.ej||'').trim().toLowerCase();
   if(ejName){
    const ejs=await db('ejs',{query:'select=id,name,slug&limit=100'});
    const candidates=roster?roster.filter(v=>v.name?.toLowerCase()===ejName||ejs.some(e=>e.id===v.id&&e.slug?.toLowerCase()===ejName)):ejs.filter(v=>v.slug?.toLowerCase()===ejName||v.name?.toLowerCase()===ejName);
    const ej=candidates.length===1?candidates[0]:null;
    if(ej)ejId=ej.id;
   }
   if(roster&&!ejId){skipped++;continue}
   try{await db('portal_form_submissions',{method:'POST',prefer:'return=minimal',data:{
     form_id:record.id,ej_id:ejId,respondent_email:r.respondentEmail||null,respondent_name:answerMap.respondent||null,
     channel:'google',state:'pending_review',google_response_id:r.responseId,answers:answerMap,
     submitted_at:r.lastSubmittedTime||new Date().toISOString()
   }});created++;}catch(e){if(String(e.message).includes('duplicate')){skipped++;continue}throw e}
  }
  pageToken=response.nextPageToken||'';pages++;
 }while(pageToken&&pages<30);
 return {created,skipped,remaining:!!pageToken,note:'Respostas do Google ficam pendentes de validação da PRESCON.'};
}
async function eligibleRoster(form, fallback){
 if(form.audience!=='counselor')return fallback;
 const rows=await db('portal_form_eligible_ejs',{query:'select=ej_id,name_snapshot&form_id=eq.'+form.id+'&order=name_snapshot.asc'});
 return rows.map(e=>({id:e.ej_id,name:e.name_snapshot}));
}
async function handler(req,res){
 const action=String(req.query?.action||'list');
 const user=await userFromToken(req);
 if(req.method==='GET'){
  if(action==='list')return json(res,200,{forms:await overview(user)});
  if(action==='oversight'){
   if(!['prescon','nucleus_direx'].includes(user.role))fail(403,'Apenas PRESCON ou fiscalização da DIREX do Núcleo.');
   const forms=await overview(user);
   const ejs=await db('ejs',{query:'select=id,name&limit=100'});
   const totals=[];
   for(const f of forms.slice(0,75)){
    const roster=await eligibleRoster(f,ejs);
    const eligible=new Set(roster.map(e=>e.id));
    const submissions=await db('portal_form_submissions',{query:'select=ej_id,state,channel&form_id=eq.'+f.id+'&limit=2000'});
    const validated=new Set(submissions.filter(x=>x.state==='accepted'&&x.ej_id&&(f.audience!=='counselor'||eligible.has(x.ej_id))).map(x=>x.ej_id));
    totals.push({id:f.id,title:f.title,kind:f.kind,status:f.status,due_at:f.due_at,
      updated_at:f.updated_at,created_at:f.created_at,question_count:f.questions?.length||0,
      accepted_count:validated.size,pending_count:Math.max(0,roster.length-validated.size),
      pending_review_count:submissions.filter(x=>x.state==='pending_review').length,
      // Não revelar a EJ que votou nem conteúdo de nenhum voto em aberto.
      votes_hidden:true});
   }
   const decisions=await db('deliberations',{query:'select=id,title,status,due_at,created_at,updated_at&is_demo=eq.false&status=neq.draft&order=created_at.desc&limit=100'});
   const demands=await db('demands',{query:'select=id,ej_id,title,due_at,status,severity&order=created_at.desc&limit=1500'});
   const demandStats={total:demands.length,open:demands.filter(d=>['pendente','em_andamento'].includes(d.status)).length,
       justified:demands.filter(d=>d.status==='justificada').length,
       overdue:demands.filter(d=>['pendente','em_andamento'].includes(d.status)&&d.due_at&&d.due_at<new Date().toISOString().slice(0,10)).length};
   return json(res,200,{role:user.role,forms:totals,deliberations:decisions,
      demands:demandStats,scope:'Acompanhamento institucional somente leitura. Votos individuais, especificações e justificativas não são exibidos.'});
  }
  if(action==='weekly'){
   if(user.role!=='prescon')fail(403,'Somente a PRESCON pode consultar a situação da Rede.');
   const forms=(await overview(user)).filter(f=>f.status==='open');
   const ejs=await db('ejs',{query:'select=id,name,slug&order=name.asc&limit=100'});
   const enriched=[];
   for(const f of forms.slice(0,40)){
    const roster=await eligibleRoster(f,ejs);
    const eligible=new Set(roster.map(e=>e.id));
    const submissions=await db('portal_form_submissions',{query:'select=ej_id,state,channel&form_id=eq.'+f.id+'&limit=2000'});
    const accepted=new Set(submissions.filter(x=>x.state==='accepted'&&x.ej_id&&(f.audience!=='counselor'||eligible.has(x.ej_id))).map(x=>x.ej_id));
    enriched.push({
     id:f.id,title:f.title,kind:f.kind,due_at:f.due_at,
     valid_votes:accepted.size,pending_ejs:roster.filter(x=>!accepted.has(x.id)).map(x=>({id:x.id,name:x.name})),
     pending_review:submissions.filter(x=>x.state==='pending_review').length,
     google_responder_url:f.google_responder_url,
     // Votações do Conselho usam exclusivamente a composição congelada.
     total_ejs:roster.length
    });
   }
   const now=Date.now(),week=7*24*3600*1000;
   const dueSoon=enriched.filter(f=>f.due_at&&Date.parse(f.due_at)>=now&&Date.parse(f.due_at)<=now+week);
   const overdue=enriched.filter(f=>f.due_at&&Date.parse(f.due_at)<now);
   return json(res,200,{generated_at:new Date().toISOString(),active_count:enriched.length,
    open_forms:enriched,pending_review_total:enriched.reduce((n,f)=>n+f.pending_review,0),
    due_soon:dueSoon.map(f=>f.id),overdue:overdue.map(f=>f.id),
    scope:'Dados de formulários abertos cadastrados no Portal. Demandas e calendário ainda não integrados.'});
  }
  if(action==='ejs'){if(user.role!=='prescon')fail(403,'Apenas PRESCON.');return json(res,200,{ejs:await db('ejs',{query:'select=id,name,slug&order=name.asc&limit=100'})});}
  if(action==='form'){
   const id=String(req.query.id||'');if(!uuid(id))fail(400,'Formulário inválido.');
   const form=(await overview(user)).find(v=>v.id===id);
   if(!form)fail(404,'Formulário não disponível para este perfil.');
   return json(res,200,{form});
  }
  if(action==='my_vote_status'){
   if(user.role!=='counselor'||!user.ej_id)fail(403,'Disponível somente para o conselheiro da EJ.');
   const formId=String(req.query.id||'');if(!uuid(formId))fail(400,'Formulário inválido.');
   const forms=await db('portal_forms',{query:'select=id,status,due_at&id=eq.'+formId+'&limit=1'});
   if(!forms.length)fail(404,'Formulário não encontrado.');
   const existing=await db('portal_form_submissions',{query:'select=id,submitted_at&form_id=eq.'+formId+'&ej_id=eq.'+user.ej_id+'&state=eq.accepted&limit=1'});
   const vote=existing[0];
   if(!vote)return json(res,200,{registered:false,can_request:false,request:null});
   const auth=await db('portal_vote_change_authorizations',{query:'select=id,status,reason,decision_note,created_at,decided_at&source=eq.form&vote_id=eq.'+vote.id+'&requester_id=eq.'+user.userId+'&order=created_at.desc&limit=1'});
   return json(res,200,{registered:true,can_request:forms[0].status==='open'&&(!forms[0].due_at||Date.parse(forms[0].due_at)>Date.now()),request:auth[0]||null,submitted_at:vote.submitted_at});
  }
  if(action==='vote_change_queue'){
   if(user.role!=='prescon')fail(403,'Só a PRESCON vê solicitações de alteração.');
   const requests=await db('portal_vote_change_authorizations',{query:'select=id,source,form_id,ej_id,requester_id,reason,status,decision_note,created_at,decided_at&order=created_at.desc&limit=200'});
   return json(res,200,{requests});
  }
  if(action==='report'){
   if(user.role!=='prescon')fail(403,'Relatórios individuais são exclusivos da PRESCON.');
   const formId=String(req.query.id||'');if(!uuid(formId))fail(400,'Formulário inválido.');
   const rows=await db('portal_form_submissions',{query:'select=id,form_id,ej_id,respondent_name,respondent_email,channel,state,answers,submitted_at,review_note&form_id=eq.'+formId+'&order=submitted_at.desc&limit=2000'});
   const [form]=await db('portal_forms',{query:'select=id,audience,status&id=eq.'+formId+'&limit=1'});
   if(!form)fail(404,'Formulário não encontrado.');
   const roster=form.audience==='counselor'?await eligibleRoster(form,[]):null;
   const eligible=new Set((roster||[]).map(e=>e.id));
   const acceptedRows=rows.filter(v=>v.state==='accepted'&&(!roster||eligible.has(v.ej_id)));
   const acceptedCount=roster?new Set(acceptedRows.map(v=>v.ej_id)).size:acceptedRows.length;
   const summaries={accepted:acceptedCount,pending:rows.filter(v=>v.state==='pending_review').length,duplicate:rows.filter(v=>v.state==='duplicate').length,rejected:rows.filter(v=>v.state==='rejected').length,google:rows.filter(v=>v.channel==='google').length,portal:rows.filter(v=>v.channel==='portal').length};
   return json(res,200,{rows,summaries,eligible_ejs:roster,total_ejs:roster?roster.length:null,absent_count:roster?roster.length-acceptedCount:null,representation_percent:roster&&roster.length?100*acceptedCount/roster.length:null});
  }
  fail(404,'Operação desconhecida.');
 }
 if(req.method!=='POST')fail(405,'Método não permitido.');
 const data=body(req);
 if(action==='submit'){
  if(user.role!=='counselor'||!user.ej_id)fail(403,'Somente conselheiros vinculados a uma EJ podem responder.');
  const formId=String(data.formId||'');if(!uuid(formId))fail(400,'Formulário inválido.');
  const [form]=await db('portal_forms',{query:'select=id,questions,status,audience,due_at&status=eq.open&id=eq.'+formId+'&limit=1'});
  if(!form||form.audience!=='counselor'&&form.audience!=='all_members')fail(404,'Formulário não aberto para este perfil.');
  if(form.due_at&&new Date(form.due_at).getTime()<Date.now())fail(409,'O prazo deste formulário encerrou. Entre em contato com a PRESCON.');
  const answerMap={};const input=data.answers||{};
  for(const q of form.questions){
   const answer=String(input[q.id]??'').trim().slice(0,10000);
   if(q.required&&!answer)fail(400,'Responda: '+q.label);
   if(['vote','choice'].includes(q.type)&&answer&&!q.options.includes(answer))fail(400,'Alternativa inválida para '+q.label);
   answerMap[q.id]=answer;
  }
  const conflict=await db('portal_form_submissions',{query:'select=id&form_id=eq.'+formId+'&ej_id=eq.'+user.ej_id+'&state=eq.accepted&limit=1'});
  if(conflict.length)fail(409,'Esta EJ já registrou uma resposta válida. Procure a PRESCON para revisão.');
  await db('portal_form_submissions',{method:'POST',prefer:'return=minimal',data:{form_id:formId,ej_id:user.ej_id,user_id:user.userId,respondent_email:user.email,channel:'portal',state:'accepted',answers:answerMap}});
  return json(res,201,{ok:true,message:'Sua resposta foi registrada no Portal NEJLON.'});
 }
 if(action==='request_vote_change'){
  if(user.role!=='counselor'||!user.ej_id)fail(403,'Somente o conselheiro pode solicitar alteração do próprio voto.');
  const formId=String(data.formId||''),reason=String(data.reason||'').trim().slice(0,2000);
  if(!uuid(formId)||reason.length<10)fail(400,'Selecione um formulário e explique a solicitação.');
  const [form]=await db('portal_forms',{query:'select=id,status,due_at&id=eq.'+formId+'&limit=1'});
  if(!form||form.status!=='open'||form.due_at&&Date.parse(form.due_at)<=Date.now())fail(409,'Prazo encerrado. A solicitação deve ser feita enquanto o formulário está aberto.');
  const vote=(await db('portal_form_submissions',{query:'select=id&form_id=eq.'+formId+'&ej_id=eq.'+user.ej_id+'&state=eq.accepted&limit=1'}))[0];
  if(!vote)fail(404,'Não há voto validado desta EJ para alterar.');
  const outstanding=await db('portal_vote_change_authorizations',{query:'select=id&source=eq.form&vote_id=eq.'+vote.id+'&status=in.(requested,approved)&limit=1'});
  if(outstanding.length)fail(409,'Já existe solicitação pendente ou autorização concedida.');
  const rows=await db('portal_vote_change_authorizations',{method:'POST',prefer:'return=representation',data:{
   source:'form',vote_id:vote.id,form_id:formId,ej_id:user.ej_id,requester_id:user.userId,reason,status:'requested'
  }});
  return json(res,201,{ok:true,request:{id:rows[0].id,status:'requested'},message:'Solicitação enviada à PRESCON. Seu voto não foi alterado.'});
 }
 if(action==='apply_vote_change'){
  if(user.role!=='counselor'||!user.ej_id)fail(403,'Somente o conselheiro pode aplicar uma alteração autorizada.');
  const authorizationId=String(data.authorizationId||'');
  if(!uuid(authorizationId))fail(400,'Autorização inválida.');
  const answers=data.answers;
  if(!answers||typeof answers!=='object'||Array.isArray(answers))fail(400,'Informe novas respostas.');
  const result=await db('rpc/portal_apply_approved_vote_change',{method:'POST',data:{
   p_authorization_id:authorizationId,p_editor_id:user.userId,p_new_vote:answers
  }});
  return json(res,200,{ok:true,result,message:'Voto substituído conforme autorização da PRESCON. Alteração registrada no histórico.'});
 }
 if(action==='review_vote_change'){
  if(user.role!=='prescon')fail(403,'Somente a PRESCON pode autorizar alterações de voto.');
  const id=String(data.id||''),decision=String(data.decision||''),note=String(data.note||'').trim().slice(0,2500);
  if(!uuid(id)||!['approved','denied'].includes(decision)||note.length<8)fail(400,'Informe a decisão e uma justificativa com pelo menos 8 caracteres.');
  const result=await db('rpc/portal_review_vote_edit_request',{method:'POST',data:{
   p_authorization_id:id,p_prescon_id:user.userId,p_decision:decision,p_note:note
  }});
  return json(res,200,{ok:true,result,message:decision==='approved'?'Alteração autorizada; o conselheiro pode enviar um novo voto uma única vez.':'Solicitação recusada e justificativa registrada.'});
 }
 if(user.role!=='prescon')fail(403,'Somente a PRESCON pode gerenciar formulários.');
 if(action==='create'){
  const title=String(data.title||'').trim().slice(0,180);
  if(title.length<3)fail(400,'Título com pelo menos três caracteres obrigatório.');
  const kind=['pf','generic','survey','event'].includes(data.kind)?data.kind:'generic';
  const questions=normalizeQuestions(data.questions,kind);
  const description=String(data.description||'').trim().slice(0,3500);
  const due_at=data.dueAt&&Number.isFinite(Date.parse(data.dueAt))?new Date(data.dueAt).toISOString():null;
  if(data.dueAt&&!due_at)fail(400,'Prazo inválido.');
  let googleData={};
  if(data.createGoogle===true){
   const token=await accessToken(user.userId);
   const created=await createGoogleForm(token,title,description,questions);
   googleData={google_form_id:created.formId,google_responder_url:created.responderUrl,google_question_map:created.map};
  }
  const created=await db('portal_forms',{method:'POST',prefer:'return=representation',data:{title,description,kind,questions,status:'draft',audience:data.audience==='all_members'?'all_members':'counselor',due_at,created_by:user.userId,...googleData}});
  return json(res,201,{form:created[0],message:'Rascunho criado. Revise e publique quando estiver pronto.'});
 }
 if(action==='publish'||action==='close'){
  const id=String(data.id||'');if(!uuid(id))fail(400,'Formulário inválido.');
  const expected=action==='publish'?'draft':'open';
  const updated=await db('portal_forms',{method:'PATCH',query:'id=eq.'+id+'&status=eq.'+expected,prefer:'return=representation',data:{status:action==='publish'?'open':'closed',updated_at:new Date().toISOString()}});
  if(!updated.length)fail(409,'Transição inválida: publique apenas rascunhos e encerre apenas formulários abertos.');
  return json(res,200,{form:updated[0]});
 }
 if(action==='attach'){
  const id=String(data.id||'');if(!uuid(id))fail(400,'Formulário inválido.');
  const googleId=String(data.googleFormId||'').trim();
  if(!/^[a-zA-Z0-9_-]{12,150}$/.test(googleId))fail(400,'ID do Google Forms inválido.');
  const token=await accessToken(user.userId);
  const remote=await google('https://forms.googleapis.com/v1/forms/'+encodeURIComponent(googleId),token);
  const [local]=await db('portal_forms',{query:'select=id,questions&id=eq.'+id+'&limit=1'});
  if(!local)fail(404,'Formulário não encontrado.');
  const mapping={};const remoteItems=(remote.items||[]).filter(i=>i.questionItem?.question?.questionId);
  remoteItems.forEach(item=>{
   const key=item.questionItem.question.questionId;
   const title=String(item.title||'').trim().toLowerCase();
   if(title.includes('empresa júnior'))mapping[key]='ej';
   else if(title.includes('nome completo'))mapping[key]='respondent';
   else{
    const q=local.questions.find(q=>q.label.trim().toLowerCase()===title);
    if(q)mapping[key]=q.id;
   }
  });
  await db('portal_forms',{method:'PATCH',query:'id=eq.'+id,data:{google_form_id:googleId,google_responder_url:remote.responderUri||null,google_question_map:mapping}});
  return json(res,200,{ok:true,mapped:Object.keys(mapping).length,total:remoteItems.length,googleUrl:remote.responderUri||null});
 }
 if(action==='sync'){
  const id=String(data.id||'');if(!uuid(id))fail(400,'Formulário inválido.');
  return json(res,200,{ok:true,sync:await syncGoogle(user,id)});
 }
 if(action==='review'){
  const submissionId=String(data.id||'');if(!uuid(submissionId))fail(400,'Resposta inválida.');
  if(!['accepted','duplicate','rejected','pending_review'].includes(data.state))fail(400,'Decisão inválida.');
  const [existing]=await db('portal_form_submissions',{query:'select=id,form_id,ej_id&'+'id=eq.'+submissionId+'&limit=1'});
  if(!existing)fail(404,'Resposta não encontrada.');
  let ejId=existing.ej_id;
  if(data.ejId&&uuid(data.ejId))ejId=data.ejId;
  if(data.state==='accepted'){
   if(!ejId)fail(400,'Vincule a resposta a uma EJ antes de aceitá-la.');
   const [form]=await db('portal_forms',{query:'select=id,audience,status,due_at&id=eq.'+existing.form_id+'&limit=1'});
   if(!form)fail(404,'Formulário não encontrado.');
   if(form.audience==='counselor'&&!(await eligibleRoster(form,[])).some(e=>e.id===ejId))fail(400,'EJ não elegível nesta votação.');
   const conflict=await db('portal_form_submissions',{query:'select=id&form_id=eq.'+existing.form_id+'&ej_id=eq.'+ejId+'&state=eq.accepted&limit=1'});
   if(conflict.some(v=>v.id!==submissionId))fail(409,'Já existe resposta válida para essa EJ. Marque uma das respostas como duplicada antes.');
  }
  const updated=await db('portal_form_submissions',{method:'PATCH',query:'id=eq.'+submissionId,prefer:'return=representation',data:{state:data.state,ej_id:ejId,review_note:String(data.note||'').slice(0,2500),reviewed_by:user.userId,reviewed_at:new Date().toISOString()}});
  return json(res,200,{row:updated[0]});
 }
 fail(404,'Operação não encontrada.');
}
module.exports=protect(handler);