import {createClient} from 'npm:@supabase/supabase-js@2.95.0';
import {generateVapidKey,vapidPublicKey,send} from 'jsr:@daaku/webpush@0.2.0';

const supabaseUrl=Deno.env.get('SUPABASE_URL')||'';
const serviceRole=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const cors={
 'Access-Control-Allow-Origin':'https://portal-nejlon-2027.vercel.app',
 'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-cron-secret',
 'Access-Control-Allow-Methods':'GET,POST,OPTIONS',
 'Content-Type':'application/json; charset=utf-8'
};
const json=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:cors});
type PushConfig={vapid_public_key:string|null;vapid_private_key:string|null;scheduler_secret:string};
type Item={id:string;user_id:string;title:string;body:string;path:string;kind:string;ref_id:string|null;attempts:number};
type Device={id:string;endpoint:string;p256dh:string;auth_secret:string};
Deno.serve(async(request:Request)=>{
 try{
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(!supabaseUrl||!serviceRole)return json({error:'Supabase admin credentials missing'},500);
  const db=createClient(supabaseUrl,serviceRole,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:configRows,error:configError}=await db.rpc('get_push_private_config');
  if(configError||!configRows?.length)return json({error:'Push config unavailable'},500);
  let config=configRows[0] as PushConfig;
  if(!config.vapid_private_key){
   const newPrivate=await generateVapidKey();
   const newPublic=await vapidPublicKey(newPrivate);
   const {error:initError}=await db.rpc('init_push_vapid',{public_key:newPublic,private_key:JSON.stringify(newPrivate)});
   if(initError)return json({error:'Could not initialise VAPID keys'},500);
   const {data:reloaded}=await db.rpc('get_push_private_config');
   config=(reloaded?.[0]||config) as PushConfig;
  }
  if(request.method==='GET')return json({ready:!!config.vapid_private_key,publicKey:config.vapid_public_key});
  if(request.method!=='POST')return json({error:'Method not allowed'},405);
  const supplied=request.headers.get('x-cron-secret')||'';
  // Comparacao em tempo constante para chamadas internas do scheduler.
  const a=new TextEncoder().encode(supplied);
  const b=new TextEncoder().encode(config.scheduler_secret||'');
  let mismatch=a.length===b.length?0:1;
  for(let i=0;i<Math.max(a.length,b.length);i++)mismatch|=(a[i]||0)^(b[i]||0);
  if(mismatch!==0||!supplied)return json({error:'Unauthorized'},401);
  const {error:queueError}=await db.rpc('queue_push_reminders');
  if(queueError)return json({error:'Failed to generate reminders'},500);
  const {data:claimed,error:claimError}=await db.rpc('claim_push_outbox',{batch_size:35});
  if(claimError)return json({error:'Could not claim push queue'},500);
  let sent=0,failed=0,undelivered=0;
  for(const item of (claimed||[]) as Item[]){
   const {data:user,error:userError}=await db.from('profiles').select('id,role,ej_id,active').eq('id',item.user_id).maybeSingle();
   if(userError||!user?.active||!['prescon','counselor'].includes(user.role)){
     await db.from('push_outbox').update({status:'failed'}).eq('id',item.id);continue;
   }
   // Revogar notificacoes de deliberações que já não estão abertas.
   if(item.ref_id&&['new_deliberation','deliberation_reminder','prescon_deadline'].includes(item.kind)){
     const {data:d}=await db.from('deliberations').select('id,status,is_demo,is_historical,due_at').eq('id',item.ref_id).maybeSingle();
     if(!d||d.status!=='open'||d.is_demo||d.is_historical||
       (item.kind==='deliberation_reminder'&&new Date(d.due_at)<=new Date())){
       await db.from('push_outbox').update({status:'failed'}).eq('id',item.id);continue;
     }
     if(item.kind==='deliberation_reminder'&&user.role==='counselor'){
       const {count}=await db.from('responses').select('id',{head:true,count:'exact'}).eq('deliberation_id',item.ref_id).eq('ej_id',user.ej_id);
       if((count||0)>0){await db.from('push_outbox').update({status:'failed'}).eq('id',item.id);continue;}
     }
   }
   if(item.kind==='meeting_reminder'&&item.ref_id){
     const {data:e}=await db.from('events').select('kind,starts_at').eq('id',item.ref_id).maybeSingle();
     if(!e||e.kind!=='reuniao_conselho'||new Date(e.starts_at)<=new Date()){
       await db.from('push_outbox').update({status:'failed'}).eq('id',item.id);continue;
     }
   }
   const {data:devices,error:devicesError}=await db.from('push_subscriptions').select('id,endpoint,p256dh,auth_secret').eq('user_id',item.user_id);
   if(devicesError||!devices?.length){
     await db.from('push_outbox').update({status:item.attempts>=5?'failed':'pending',locked_until:null}).eq('id',item.id);
     undelivered++;continue;
   }
   let errors=0;
   for(const device of devices as Device[]){
     const {count}=await db.from('push_deliveries').select('outbox_id',{head:true,count:'exact'})
       .eq('outbox_id',item.id).eq('subscription_id',device.id);
     if(count)continue;
     try {
       await send({endpoint:device.endpoint,keys:{p256dh:device.p256dh,auth:device.auth_secret}},
         JSON.stringify({title:item.title,body:item.body,url:item.path}),
         {vapid:JSON.parse(config.vapid_private_key!),subscriber:'mailto:presconteste@nejlondrina.com',ttl:60*60*24});
       await db.from('push_deliveries').upsert({outbox_id:item.id,subscription_id:device.id});
       sent++;
     }catch(e){
       const code=(e as {statusCode?:number}).statusCode;
       if(code===404||code===410)await db.from('push_subscriptions').delete().eq('id',device.id);
       else errors++;
     }
   }
   await db.from('push_outbox').update({status:errors>0?(item.attempts>=5?'failed':'pending'):'sent',
     delivered_at:errors>0?null:new Date().toISOString(),locked_until:null}).eq('id',item.id);
   failed+=errors;
  }
  return json({processed:(claimed||[]).length,sent,failed,undelivered});
 }catch(e){return json({error:e instanceof Error?e.message:'Internal error'},500);}
});
