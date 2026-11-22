import {createClient} from 'npm:@supabase/supabase-js@2.95.0';
import {corsHeaders} from 'npm:@supabase/supabase-js@2.95.0/cors';

type PortalRole='prescon'|'nucleus_direx'|'ej_direx'|'counselor';
type Target={email:string;role:PortalRole;ej_id:string|null;full_name:string};
const domain='@nejlondrina.com';
const allowedRoles=new Set<PortalRole>(['prescon','nucleus_direx','ej_direx','counselor']);
const response=(body:unknown,status=200)=>new Response(JSON.stringify(body),{
  status,headers:{...corsHeaders,'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}
});
const string=(value:unknown,max:number)=>typeof value==='string'&&value.trim().length<=max?value.trim():'';
const errorMessage=(error:unknown)=>error instanceof Error?error.message:'Erro interno.';

Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response('ok',{status:200,headers:corsHeaders});
 try{
  if(req.method!=='POST')return response({error:'Método não permitido.'},405);
  const url=Deno.env.get('SUPABASE_URL');
  const roleKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!roleKey)return response({error:'Configuração administrativa indisponível.'},503);
  const header=req.headers.get('Authorization')||'';
  if(!header.startsWith('Bearer '))return response({error:'É necessário entrar na sua conta.'},401);
  const token=header.slice(7);
  const admin=createClient(url,roleKey,{auth:{autoRefreshToken:false,persistSession:false}});
  const {data:{user},error:authError}=await admin.auth.getUser(token);
  if(authError||!user)return response({error:'Sessão inválida. Entre novamente.'},401);
  const {data:viewer,error:profileError}=await admin.from('profiles')
   .select('id,role,active,must_change_password').eq('id',user.id).maybeSingle();
  if(profileError||!viewer?.active)return response({error:'Seu acesso não está ativo.'},403);

  const raw=await req.text();
  if(raw.length>12000)return response({error:'Requisição muito extensa.'},413);
  let body:Record<string,unknown>;
  try{body=JSON.parse(raw);}catch{return response({error:'Dados inválidos.'},400);}
  if(!body||typeof body!=='object'||Array.isArray(body))return response({error:'Dados inválidos.'},400);
  const mode=string(body.mode,40);
  const isPrescon=viewer.role==='prescon'&&!viewer.must_change_password;
  if(!isPrescon&&mode!=='self_change')return response({error:'Operação exclusiva da PRESCON.'},403);

  async function targetFor(role:PortalRole,ejId:string|null):Promise<Target>{
   if(!allowedRoles.has(role))throw new Error('Perfil inválido.');
   if(role==='prescon')return {email:'prescon'+domain,role,ej_id:null,full_name:'Presidência do Conselho NEJLON'};
   if(role==='nucleus_direx')return {email:'direx'+domain,role,ej_id:null,full_name:'DIREX do Núcleo NEJLON'};
   if(!ejId)throw new Error('Selecione uma EJ.');
   const {data:ej,error}=await admin.from('ejs').select('id,name,slug').eq('id',ejId).maybeSingle();
   if(error||!ej||!/^[a-z0-9]+$/.test(ej.slug))throw new Error('EJ não encontrada.');
   return {
    email:(role==='counselor'?'conselho':'direx')+ej.slug+domain,
    role,ej_id:ej.id,
    full_name:(role==='counselor'?'Conselho — ':'DIREX — ')+ej.name
   };
  }

  if(mode==='self_change'){
   const password=string(body.password,72);
   if(password.length<12)return response({error:'Defina uma senha de pelo menos 12 caracteres.'},400);
   const {error}=await admin.auth.admin.updateUserById(user.id,{password});
   if(error)return response({error:'Não foi possível atualizar a senha: '+error.message},400);
   const {error:pError}=await admin.from('profiles').update({must_change_password:false}).eq('id',user.id);
   if(pError)return response({error:'Senha alterada, mas o perfil não foi atualizado. Contate a PRESCON.'},500);
   return response({ok:true,message:'Senha atualizada.'});
  }

  if(mode==='create'){
   const role=string(body.role,20) as PortalRole;
   const target=await targetFor(role,string(body.ej_id,50)||null);
   const password=string(body.password,72);
   if(password.length<6)return response({error:'A senha deve ter pelo menos 6 caracteres.'},400);
   if(role==='prescon'&&(password.length<12||password==='123456'))
    return response({error:'PRESCON exige uma senha individual com 12 caracteres ou mais.'},400);
   const full_name=string(body.full_name,150)||target.full_name;
   const phone=string(body.phone,40)||null;
   const {data:created,error}=await admin.auth.admin.createUser({
    email:target.email,password,email_confirm:true
   });
   if(error||!created.user)return response({error:'Não foi possível criar '+target.email+': '+(error?.message||'Erro do Auth')},409);
   const {error:insertError}=await admin.from('profiles').insert({
    id:created.user.id,email:target.email,full_name,role:target.role,ej_id:target.ej_id,
    phone,active:true,must_change_password:false
   });
   if(insertError){
    await admin.auth.admin.deleteUser(created.user.id);
    return response({error:'Erro ao vincular o perfil da EJ: '+insertError.message},500);
   }
   return response({ok:true,email:target.email,message:'Conta criada com perfil e EJ vinculados.'});
  }

  if(mode==='update'){
   const id=string(body.id,50);
   if(!/^[0-9a-f-]{36}$/i.test(id))return response({error:'Usuário inválido.'},400);
   const role=string(body.role,20) as PortalRole;
   const target=await targetFor(role,string(body.ej_id,50)||null);
   const active=body.active===true;
   if(id===user.id&&(!active||role!=='prescon'))return response({error:'Você não pode remover seu próprio acesso PRESCON.'},403);
   const {data:original,error:readError}=await admin.from('profiles').select('*').eq('id',id).maybeSingle();
   if(readError||!original)return response({error:'Usuário não encontrado.'},404);
   const updated={email:target.email,role,ej_id:target.ej_id,active,
      full_name:string(body.full_name,150)||target.full_name,phone:string(body.phone,40)||null};
   const {error:writeError}=await admin.from('profiles').update(updated).eq('id',id);
   if(writeError)return response({error:writeError.message},400);
   if(original.email!==target.email){
    const {error:authUpdateError}=await admin.auth.admin.updateUserById(id,{email:target.email,email_confirm:true});
    if(authUpdateError){
      await admin.from('profiles').update({
       email:original.email,role:original.role,ej_id:original.ej_id,active:original.active,
       full_name:original.full_name,phone:original.phone
      }).eq('id',id);
      return response({error:'Falha no Auth: '+authUpdateError.message},400);
    }
   }
   return response({ok:true,message:'Conta atualizada.'});
  }

  if(mode==='reset'){
   const id=string(body.id,50);
   if(!/^[0-9a-f-]{36}$/i.test(id)||id===user.id)return response({error:'Use Alterar senha para sua própria conta.'},400);
   const {data:target,error:readError}=await admin.from('profiles').select('id,role').eq('id',id).maybeSingle();
   if(readError||!target)return response({error:'Usuário não encontrado.'},404);
   const bytes=crypto.getRandomValues(new Uint8Array(24));
   const password=btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
   const {error:authUpdateError}=await admin.auth.admin.updateUserById(id,{password});
   if(authUpdateError)return response({error:'Falha ao redefinir senha: '+authUpdateError.message},400);
   const {error:writeError}=await admin.from('profiles').update({must_change_password:true}).eq('id',id);
   if(writeError)return response({error:'Senha redefinida, mas a troca obrigatória não foi marcada.'},500);
   return response({ok:true,password,message:'Senha temporária gerada. Copie agora.'});
  }

  return response({error:'Operação não suportada.'},400);
 }catch(e){return response({error:errorMessage(e)},400);}
});
