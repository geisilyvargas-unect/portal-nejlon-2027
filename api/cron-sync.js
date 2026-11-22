'use strict';
/* Rotina diária opcional da Vercel. Requer CRON_SECRET + credenciais Google/Supabase. */
const G=require('./_shared');
const {json,db,google,accessToken}=G;
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 const key=process.env.CRON_SECRET;
 if(!key||!process.env.SUPABASE_SERVICE_ROLE_KEY)return json(res,503,{error:'Rotina não configurada.'});
 if(String(req.headers.authorization||'')!=='Bearer '+key)return json(res,401,{error:'Não autorizado.'});
 if(req.method!=='GET')return json(res,405,{error:'Método inválido.'});
 try{
  const forms=await db('portal_forms',{query:'select=id,google_form_id,google_question_map,created_by&status=eq.open&google_form_id=not.is.null&created_by=not.is.null&order=updated_at.desc&limit=10'});
  let processed=0,imported=0,duplicates=0,errors=0;
  for(const f of forms){
   try{
    const token=await accessToken(f.created_by);
    const result=await google('https://forms.googleapis.com/v1/forms/'+encodeURIComponent(f.google_form_id)+'/responses?pageSize=1000',token);
    for(const response of result.responses||[]){
     const existed=await db('portal_form_submissions',{query:'select=id&form_id=eq.'+f.id+'&google_response_id=eq.'+encodeURIComponent(response.responseId)+'&limit=1'});
     if(existed.length){duplicates++;continue}
     const answers={};
     for(const [qId,ans] of Object.entries(response.answers||{})){
      answers[f.google_question_map?.[qId]||qId]=ans.textAnswers?.answers?.map(a=>a.value).join(', ')||'';
     }
     // Não presumir que a EJ informada no Google esteja autenticada: revisão humana.
     await db('portal_form_submissions',{method:'POST',prefer:'return=minimal',data:{
      form_id:f.id,channel:'google',state:'pending_review',google_response_id:response.responseId,
      respondent_email:response.respondentEmail||null,respondent_name:answers.respondent||null,
      submitted_at:response.lastSubmittedTime||new Date().toISOString(),answers
     }});
     imported++;
    }
    processed++;
   }catch(e){errors++}
  }
  return json(res,200,{ok:true,processed,imported,duplicates,errors,limited:forms.length===10});
 }catch{return json(res,500,{error:'Falha na sincronização.'})}
};