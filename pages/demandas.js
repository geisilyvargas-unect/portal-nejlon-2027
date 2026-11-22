(()=>{
'use strict';
const $=id=>document.getElementById(id);
const API='https://imsisbixzkqphooxyfhr.supabase.co/functions/v1';
const SB='https://imsisbixzkqphooxyfhr.supabase.co';
const KEY='sb_publishable_mS_TDGKZhUuJi-rxc5Nu1w_IXODeo-_';
const STORE='nejlon.demands.session.v1';
const SOURCES=[STORE,'nejlon.prescon.central.session.v1','nejlon.conselheiro.session.v1'];
let session=null,ui=null;
for(const key of SOURCES){try{const saved=JSON.parse(sessionStorage.getItem(key)||'null');if(saved?.access_token){session=saved;break}}catch{}}
async function parse(res){let x={};try{x=await res.json()}catch{}if(!res.ok)throw Error(String(x.error_description||x.error||x.message||'Não foi possível concluir a solicitação.'));return x}
async function refresh(){
 if(!session?.refresh_token)throw Error('Entre novamente no Portal.');
 const response=await fetch(SB+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token})});
 session=await parse(response);sessionStorage.setItem(STORE,JSON.stringify(session));
}
async function request(endpoint,{method='GET',data,retry=true}={}){
 const run=()=>fetch(API+endpoint,{method,headers:{'Content-Type':'application/json',apikey:KEY,Authorization:'Bearer '+session.access_token},...(data===undefined?{}:{body:JSON.stringify(data)})});
 let response;try{response=await run()}catch{throw Error('Não foi possível acessar o Supabase. Verifique a conexão ou a função de demandas.')}
 if(response.status===401&&retry){await refresh();return request(endpoint,{method,data,retry:false})}
 return parse(response);
}
function visible(signed){$('demands-login').hidden=signed;$('demands-app').hidden=!signed}
async function open(){
 if(!ui)ui=window.NEJLON_DemandUI.mount({containerId:'demands-root',request});
 await ui.refresh();
 visible(true);
 $('demands-user').textContent=session?.user?.email||'Membro da Rede';
}
$('demands-login-form').addEventListener('submit',async e=>{
 e.preventDefault();const btn=e.target.querySelector('button');btn.disabled=true;
 $('demands-login-status').textContent='Verificando acesso…';
 try{
  const response=await fetch(SB+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({email:$('demands-email').value.trim(),password:$('demands-password').value})});
  session=await parse(response);sessionStorage.setItem(STORE,JSON.stringify(session));$('demands-password').value='';await open();$('demands-login-status').textContent='';
 }catch(err){visible(false);$('demands-login-status').textContent=err.message;session=null;sessionStorage.removeItem(STORE)}
 finally{btn.disabled=false}
});
$('demands-logout').addEventListener('click',()=>{
 session=null;for(const key of SOURCES)sessionStorage.removeItem(key);
 visible(false);$('demands-login-status').textContent='Sessão encerrada.';
});
if(session)open().catch(e=>{visible(false);$('demands-login-status').textContent=e.message});
else visible(false);
})();