'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireRole, requireViewer } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
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
  const improvements=maybe(form,'improvements',2000)||'';
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
async function callAccessFunction<T extends Record<string, unknown>>(payload:Record<string,unknown>):Promise<T>{
  const db=await createClient();
  // A sessão já é verificada no servidor por requireRole/requireViewer antes desta chamada.
  const {data:{session},error:sessionError}=await db.auth.getSession();
  if(sessionError||!session?.access_token)fail('Sessão expirada. Entre novamente para continuar.');
  const {data,error}=await db.functions.invoke('portal-manage-access',{
    body:payload,
    headers:{Authorization:'Bearer '+session.access_token}
  });
  if(error){
    let reason=error.message||'Não foi possível concluir a operação.';
    const context=(error as {context?:{json?:()=>Promise<unknown>}}).context;
    if(context&&typeof context.json==='function'){
      try{
        const detail=await context.json();
        if(detail&&typeof detail==='object'&&'error' in detail&&typeof detail.error==='string')reason=detail.error;
      }catch{/* retorno do gateway pode não ser JSON */}
    }
    fail(reason);
  }
  if(!data||typeof data!=='object')fail('O servidor de acessos não retornou uma confirmação.');
  if('error' in data&&typeof data.error==='string')fail(data.error);
  return data as T;
}

export async function createPortalUser(_previous:AccessResult,form:FormData):Promise<AccessResult>{
  try{
    await requireRole(['prescon']);
    const role=required(form,'role',20);
    if(!isOneOf<Role>(role,validRoles))fail('Perfil inválido.');
    const ej_id=maybe(form,'ej_id',50);
    const full_name=maybe(form,'full_name',150);
    const phone=maybe(form,'phone',40);
    const password=required(form,'password',72);
    if(password.length<6)fail('Use uma senha de no mínimo 6 caracteres.');
    const created=await callAccessFunction<{ok:boolean;email:string;message:string}>({
      mode:'create',role,ej_id,full_name,phone,password
    });
    revalidatePath('/acessos');
    return {ok:true,message:created.email+' — cadastro concluído. Cada usuário possui login independente.'};
  }catch(e){return {ok:false,message:e instanceof Error?e.message:'Falha ao criar usuário.'};}
}

export async function updatePortalUser(_previous:AccessResult,form:FormData):Promise<AccessResult>{
  try{
    await requireRole(['prescon']);
    const id=required(form,'id',50);
    const role=required(form,'role',20);
    if(!isOneOf<Role>(role,validRoles))fail('Perfil inválido.');
    const result=await callAccessFunction<{ok:boolean;message:string}>({
      mode:'update',id,role,ej_id:maybe(form,'ej_id',50),
      full_name:required(form,'full_name',150),
      phone:maybe(form,'phone',40),active:form.get('active')==='on'
    });
    revalidatePath('/acessos');
    return {ok:true,message:result.message};
  }catch(e){return {ok:false,message:e instanceof Error?e.message:'Falha ao atualizar usuário.'};}
}

export async function changeMyPassword(_previous:AccessResult,form:FormData):Promise<AccessResult>{
  try{
    await requireViewer();
    const password=required(form,'password',72);
    if(password.length<12)fail('Use uma senha com pelo menos 12 caracteres.');
    if(password!==required(form,'confirmation',72))fail('As senhas não coincidem.');
    await callAccessFunction<{ok:boolean;message:string}>({mode:'self_change',password});
    revalidatePath('/');
    return {ok:true,message:'Senha atualizada. Você já pode acessar o portal.'};
  }catch(e){return {ok:false,message:e instanceof Error?e.message:'Falha ao alterar senha.'};}
}

export async function resetPortalPassword(_previous:AccessResult,form:FormData):Promise<AccessResult>{
  try{
    await requireRole(['prescon']);
    const id=required(form,'id',50);
    const result=await callAccessFunction<{ok:boolean;message:string;password:string}>({mode:'reset',id});
    revalidatePath('/acessos');
    return {ok:true,message:result.message,password:result.password};
  }catch(e){return {ok:false,message:e instanceof Error?e.message:'Falha ao redefinir senha.'};}
}

