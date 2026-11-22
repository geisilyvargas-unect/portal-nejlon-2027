(()=>{
'use strict';
const $=id=>document.getElementById(id);
const API='https://imsisbixzkqphooxyfhr.supabase.co/functions/v1/forms';
const SB='https://imsisbixzkqphooxyfhr.supabase.co';
const KEY='sb_publishable_mS_TDGKZhUuJi-rxc5Nu1w_IXODeo-_';
const STORE='nejlon.conselheiro.session.v1';
const id=new URLSearchParams(location.search).get('id')||'';
const isUuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let session=null,form=null,editAuthorizationId=null;
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
 try{res=await fetch(API+query,{method:options.method||'GET',headers:{Authorization:'Bearer '+session.access_token,apikey:KEY,'Content-Type':'application/json'},...(options.data?{body:JSON.stringify(options.data)}:{})})}catch{throw Error('Não foi possível acessar o Supabase. Confira sua conexão.')}
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
 // Análise financeira compartilhada: leitura autorizada por RLS, sem valores fictícios.
 try{
  const financialRes=await fetch(SB+'/rest/v1/portal_pf_snapshots?form_id=eq.'+encodeURIComponent(id)+'&select=financial,original_filename',{headers:{apikey:KEY,Authorization:'Bearer '+session.access_token}});
  if(financialRes.ok){
   const entries=await financialRes.json(),snapshot=entries[0],alts=snapshot?.financial?.alternatives||[];
   if(alts.length){
    const fmt=n=>Number.isFinite(n)?new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n):'—';
    const wrap=document.createElement('section');wrap.className='respond-pf-financial';wrap.style.cssText='margin:20px 0;padding:18px;border:2px solid #f00;overflow:auto';
    wrap.innerHTML='<h3>ANÁLISE FINANCEIRA DO PLANEJAMENTO</h3><p>Dados extraídos de '+esc(snapshot.original_filename)+'. Confira os valores antes de votar.</p>'+
    alts.map(a=>'<h4>'+esc(a.label)+'</h4><table style="border-collapse:collapse;width:100%;min-width:480px"><thead><tr><th>Indicador</th><th>Pessimista</th><th>Realista</th><th>Otimista</th></tr></thead><tbody>'+
    [['Receitas','revenue'],['Despesas','expenses'],['Saldo','balance']].map(([label,key])=>'<tr><th style="text-align:left">'+label+'</th>'+['pessimistic','realistic','optimistic'].map(k=>'<td style="padding:8px;border-bottom:1px solid #aaa">'+fmt(a.projections?.[k]?.[key])+'</td>').join('')+'</tr>').join('')+'</tbody></table>').join('')+
    '<p>As projeções são estimativas, não resultados realizados. Ressalvas devem ser registradas no voto correspondente.</p>';
    $('respond-form-header').after(wrap);
   }
  }
 }catch(err){console.warn('Resumo financeiro indisponível:',err)}
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
 await updateVoteStatus();
}
async function updateVoteStatus(){
 const status=await request('?action=my_vote_status&id='+id);
 const panel=$('respond-vote-change'),requestForm=$('respond-change-request-form');
 editAuthorizationId=null;
 panel.hidden=!status.registered;
 requestForm.hidden=true;
 const button=$('respond-answer-form').querySelector('button[type=submit]');
 button.disabled=false;
 button.textContent='Registrar resposta da EJ';
 if(!status.registered){$('respond-answer-form').hidden=false;return}
 const change=status.request;
 $('respond-answer-form').hidden=true;
 if(change?.status==='approved'&&status.can_request){
  editAuthorizationId=change.id;
  $('respond-vote-status').textContent='A PRESCON autorizou uma substituição. Preencha novamente todo o formulário e confirme o novo voto. Esta autorização só pode ser usada uma vez.';
  $('respond-answer-form').hidden=false;
  button.textContent='Substituir voto autorizado pela PRESCON';
  return;
 }
 if(change?.status==='requested'){$('respond-vote-status').textContent='Sua solicitação de alteração está aguardando decisão da PRESCON.';return}
 if(!status.can_request){$('respond-vote-status').textContent='A resposta já foi registrada e o prazo para solicitar alteração está encerrado.';return}
 $('respond-vote-status').textContent=change?.status==='denied'
  ?'A PRESCON recusou a solicitação. Motivo: '+(change.decision_note||'Consulte a PRESCON.')+'. Você pode enviar nova solicitação enquanto o prazo estiver aberto.'
  :'Você já enviou uma resposta. Para substituir o voto, solicite antes a autorização da PRESCON.';
 requestForm.hidden=false;
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
 for(const q of form.questions||[]){
  const value=String(data.get(q.id)||'').trim();
  if(q.required&&!value){
   showError('Preencha a pergunta obrigatória: '+String(q.label||'sem título'));
   const field=e.target.querySelectorAll('[name]');
   for(const item of field){if(item.name===String(q.id)){item.focus();break}}
   return;
  }
  if(q.type!=='text'&&value&&(!Array.isArray(q.options)||!q.options.includes(value))){
   showError('A resposta selecionada não é válida. Atualize o formulário e tente novamente.');
   return;
  }
  answers[q.id]=value;
 }
 if(!confirm('Confirma o registro da resposta da sua EJ? Ela não poderá ser substituída automaticamente.'))return;
 const btn=e.target.querySelector('button[type=submit]');if(btn.disabled)return;btn.disabled=true;showError('Registrando resposta…');
 try{
  const out=editAuthorizationId?
   await request('?action=apply_vote_change',{method:'POST',data:{authorizationId:editAuthorizationId,answers}}):
   await request('?action=submit',{method:'POST',data:{formId:form.id,answers}});
  showError(out.message||'Resposta registrada com sucesso!');
  try{await updateVoteStatus()}catch{
   $('respond-answer-form').hidden=true;
   $('respond-vote-change').hidden=false;
   $('respond-vote-status').textContent='Resposta enviada. Não foi possível atualizar a situação do voto agora; recarregue a página antes de tentar novamente.';
   showError('Resposta enviada. Consulte o status atualizado antes de realizar outra operação.');
  }
 }catch(error){showError('Não foi possível registrar: '+error.message);btn.disabled=false}
});
$('respond-change-request-form').addEventListener('submit',async e=>{
 e.preventDefault();
 const button=e.target.querySelector('button');if(button.disabled)return;button.disabled=true;
 try{
  const reason=String(new FormData(e.target).get('reason')||'').trim();
  const result=await request('?action=request_vote_change',{method:'POST',data:{formId:id,reason}});
  showError(result.message||'Solicitação enviada à PRESCON.');
  e.target.reset();
  await updateVoteStatus();
 }catch(error){showError(error.message)}finally{button.disabled=false}
});
if(!isUuid){$('respond-login-error').textContent='Link do formulário inválido. Solicite um link atualizado à PRESCON.';$('respond-login-form').hidden=true}
else if(session)show().catch(e=>{switchLogin(false);$('respond-login-error').textContent=e.message;session=null;sessionStorage.removeItem(STORE)});
})();