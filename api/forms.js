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
 const source=kind==='pf'?presetPf():questions;
 if(!Array.isArray(source)||source.length<1||source.length>30)fail(400,'Informe de 1 a 30 perguntas.');
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
 const forms=await db('portal_forms',{query:'select=id,title,description,questions,kind,status,audience,google_form_id,google_responder_url,created_at&'+(prescon?'':'status=eq.open&')+'order=created_at.desc&limit=100'});
 return prescon?forms:forms.filter(f=>f.audience==='all_members'||user.role==='counselor');
}
async function syncGoogle(user,formId){
 const [record]=await db('portal_forms',{query:'select=id,google_form_id,google_question_map,status&'+(formId?'id=eq.'+formId+'&':'google_form_id=not.is.null&')+'limit=1'});
 if(!record?.google_form_id)fail(404,'Formulário Google não vinculado.');
 const token=await accessToken(user.userId);
 let pageToken='',pages=0,created=0,skipped=0;
 do{
  const qs=new URLSearchParams({pageSize:'1000'});
  if(pageToken)qs.set('pageToken',pageToken);
  const response=await google('https://forms.googleapis.com/v1/forms/'+encodeURIComponent(record.google_form_id)+'/responses?'+qs,token);
  for(const r of response.responses||[]){
   const existing=await db('portal_form_submissions',{query:'select=id&form_id=eq.'+record.id+'&google_response_id=eq.'+encodeURIComponent(r.responseId)+'&limit=1'});
   if(existing.length){skipped++;continue}
   const answerMap={};
   for(const [googleQuestionId,value] of Object.entries(r.answers||{})){
    const key=record.google_question_map?.[googleQuestionId]||googleQuestionId;
    answerMap[key]=value.textAnswers?.answers?.map(a=>a.value).join(', ')||'';
   }
   let ejId=null;const ejName=String(answerMap.ej||'').trim().toLowerCase();
   if(ejName){
    const ejs=await db('ejs',{query:'select=id,name,slug&limit=100'});
    const ej=ejs.find(v=>v.slug?.toLowerCase()===ejName||v.name?.toLowerCase()===ejName);
    if(ej)ejId=ej.id;
   }
   try{await db('portal_form_submissions',{method:'POST',prefer:'return=minimal',data:{
     form_id:record.id,ej_id:ejId,respondent_email:r.respondentEmail||null,respondent_name:answerMap.respondent||null,
     channel:'google',state:'pending_review',google_response_id:r.responseId,answers:answerMap,
     submitted_at:r.lastSubmittedTime||new Date().toISOString()
   }});created++;}catch(e){if(String(e.message).includes('duplicate')){skipped++;continue}throw e}
  }
  pageToken=response.nextPageToken||'';pages++;
 }while(pageToken&&pages<5);
 return {created,skipped,remaining:!!pageToken,note:'Respostas do Google ficam pendentes de validação da PRESCON.'};
}
async function handler(req,res){
 const action=String(req.query?.action||'list');
 const user=await userFromToken(req);
 if(req.method==='GET'){
  if(action==='list')return json(res,200,{forms:await overview(user)});
  if(action==='form'){
   const id=String(req.query.id||'');if(!uuid(id))fail(400,'Formulário inválido.');
   const form=(await overview(user)).find(v=>v.id===id);
   if(!form)fail(404,'Formulário não disponível para este perfil.');
   return json(res,200,{form});
  }
  if(action==='report'){
   if(user.role!=='prescon')fail(403,'Relatórios individuais são exclusivos da PRESCON.');
   const formId=String(req.query.id||'');if(!uuid(formId))fail(400,'Formulário inválido.');
   const rows=await db('portal_form_submissions',{query:'select=id,form_id,ej_id,respondent_name,respondent_email,channel,state,answers,submitted_at,review_note&form_id=eq.'+formId+'&order=submitted_at.desc&limit=2000'});
   const summaries={accepted:rows.filter(v=>v.state==='accepted').length,pending:rows.filter(v=>v.state==='pending_review').length,duplicate:rows.filter(v=>v.state==='duplicate').length,rejected:rows.filter(v=>v.state==='rejected').length,google:rows.filter(v=>v.channel==='google').length,portal:rows.filter(v=>v.channel==='portal').length};
   return json(res,200,{rows,summaries});
  }
  fail(404,'Operação desconhecida.');
 }
 if(req.method!=='POST')fail(405,'Método não permitido.');
 const data=body(req);
 if(action==='submit'){
  if(user.role!=='counselor'||!user.ej_id)fail(403,'Somente conselheiros vinculados a uma EJ podem responder.');
  const formId=String(data.formId||'');if(!uuid(formId))fail(400,'Formulário inválido.');
  const [form]=await db('portal_forms',{query:'select=id,questions,status,audience&status=eq.open&id=eq.'+formId+'&limit=1'});
  if(!form||form.audience!=='counselor'&&form.audience!=='all_members')fail(404,'Formulário não aberto para este perfil.');
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
 if(user.role!=='prescon')fail(403,'Somente a PRESCON pode gerenciar formulários.');
 if(action==='create'){
  const title=String(data.title||'').trim().slice(0,180);
  if(title.length<3)fail(400,'Título com pelo menos três caracteres obrigatório.');
  const kind=['pf','generic','survey','event'].includes(data.kind)?data.kind:'generic';
  const questions=normalizeQuestions(data.questions,kind);
  const description=String(data.description||'').trim().slice(0,3500);
  let googleData={};
  if(data.createGoogle===true){
   const token=await accessToken(user.userId);
   const created=await createGoogleForm(token,title,description,questions);
   googleData={google_form_id:created.formId,google_responder_url:created.responderUrl,google_question_map:created.map};
  }
  const created=await db('portal_forms',{method:'POST',prefer:'return=representation',data:{title,description,kind,questions,status:'draft',audience:data.audience==='all_members'?'all_members':'counselor',created_by:user.userId,...googleData}});
  return json(res,201,{form:created[0],message:'Rascunho criado. Revise e publique quando estiver pronto.'});
 }
 if(action==='publish'||action==='close'){
  const id=String(data.id||'');if(!uuid(id))fail(400,'Formulário inválido.');
  const updated=await db('portal_forms',{method:'PATCH',query:'id=eq.'+id,prefer:'return=representation',data:{status:action==='publish'?'open':'closed',updated_at:new Date().toISOString()}});
  if(!updated.length)fail(404,'Formulário não encontrado.');
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
   const conflict=await db('portal_form_submissions',{query:'select=id&form_id=eq.'+existing.form_id+'&ej_id=eq.'+ejId+'&state=eq.accepted&limit=1'});
   if(conflict.some(v=>v.id!==submissionId))fail(409,'Já existe resposta válida para essa EJ. Marque uma das respostas como duplicada antes.');
  }
  const updated=await db('portal_form_submissions',{method:'PATCH',query:'id=eq.'+submissionId,prefer:'return=representation',data:{state:data.state,ej_id:ejId,review_note:String(data.note||'').slice(0,2500),reviewed_by:user.userId,reviewed_at:new Date().toISOString()}});
  return json(res,200,{row:updated[0]});
 }
 fail(404,'Operação não encontrada.');
}
module.exports=protect(handler);