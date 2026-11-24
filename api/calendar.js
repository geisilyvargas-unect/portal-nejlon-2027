'use strict';
const G=require('./_shared');
module.exports=G.protect(async(req,res)=>{
 const p=await G.prescon(req);
 if(req.method!=='POST')G.fail(405,'Método não permitido.');
 const b=G.body(req),action=String(req.query?.action||'');
 const token=await G.accessToken(p.userId);
 const base='https://www.googleapis.com/calendar/v3';
 if(action==='calendar'){
 const calendar=await G.google(base+'/calendars',token,{method:'POST',data:{summary:'Conselho Deliberativo — NEJLON',timeZone:'America/Sao_Paulo'}});
 return G.json(res,200,{id:calendar.id,summary:calendar.summary});
 }
 if(action!=='test-event')G.fail(404,'Operação desconhecida.');
 if(b.confirm!==true)G.fail(400,'Confirme o envio de teste.');
 const calendarId=String(b.calendarId||'');
 if(!calendarId||calendarId==='primary')G.fail(400,'Informe o calendário exclusivo do portal.');
 const emails=Array.isArray(b.emails)?[...new Set(b.emails.map(x=>String(x).trim().toLowerCase()))]:[];
 if(!emails.length||emails.length>4||emails.some(x=>! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x)))G.fail(400,'Informe até quatro endereços de teste.');
 const allowed=new Set(String(process.env.PORTAL_TEST_INVITE_EMAILS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean));
 if(!allowed.size||emails.some(x=>!allowed.has(x)))G.fail(403,'Destinatários de teste não autorizados na configuração do servidor.');
 const start=new Date(Date.now()+3600000),end=new Date(+start+900000);
 const event=await G.google(base+'/calendars/'+encodeURIComponent(calendarId)+'/events?sendUpdates=all',token,{method:'POST',data:{summary:'[TESTE] Portal NEJLON — prazo de deliberação',description:'Convite de teste da integração. Não é uma deliberação oficial.',start:{dateTime:start.toISOString(),timeZone:'America/Sao_Paulo'},end:{dateTime:end.toISOString(),timeZone:'America/Sao_Paulo'},attendees:emails.map(email=>({email})),guestsCanInviteOthers:false}});
 return G.json(res,200,{id:event.id,url:event.htmlLink,status:event.status});
});