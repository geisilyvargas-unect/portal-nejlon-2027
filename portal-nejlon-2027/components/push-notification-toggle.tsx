'use client';
import {useEffect,useState} from 'react';
import {createClient} from '@/lib/supabase/browser';
import {Bell,BellOff} from 'lucide-react';

function decodeKey(base64:string){
 const b64=base64.replace(/-/g,'+').replace(/_/g,'/');
 const raw=atob(b64+'='.repeat((4-b64.length%4)%4));
 const buffer=new ArrayBuffer(raw.length);
 const bytes=new Uint8Array(buffer);
 for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
 return buffer;
}
export function PushNotificationToggle({userId}:{userId:string}){
 const [enabled,setEnabled]=useState(false);
 const [busy,setBusy]=useState(false);
 const [supported,setSupported]=useState(true);
 const [message,setMessage]=useState('');
 useEffect(()=>{
   if(!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window)){setSupported(false);return;}
   navigator.serviceWorker.register('/sw.js',{scope:'/'}).then(reg=>reg.pushManager.getSubscription())
    .then(s=>setEnabled(!!s)).catch(()=>setSupported(false));
 },[]);
 async function toggle(){
  setBusy(true);setMessage('');
  try{
   const db=createClient();
   const reg=await navigator.serviceWorker.ready;
   const current=await reg.pushManager.getSubscription();
   if(enabled){
    if(current){
     const {error}=await db.from('push_subscriptions').delete().eq('endpoint',current.endpoint).eq('user_id',userId);
     if(error)throw error;
     await current.unsubscribe();
    }
    setEnabled(false);setMessage('Notificações desativadas neste dispositivo.');
   }else{
    const permission=await Notification.requestPermission();
    if(permission!=='granted')throw Error('A permissão de notificação foi negada pelo dispositivo.');
    let key:string|null=null;
    const {data,error}=await db.from('push_settings').select('vapid_public_key').eq('id',1).maybeSingle();
    if(error)throw error;
    key=data?.vapid_public_key||null;
    if(!key){
     const response=await fetch('https://imsisbixzkqphooxyfhr.supabase.co/functions/v1/nejlon-push-dispatch',{method:'GET'});
     if(response.ok)key=(await response.json()).publicKey;
    }
    if(!key)throw Error('Servidor de notificações ainda não foi inicializado.');
    const sub=current||await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decodeKey(key)});
    const payload=sub.toJSON();
    if(!payload.keys?.p256dh||!payload.keys?.auth)throw Error('Assinatura do dispositivo incompleta.');
    const {error:saveError}=await db.from('push_subscriptions').upsert({
      user_id:userId,endpoint:sub.endpoint,p256dh:payload.keys.p256dh,auth_secret:payload.keys.auth
    },{onConflict:'endpoint'});
    if(saveError)throw saveError;
    setEnabled(true);
    setMessage('Notificações ativadas para este usuário neste dispositivo.');
   }
  }catch(e){setMessage(e instanceof Error?e.message:'Falha ao configurar notificações.');}
  finally{setBusy(false);}
 }
 return <section className="panel" aria-label="Notificações no celular">
  <div className="toolbar" style={{marginTop:0}}>
    <div><div className="eyebrow">NEJLON no seu celular</div><h2 style={{margin:'8px 0'}}>Notificações do Conselho</h2></div>
    {enabled?<Bell size={24} aria-hidden/>:<BellOff size={24} aria-hidden/>}
  </div>
  <p className="muted small">Receba novos formulários, lembretes de deliberação (3 dias antes e no último dia) e reuniões. A PRESCON também recebe avisos de encerramento.</p>
  {supported?<button type="button" className={enabled?'outline':'primary'} disabled={busy} onClick={toggle}>
    {busy?'Configurando…':enabled?'Desativar neste dispositivo':'Ativar notificações'}
  </button>:<p className="notice">Seu navegador não oferece Web Push nesta página. No iPhone, adicione o portal à Tela de Início e abra pelo ícone.</p>}
  {message&&<p role="status" className="small" style={{marginTop:12}}>{message}</p>}
  <p className="muted small" style={{marginTop:10,marginBottom:0}}>Só ative em um celular pessoal. O navegador exige sua autorização e pode limitar a entrega conforme o sistema.</p>
 </section>;
}
