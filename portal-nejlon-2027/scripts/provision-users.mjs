import {createClient} from '@supabase/supabase-js';
import {randomBytes} from 'node:crypto';
import {writeFileSync} from 'node:fs';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key)throw Error('Configure URL e SERVICE_ROLE_KEY no .env.local.');
const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const {data:ejs,error:ejError}=await admin.from('ejs').select('id,name,slug').order('name');if(ejError)throw Error(ejError.message);
if(ejs?.length!==29)throw Error(`Esperadas 29 EJs, encontradas ${ejs?.length??0}. Rode a migração primeiro.`);
let created=0,skipped=0;const lines=['EJ;Perfil;Email;Senha temporária'];
for(const ej of ejs){for(const role of ['counselor','ej_direx']){
 const email=`${role==='counselor'?'conselho':'direx'}${ej.slug}@nejlondrina.com`;
 const {data:exists,error:checkError}=await admin.from('profiles').select('id').eq('email',email).maybeSingle();if(checkError)throw Error(checkError.message);
 if(exists){skipped++;continue;}
 const password=randomBytes(24).toString('base64url');
 const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true});if(error){console.error('Falha:',email,error.message);continue;}
 const user=data.user;if(!user){console.error('Sem ID:',email);continue;}
 const {error:profileError}=await admin.from('profiles').insert({id:user.id,email,full_name:`${role==='counselor'?'Conselho':'Direx'} — ${ej.name}`,role,ej_id:ej.id,active:true,must_change_password:true});
 if(profileError){await admin.auth.admin.deleteUser(user.id);console.error('Falha no perfil:',email,profileError.message);continue;}
 lines.push(`${ej.name};${role};${email};${password}`);created++;
}}
if(created){const path='acessos-iniciais.csv';writeFileSync(path,'\ufeff'+lines.join('\n')+'\n',{mode:0o600});console.log(`Credenciais temporárias gravadas em ${path} — NUNCA envie ao GitHub. Entregue individualmente e apague após o uso.`);}
console.log(`Contas criadas: ${created}; existentes ignoradas: ${skipped}; erros exibidos acima.`);
