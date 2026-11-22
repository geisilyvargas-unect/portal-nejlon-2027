(()=>{'use strict';
const SB='https://imsisbixzkqphooxyfhr.supabase.co',KEY='sb_publishable_mS_TDGKZhUuJi-rxc5Nu1w_IXODeo-_',STORE='nejlon.prescon.central.session.v1';
const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let session=null,ejs=[];try{session=JSON.parse(sessionStorage.getItem(STORE)||'null')}catch{}
const msg=t=>$('test-feedback').textContent=t;
async function api(path,options={},retry=true){
 if(!session?.access_token)throw Error('Entre com uma conta PRESCON.');
 const res=await fetch(SB+path,{...options,headers:{apikey:KEY,Authorization:'Bearer '+session.access_token,...options.headers}});
 if(res.status===401&&retry&&session.refresh_token){
  const refresh=await fetch(SB+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token})});
  if(refresh.ok){session=await refresh.json();sessionStorage.setItem(STORE,JSON.stringify(session));return api(path,options,false)}
 }
 const body=await res.json().catch(()=>({}));
 if(!res.ok)throw Error(body.error||body.message||'Falha de autenticação ou autorização ('+res.status+').');
 return body;
}
async function init(){
 const user=await api('/auth/v1/user');
 const profiles=await api('/rest/v1/profiles?select=role,active,must_change_password&id=eq.'+encodeURIComponent(user.id));
 if(!profiles[0]?.active||profiles[0].role!=='prescon'||profiles[0].must_change_password)throw Error('Esta página exige uma conta PRESCON ativa e com senha definitiva.');
 ejs=await api('/rest/v1/ejs?select=id,name,slug&order=name.asc');
 $('test-ej').innerHTML=ejs.map(e=>'<option value="'+esc(e.id)+'">'+esc(e.name)+'</option>').join('');
 $('test-login').hidden=true;$('test-app').hidden=false;msg('PRESCON autenticada. Escolha a EJ e crie os perfis de teste.');
}
function makePassword(){
 const chars='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
 const random=new Uint32Array(20);crypto.getRandomValues(random);
 return Array.from(random,n=>chars[n%chars.length]).join('');
}
$('test-login-form').addEventListener('submit',async e=>{
 e.preventDefault();const f=new FormData(e.target);
 try{const res=await fetch(SB+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({email:f.get('email'),password:f.get('password')})});const data=await res.json();if(!res.ok)throw Error(data.error_description||data.msg||'Credenciais inválidas.');session=data;sessionStorage.setItem(STORE,JSON.stringify(data));await init()}catch(err){msg(err.message)}
});
document.querySelectorAll('[data-role]').forEach(button=>button.addEventListener('click',async()=>{
 const role=button.dataset.role,ej=ejs.find(x=>x.id===$('test-ej').value),password=makePassword();
 button.disabled=true;msg('Criando conta '+role+'...');
 try{
  const result=await api('/functions/v1/portal-manage-access',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'create',role,ej_id:role==='nucleus_direx'?null:ej.id,password,full_name:'CONTA DE TESTE — '+role.toUpperCase()})});
  const wrapper=document.createElement('div');wrapper.className='test-credential';
  wrapper.innerHTML='<strong>Conta criada: '+esc(role)+'</strong><code>E-mail: '+esc(result.email)+'</code><code>Senha temporária: '+esc(password)+'</code><p>Copie agora: a senha não será armazenada nem exibida novamente nesta página.</p>';
  const copy=document.createElement('button');copy.type='button';copy.textContent='Copiar credenciais';
  copy.addEventListener('click',()=>navigator.clipboard.writeText('E-mail: '+result.email+'\\nSenha: '+password).then(()=>msg('Credenciais copiadas. Guarde em local privado.')).catch(()=>msg('Copie manualmente as credenciais exibidas.')));
  wrapper.appendChild(copy);$('test-result').prepend(wrapper);msg('Conta criada com sucesso.');
 }catch(err){msg(err.message)}finally{button.disabled=false}
}));
if(session?.access_token)init().catch(err=>msg(err.message));
})();