'use strict';
const G=require('./_shared');
module.exports=G.protect(async(req,res)=>{
 if(req.method!=='GET')G.fail(405,'Método não permitido.');
 const p=await G.userFromToken(req);
 const currentYear=Number(new Intl.DateTimeFormat('en',{year:'numeric',timeZone:'America/Sao_Paulo'}).format(new Date()));
 const years=await G.db('portal_years',{query:'select=year,roster_confirmed_at&order=year.desc'});
 const year=Number(req.query?.year||currentYear);
 if(!Number.isInteger(year)||year<2000||year>currentYear)G.fail(400,'Ano inválido.');
 const roster=await G.db('portal_year_ejs',{query:'select=ej_id,name_snapshot,active&year=eq.'+year});
 let forms=p.role==='prescon'?await G.db('portal_forms',{query:'select=id,title,status,due_at,management_year&management_year=eq.'+year+'&order=created_at.desc'}):[];
 if(['counselor','nucleus_direx'].includes(p.role)){
 const candidates=await G.db('portal_forms',{query:'select=id,title,status,due_at,management_year&management_year=eq.'+year+'&status=eq.closed&audience=eq.counselor'});
 const reports=await G.db('portal_form_reports',{query:'select=form_id'});
 const published=new Set(reports.map(r=>r.form_id));forms=candidates.filter(f=>published.has(f.id));
 }
 G.json(res,200,{role:p.role,currentYear,year,years:[...new Set([currentYear,...years.map(x=>x.year)])],rosterConfirmed:!!years.find(x=>x.year===year)?.roster_confirmed_at,eligibleCount:roster.filter(x=>x.active).length,forms,readonly:year!==currentYear});
});