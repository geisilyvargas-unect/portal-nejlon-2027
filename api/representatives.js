'use strict';
const G=require('./_shared');
module.exports=G.protect(async(req,res)=>{
 const p=await G.prescon(req);
 if(req.method==='GET'){const profiles=await G.db('profiles',{query:'select=id,full_name,email,ej_id,active&role=eq.counselor&order=full_name'});return G.json(res,200,{profiles});}
 if(req.method!=='POST')G.fail(405,'Método não permitido.');
 const b=G.body(req),uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 if(!uuid.test(b.ej)||!uuid.test(b.profile)||String(b.reason||'').trim().length<3)G.fail(400,'Dados inválidos.');
 await G.db('rpc/portal_replace_counselor',{method:'POST',data:{p_actor:p.userId,p_ej:b.ej,p_new:b.profile,p_reason:b.reason}});
 G.json(res,200,{ok:true});
});