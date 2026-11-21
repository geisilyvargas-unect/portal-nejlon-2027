'use server';
import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireRole, requireViewer } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { safeText, type Role, type Position, type Deliberation, type ScenarioAnswer } from '@/lib/constants';
import { scenariosOf } from '@/lib/deliberation-form';

const isOneOf = <T extends string>(value: string, valid: readonly T[]): value is T => valid.includes(value as T);
const validRoles = ['prescon','nucleus_direx','ej_direx','counselor'] as const;
const validPositions = ['favorable','suggestions','qualified','against','abstention'] as const;
function fail(message: string): never { throw new Error(message); }
function required(form: FormData, key: string, max = 3000): string {
  const value = safeText(form.get(key));
  if (!value || value.length > max) fail(`Preencha o campo ${key} (máximo ${max} caracteres).`);
  return value;
}
function maybe(form: FormData, key: string, max = 8000): string | null {
  const v = safeText(form.get(key));
  if (v.length > max) fail(`Campo ${key} acima do limite.`);
  return v || null;
}
function dateTime(value: string): string {
  const iso = new Date(/(?:Z|[+-]\d\d:\d\d)$/.test(value) ? value : `${value}:00-03:00`);
  if (Number.isNaN(iso.getTime())) fail('Data e hora inválidas.');
  return iso.toISOString();
}
function checkError(error: {message: string} | null): void { if (error) fail(error.message); }

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

function readScenarios(form:FormData){
  const raw=required(form,'scenarios_json',35000);
  let data:unknown;
  try{data=JSON.parse(raw);}catch{fail('Os cenários estão em um formato inválido.');}
  if(!Array.isArray(data)||data.length<1||data.length>12)fail('Cadastre de 1 a 12 cenários.');
  return data.map((value:unknown,index:number)=>{
    if(!value||typeof value!=='object')fail('Cenário inválido.');
    const row=value as Record<string,unknown>;
    const title=typeof row.title==='string'?row.title.trim():'';
    const description=typeof row.description==='string'?row.description.trim():'';
    const material_url=typeof row.material_url==='string'?row.material_url.trim():'';
    if(title.length<3||title.length>180)fail('O título do cenário deve ter entre 3 e 180 caracteres.');
    if(description.length>4000)fail('Contexto do cenário muito extenso.');
    if(material_url&&(!material_url.startsWith('https://')||material_url.length>2000))fail('Os materiais devem ter links HTTPS.');
    return {key:'c'+(index+1),title,description,material_url};
  });
}

