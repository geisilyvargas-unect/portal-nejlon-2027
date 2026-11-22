(()=>{
'use strict';
const $=id=>document.getElementById(id);
const SB='https://imsisbixzkqphooxyfhr.supabase.co';
const PUBLIC='sb_publishable_mS_TDGKZhUuJi-rxc5Nu1w_IXODeo-_';
const STORE='nejlon.oversight.session.v1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let session=null;
for(const key of [STORE,'nejlon.demands.session.v1']){try{const v=JSON.parse(sessionStorage.getItem(key)||'null');if(v?.access_token){session=v;break}}catch{}}
async function response(r){let v={};try{v=await r.json()}catch{}if(!r.ok)throw Error(String(v.error_description||v.error||v.message||'Não foi possível consultar o painel.'));return v}
async function refresh(){if(!session?.refresh_token)throw Error('Sessão expirada. Entre novamente.');const r=await fetch(SB+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:PUBLIC,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token})});session=await response(r);sessionStorage.setItem(STORE,JSON.stringify(session))}
async function query(retry=true){let r;try{r=await fetch(SB+'/functions/v1/forms?action=oversight',{headers:{Authorization:'Bearer '+session.access_token,apikey:PUBLIC}})}catch{throw Error('Não foi possível acessar o Supabase.')}if(r.status===401&&retry){await refresh();return query(false)}return response(r)}
function visible(yes){$('oversight-login').hidden=yes;$('oversight-app').hidden=!yes}
function render(data){
 const forms=data.forms||[],decisions=data.deliberations||[],demands=data.demands||{};
 $('oversight-user').textContent=session?.user?.email||'DIREX do Núcleo';
 $('oversight-metrics').innerHTML=[['Deliberações publicadas',decisions.length],['Formulários cadastrados',forms.length],['Demandas abertas',demands.open||0],['Demandas vencidas',demands.overdue||0]].map(([name,value])=>'<article><span>'+esc(name)+'</span><strong>'+value+'</strong></article>').join('');
 $('oversight-deliberations').innerHTML=decisions.length?decisions.map(d=>'<article class="automation-form-card"><strong>'+esc(d.title)+'</strong><small>'+esc(d.status)+' · Prazo: '+(d.due_at?new Date(d.due_at).toLocaleDateString('pt-BR'):'não informado')+'</small><p class="automation-muted">Somente consulta · votos individuais indisponíveis</p></article>').join(''):'<p class="automation-muted">Não há deliberações publicadas.</p>';
 $('oversight-forms').innerHTML=forms.length?forms.map(f=>'<article class="automation-form-card"><strong>'+esc(f.title)+'</strong><small>'+esc(f.status)+' · '+esc(f.kind)+' · '+(f.question_count||0)+' perguntas</small><p class="automation-muted">Respostas aceitas: '+(f.accepted_count||0)+' EJs · aguardando conferência: '+(f.pending_review_count||0)+'</p><p class="automation-muted">Consulta agregada, sem dados ou votos individuais</p></article>').join(''):'<p class="automation-muted">Não há formulários cadastrados.</p>';
}
async function load(){const data=await query();if(!['nucleus_direx','prescon'].includes(data.role))throw Error('O perfil não tem acesso à fiscalização.');render(data);visible(true)}
$('oversight-login-form').addEventListener('submit',async e=>{
 e.preventDefault();const b=e.target.querySelector('button');b.disabled=true;
 $('oversight-message').textContent='Verificando acesso…';
 try{const r=await fetch(SB+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:PUBLIC,'Content-Type':'application/json'},body:JSON.stringify({email:$('oversight-email').value.trim(),password:$('oversight-password').value})});session=await response(r);sessionStorage.setItem(STORE,JSON.stringify(session));$('oversight-password').value='';await load()}catch(err){$('oversight-message').textContent=err.message;visible(false)}finally{b.disabled=false}
});
$('oversight-logout').addEventListener('click',()=>{session=null;sessionStorage.removeItem(STORE);visible(false);$('oversight-message').textContent='Sessão encerrada.'});
if(session)load().catch(e=>{visible(false);$('oversight-message').textContent=e.message});else visible(false);
})();