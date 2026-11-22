'use strict';
const crypto=require('node:crypto');
const SB=process.env.SUPABASE_URL||'https://imsisbixzkqphooxyfhr.supabase.co';
const PUBLIC_KEY=process.env.SUPABASE_PUBLISHABLE_KEY||'sb_publishable_mS_TDGKZhUuJi-rxc5Nu1w_IXODeo-_';
const SITE=process.env.PORTAL_PUBLIC_ORIGIN||'https://portal-nejlon-2027.vercel.app';
const scopes=['openid','email','https://www.googleapis.com/auth/drive.file','https://www.googleapis.com/auth/forms.body','https://www.googleapis.com/auth/forms.responses.readonly','https://www.googleapis.com/auth/spreadsheets'];
class HttpError extends Error{constructor(code,message){super(message);this.code=code}}
function fail(code,message){throw new HttpError(code,message)}
function json(res,status,data){res.status(status).setHeader('Cache-Control','no-store').setHeader('Content-Type','application/json; charset=utf-8').end(JSON.stringify(data))}
function body(req){if(req.body&&typeof req.body==='object')return req.body;if(typeof req.body==='string'){try{return JSON.parse(req.body)}catch{fail(400,'JSON inválido.')}}return{}}
function envCheck(){const required=['SUPABASE_SERVICE_ROLE_KEY','GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','GOOGLE_TOKEN_ENCRYPTION_KEY'];return required.filter(key=>!process.env[key])}
function ready(){return envCheck().length===0}
function serviceKey(){const k=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!k)fail(503,'Integração ainda não configurada: falta a chave de servidor Supabase.');return k}
async function requestJson(url,options={}){
 const response=await fetch(url,options);
 let data;try{data=await response.json()}catch{data={}}
 if(!response.ok)fail(response.status>=500?502:response.status,(data.error_description||data.error?.message||data.message||data.error||'Falha na integração externa.').toString().slice(0,350));
 return data;
}
async function db(table,{method='GET',query='',data,prefer}={}){
 const key=serviceKey();
 return requestJson(SB+'/rest/v1/'+table+(query?'?'+query:''),{
  method,headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',...(prefer?{Prefer:prefer}:{})},
  ...(data!==undefined?{body:JSON.stringify(data)}:{})
 });
}
async function userFromToken(req){
 const header=String(req.headers.authorization||'');
 if(!header.startsWith('Bearer ')||header.length>4600)fail(401,'Entre com sua conta do Portal NEJLON.');
 const token=header.slice(7);
 const me=await requestJson(SB+'/auth/v1/user',{headers:{apikey:PUBLIC_KEY,Authorization:'Bearer '+token}});
 if(!me.id||!me.email)fail(401,'Sessão inválida.');
 const profile=(await db('profiles',{query:'select=id,email,role,ej_id,active&id=eq.'+encodeURIComponent(me.id)+'&limit=1'}))[0];
 if(!profile||!profile.active)fail(403,'Perfil inativo ou não autorizado.');
 return {...profile,userId:me.id};
}
async function prescon(req){const p=await userFromToken(req);if(p.role!=='prescon')fail(403,'Acesso reservado à PRESCON.');return p}
function encrypt(plain){
 const k=process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
 if(!k)fail(503,'A chave de criptografia Google ainda não foi configurada.');
 const key=Buffer.from(k,'base64');if(key.length!==32)fail(503,'GOOGLE_TOKEN_ENCRYPTION_KEY precisa conter 32 bytes em base64.');
 const iv=crypto.randomBytes(12),c=crypto.createCipheriv('aes-256-gcm',key,iv);
 const ciphertext=Buffer.concat([c.update(plain,'utf8'),c.final()]);
 return [iv,c.getAuthTag(),ciphertext].map(b=>b.toString('base64url')).join('.');
}
function decrypt(code){
 const k=process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;const key=Buffer.from(k||'','base64');
 if(key.length!==32)fail(503,'Criptografia Google indisponível.');
 try{const [i,t,v]=code.split('.').map(x=>Buffer.from(x,'base64url'));const c=crypto.createDecipheriv('aes-256-gcm',key,i);c.setAuthTag(t);return Buffer.concat([c.update(v),c.final()]).toString()}catch{fail(500,'Não foi possível abrir a conexão Google. Reconecte a conta.')}
}
function signState(userId){const raw=Buffer.from(JSON.stringify({userId,expiry:Date.now()+10*60*1000,nonce:crypto.randomBytes(12).toString('hex')})).toString('base64url');const tag=crypto.createHmac('sha256',Buffer.from(process.env.GOOGLE_TOKEN_ENCRYPTION_KEY||'','base64')).update(raw).digest('base64url');return raw+'.'+tag}
function verifyState(state){
 const parts=String(state||'').split('.');if(parts.length!==2)fail(400,'Autorização expirada.');
 const expected=crypto.createHmac('sha256',Buffer.from(process.env.GOOGLE_TOKEN_ENCRYPTION_KEY||'','base64')).update(parts[0]).digest('base64url');
 if(parts[1].length!==expected.length||!crypto.timingSafeEqual(Buffer.from(parts[1]),Buffer.from(expected)))fail(400,'Autorização inválida.');
 let payload;try{payload=JSON.parse(Buffer.from(parts[0],'base64url').toString())}catch{fail(400,'Autorização inválida.')}
 if(!payload.userId||!payload.expiry||Date.now()>payload.expiry)fail(400,'Autorização expirada.');return payload.userId;
}
function redirectUri(){return SITE+'/api/google-callback'}
async function googleToken(code){
 return requestJson('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID,client_secret:process.env.GOOGLE_CLIENT_SECRET,code,grant_type:'authorization_code',redirect_uri:redirectUri()}).toString()});
}
async function connected(userId){
 const r=await db('portal_google_connections',{query:'select=owner_user_id,email,encrypted_refresh_token,connected_at&owner_user_id=eq.'+userId+'&limit=1'});
 if(!r.length)fail(409,'Conecte uma conta Google na Central de Automações.');return r[0];
}
async function accessToken(userId){
 const record=await connected(userId);
 const refresh=decrypt(record.encrypted_refresh_token);
 const out=await requestJson('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID,client_secret:process.env.GOOGLE_CLIENT_SECRET,refresh_token:refresh,grant_type:'refresh_token'}).toString()});
 if(!out.access_token)fail(502,'O Google não devolveu uma sessão válida. Reconecte a conta.');
 return out.access_token;
}
async function google(url,token,{method='GET',data,headers={}}={}){
 return requestJson(url,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',...headers},...(data===undefined?{}:{body:JSON.stringify(data)})});
}
function textName(v,fallback='Arquivo'){return String(v||fallback).trim().replace(/[\\/<>:"|?*\u0000-\u001f]/g,' ').replace(/\s+/g,' ').slice(0,105)||fallback}
async function createFolder(token,name,parent){
 return google('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink,mimeType',token,{method:'POST',data:{name:textName(name),mimeType:'application/vnd.google-apps.folder',...(parent?{parents:[parent]}:{})}});
}
async function upload(token,folder,name,mime,bytes){
 if(bytes.length>4*1024*1024)fail(413,'O arquivo ultrapassa o limite de 4 MB deste fluxo. Para arquivos maiores, use o Drive diretamente.');
 const boundary='nejlon'+crypto.randomBytes(8).toString('hex');
 const metadata={name:textName(name),parents:[folder],mimeType:mime};
 const prefix=Buffer.from('--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+JSON.stringify(metadata)+'\r\n--'+boundary+'\r\nContent-Type: '+mime+'\r\n\r\n');
 const end=Buffer.from('\r\n--'+boundary+'--');
 const response=await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink',{
  method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'multipart/related; boundary='+boundary},
  body:Buffer.concat([prefix,bytes,end])
 });
 let out;try{out=await response.json()}catch{out={}}
 if(!response.ok)fail(502,'O Drive recusou o arquivo: '+String(out.error?.message||response.status).slice(0,240));
 return out;
}
async function settings(userId){
 const a=await db('portal_drive_settings',{query:'select=*&owner_user_id=eq.'+userId+'&limit=1'});
 return a[0]||null;
}
async function ensureRoot(userId,token){
 const old=await settings(userId);
 if(old?.root_folder_id)return {id:old.root_folder_id,url:old.root_folder_url};
 const folder=await createFolder(token,'NEJLON — Documentos do Conselho');
 await db('portal_drive_settings',{method:'POST',query:'on_conflict=owner_user_id',data:{owner_user_id:userId,root_folder_id:folder.id,root_folder_url:folder.webViewLink||'https://drive.google.com/drive/folders/'+folder.id},prefer:'resolution=merge-duplicates,return=representation'});
 return {id:folder.id,url:folder.webViewLink||'https://drive.google.com/drive/folders/'+folder.id};
}
async function ensureChild(token,root,title){
 const folderName=textName(title,'Nova deliberação');
 const q="'"+root.replace(/'/g,"\\'")+"' in parents and name = '"+folderName.replace(/'/g,"\\'")+"' and mimeType = 'application/vnd.google-apps.folder' and trashed = false";
 const list=await google('https://www.googleapis.com/drive/v3/files?fields=files(id,name,webViewLink)&q='+encodeURIComponent(q)+'&pageSize=2',token);
 if(list.files?.length)return list.files[0];
 return createFolder(token,folderName,root);
}
async function recordFile(userId,file,{kind,formId,folderId}={}){
 await db('portal_drive_files',{method:'POST',query:'on_conflict=owner_user_id,google_file_id',prefer:'resolution=merge-duplicates,return=representation',data:{owner_user_id:userId,form_id:formId||null,google_file_id:file.id,google_folder_id:folderId||null,kind,name:file.name,web_view_link:file.webViewLink||null}});
}
function protect(handler){return async(req,res)=>{
 const origin=String(req.headers.origin||'');
 const allowed=new Set(['https://geisilyvargas-unect.github.io','https://portal-nejlon-2027.vercel.app','https://portal-nejlon-2027-geisily.vercel.app',new URL(SITE).origin]);
 for(const extra of String(process.env.PORTAL_ALLOWED_ORIGINS||'').split(',')){if(extra.trim().startsWith('https://'))allowed.add(extra.trim())}
 if(origin){if(!allowed.has(origin))return json(res,403,{error:'Origem não autorizada.'});res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin')}
 res.setHeader('Access-Control-Allow-Headers','Authorization,Content-Type');
 res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
 if(req.method==='OPTIONS')return res.status(204).end();
 try{await handler(req,res)}catch(e){json(res,e instanceof HttpError?e.code:500,{error:e instanceof HttpError?e.message:'Não foi possível concluir a operação. Tente novamente.'});}
}}
module.exports={SB,PUBLIC_KEY,SITE,scopes,fail,json,body,ready,envCheck,db,prescon,userFromToken,encrypt,decrypt,signState,verifyState,redirectUri,googleToken,connected,accessToken,google,textName,createFolder,upload,settings,ensureRoot,ensureChild,recordFile,protect};