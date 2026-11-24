'use strict';
const G=require('./_shared');
module.exports=G.protect(async(req,res)=>{
 await G.prescon(req);
 if(req.method!=='GET')G.fail(405,'Método não permitido.');
 const raw=String(req.query?.page||'0');
 if(!/^\d{1,5}$/.test(raw))G.fail(400,'Página inválida.');
 const offset=Number(raw)*50;
 const rows=await G.db('portal_management_audit',{query:'select=id,year,actor,action,reason,created_at&order=created_at.desc,id.desc&limit=51&offset='+offset});
 const actors=await G.db('profiles',{query:'select=id,full_name'});
 return G.json(res,200,{rows:rows.slice(0,50).map(r=>({...r,actor_name:actors.find(a=>a.id===r.actor)?.full_name||'Perfil histórico'})),more:rows.length>50});
});