export async function createDeliberation(form: FormData) {
  const viewer = await requireRole(['prescon']);
  const supabase = await createClient();
  const title = required(form,'title',250);
  const scenarios=readScenarios(form);
  const due_at = dateTime(required(form,'due_at'));
  const status = safeText(form.get('status')) === 'open' ? 'open' : 'draft';
  const { error } = await supabase.from('deliberations').insert({
    title, description: maybe(form,'description') || '', due_at, status,
    direx_visible: form.get('direx_visible') === 'on', created_by: viewer.id, is_demo: false, scenarios,
  }); checkError(error);
  revalidatePath('/deliberacoes'); revalidatePath('/pendencias');
  redirect('/deliberacoes?criada=1');
}
export async function changeDeliberationStatus(form: FormData) {
  await requireRole(['prescon']);
  const supabase = await createClient();
  const id = required(form,'id',50);
  const status = required(form,'status');
  if (!isOneOf(status,['draft','open','closed'])) fail('Status inválido.');
  const { error } = await supabase.from('deliberations').update({status}).eq('id',id);
  checkError(error); revalidatePath('/deliberacoes'); revalidatePath('/pendencias'); revalidatePath(`/deliberacoes/${id}`);
}
export async function submitResponse(form: FormData) {
  const viewer=await requireRole(['counselor']);
  if(!viewer.ej_id)fail('Conselheiro sem EJ vinculada.');
  const id=required(form,'deliberation_id',50);
  const db=await createClient();
  const {data:delib,error:delibError}=await db.from('deliberations')
    .select('id,title,description,scenarios,status,due_at,is_demo').eq('id',id).single();
  checkError(delibError);
  if(!delib||delib.status!=='open'||delib.is_demo||new Date(delib.due_at).getTime()<=Date.now())
    fail('Esta deliberação não aceita mais respostas.');
  const scenarios=scenariosOf(delib as Deliberation);
  let incoming:unknown;
  try{incoming=JSON.parse(required(form,'answers_json',50000));}
  catch{fail('Não foi possível interpretar as respostas do formulário.');}
  if(!Array.isArray(incoming)||incoming.length!==scenarios.length)fail('Responda todos os cenários para concluir a deliberação.');
  const seen=new Set<string>();
  const answers:ScenarioAnswer[]=incoming.map((row:unknown)=>{
    if(!row||typeof row!=='object')fail('Resposta de cenário inválida.');
    const r=row as Record<string,unknown>;
    const key=typeof r.scenario_key==='string'?r.scenario_key:'';
    if(!scenarios.some(sc=>sc.key===key)||seen.has(key))fail('Os cenários não correspondem ao formulário.');
    seen.add(key);
    const position=typeof r.position==='string'?r.position:'';
    if(!isOneOf<Position>(position,validPositions))fail('Posicionamento inválido.');
    const justification=typeof r.justification==='string'?r.justification.trim():'';
    const caveats=typeof r.caveats==='string'?r.caveats.trim():'';
    const suggestions=typeof r.suggestions==='string'?r.suggestions.trim():'';
    if([justification,caveats,suggestions].some(value=>value.length>5000))fail('Justificativa ou observações muito longas.');
    if(position==='against'&&!justification)fail('Explique os motivos da reprovação.');
    if(position==='qualified'&&!caveats)fail('Descreva as condições ou ressalvas para a aprovação.');
    if(position==='suggestions'&&!suggestions)fail('Escreva as sugestões de melhoria.');
    return {scenario_key:key,position,justification,caveats,suggestions};
  });
  const clarity=required(form,'clarity',2);
  const difficulty=required(form,'difficulty',2);
  if(!/^[0-5]$/.test(clarity)||!/^[0-5]$/.test(difficulty))fail('Avalie clareza e dificuldade de 0 a 5.');
  const improvements=required(form,'improvements',2000);
  const primary=answers[0];
  const {error}=await db.from('responses').upsert({
    deliberation_id:id,ej_id:viewer.ej_id,position:primary.position,
    justification:primary.justification||null,
    caveats:primary.caveats||null,
    suggestions:primary.suggestions||null,
    scenario_answers:answers,
    final_feedback:{clarity:Number(clarity),difficulty:Number(difficulty),improvements},
    submitted_by:viewer.id
  },{onConflict:'deliberation_id,ej_id'});
  checkError(error);
  revalidatePath('/pendencias'); revalidatePath('/relatorios');
  revalidatePath('/');revalidatePath('/painel');revalidatePath('/deliberacoes');
  revalidatePath('/deliberacoes/'+id); revalidatePath('/relatorios/'+id);
  redirect('/deliberacoes/'+id+'?respondida=1');
}

export async function saveReportNotes(form: FormData) {
  await requireRole(['prescon']);
  const id=required(form,'id',50);
  const supabase=await createClient();
  const {error}=await supabase.from('deliberations').update({report_notes:maybe(form,'report_notes'),report_followup:maybe(form,'report_followup')}).eq('id',id);
  checkError(error);revalidatePath(`/relatorios/${id}`);revalidatePath(`/deliberacoes/${id}`);
}
export async function saveResponseReview(form:FormData){
  const viewer=await requireRole(['prescon']);
  const deliberationId=required(form,'deliberation_id',50);
  const responseId=required(form,'response_id',50);
  const scenarioKey=required(form,'scenario_key',80);
  const aspect=required(form,'aspect',30);
  const decision=required(form,'decision',30);
  const comment=maybe(form,'comment',8000)||'';
  if(!isOneOf(aspect,['rejection','suggestion','caveat']))fail('Tipo de análise inválido.');
  if(!isOneOf(decision,['under_review','accepted','rejected']))fail('Encaminhamento inválido.');
  const db=await createClient();
  const {data:response,error:check}=await db.from('responses').select('id').eq('id',responseId).eq('deliberation_id',deliberationId).maybeSingle();
  checkError(check);
  if(!response)fail('Esta resposta não pertence à deliberação.');
  const {error}=await db.from('response_reviews').upsert({
    response_id:responseId,scenario_key:scenarioKey,aspect,decision,comment,reviewed_by:viewer.id
  },{onConflict:'response_id,scenario_key,aspect'});
  checkError(error);
  revalidatePath('/relatorios/'+deliberationId);
}