/** Publica uma versão imutável. Apenas totais agregados: sem EJ, resposta, comentário ou identificador de votante. */
export async function publishDeliberationReport(form:FormData) {
 const viewer=await requireRole(['prescon']);
 const id=required(form,'deliberation_id',50);
 if(!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id))fail('Identificador inválido.');
 const db=await createClient();
 const {data:d,error:de}=await db.from('deliberations').select('id,title,description,scenarios,status,is_demo,is_historical,due_at').eq('id',id).maybeSingle();
 checkError(de);
 if(!d||d.is_demo||d.is_historical)fail('Publicação disponível apenas para deliberações atuais não demonstrativas.');
 if(d.status!=='closed')fail('O relatório só pode ser publicado depois que o formulário da deliberação estiver encerrado.');
 const {data:rows,error:re}=await db.from('responses').select('id,position,scenario_answers').eq('deliberation_id',id);
 checkError(re);
 const {data:ejs,error:ee}=await db.from('ejs').select('id');
 checkError(ee);
 const scenarios=Array.isArray(d.scenarios)?d.scenarios:[];
 const positions=['favorable','suggestions','qualified','against','abstention'];
 const results=scenarios.map((sc:unknown,index:number)=>{
  const scenario=sc&&typeof sc==='object'?sc as Record<string,unknown>:{};
  const votes=(rows||[]).map((r:Record<string,unknown>)=>{
   const answers=Array.isArray(r.scenario_answers)?r.scenario_answers:[];
   const answer=answers.find((a:unknown)=>a&&typeof a==='object'&&(a as Record<string,unknown>).scenario_key===scenario.key) as Record<string,unknown>|undefined;
   return String(answer?.position||r.position||'');
  });
  return {title:String(scenario.title||'Cenário '+(index+1)),votes:votes.length,counts:Object.fromEntries(positions.map(p=>[p,votes.filter(v=>v===p).length]))};
 });
 const content={description:d.description||'',status:d.status,due_at:d.due_at,total_ejs:(ejs||[]).length,voters:(rows||[]).length,scenarios:results,
  privacy:'Relatório agregado. Comentários individuais e identidades das EJs não são publicados.'};
 const {data:existing,error:ex}=await db.from('published_deliberation_reports').select('version').eq('deliberation_id',id).order('version',{ascending:false}).limit(1);
 checkError(ex);
 const version=(existing?.[0]?.version||0)+1;
 const {data:created,error:ce}=await db.from('published_deliberation_reports').insert({deliberation_id:id,version,title:d.title,content,published_by:viewer.id}).select('id').single();
 checkError(ce);
 revalidatePath('/relatorios');revalidatePath('/deliberacoes');
 redirect('/relatorios/publicado/'+created!.id);
}

/** Upload privado do PF original pela PRESCON, vinculado à deliberação. */
export async function uploadDeliberationPf(form:FormData){
 const viewer=await requireRole(['prescon']);
 const id=required(form,'deliberation_id',50);
 if(!/^[0-9a-f-]{36}$/i.test(id))fail('Deliberação inválida.');
 const file=form.get('pf_file');
 if(!(file instanceof File)||file.size<1||file.size>15*1024*1024||!(/\.(xlsx|xls|csv)$/i.test(file.name)))fail('Envie uma planilha XLSX, XLS ou CSV de até 15 MB.');
 const db=await createClient();
 const {data:d,error:de}=await db.from('deliberations').select('id,is_demo,is_historical').eq('id',id).maybeSingle();
 checkError(de);
 if(!d||d.is_demo||d.is_historical)fail('Selecione uma deliberação oficial válida.');
 const ext=file.name.split('.').pop()?.toLowerCase();
 const path=id+'/'+crypto.randomUUID()+'.'+ext;
 const contentType=ext==='xlsx'?'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':ext==='xls'?'application/vnd.ms-excel':'text/csv';
 const {error:up}=await db.storage.from('deliberation-pf').upload(path,file,{contentType,upsert:false});
 checkError(up);
 const {error:save}=await db.from('deliberation_pf_files').upsert({deliberation_id:id,storage_path:path,file_name:file.name.slice(0,180),file_size:file.size,uploaded_by:viewer.id},{onConflict:'deliberation_id'});
 if(save){await db.storage.from('deliberation-pf').remove([path]);checkError(save)}
 revalidatePath('/deliberacoes/'+id);revalidatePath('/deliberacoes/'+id+'/planejamento-financeiro');
 redirect('/deliberacoes/'+id);
}
