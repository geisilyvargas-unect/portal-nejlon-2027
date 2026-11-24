'use strict';
const G=require('./_shared');
const crypto=require('node:crypto');
module.exports=G.protect(async(req,res)=>{
 const p=await G.prescon(req);
 if(req.method==='GET')return G.json(res,200,{profiles:await G.db('profiles',{query:'select=id,full_name,email,role,ej_id,active&order=full_name'})});
 if(req.method!=='POST')G.fail(405,'Método não permitido.');
 const b=G.body(req),name=String(b.name||'').trim(),email=String(b.email||'').trim().toLowerCase(),reason=String(b.reason||'').trim();
 if(b.action==='set_active'){if(typeof b.active!=='boolean'||!/^[0-9a-f-]{36}$/i.test(b.target||'')||reason.length<3)G.fail(400,'Dados inválidos.');await G.db('rpc/portal_set_profile_active',{method:'POST',data:{p_actor:p.userId,p_target:b.target,p_active:b.active,p_reason:reason}});return G.json(res,200,{ok:true});}
 if(b.action!=='create'||!['counselor','ej_direx','nucleus_direx'].includes(b.role)||name.length<2||name.length>120||!/^\S+@\S+\.\S+$/.test(email)||reason.length<3)G.fail(400,'Dados inválidos.');
 const ej=b.role==='nucleus_direx'?null:b.ej;
 if(b.role!=='nucleus_direx'&&(!/^[0-9a-f-]{36}$/i.test(ej||'')||!(await G.db('ejs',{query:'select=id&id=eq.'+ej})).length))G.fail(400,'EJ inválida.');
 const key=process.env.SUPABASE_SECRET_KEY||process.env.supabase_secret_play||process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!key)G.fail(503,'Servidor não configurado.');
 const headers={apikey:key,...(key.startsWith('sb_secret_')?{}:{Authorization:'Bearer '+key}),'Content-Type':'application/json'};
 const password=crypto.randomBytes(32).toString('base64url')+'Aa1!';
 const r=await fetch(G.SB+'/auth/v1/admin/users',{method:'POST',headers,body:JSON.stringify({email,password,email_confirm:false})});
 if(!r.ok)G.fail(409,'Não foi possível cadastrar a conta. Verifique se o e-mail já existe.');
 const u=await r.json();
 if(!u.id)G.fail(502,'Cadastro não confirmado.');
 try{await G.db('rpc/portal_register_profile',{method:'POST',data:{p_actor:p.userId,p_id:u.id,p_email:email,p_name:name,p_role:b.role,p_ej:ej,p_reason:reason}})}catch(e){await fetch(G.SB+'/auth/v1/admin/users/'+u.id,{method:'DELETE',headers});throw e}
 return G.json(res,201,{ok:true});
});