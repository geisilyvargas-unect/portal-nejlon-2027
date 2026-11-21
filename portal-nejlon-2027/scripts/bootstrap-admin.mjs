import {createClient} from '@supabase/supabase-js';
import {randomBytes} from 'node:crypto';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
const email=(process.env.BOOTSTRAP_ADMIN_EMAIL||'prescon@nejlondrina.com').toLowerCase();
const password=process.env.BOOTSTRAP_ADMIN_PASSWORD||randomBytes(24).toString('base64url');
if(!url || !key)throw Error('Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local.');
if(password.length<12)throw Error('A senha inicial deve ter no mínimo 12 caracteres.');
const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const {data:found,error:findError}=await admin.from('profiles').select('id').eq('email',email).maybeSingle();
if(findError)throw Error(findError.message);
if(found){console.log('PRESCON já foi cadastrada. Nenhuma alteração feita.');process.exit(0);}
const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true});
if(error)throw Error(`Não foi possível criar a conta: ${error.message}. Se já existir no Auth, remova ou regularize pelo painel do Supabase.`);
const id=data.user?.id;
if(!id)throw Error('Auth não retornou o ID do novo usuário.');
const {error:pError}=await admin.from('profiles').insert({id,email,full_name:'Presidência do Conselho NEJLON',role:'prescon',ej_id:null,active:true,must_change_password:true});
if(pError){await admin.auth.admin.deleteUser(id);throw Error(pError.message);}
console.log('Conta PRESCON criada:',email);
console.log('SENHA TEMPORÁRIA (GUARDE COM SEGURANÇA, EXIBIDA UMA VEZ):',password);
console.log('Entre no portal e defina sua senha pessoal de pelo menos 12 caracteres.');
