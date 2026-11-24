'use strict';
const G=require('./_shared');
const uuid=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
module.exports=G.protect(async(req,res)=>{
const p=await G.userFromToken(req);

if(req.method==='GET'){
const rows=await G.db('portal_succession',{query:'select=id,outgoing,incoming,reason,status,target_year,created_at,resolved_at&'+(p.role==='prescon'?'outgoing':'incoming')+'=eq.'+p.userId+'&order=created_at.desc&limit=50'});
if(p.role!=='prescon'&&!rows.some(r=>r.status==='pending'))G.fail(403,'Acesso negado.');
const candidates=p.role==='prescon'?await G.db('profiles',{query:'select=id,full_name,email&role=neq.prescon&active=eq.true&order=full_name'}):[];
return G.json(res,200,{role:p.role,rows,candidates});
}
if(req.method!=='POST')G.fail(405,'Método não permitido.');
const b=G.body(req),reason=String(b.reason||'').trim();
if(reason.length<3||reason.length>2000||b.confirm!==true)G.fail(400,'Confirme a operação e informe a justificativa.');
if(b.action==='request'&&p.role==='prescon'&&uuid(b.target)){await G.db('rpc/portal_request_succession',{method:'POST',data:{p_actor:p.userId,p_target:b.target,p_reason:reason}});}
else if(uuid(b.request)&&((b.action==='cancel'&&p.role==='prescon')||(b.action==='accept'&&p.role!=='prescon'))){await G.db('rpc/portal_resolve_succession',{method:'POST',data:{p_actor:p.userId,p_request:b.request,p_action:b.action,p_reason:reason}});}
else G.fail(403,'Operação não autorizada.');
return G.json(res,200,{ok:true});
});