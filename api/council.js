'use strict';
const G=require('./_shared');
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
module.exports=protect(handler);