export async function createDemand(form: FormData) {
  await requireRole(['prescon','nucleus_direx']);
  const supabase=await createClient();
  const {error}=await supabase.from('demands').insert({
    ej_id:required(form,'ej_id',50),title:required(form,'title',250),
    description:maybe(form,'description')||'', due_at:maybe(form,'due_at',30),
    responsible:maybe(form,'responsible',150)
  }); checkError(error);revalidatePath('/demandas');
}
export async function changeDemandStatus(form:FormData) {
  await requireRole(['prescon','nucleus_direx']);
  const status=required(form,'status');
  if(!isOneOf(status,['pendente','em_andamento','concluida'])) fail('Status inválido.');
  const supabase=await createClient();
  const {error}=await supabase.from('demands').update({status}).eq('id',required(form,'id',50));
  checkError(error);revalidatePath('/demandas');
}
export async function createEvent(form:FormData) {
  await requireRole(['prescon','nucleus_direx']);
  const supabase=await createClient();
  const {error}=await supabase.from('events').insert({title:required(form,'title',250),description:maybe(form,'description')||'',kind:required(form,'kind',50),starts_at:dateTime(required(form,'starts_at'))});
  checkError(error);revalidatePath('/calendario');
}
export async function createDocument(form:FormData) {
  await requireRole(['prescon']);
  const url=required(form,'url',2000); if(!url.startsWith('https://')) fail('Use um link HTTPS.');
  const visibility=required(form,'visibility');
  if(!isOneOf(visibility,['all','council','direx'])) fail('Visibilidade inválida.');
  const supabase=await createClient();
  const {error}=await supabase.from('documents').insert({title:required(form,'title',250),category:required(form,'category',100),url,visibility});
  checkError(error);revalidatePath('/biblioteca');
}
export async function createJourneyItem(form:FormData) {
  await requireRole(['prescon']);
  const material_url=maybe(form,'material_url',2000);
  if(material_url && !material_url.startsWith('https://')) fail('Use um link HTTPS.');
  const supabase=await createClient();
  const {error}=await supabase.from('journey_items').insert({
    title:required(form,'title',250),description:maybe(form,'description')||'',
    material_url,session_at:safeText(form.get('session_at')) ? dateTime(required(form,'session_at')):null
  }); checkError(error);revalidatePath('/jornada');
}
export async function saveJourneyFeedback(form:FormData) {
  const viewer=await requireRole(['counselor']);
  const supabase=await createClient();
  const journey_id=required(form,'journey_id',50);
  const feedback=maybe(form,'feedback',2000);
  // Atualiza APENAS o feedback: a presença registrada pela administração nunca é sobrescrita.
  const {data:existing,error:lookupError}=await supabase.from('journey_progress')
    .select('id').eq('journey_id',journey_id).eq('counselor_id',viewer.id).maybeSingle();
  checkError(lookupError);
  const result=existing
    ? await supabase.from('journey_progress').update({feedback}).eq('id',existing.id)
    : await supabase.from('journey_progress').insert({journey_id,counselor_id:viewer.id,feedback});
  checkError(result.error);
  revalidatePath('/jornada');
}

