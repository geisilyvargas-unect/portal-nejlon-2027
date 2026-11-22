(()=>{
'use strict';
const $=id=>document.getElementById(id);
const BASE='https://imsisbixzkqphooxyfhr.supabase.co';
const KEY='sb_publishable_mS_TDGKZhUuJi-rxc5Nu1w_IXODeo-_';
const SESSIONS=['nejlon.conselheiro.session.v1','nejlon.demands.session.v1','nejlon.prescon.central.session.v1'];
const ACTIVE='nejlon.conselho.session.v1';
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link=x=>{try{const u=new URL(x);return u.protocol==='https:'?u.href:null}catch{return null}};
let session=null,data=null;
for(const k of [ACTIVE,...SESSIONS]){try{const x=JSON.parse(sessionStorage.getItem(k)||'null');if(x?.access_token){session=x;break}}catch{}}
function show(logged){$('council-login').hidden=logged;$('council-app').hidden=!logged}
async function asJson(r){let v={};try{v=await r.json()}catch{}if(!r.ok)throw Error(String(v.error_description||v.error||v.message||'A operação não foi concluída.'));return v}
async function refresh(){if(!session?.refresh_token)throw Error('Entre novamente.');const r=await fetch(BASE+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token})});session=await asJson(r);sessionStorage.setItem(ACTIVE,JSON.stringify(session))}
async function request(action,method='GET',payload,retry=true){
 if(!session?.access_token)throw Error('Acesse sua conta.');
 const url=BASE+'/functions/v1/council?action='+encodeURIComponent(action);
 let response;try{response=await fetch(url,{method,headers:{apikey:KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},...(payload?{body:JSON.stringify(payload)}:{})})}catch{throw Error('Sem conexão com o Supabase.')}
 if(response.status===401&&retry){await refresh();return request(action,method,payload,false)}
 return asJson(response);
}
const ownLinks={demandas:{url:'./demandas.html',label:'Abrir panorama de demandas'},deliberacoes:{url:'./responder.html',label:'Abrir deliberações publicadas'}};
function renderCards(){
 const list=data.resources||[],prescon=data.role==='prescon';
 $('council-highlights').innerHTML=[
  ['Áreas institucionais',list.length],['Links atualizados',list.filter(x=>x.status==='active'&&x.official_url).length],['Formulários abertos',(data.forms||[]).length],['Deliberações publicadas',(data.deliberations||[]).length]
 ].map(([title,count])=>'<article><span>'+safe(title)+'</span><strong>'+count+'</strong></article>').join('');
 $('council-directory').innerHTML=list.map(row=>{
  const internal=row.key==='demandas'?ownLinks.demandas:null;
  const official=link(row.official_url);
  const active=official&&row.status==='active';
  const primary=internal|| (active?{url:official,label:'Abrir recurso institucional'}:null);
  const approved=primary?'<a class="btn red" href="'+safe(primary.url)+'" '+(primary.url.startsWith('https://')?'target="_blank" rel="noopener noreferrer"':'')+'>'+safe(primary.label)+' →</a>':'<p class="council-empty">Aguardando link atualizado pela PRESCON.</p>';
  return '<article class="council-resource" data-key="'+safe(row.key)+'"><div class="council-resource-header"><h3>'+safe(row.label)+'</h3><span class="council-status">'+safe(active?'ATUALIZADO':'REFERÊNCIA 2024')+'</span></div><p>'+safe(row.description)+'</p>'+
    (row.key==='deliberacoes'?'<p>As deliberações e os formulários abertos também aparecem abaixo, com links individuais de resposta.</p>':'')+
    approved+
    (prescon?'<details><summary>Atualizar link institucional</summary><form class="council-edit-form" data-key="'+safe(row.key)+'"><label>Endereço HTTPS<input name="url" type="url" value="'+safe(row.official_url||'')+'" placeholder="https://..."></label><label>Situação<select name="status"><option value="pending" '+(row.status==='pending'?'selected':'')+'>Aguardando atualização</option><option value="active" '+(row.status==='active'?'selected':'')+'>Link vigente</option><option value="archived" '+(row.status==='archived'?'selected':'')+'>Arquivado</option></select></label><button class="btn" type="submit">Salvar link</button></form></details>':'')+
  '</article>';
 }).join('');
 const groups=[
  ...(data.forms||[]).filter(f=>f.status==='open').map(f=>({
   title:f.title,kind:'Formulário',due:f.due_at,url:'./responder.html?id='+encodeURIComponent(f.id)
  })),
  ...(data.deliberations||[]).map(d=>({
   title:d.title,kind:'Deliberação',due:d.due_at,url:null
  }))
 ];
 $('council-forms').innerHTML=groups.length?groups.map(f=>'<article class="council-form-row"><div><strong>'+safe(f.title)+'</strong><small>'+safe(f.kind)+' · '+(f.due?new Date(f.due).toLocaleDateString('pt-BR'):'Prazo não cadastrado')+'</small></div>'+(f.url?'<a class="btn red" href="'+safe(f.url)+'">Responder →</a>':'<span class="council-status">Consultar no painel de deliberações</span>')+'</article>').join(''):'<p class="council-empty">Não há deliberações ou formulários abertos registrados neste momento.</p>';
}
async function load(){
 data=await request('list');
 show(true);$('council-email-display').textContent=session?.user?.email||'Conselho NEJLON';renderCards();
}
$('council-login-form').addEventListener('submit',async e=>{
 e.preventDefault();const button=e.target.querySelector('button');button.disabled=true;
 $('council-login-status').textContent='Validando perfil…';
 try{const r=await fetch(BASE+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({email:$('council-email').value.trim(),password:$('council-password').value})});session=await asJson(r);sessionStorage.setItem(ACTIVE,JSON.stringify(session));$('council-password').value='';await load()}
 catch(err){$('council-login-status').textContent=err.message;show(false)}finally{button.disabled=false}
});
$('council-logout').addEventListener('click',()=>{session=null;sessionStorage.removeItem(ACTIVE);data=null;show(false);$('council-login-status').textContent='Sessão encerrada.'});
$('council-directory').addEventListener('submit',async e=>{
 const form=e.target.closest('.council-edit-form');if(!form)return;e.preventDefault();
 const button=form.querySelector('button');button.disabled=true;
 const data=new FormData(form);
 try{await request('update','POST',{key:form.dataset.key,url:data.get('url'),status:data.get('status')});await load()}
 catch(err){window.alert(err.message)}finally{button.disabled=false}
});
if(session)load().catch(err=>{show(false);$('council-login-status').textContent=err.message;});
else show(false);
})();