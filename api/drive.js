'use strict';
const G=require('./_shared');
const {json,fail,body,protect,prescon,db,ready,envCheck,accessToken,google,googleToken,settings,ensureRoot,ensureChild,upload,recordFile,textName}=G;
const formulaSafe=value=>{const s=String(value??'');return /^\s*[=+\-@]/.test(s)?"'"+s:s};
const csv=rows=>'\ufeff'+rows.map(row=>row.map(cell=>'"'+formulaSafe(cell).replace(/"/g,'""')+'"').join(';')).join('\r\n');
async function makeReport(userId,token,formId,asSheet){
 const query='select=id,title,status,kind&'+(formId?'id=eq.'+encodeURIComponent(formId)+'&':'')+'order=created_at.desc&limit=50';
 const forms=await db('portal_forms',{query});
 if(formId&&!forms.length)fail(404,'Formulário não encontrado.');
 const rows=[['Formulário','EJ / identificador','Canal','Situação','Data','Respostas em JSON']];
 let accepted=0,pending=0,total=0;
 for(const f of forms){
  const submissions=await db('portal_form_submissions',{query:'select=ej_id,respondent_name,channel,state,submitted_at,answers&form_id=eq.'+f.id+'&order=submitted_at.asc&limit=1000'});
  for(const sub of submissions){
   total++;accepted+=Number(sub.state==='accepted');pending+=Number(sub.state==='pending_review');
   rows.push([f.title,sub.respondent_name||sub.ej_id||'Identificação pendente',sub.channel,sub.state,sub.submitted_at,JSON.stringify(sub.answers)]);
  }
 }
 const root=await ensureRoot(userId,token);
 const folder=await ensureChild(token,root.id,formId?forms[0].title:'Relatórios da Rede');
 const stamp=new Date().toISOString().slice(0,10);
 if(asSheet){
  const doc=await google('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink',token,{method:'POST',data:{name:'Relatório NEJLON '+stamp,mimeType:'application/vnd.google-apps.spreadsheet',parents:[folder.id]}});
  await google('https://sheets.googleapis.com/v4/spreadsheets/'+doc.id+'/values/A1?valueInputOption=RAW',token,{method:'PUT',data:{values:rows}});
  await recordFile(userId,doc,{kind:'sheet',formId,folderId:folder.id});
  return {name:doc.name,url:doc.webViewLink||'https://docs.google.com/spreadsheets/d/'+doc.id+'/edit',total,accepted,pending};
 }
 const file=await upload(token,folder.id,'Relatório NEJLON '+stamp+'.csv','text/csv',Buffer.from(csv(rows),'utf8'));
 await recordFile(userId,file,{kind:'report',formId,folderId:folder.id});
 return {name:file.name,url:file.webViewLink||'https://drive.google.com/file/d/'+file.id+'/view',total,accepted,pending};
}
async function handle(req,res){
 const action=String(req.query?.action||'status');
 if(action==='callback'){
  const returnTo=process.env.PORTAL_UI_URL||'https://geisilyvargas-unect.github.io/portal-nejlon-2027/pages/central-automacoes.html';
  const state=req.query?.state;
  if(!state||!req.query?.code)return res.redirect(302,returnTo+'?google=cancelado');
  if(!ready())fail(503,'Integração Google ainda não configurada no servidor.');
  const userId=G.verifyState(state);
  const profiles=await db('profiles',{query:'select=id,role,active&id=eq.'+userId+'&limit=1'});
  if(!profiles.length||profiles[0].role!=='prescon'||!profiles[0].active)fail(403,'Autorização reservada à PRESCON.');
  const tokens=await googleToken(String(req.query.code));
  if(!tokens.refresh_token)fail(409,'O Google não forneceu autorização permanente. Revogue a conexão anterior e tente novamente.');
  let email=null;
  try{const u=await google('https://www.googleapis.com/oauth2/v3/userinfo',tokens.access_token);email=u.email||null;}catch{}
  await db('portal_google_connections',{method:'POST',query:'on_conflict=owner_user_id',prefer:'resolution=merge-duplicates',data:{owner_user_id:userId,email,encrypted_refresh_token:G.encrypt(tokens.refresh_token),connected_at:new Date().toISOString()}});
  return res.redirect(302,returnTo+'?google=conectado');
 }
 if(req.method==='GET'&&action==='health')return json(res,200,{configured:ready(),missing:envCheck(),service:'PRESCON integrations'});
 const user=await prescon(req);
 const uid=user.userId;
 if(req.method==='GET'&&action==='status'){
  const configured=ready();
  let googleConnected=false,root=null,files=[],formCount=0;
  if(configured){
   const conn=await db('portal_google_connections',{query:'select=owner_user_id,email,connected_at&owner_user_id=eq.'+uid+'&limit=1'});
   googleConnected=!!conn.length;
   root=await settings(uid);
   files=await db('portal_drive_files',{query:'select=name,kind,web_view_link,created_at&owner_user_id=eq.'+uid+'&order=created_at.desc&limit=20'});
  }
  const forms=await db('portal_forms',{query:'select=id,title,status,kind,google_form_id,google_responder_url,created_at&order=created_at.desc&limit=40'});
  formCount=forms.length;
  return json(res,200,{configured,missing:envCheck(),googleConnected,root,files,forms,formCount});
 }
 if(req.method==='GET'&&action==='connect'){
  if(!ready())fail(503,'Para conectar o Google, configure as credenciais na Vercel.');
  const params=new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID,redirect_uri:G.redirectUri(),response_type:'code',access_type:'offline',prompt:'consent',include_granted_scopes:'true',scope:G.scopes.join(' '),state:G.signState(uid)});
  return json(res,200,{url:'https://accounts.google.com/o/oauth2/v2/auth?'+params});
 }
 if(req.method!=='POST')fail(405,'Método não permitido.');
 const params=body(req);
 const token=await accessToken(uid);
 if(action==='root'){
  const result=await ensureRoot(uid,token);
  return json(res,200,{ok:true,folder:result});
 }
 if(action==='folder'){
  const root=await ensureRoot(uid,token);
  if(!params.name||String(params.name).trim().length<3)fail(400,'Informe um nome para a pasta.');
  const folder=await ensureChild(token,root.id,params.name);
  await recordFile(uid,folder,{kind:'folder',folderId:root.id});
  return json(res,200,{ok:true,folder:{id:folder.id,url:folder.webViewLink||'https://drive.google.com/drive/folders/'+folder.id}});
 }
 if(action==='upload'){
  const name=textName(params.name);
  const mime=String(params.mime||'application/octet-stream').slice(0,120);
  if(!/^[\w.+-]+\/[\w.+-]+$/.test(mime))fail(400,'Tipo do arquivo inválido.');
  const base64=String(params.base64||'');
  if(!base64||base64.length>6*1024*1024||!/^[A-Za-z0-9+/]*={0,2}$/.test(base64))fail(400,'Arquivo inválido ou muito grande.');
  const bytes=Buffer.from(base64,'base64');
  if(bytes.length>4*1024*1024)fail(413,'Limite de 4 MB por arquivo.');
  const root=await ensureRoot(uid,token);
  const folder=await ensureChild(token,root.id,params.folderName||'Documentos avulsos');
  const file=await upload(token,folder.id,name,mime,bytes);
  await recordFile(uid,file,{kind:params.kind==='manual'?'manual':'upload',folderId:folder.id});
  return json(res,200,{ok:true,file:{name:file.name,url:file.webViewLink||'https://drive.google.com/file/d/'+file.id+'/view'}});
 }
 if(action==='report'){
  const formId=params.formId&&/^[0-9a-f-]{36}$/i.test(params.formId)?params.formId:null;
  const result=await makeReport(uid,token,formId,params.format==='sheets');
  return json(res,200,{ok:true,report:result});
 }
 fail(404,'Funcionalidade não encontrada.');
}
module.exports=protect(handle);