export type AccessResult = { ok: boolean; message: string; password?: string };
function canonicalEmail(role:Role,slug:string|null):string {
  const domain='@nejlondrina.com';
  if(role==='prescon')return `prescon${domain}`;
  if(role==='nucleus_direx')return `direx${domain}`;
  if(!slug)fail('Selecione uma EJ.');
  return `${role==='counselor'?'conselho':'direx'}${slug}${domain}`;
}
async function getCanonical(role:Role,ejId:string|null) {
  const admin=adminClient();
  if(role==='prescon'||role==='nucleus_direx')return {email:canonicalEmail(role,null),ej_id:null};
  if(!ejId)fail('Selecione uma EJ para este perfil.');
  const {data,error}=await admin.from('ejs').select('id,slug').eq('id',ejId).single();
  checkError(error);
  return {email:canonicalEmail(role,data!.slug),ej_id:ejId};
}
export async function createPortalUser(_previous:AccessResult, form:FormData):Promise<AccessResult> {
  try {
    await requireRole(['prescon']);
    const name=required(form,'full_name',150);
    const roleRaw=required(form,'role');
    if(!isOneOf<Role>(roleRaw,validRoles))fail('Perfil inválido.');
    const {email,ej_id}=await getCanonical(roleRaw,safeText(form.get('ej_id'))||null);
    const phone=maybe(form,'phone',40);
    const admin=adminClient();
    // Conta ativada sem depender do e-mail institucional. Senha forte, aleatória e de uso inicial.
    const password=randomBytes(24).toString('base64url');
    const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true});
    checkError(error);
    if(!data.user)fail('Supabase não retornou o usuário.');
    const {error:profileError}=await admin.from('profiles').insert({
      id:data.user.id,email,full_name:name,role:roleRaw,ej_id,phone,active:true,must_change_password:true,
    });
    if(profileError){await admin.auth.admin.deleteUser(data.user.id);fail(profileError.message);}
    revalidatePath('/acessos');
    return {ok:true,message:`Conta ${email} criada. Copie a senha temporária agora; ela não será exibida novamente.`,password};
  } catch(error) {return {ok:false,message:error instanceof Error?error.message:'Falha ao criar usuário.'};}
}
export async function updatePortalUser(_previous:AccessResult,form:FormData):Promise<AccessResult> {
  try {
    const viewer=await requireRole(['prescon']);
    const id=required(form,'id',50);
    const name=required(form,'full_name',150);
    const roleRaw=required(form,'role');
    if(!isOneOf<Role>(roleRaw,validRoles))fail('Perfil inválido.');
    const {email,ej_id}=await getCanonical(roleRaw,safeText(form.get('ej_id'))||null);
    const active=form.get('active')==='on';
    if(viewer.id===id && (!active || roleRaw!=='prescon'))fail('Você não pode desativar ou remover seu próprio acesso administrativo.');
    const admin=adminClient();
    const {data:old,error:oldError}=await admin.from('profiles').select('email').eq('id',id).single();
    checkError(oldError);
    const {error:profileError}=await admin.from('profiles').update({full_name:name,role:roleRaw,ej_id,active,email,phone:maybe(form,'phone',40)}).eq('id',id);
    checkError(profileError);
    if(old!.email!==email) {
      const {error:authError}=await admin.auth.admin.updateUserById(id,{email,email_confirm:true});
      if(authError) {
        // Evita divergência permanente de e-mails caso o Auth rejeite a alteração.
        await admin.from('profiles').update({email:old!.email}).eq('id',id);
        fail(`O e-mail no Auth não foi atualizado: ${authError.message}`);
      }
    }
    revalidatePath('/acessos');
    return {ok:true,message:'Usuário atualizado com sucesso.'};
  } catch(error) {return {ok:false,message:error instanceof Error?error.message:'Falha ao atualizar.'};}
}
export async function changeMyPassword(_previous:AccessResult,form:FormData):Promise<AccessResult> {
  try {
    const viewer=await requireViewer();
    const password=required(form,'password',150);
    if(password.length<12)fail('Use uma senha com pelo menos 12 caracteres.');
    if(password!==required(form,'confirmation',150))fail('As senhas não coincidem.');
    const supabase=await createClient();
    const {error}=await supabase.auth.updateUser({password});checkError(error);
    const {error:profileError}=await adminClient().from('profiles').update({must_change_password:false}).eq('id',viewer.id);checkError(profileError);
    revalidatePath('/');
    return {ok:true,message:'Senha atualizada. Você já pode acessar o portal.'};
  } catch(error) {return {ok:false,message:error instanceof Error?error.message:'Falha ao alterar senha.'};}
}

export async function resetPortalPassword(_previous:AccessResult,form:FormData):Promise<AccessResult> {
  try {
    const viewer=await requireRole(['prescon']);
    const id=required(form,'id',50);
    if(id===viewer.id) fail('Para alterar sua senha, use a página Alterar senha.');
    const admin=adminClient();
    const password=randomBytes(24).toString('base64url');
    const {error}=await admin.auth.admin.updateUserById(id,{password});checkError(error);
    const {error:profileError}=await admin.from('profiles').update({must_change_password:true}).eq('id',id);checkError(profileError);
    revalidatePath('/acessos');
    return {ok:true,message:'Senha temporária recriada. Copie e compartilhe por canal seguro.',password};
  } catch(error){return {ok:false,message:error instanceof Error?error.message:'Falha ao redefinir senha.'};}
}
