(()=>{
'use strict';
const $=id=>document.getElementById(id);
const API=(location.hostname.endsWith('github.io')?'https://portal-nejlon-2027.vercel.app':'')+'/api/forms';
const SB='https://imsisbixzkqphooxyfhr.supabase.co';
const KEY='sb_publishable_mS_TDGKZhUuJi-rxc5Nu1w_IXODeo-_';
const STORE='nejlon.conselheiro.session.v1';
const id=new URLSearchParams(location.search).get('id')||'';
const isUuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let session=null,form=null;
try{session=JSON.parse(sessionStorage.getItem(STORE)||'null')}catch{}
async function parseResponse(res){
 let x;try{x=await res.json()}catch{x={}}
 if(!res.ok)throw Error(String(x.error_description||x.error||x.msg||x.message||'Erro de comunicação.'));
 return x;
}
async function refresh(){
 if(!session?.refresh_token)throw Error('Entre novamente.');
 const r=await fetch(SB+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token})});
 session=await parseResponse(r);sessionStorage.setItem(STORE,JSON.stringify(session));
}
async function request(query,options={},retry=true){
 let res;
 try{res=await fetch(API+query,{method:options.method||'GET',headers:{Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},...(options.data?{body:JSON.stringify(options.data)}:{})})}catch{throw Error('Não foi possível acessar o servidor. Confira a publicação do Portal no Vercel.')}
 if(res.status===401&&retry){await refresh();return request(query,options,false)}
 return parseResponse(res);
}
function switchLogin(ok){$('respond-login').hidden=ok;$('respond-app').hidden=!ok}
function showError(s){$('respond-submit-feedback').textContent=s}
async function show(){
 if(!isUuid)throw Error('Este link de formulário é inválido. Peça um novo link à PRESCON.');
 const payload=await request('?action=form&id='+id);
 form=payload.form;if(!form)throw Error('Formulário não disponível.');
 switchLogin(true);
 $('respond-user').textContent=session.user?.email||'Conselheiro(a)';
 $('respond-form-header').innerHTML='<h2>'+esc(form.title)+'</h2><p>'+esc(form.description||'')+'</p>';
 if(form.google_responder_url){
  let u;try{u=new URL(form.google_responder_url)}catch{}
  if(u?.protocol==='https:')$('respond-google-link').innerHTML='<p>Prefere responder no Google Forms? <a href="'+esc(u.href)+'" target="_blank" rel="noopener noreferrer">Abrir formulário Google ↗</a></p>';
 }
 const questions=Array.isArray(form.questions)?form.questions:[];
 $('respond-questions').innerHTML=questions.map((q,i)=>{
  const required=q.required?' required':'';
  const legend='<legend>'+(i+1)+'. '+esc(q.label)+(q.required?' <small>Obrigatório</small>':'')+'</legend>';
  if(q.type==='text')return '<fieldset class="respond-question">'+legend+'<textarea name="'+esc(q.id)+'" rows="4" '+required+' placeholder="Digite sua resposta"></textarea></fieldset>';
  return '<fieldset class="respond-question">'+legend+'<div class="respond-options">'+(q.options||[]).map(v=>'<label class="respond-option"><input type="radio" name="'+esc(q.id)+'" value="'+esc(v)+'"'+required+'><span>'+esc(v)+'</span></label>').join('')+'</div></fieldset>';
 }).join('');
 $('respond-answer-form').hidden=false;
}
async function login(ev){
 ev.preventDefault();const button=ev.target.querySelector('button');button.disabled=true;
 $('respond-login-error').textContent='Verificando conta…';
 try{
  const res=await fetch(SB+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({email:$('respond-email').value.trim(),password:$('respond-password').value})});
  session=await parseResponse(res);sessionStorage.setItem(STORE,JSON.stringify(session));$('respond-password').value='';await show();
 }catch(e){$('respond-login-error').textContent=e.message;session=null;sessionStorage.removeItem(STORE);switchLogin(false)}
 finally{button.disabled=false}
}
$('respond-login-form').addEventListener('submit',login);
$('respond-logout').addEventListener('click',()=>{session=null;sessionStorage.removeItem(STORE);switchLogin(false);$('respond-login-error').textContent='Sessão encerrada.'});
$('respond-answer-form').addEventListener('submit',async e=>{
 e.preventDefault();
 if(!form)return;
 const answers={},data=new FormData(e.target);
 for(const q of form.questions||[])answers[q.id]=String(data.get(q.id)||'').trim();
 if(!confirm('Confirma o registro da resposta da sua EJ? Ela não poderá ser substituída automaticamente.'))return;
 const btn=e.target.querySelector('button[type=submit]');btn.disabled=true;showError('Registrando resposta…');
 try{
  const out=await request('?action=submit',{method:'POST',data:{formId:form.id,answers}});
  e.target.hidden=true;showError(out.message||'Resposta registrada com sucesso!');
 }catch(error){showError('Não foi possível registrar: '+error.message);btn.disabled=false}
});
if(!isUuid){$('respond-login-error').textContent='Link do formulário inválido. Solicite um link atualizado à PRESCON.';$('respond-login-form').hidden=true}
else if(session)show().catch(e=>{switchLogin(false);$('respond-login-error').textContent=e.message;session=null;sessionStorage.removeItem(STORE)});
})();