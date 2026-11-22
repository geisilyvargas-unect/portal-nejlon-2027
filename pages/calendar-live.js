(()=>{'use strict';
const SB='https://imsisbixzkqphooxyfhr.supabase.co',KEY='sb_publishable_mS_TDGKZhUuJi-rxc5Nu1w_IXODeo-_',STORE='nejlon.prescon.central.session.v1';
const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let session=null,profile=null,events=[],month=new Date().getMonth(),year=new Date().getFullYear();
const msg=t=>$('feedback').textContent=t;
try{session=JSON.parse(sessionStorage.getItem(STORE)||'null')}catch{}
async function request(path,options={},retry=true){
 if(!session?.access_token)throw Error('Faça login para acessar a agenda.');
 const headers={apikey:KEY,Authorization:'Bearer '+session.access_token,...options.headers};
 let res=await fetch(SB+path,{...options,headers});
 if(res.status===401&&retry&&session.refresh_token){
  const refresh=await fetch(SB+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token})});
  if(!refresh.ok)throw Error('Sessão expirada. Entre novamente.');
  session=await refresh.json();sessionStorage.setItem(STORE,JSON.stringify(session));return request(path,options,false);
 }
 if(!res.ok){let e=await res.json().catch(()=>({}));throw Error(e.message||e.error_description||'Erro ao consultar o Supabase ('+res.status+').')}
 return res.status===204?null:res.json();
}
async function load(){
 const me=await request('/auth/v1/user');
 const rows=await request('/rest/v1/profiles?select=role,active,ej_id&id=eq.'+encodeURIComponent(me.id));
 profile=rows?.[0];
 if(!profile?.active)throw Error('Perfil institucional inativo ou não encontrado.');
 events=await request('/rest/v1/events?select=id,title,description,kind,starts_at,visible_to_ej_direx&order=starts_at.asc&limit=500');
 $('auth-box').hidden=true;$('calendar-app').hidden=false;$('editor').hidden=profile.role!=='prescon';
 $('profile-label').textContent='Perfil autenticado: '+profile.role.replaceAll('_',' ').toUpperCase();
 draw();msg('Agenda carregada com permissões verificadas no Supabase.');
}
function draw(){
 const first=new Date(year,month,1).getDay(),total=new Date(year,month+1,0).getDate();
 $('month-label').textContent=new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(new Date(year,month,1));
 $('weekdays').innerHTML=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(x=>'<span>'+x+'</span>').join('');
 const monthly=events.filter(x=>{const d=new Date(x.starts_at);return d.getMonth()===month&&d.getFullYear()===year});
 $('calendar-grid').innerHTML=Array.from({length:Math.ceil((first+total)/7)*7},(_,i)=>{
  const day=i-first+1,valid=day>0&&day<=total,items=monthly.filter(x=>new Date(x.starts_at).getDate()===day);
  return '<div class="portal-calendar-day '+(valid?'':'outside')+'">'+(valid?'<strong>'+day+'</strong>'+items.map(x=>'<div class="portal-calendar-event">'+esc(x.title)+'</div>').join(''):'')+'</div>';
 }).join('');
 $('event-list').innerHTML=monthly.length?monthly.map(x=>'<div class="live-event"><div><strong>'+esc(new Date(x.starts_at).toLocaleString('pt-BR'))+' · '+esc(x.title)+'</strong><p>'+esc(x.kind)+' · '+esc(x.description)+'</p></div>'+(profile.role==='prescon'?'<button type="button" data-delete="'+esc(x.id)+'">Excluir</button>':'')+'</div>').join(''):'<p>Não há compromissos visíveis para este mês.</p>';
}
$('login-form').addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(e.target);msg('Autenticando...');try{const r=await fetch(SB+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({email:fd.get('email'),password:fd.get('password')})});const data=await r.json();if(!r.ok)throw Error(data.error_description||data.msg||'Login não autorizado.');session=data;sessionStorage.setItem(STORE,JSON.stringify(session));await load()}catch(err){msg(err.message)}});
$('logout').addEventListener('click',()=>{session=null;profile=null;sessionStorage.removeItem(STORE);$('calendar-app').hidden=true;$('auth-box').hidden=false;msg('Sessão local encerrada.')});
$('prev').onclick=()=>{const d=new Date(year,month-1,1);year=d.getFullYear();month=d.getMonth();draw()};
$('next').onclick=()=>{const d=new Date(year,month+1,1);year=d.getFullYear();month=d.getMonth();draw()};
$('today').onclick=()=>{year=new Date().getFullYear();month=new Date().getMonth();draw()};
$('event-form').addEventListener('submit',async e=>{e.preventDefault();if(profile?.role!=='prescon')return;const f=new FormData(e.target),raw=String(f.get('starts_at')||''),d=new Date(raw);if(!raw||isNaN(d.getTime()))return msg('Informe uma data válida.');try{await request('/rest/v1/events',{method:'POST',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({title:String(f.get('title')).trim(),starts_at:d.toISOString(),kind:f.get('kind'),description:String(f.get('description')||''),visible_to_ej_direx:f.has('visible_to_ej_direx')})});e.target.reset();await load();msg('Compromisso publicado no Supabase.')}catch(err){msg(err.message)}});
$('event-list').addEventListener('click',async e=>{const b=e.target.closest('[data-delete]');if(!b||profile?.role!=='prescon')return;if(!confirm('Excluir este compromisso do calendário compartilhado?'))return;try{await request('/rest/v1/events?id=eq.'+encodeURIComponent(b.dataset.delete),{method:'DELETE'});await load();msg('Compromisso excluído.')}catch(err){msg(err.message)}});
if(session?.access_token)load().catch(err=>{msg(err.message);$('auth-box').hidden=false});
})();