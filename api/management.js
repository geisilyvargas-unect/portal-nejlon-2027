'use strict';
const G=require('./_shared');
module.exports=G.protect(async(req,res)=>{
 const p=await G.prescon(req),year=Number(new Intl.DateTimeFormat('en',{year:'numeric',timeZone:'America/Sao_Paulo'}).format(new Date()));
 if(req.method==='GET'){
 const [years,roster,ejs]=await Promise.all([G.db('portal_years',{query:'select=year,roster_confirmed_at&order=year.desc'}),G.db('portal_year_ejs',{query:'select=ej_id,name_snapshot,active&year=eq.'+year}),G.db('ejs',{query:'select=id,name&order=name'})]);
 return G.json(res,200,{year,confirmed:!!years.find(x=>x.year===year)?.roster_confirmed_at,roster,ejs});
 }
 if(req.method!=='POST')G.fail(405,'Método não permitido.');
 const b=G.body(req);if(b.year!==year)G.fail(409,'Somente gestão vigente.');
 if(b.action==='register_ej'){await G.db('rpc/portal_register_ej',{method:'POST',data:{p_actor:p.userId,p_name:String(b.name||''),p_slug:String(b.slug||''),p_reason:String(b.reason||'')}});return G.json(res,200,{ok:true});}
 if(!['prepare','save','confirm'].includes(b.action))G.fail(400,'Ação inválida.');
 await G.db('rpc/portal_manage_roster',{method:'POST',data:{p_actor:p.userId,p_action:b.action,p_ejs:b.ejs||[],p_reason:String(b.reason||'').trim()}});
 G.json(res,200,{ok:true});
});