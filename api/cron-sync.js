'use strict';
/* Sincronização diária: paginação, isolamento por formulário e diagnóstico seguro. */
const G=require('./_shared');
const {json,db,google,accessToken}=G;
const MAX_FORMS=200, MAX_PAGES_PER_FORM=30;
const id=x=>String(x||'');
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return json(res,405,{error:'Método inválido.'});
 const key=process.env.CRON_SECRET;
 if(!key||!process.env.SUPABASE_SERVICE_ROLE_KEY)return json(res,503,{error:'Rotina não configurada.'});
 if(String(req.headers.authorization||'')!=='Bearer '+key)return json(res,401,{error:'Não autorizado.'});
 try{
  let formOffset=0,processed=0,imported=0,duplicates=0,errors=0,remaining=false;
  const failures=[];
  while(formOffset<MAX_FORMS){
   const forms=await db('portal_forms',{query:'select=id,google_form_id,google_question_map,created_by&status=eq.open&google_form_id=not.is.null&created_by=not.is.null&order=created_at.asc,id.asc&limit=50&offset='+formOffset});
   if(!forms.length)break;
   for(const f of forms){
    try{
     const token=await accessToken(f.created_by);
     let pageToken='',pages=0;
     do{
      const qs=new URLSearchParams({pageSize:'1000'});
      if(pageToken)qs.set('pageToken',pageToken);
      const result=await google('https://forms.googleapis.com/v1/forms/'+encodeURIComponent(f.google_form_id)+'/responses?'+qs,token);
      for(const response of result.responses||[]){
       const responseId=id(response.responseId);
       if(!responseId)continue;
       const existed=await db('portal_form_submissions',{query:'select=id&form_id=eq.'+f.id+'&google_response_id=eq.'+encodeURIComponent(responseId)+'&limit=1'});
       if(existed.length){duplicates++;continue}
       const answers={};
       for(const [qId,ans] of Object.entries(response.answers||{})){
        answers[f.google_question_map?.[qId]||qId]=ans.textAnswers?.answers?.map(a=>a.value).join(', ')||'';
       }
       try{
        await db('portal_form_submissions',{method:'POST',prefer:'return=minimal',data:{
         form_id:f.id,channel:'google',state:'pending_review',google_response_id:responseId,
         respondent_email:response.respondentEmail||null,respondent_name:answers.respondent||null,
         submitted_at:response.lastSubmittedTime||new Date().toISOString(),answers
        }});
        imported++;
       }catch(e){
        if(/duplicate|unique|23505/i.test(String(e.message||''))){duplicates++;continue}
        throw e;
       }
      }
      pageToken=result.nextPageToken||'';pages++;
     }while(pageToken&&pages<MAX_PAGES_PER_FORM);
     if(pageToken){remaining=true;failures.push({formId:f.id,reason:'page_limit'});}
     processed++;
    }catch(e){
     errors++;
     failures.push({formId:f.id,reason:'sync_failed'});
     console.error('cron-sync form failure',f.id,String(e.message||e).slice(0,180));
    }
   }
   formOffset+=forms.length;
   if(forms.length<50)break;
  }
  if(formOffset>=MAX_FORMS)remaining=true;
  const status=errors||remaining?207:200;
  return json(res,status,{ok:!errors&&!remaining,processed,imported,duplicates,errors,remaining,failures});
 }catch(e){
  console.error('cron-sync batch failure',String(e.message||e).slice(0,180));
  return json(res,500,{error:'Falha na sincronização.'});
 }
};
