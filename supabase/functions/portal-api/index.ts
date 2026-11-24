
const SB=Deno.env.get('SUPABASE_URL')||'https://imsisbixzkqphooxyfhr.supabase.co';
const SERVICE=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const PUBLIC=Deno.env.get('SUPABASE_ANON_KEY')||'sb_publishable_mS_TDGKZhUuJi-rxc5Nu1w_IXODeo-_';
const ALLOWED=new Set(['https://geisilyvargas-unect.github.io','https://portal-nejlon-2027.vercel.app','https://portal-nejlon-2027-geisily.vercel.app']);
class HttpError extends Error{constructor(code,message){super(message);this.code=code}}
function fail(code,message){throw new HttpError(code,message)}
function json(res,status,data){res.status(status).setHeader('Cache-Control','no-store').setHeader('Content-Type','application/json; charset=utf-8').end(JSON.stringify(data))}
function body(req){return req.body||{}}
function envCheck(){const missing=['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','GOOGLE_TOKEN_ENCRYPTION_KEY'].filter(x=>!Deno.env.get(x));return missing}
function ready(){return envCheck().length===0}
async function parseJson(response){
 let data={};try{data=await response.json()}catch{}
 if(!response.ok){
  const code=data.code==='23505'?409:response.status>=500?502:response.status;
  const reason=code===409?'Já existe um registro com essas informações.':String(data.error_description||data.error?.message||data.message||data.error||'Erro de acesso ao banco.').slice(0,300);
  fail(code,reason)
 }
 return data;
}
async function db(table,{method='GET',query='',data,prefer}={}){
 if(!SERVICE)fail(503,'A configuração privada do Supabase está indisponível.');
 let result;try{
  result=await fetch(SB+'/rest/v1/'+table+(query?'?'+query:''),{
   method,headers:{apikey:SERVICE,Authorization:'Bearer '+SERVICE,'Content-Type':'application/json',...(prefer?{Prefer:prefer}:{})},
   ...(data===undefined?{}:{body:JSON.stringify(data)})
  })
 }catch{fail(503,'Não foi possível consultar o banco Supabase.')}
 return parseJson(result);
}
async function userFromToken(req){
 const authorization=String(req.headers.authorization||'');
 if(!authorization.startsWith('Bearer ')||authorization.length>4800)fail(401,'Entre com sua conta institucional.');
 let response;
 try{response=await fetch(SB+'/auth/v1/user',{headers:{apikey:PUBLIC,Authorization:authorization}})}catch{fail(503,'Não foi possível validar a sessão.')}
 const me=await parseJson(response);
 if(!me?.id||!me.email)fail(401,'Sessão inválida.');
 const rows=await db('profiles',{query:'select=id,email,role,ej_id,active&id=eq.'+me.id+'&limit=1'});
 const p=rows?.[0];
 if(!p?.active)fail(403,'Seu perfil institucional está inativo ou não cadastrado.');
 return {...p,userId:me.id};
}
async function prescon(req){const p=await userFromToken(req);if(p.role!=='prescon')fail(403,'Acesso exclusivo da PRESCON.');return p}
function accessToken(){fail(503,'A integração Google ainda não está ativada. Use os formulários e demandas internos enquanto isso.')}
function google(){fail(503,'Conecte sua conta Google para usar esta ação.')}
function protect(handler){return async(req,res)=>{
 try{await handler(req,res)}catch(e){json(res,e instanceof HttpError?e.code:500,{error:e instanceof HttpError?e.message:'Não foi possível concluir a operação.'})}
}}
const G={json,fail,body,protect,db,userFromToken,prescon,accessToken,google};
async function handleDrive(req,res){
 const action=String(req.query?.action||'status');
 if(req.method==='GET'&&action==='health')return json(res,200,{configured:true,googleReady:ready(),backend:'Supabase Edge Functions'});
 const p=await prescon(req);
 if(req.method==='GET'&&action==='status'){
  const [forms,files,settings,connected]=await Promise.all([
   db('portal_forms',{query:'select=id,title,status,kind,google_form_id,google_responder_url,created_at,due_at&order=created_at.desc&limit=60'}),
   db('portal_drive_files',{query:'select=name,kind,web_view_link,created_at&owner_user_id=eq.'+p.userId+'&order=created_at.desc&limit=20'}),
   db('portal_drive_settings',{query:'select=root_folder_id,root_folder_url&owner_user_id=eq.'+p.userId+'&limit=1'}),
   db('portal_google_connections',{query:'select=owner_user_id,email,connected_at&owner_user_id=eq.'+p.userId+'&limit=1'})
  ]);
  return json(res,200,{configured:ready(),googleConnected:!!connected.length,root:settings[0]||null,files,forms,formCount:forms.length,missing:envCheck()});
 }
 fail(503,'A gestão de arquivos Google requer autorização OAuth e backend Google, ainda não habilitados no Pages. Demandas e formulários do Portal já usam o Supabase.')
}
function buildResponse(req){
 const url=new URL(req.url);
 let statusCode=200,bodyText='';
 const headers=new Headers({'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
 const origin=req.headers.get('origin')||'';
 if(origin&&ALLOWED.has(origin)){headers.set('Access-Control-Allow-Origin',origin);headers.set('Vary','Origin')}
 const res={
  status(code){statusCode=code;return this},
  setHeader(k,v){headers.set(k,v);return this},
  end(value){bodyText=value??'';return this}
 };
 return {res,output:()=>new Response(bodyText,{status:statusCode,headers}),url};
}

const handler0=(()=>{
const {json,fail,body,protect,db,userFromToken}=G;
const uuid=x=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(x||''));
const canExplain=role=>role==='counselor';
const clean=(v,max=2000)=>String(v??'').trim().slice(0,max);
const validDate=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(Date.parse(d+'T12:00:00Z'))?d:null;
const https=x=>{if(!x)return null;try{const u=new URL(String(x));if(u.protocol!=='https:')fail(400,'O link do comprovante deve começar com https://.');return u.href.slice(0,1800)}catch{fail(400,'Informe um link HTTPS válido para o comprovante.')}};
async function ejIds(){return db('ejs',{query:'select=id,name,slug&order=name.asc&limit=100'})}
async function findDemand(id){
 if(!uuid(id))fail(400,'Demanda inválida.');
 const rows=await db('demands',{query:'select=id,ej_id,title,description,due_at,status,responsible,created_at,created_by,updated_at,completed_at,template_key,severity&id=eq.'+id+'&limit=1'});
 if(!rows.length)fail(404,'Demanda não encontrada.');return rows[0];
}
async function event({demand,actor,action,note='',details={}}){
 return db('portal_demand_events',{method:'POST',prefer:'return=minimal',data:{demand_id:demand,actor_id:actor.userId,actor_role:actor.role,action,note,details}});
}
async function list(user){
 const role=user.role;
 const isPrescon=role==='prescon';
 const allEjs=isPrescon||role==='nucleus_direx'||role==='counselor';
 if(!allEjs&&role!=='ej_direx')fail(403,'Perfil sem acesso às demandas.');
 if(!allEjs&&!user.ej_id)fail(403,'Seu cadastro ainda não está vinculado a uma EJ.');
 // Para os demais perfis, o banco é consultado somente por campos de visão geral.
 // Descrição, responsável, comprovantes, notas e histórico são exclusivos da PRESCON.
 const columns=isPrescon?
   'id,ej_id,title,description,due_at,status,responsible,created_at,created_by,updated_at,completed_at,template_key,severity':
   'id,ej_id,title,due_at,status,severity,created_at';
 const filter=allEjs?'':'&ej_id=eq.'+user.ej_id;
 const demands=await db('demands',{query:'select='+columns+'&order=created_at.desc&limit=1500'+filter});
 let justifications=[],events=[];
 if(isPrescon){
  justifications=await db('portal_demand_justifications',{query:'select=id,demand_id,ej_id,submitted_by,reason_type,explanation,evidence_url,state,decision_note,decided_by,decided_at,created_at&order=created_at.desc&limit=3000'});
  if(demands.length){
   const ids=demands.map(d=>d.id);
   for(let start=0;start<ids.length;start+=100){
    const part=ids.slice(start,start+100);
    events.push(...await db('portal_demand_events',{query:'select=id,demand_id,actor_role,action,note,details,created_at&demand_id=in.('+part.join(',')+')&order=created_at.asc&limit=2500'}));
   }
  }
 }else if(role==='counselor'&&user.ej_id){
  // Apenas o estado do pedido de justificativa da própria EJ, nunca texto ou documento.
  justifications=await db('portal_demand_justifications',{query:'select=demand_id,state,created_at&ej_id=eq.'+user.ej_id+'&order=created_at.desc&limit=3000'});
 }
 const ejs=allEjs?await ejIds():[];
 const summary={
  total:demands.length,
  waiting:demands.filter(d=>['pendente','em_andamento'].includes(d.status)).length,
  justified:demands.filter(d=>d.status==='justificada').length,
  completed:demands.filter(d=>d.status==='concluida').length,
  pendingReview:isPrescon?justifications.filter(j=>j.state==='pending_review').length:0,
  overdue:demands.filter(d=>['pendente','em_andamento'].includes(d.status)&&d.due_at&&d.due_at<new Date().toISOString().slice(0,10)).length
 };
 return {demands,justifications,events,ejs,summary,ownEjId:user.ej_id||null,
  role,detailAccess:isPrescon,limited:demands.length===1500||(isPrescon&&justifications.length===3000)};
}
async function eligibleRoster(form, fallback){
 if(form.audience!=='counselor')return fallback;
 const rows=await db('portal_form_eligible_ejs',{query:'select=ej_id,name_snapshot&form_id=eq.'+form.id+'&order=name_snapshot.asc'});
 return rows.map(e=>({id:e.ej_id,name:e.name_snapshot}));
}
async function handler(req,res){
 const user=await userFromToken(req);
 const action=String(req.query?.action||'list');
 if(req.method==='GET'){
  if(action==='list')return json(res,200,{...(await list(user)),role:user.role});
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
  const severity=['amarela','laranja','vermelha'].includes(data.severity)?data.severity:'amarela';
  // Um único envio em lote: 29 EJs não exigem dezenas de requisições separadas.
  const created=await db('demands',{method:'POST',prefer:'return=representation',data:ids.map(id=>({
   ej_id:id,title,description,due_at:due,status:'pendente',responsible,
   created_by:user.userId,updated_at:new Date().toISOString(),template_key:templateKey,severity
  }))});
  if(!Array.isArray(created)||created.length!==ids.length)fail(500,'Não foi possível confirmar todas as demandas no banco.');
  await db('portal_demand_events',{method:'POST',prefer:'return=minimal',data:created.map(d=>({
   demand_id:d.id,actor_id:user.userId,actor_role:'prescon',action:'created',
   note:'Demanda cadastrada pela PRESCON.',details:{ej_id:d.ej_id,title,due_at:due,severity}
  }))});
  return json(res,201,{ok:true,count:created.length,demands:created});
 }
 if(action==='justify'){
  if(!canExplain(user.role)||!user.ej_id)fail(403,'Somente o conselheiro da própria EJ pode justificar.');
  const demand=await findDemand(data.demandId);
  if(demand.ej_id!==user.ej_id)fail(403,'Esta demanda pertence a outra EJ.');
  if(!['pendente','em_andamento'].includes(demand.status))fail(409,'Esta demanda já foi encerrada ou justificada.');
  const reason=clean(data.reason,35),explanation=clean(data.explanation,5000);
  if(!['ausencia','prazo','dificuldade','impedimento','outro'].includes(reason))fail(400,'Selecione o motivo da justificativa.');
  if(explanation.length<10)fail(400,'Explique a situação em pelo menos 10 caracteres.');
  const earlier=await db('portal_demand_justifications',{query:'select=id,state&demand_id=eq.'+demand.id+'&state=eq.pending_review&limit=1'});
  if(earlier.length)fail(409,'Já existe justificativa enviada ou aceita para esta demanda.');
  const evidence=https(clean(data.evidenceUrl,1800));
  const created=await db('portal_demand_justifications',{method:'POST',prefer:'return=representation',data:{
   demand_id:demand.id,ej_id:user.ej_id,submitted_by:user.userId,reason_type:reason,explanation,evidence_url:evidence,state:'pending_review'
  }});
  await event({demand:demand.id,actor:user,action:'justification_submitted',note:'A EJ enviou uma justificativa para análise.',details:{justification_id:created[0].id,reason_type:reason}});
  return json(res,201,{ok:true,justification:{id:created[0].id,state:'pending_review'},message:'Justificativa registrada e enviada para a PRESCON.'});
 }
 if(user.role!=='prescon')fail(403,'Decisões e alterações de demandas são exclusivas da PRESCON.');
 if(action==='decide'){
  const id=String(data.justificationId||'');if(!uuid(id))fail(400,'Justificativa inválida.');
  const decision=data.decision==='accepted'?'accepted':data.decision==='rejected'?'rejected':null;
  if(!decision)fail(400,'Escolha aceitar ou recusar.');
  const note=clean(data.note,3000);
  if(note.length<8)fail(400,'Registre o motivo da decisão com pelo menos 8 caracteres.');
  // Transação única no Postgres: decisão, situação e histórico sempre ficam consistentes.
  const decided=await db('rpc/portal_decide_demand_justification',{method:'POST',data:{
   p_justification_id:id,p_actor_id:user.userId,p_decision:decision,p_note:note
  }});
  return json(res,200,{ok:true,justification:decided,message:decision==='accepted'?'Justificativa aceita. Demanda marcada como justificada.':'Justificativa recusada. Demanda permanece pendente.'});
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
return protect(handler);
})();

const handler1=(()=>{
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
 const oversight=user.role==='nucleus_direx';
 // DIREX de EJ não recebe formulários, manuais, arquivos nem links.
 if(!prescon&&!oversight&&user.role!=='counselor')return [];
 const fields=prescon?'id,title,description,questions,kind,status,audience,google_form_id,google_responder_url,created_at,updated_at,due_at':'id,title,description,questions,kind,status,audience,google_responder_url,created_at,updated_at,due_at';
 const forms=await db('portal_forms',{query:'select='+fields+'&'+(prescon||oversight?'':'status=eq.open&')+'order=created_at.desc&limit=100'});
 return prescon||oversight?forms:forms.filter(f=>f.audience==='all_members'||user.role==='counselor');
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
return protect(handler);
})();

const handler2=(()=>{
const {json,fail,body,protect,db,userFromToken}=G;
const allowedKeys=['calendario','drive-conselho','mapa-estrategico','demandas','politica-participacao','reunioes-virtuais','reunioes-conselho','deliberacoes','painel-gamificacao','politica-pontuacao'];
function externalUrl(raw){
 if(!raw)return null;
 let url;try{url=new URL(String(raw).trim())}catch{fail(400,'Informe um link completo começando com https://.')}
 if(url.protocol!=='https:')fail(400,'Somente links HTTPS são aceitos.');
 return url.href.slice(0,1800);
}
async function handler(req,res){
 const user=await userFromToken(req);
 if(!['counselor','prescon'].includes(user.role))fail(403,'Esta área é exclusiva do Conselho e da PRESCON.');
 const action=String(req.query?.action||'list');
 if(req.method==='GET'&&action==='list'){
  const resources=await db('portal_council_resources',{query:'select=key,label,description,reference_year,official_url,status,updated_at&order=label.asc&limit=30'});
  const forms=await db('portal_forms',{query:'select=id,title,kind,status,due_at,created_at&status=eq.open&order=created_at.desc&limit=100'});
  const delibs=await db('deliberations',{query:'select=id,title,status,due_at,created_at&is_demo=eq.false&status=neq.draft&order=created_at.desc&limit=100'});
  return json(res,200,{role:user.role,resources,forms,deliberations:delibs,own_ej:user.ej_id||null});
 }
 if(req.method==='POST'&&action==='update'){
  if(user.role!=='prescon')fail(403,'Só a PRESCON pode editar os links do painel.');
  const data=body(req),key=String(data.key||''),status=String(data.status||'pending');
  if(!allowedKeys.includes(key))fail(400,'Recurso não reconhecido.');
  if(!['pending','active','archived'].includes(status))fail(400,'Situação inválida.');
  const url=externalUrl(data.url);
  if(status==='active'&&!url)fail(400,'Para ativar, cadastre o link oficial.');
  const updated=await db('portal_council_resources',{method:'PATCH',query:'key=eq.'+encodeURIComponent(key),prefer:'return=representation',
   data:{official_url:url,status,updated_by:user.userId,updated_at:new Date().toISOString()}});
  return json(res,200,{ok:true,resource:updated[0]});
 }
 fail(404,'Operação indisponível.');
}
return protect(handler);
})();

Deno.serve(async req=>{
 const origin=req.headers.get('origin')||'';
 if(origin&&!ALLOWED.has(origin))return new Response(JSON.stringify({error:'Origem não autorizada.'}),{status:403,headers:{'Content-Type':'application/json'}});
 const {res,output,url}=buildResponse(req);
 res.setHeader('Access-Control-Allow-Headers','Authorization,Content-Type,apikey');
 res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:resHeaders(req)});
 const which=url.pathname.split('/').pop();
 const q=Object.fromEntries(url.searchParams.entries());
 let data={};
 if(req.method==='POST'){
  if(Number(req.headers.get('content-length')||0)>150000)return new Response(JSON.stringify({error:'Solicitação muito grande.'}),{status:413,headers:resHeaders(req)});
  try{data=await req.json()}catch{return new Response(JSON.stringify({error:'JSON inválido.'}),{status:400,headers:resHeaders(req)})}
 }
 const adapted={method:req.method,query:q,body:data,headers:{authorization:req.headers.get('authorization')||''}};
 try{
  if(which==='demands')await handler0(adapted,res);
  else if(which==='forms')await handler1(adapted,res);
  else if(which==='drive')await handleDrive(adapted,res);
  else if(which==='council')await handler2(adapted,res);
  else json(res,404,{error:'Rota inexistente.'});
 }catch{json(res,500,{error:'Erro inesperado. Tente novamente.'})}
 return output()
});
function resHeaders(req){
 const o=req.headers.get('origin')||'';
 const h=new Headers({'Content-Type':'application/json','Access-Control-Allow-Headers':'Authorization,Content-Type,apikey','Access-Control-Allow-Methods':'GET,POST,OPTIONS'});
 if(o&&ALLOWED.has(o)){h.set('Access-Control-Allow-Origin',o);h.set('Vary','Origin')}
 return h;
}
