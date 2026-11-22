(()=>{
'use strict';
const $=id=>document.getElementById(id);
const API='https://imsisbixzkqphooxyfhr.supabase.co/functions/v1';
const SB='https://imsisbixzkqphooxyfhr.supabase.co';
const PUBLIC='sb_publishable_mS_TDGKZhUuJi-rxc5Nu1w_IXODeo-_';
const STORE='nejlon.prescon.central.session.v1';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validUrl=x=>{try{const u=new URL(x);return u.protocol==='https:'?u.href:null}catch{return null}};
const formURL=id=>new URL('./responder.html?id='+encodeURIComponent(id),location.href).href;
let session=null,formRows=[],currentFiles=[],ejs=[],reportRows=[];
let weeklyData=null,demandSummary=null,demandUI=null;
try{const stored=JSON.parse(sessionStorage.getItem(STORE)||'null');if(stored&&stored.access_token)session=stored}catch{}
function toast(s){$('auto-toast').textContent=s;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('auto-toast').textContent='',6500)}
function tab(which){document.querySelectorAll('.automation-tabs button').forEach(b=>{const yes=b.dataset.tab===which;b.classList.toggle('active',yes);if(yes)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});document.querySelectorAll('.auto-tab').forEach(p=>p.hidden=p.dataset.panel!==which);window.scrollTo({top:0,behavior:'smooth'})}
function link(url,label){const href=validUrl(url);return href?'<a href="'+esc(href)+'" target="_blank" rel="noopener noreferrer">'+esc(label)+'</a>':''}
async function jsonResponse(resp){
 let data;try{data=await resp.json()}catch{data={}}
 if(!resp.ok){const message=data.error_description||data.msg||data.error||data.message||'Ocorreu uma falha na operação.';throw Error(typeof message==='string'?message:'Erro de comunicação.')}
 return data;
}
async function refreshSession(){
 if(!session?.refresh_token)throw Error('Entre novamente no portal.');
 const res=await fetch(SB+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:PUBLIC,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token})});
 const data=await jsonResponse(res);session=data;sessionStorage.setItem(STORE,JSON.stringify(session));
}
async function request(endpoint,{method='GET',data,retry=true}={}){
 const fetchData=()=>fetch(API+endpoint,{method,headers:{'Content-Type':'application/json',apikey:PUBLIC,Authorization:'Bearer '+session.access_token},...(data===undefined?{}:{body:JSON.stringify(data)})});
 let response;
 try{response=await fetchData()}catch{throw Error('Não foi possível acessar a API no Supabase. Verifique sua conexão ou a função publicada.')}
 if(response.status===401&&retry){await refreshSession();return request(endpoint,{method,data,retry:false})}
 return jsonResponse(response);
}
function authVisible(logged){
 $('auto-login').hidden=logged;$('auto-app').hidden=!logged;
}
async function login(ev){
 ev.preventDefault();
 const b=$('auto-login-form').querySelector('button');b.disabled=true;
 $('auto-login-message').textContent='Validando acesso…';
 try{
  const res=await fetch(SB+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:PUBLIC,'Content-Type':'application/json'},body:JSON.stringify({email:$('auto-email').value.trim(),password:$('auto-password').value})});
  session=await jsonResponse(res);sessionStorage.setItem(STORE,JSON.stringify(session));$('auto-password').value='';
  await load();
 }catch(e){$('auto-login-message').textContent=e.message||'Não foi possível entrar.';session=null;sessionStorage.removeItem(STORE);authVisible(false)}
 finally{b.disabled=false}
}
function logout(){session=null;sessionStorage.removeItem(STORE);authVisible(false);$('auto-login-message').textContent='Sessão encerrada.'}
function statusNotice(root){
 if(!root.configured){$('auto-google-state').textContent='Configuração pendente';$('auto-drive-result').textContent='As demandas e os formulários do Portal funcionam pelo Supabase. Para usar Google Drive, é preciso ativar a integração Google separadamente.'}
 else{
  $('auto-google-state').textContent=root.googleConnected?'Conectado':'Não conectado';
  $('auto-drive-result').textContent=root.root?.root_folder_url?'Pasta institucional disponível: '+root.root.root_folder_url:'Conecte o Google e crie a pasta institucional.';
 }
 $('auto-form-total').textContent=String(root.forms?.length||0);
 $('auto-file-total').textContent=String(root.files?.length||0);
}
function renderFiles(files){
 currentFiles=files||[];
 $('auto-files').innerHTML=currentFiles.length?currentFiles.map(file=>'<article class="automation-file"><div><strong>'+esc(file.name)+'</strong><small>'+esc(file.kind)+' · '+new Date(file.created_at).toLocaleDateString('pt-BR')+'</small></div>'+link(file.web_view_link,'Abrir no Drive ↗')+'</article>').join(''):'<p class="automation-muted">A Central ainda não registrou arquivos.</p>';
}
function refreshFormsSelector(){
 const options=formRows.map(f=>'<option value="'+esc(f.id)+'">'+esc(f.title)+'</option>').join('');
 const previous=$('auto-report-form').value;
 $('auto-report-form').innerHTML=options||'<option value="">Nenhum formulário</option>';
 if(formRows.some(f=>f.id===previous))$('auto-report-form').value=previous;
}
function messageLink(form,due=''){
 const base=new URL('./whatsapp.html',location.href);
 const args=new URLSearchParams({modelo:form.kind==='pf'?'pf':'deliberacao',formulario:form.title,portal:formURL(form.id)});
 if(due)args.set('prazo',due);
 if(form.google_responder_url)args.set('google',form.google_responder_url);
 base.search=args.toString();return base.href;
}
function renderForms(){
 $('auto-forms').innerHTML=formRows.length?formRows.map(f=>'<article class="automation-form-card" data-form-id="'+esc(f.id)+'"><div class="automation-form-card-head"><div><strong>'+esc(f.title)+'</strong><small>'+esc(f.kind)+' · '+new Date(f.created_at).toLocaleDateString('pt-BR')+'</small></div><span class="tag '+(f.status==='open'?'green':f.status==='closed'?'red':'yellow')+'">'+esc(f.status==='open'?'ABERTO':f.status==='closed'?'ENCERRADO':'RASCUNHO')+'</span></div><div class="automation-actions">'+link(f.status==='open'?formURL(f.id):null,'Responder pelo Portal')+link(f.google_responder_url,'Google Forms ↗')+link(messageLink(f),'Preparar mensagem ↗')+'</div><div class="automation-actions">'+(f.status==='draft'?'<button type="button" data-activity="publish" class="btn red">Publicar</button>':f.status==='open'?'<button type="button" data-activity="close" class="btn">Encerrar</button>':'')+(f.google_form_id?'<button type="button" data-activity="sync" class="btn">Sincronizar Google</button>':'<label class="auto-google-attach">Vincular Forms existente <input type="text" class="auto-google-url" placeholder="URL de edição do Google Forms" aria-label="URL de edição do Google Forms"><button type="button" class="btn" data-activity="attach">Vincular</button></label>')+'<button type="button" data-activity="report" class="btn">Consultar resultados</button></div></article>').join(''):'<p>Nenhum formulário criado ainda. Comece em “Criar em minutos”.</p>';
 refreshFormsSelector();
}
function formatDue(value){
 if(!value)return 'Prazo não cadastrado';
 const d=new Date(value);
 return Number.isNaN(d.getTime())?'Prazo inválido':d.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
}
function weeklyMessage(){
 if(!weeklyData)return 'Panorama semanal indisponível.';
 const forms=weeklyData.open_forms||[];
 const lines=['Falaaaa, Conselho! ❤️🖤','','Passando para compartilhar os prazos das deliberações em aberto:',''];
 for(const f of forms){
  const due=formatDue(f.due_at);
  lines.push('📌 *'+f.title+'*');
  lines.push('⏰ '+due);
  lines.push('📋 '+f.pending_ejs.length+' EJs sem resposta válida registrada');
  lines.push('🔴 Portal NEJLON: '+formURL(f.id));
  if(f.google_responder_url)lines.push('🟢 Google Forms: '+f.google_responder_url);
  lines.push('');
 }
 if(!forms.length)lines.push('Não há deliberações abertas para cobrar nesta semana. ❤️');
 if(demandSummary?.waiting)lines.push('📋 Lembrando também de consultar as demandas pendentes diretamente no Portal NEJLON, onde cada EJ encontra os seus prazos e orientações.','🔗 '+new URL('./demandas.html',location.href).href,'');
 lines.push('Se você já respondeu pelo Google Forms, desconsidere a pendência até a sincronização e conferência da PRESCON.');
 lines.push('Qualquer dúvida, podem me chamar! ❤️');
 return lines.join('\n');
}
function overviewText(){
 if(!weeklyData)return 'Panorama semanal ainda não carregado.';
 const w=weeklyData,forms=w.open_forms||[];
 return ['PRESCON · PANORAMA DA REDE','Atualizado: '+new Date(w.generated_at).toLocaleString('pt-BR'),
  'Deliberações abertas: '+w.active_count,'Respostas externas para validar: '+w.pending_review_total,
  'Prazos nos próximos 7 dias: '+w.due_soon.length,'Prazos ultrapassados: '+w.overdue.length,
  ...(demandSummary?['Demandas em aberto: '+demandSummary.waiting,'Justificativas esperando decisão da PRESCON: '+demandSummary.pendingReview,'Demandas atrasadas: '+demandSummary.overdue]:[]),'',
  ...forms.flatMap(f=>[f.title+' · '+formatDue(f.due_at),
    'EJs sem resposta válida: '+f.pending_ejs.length+' / '+f.total_ejs,
    'Respostas aguardando validação: '+f.pending_review,
    f.pending_ejs.length?'Pendentes: '+f.pending_ejs.map(x=>x.name).join(', '):'Todas as EJs têm resposta validada',''])
 ].join('\n');
}
async function loadWeekly(){
 $('auto-weekly-status').textContent='Consultando dados reais do Portal…';
 try{
  const w=await request('/forms?action=weekly');
  weeklyData=w;
  $('auto-weekly-status').textContent='Atualizado em '+new Date(w.generated_at).toLocaleString('pt-BR')+'. Respostas externas pendentes de validação não contam como voto confirmado.';
  const cards=[
    ['Deliberações abertas',w.active_count],
    ['Prazos nos próximos 7 dias',(w.due_soon||[]).length],
    ['Respostas para conferir',w.pending_review_total],
    ['Prazos ultrapassados',(w.overdue||[]).length]
  ];
  $('auto-weekly-stats').innerHTML=cards.map(([name,n])=>'<article><span>'+esc(name)+'</span><strong>'+esc(n)+'</strong></article>').join('');
  $('auto-weekly-items').innerHTML=w.open_forms.length?w.open_forms.map(f=>{
    const overdue=w.overdue.includes(f.id),soon=w.due_soon.includes(f.id);
    const status=overdue?'PRAZO ULTRAPASSADO':soon?'PRAZO NESTA SEMANA':'EM ABERTO';
    const warning=f.pending_review?'<p class="automation-week-alert">'+f.pending_review+' resposta(s) externa(s) aguardando conferência da EJ.</p>':'';
    return '<article class="automation-week-item"><div class="automation-week-top"><div><strong>'+esc(f.title)+'</strong><span>'+esc(formatDue(f.due_at))+'</span></div><span class="tag '+(overdue?'red':soon?'yellow':'green')+'">'+status+'</span></div><div class="automation-week-count"><strong>'+f.pending_ejs.length+'</strong><span>EJs sem resposta validada, de '+f.total_ejs+'</span></div>'+warning+'<details><summary>Consultar EJs pendentes</summary><p>'+esc(f.pending_ejs.length?f.pending_ejs.map(e=>e.name).join(' · '):'Todas têm resposta validada.')+'</p></details><button type="button" class="btn" data-week-report="'+esc(f.id)+'">Ver respostas e ressalvas →</button></article>';
  }).join(''):'<p class="automation-muted">Nenhuma deliberação aberta. Quando você publicar um formulário, ele aparecerá aqui automaticamente.</p>';
 }catch(e){weeklyData=null;$('auto-weekly-status').textContent='Não foi possível carregar o panorama: '+e.message;$('auto-weekly-stats').innerHTML='';$('auto-weekly-items').innerHTML='';}
}

async function loadDemands(){
 if(!demandUI&&window.NEJLON_DemandUI){
  demandUI=window.NEJLON_DemandUI.mount({containerId:'auto-demands-root',request});
 }
 if(demandUI)await demandUI.refresh();
 try{
  const data=await request('/demands?action=summary');
  demandSummary=data.summary;
  $('auto-weekly-demand').innerHTML='<strong>Demandas da Rede:</strong> '+demandSummary.waiting+' em aberto · '+demandSummary.pendingReview+' justificativa(s) aguardando sua decisão · '+demandSummary.overdue+' com prazo vencido. <button type="button" class="btn" id="auto-open-demandas">Analisar demandas →</button>';
  $('auto-open-demandas').addEventListener('click',()=>tab('demandas'));
 }catch(e){
  demandSummary=null;
  $('auto-weekly-demand').textContent='Demandas ainda indisponíveis nesta publicação: '+e.message;
 }
}
async function load(){
 const response=await request('/drive?action=status');
 authVisible(true);
 $('auto-user').textContent=session.user?.email||'PRESCON';
 statusNotice(response);formRows=response.forms||[];renderFiles(response.files||[]);renderForms();
 await loadWeekly();
 await loadDemands();
 const query=new URLSearchParams(location.search);
 if(query.get('google')==='conectado'){toast('Google autorizado. Verifique o status de conexão.');history.replaceState(null,'',location.pathname)}
 else if(query.get('google')==='cancelado'){toast('Conexão Google cancelada.');history.replaceState(null,'',location.pathname)}
 try{ejs=(await request('/forms?action=ejs')).ejs||[]}catch{}
}
async function mutateForm(id,action){
 const result=await request('/forms?action='+action,{method:'POST',data:{id}});
 toast(action==='publish'?'Formulário publicado no Portal. Confirme a publicação no Google Forms separadamente, se necessário.':'Formulário encerrado no Portal.');
 await load();return result;
}
async function createForm(ev){
 ev.preventDefault();
 const form=$('auto-create-form'),btn=form.querySelector('button[type=submit]'),x=new FormData(form);
 const title=String(x.get('title')||'').trim(),kind=String(x.get('kind')||'pf'),createGoogle=x.has('google'),createFolder=x.has('folder');
 if(!title){toast('Informe o título do formulário.');return}
 btn.disabled=true;
 const result=$('auto-create-result');result.textContent='Criando o rascunho…';
 try{
  const questions=kind==='pf'?[]:[{id:'pergunta1',label:kind==='event'?'Confirma sua participação?':kind==='survey'?'Como avalia a atividade?':'Sua resposta',type:kind==='event'?'choice':kind==='survey'?'choice':'text',required:true,options:kind==='event'?['Sim','Não','Talvez']:kind==='survey'?['Ótima','Boa','Regular','Ruim']:[]}];
  const response=await request('/forms?action=create',{method:'POST',data:{title,kind,description:x.get('description'),questions,createGoogle,dueAt:x.get('due')?new Date(String(x.get('due'))).toISOString():null}});
  const created=response.form;if(!created?.id)throw Error('O servidor não devolveu o formulário criado.');
  let folderStatus='Pasta não solicitada.';
  if(createFolder){
   try{const folder=await request('/drive?action=folder',{method:'POST',data:{name:title}});folderStatus='Pasta criada/localizada: '+(folder.folder?.url||'Drive conectado');}
   catch(e){folderStatus='A pasta não foi criada: '+e.message}
  }
  const due=x.get('due')?new Date(String(x.get('due'))).toLocaleString('pt-BR'):'';
  const linkToMessage=messageLink(created,due);
  result.innerHTML='<b>Rascunho criado com sucesso!</b><p>'+esc(title)+'</p><p>'+esc(folderStatus)+'</p>'+link(linkToMessage,'Preparar comunicado para o Conselho ↗')+'<p>Agora confira o formulário na aba “Formulários” e publique quando estiver pronto.</p>';
  await load();tab('formularios');
 }catch(e){result.textContent='Não foi possível concluir: '+e.message}
 finally{btn.disabled=false}
}
function fileBase64(file){
 return new Promise((resolve,reject)=>{
  const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]||'');reader.onerror=()=>reject(Error('Não foi possível ler o arquivo.'));reader.readAsDataURL(file);
 });
}
async function submitUpload(ev){
 ev.preventDefault();const data=new FormData(ev.target),file=data.get('file');
 if(!file||!file.size){toast('Selecione um arquivo.');return}
 if(file.size>4*1024*1024){toast('O limite nesta integração é de 4 MB por arquivo.');return}
 const btn=ev.target.querySelector('button[type=submit]');btn.disabled=true;
 try{
  const saved=await request('/drive?action=upload',{method:'POST',data:{name:file.name,mime:file.type||'application/octet-stream',base64:await fileBase64(file),folderName:data.get('folderName')}});
  $('auto-drive-result').innerHTML='Documento guardado: '+link(saved.file?.url,saved.file?.name||'Abrir no Drive');
  toast('Arquivo salvo no Drive.');ev.target.reset();await load();
 }catch(e){toast(e.message)}finally{btn.disabled=false}
}
async function submitFolder(ev){
 ev.preventDefault();const name=new FormData(ev.target).get('name');
 try{const d=await request('/drive?action=folder',{method:'POST',data:{name}});$('auto-drive-result').innerHTML='Pasta pronta: '+link(d.folder?.url,String(name));toast('Pasta disponível no Drive.');await load()}
 catch(e){toast(e.message)}
}
async function getReport(formId){
 if(!formId)return;
 try{
  const [report,ejResult]=await Promise.all([request('/forms?action=report&id='+encodeURIComponent(formId)),ejs.length?Promise.resolve({ejs}):request('/forms?action=ejs')]);
  reportRows=report.rows||[];ejs=ejResult.ejs||[];
  const stats=report.summaries||{};
  $('auto-report-overview').innerHTML=[['Votos aceitos',stats.accepted||0],['Aguardando análise',stats.pending||0],['Vindos do Google',stats.google||0],['Vindos do Portal',stats.portal||0]].map(([label,count])=>'<article><span>'+esc(label)+'</span><strong>'+count+'</strong></article>').join('');
  $('auto-report-list').innerHTML=reportRows.map(r=>'<article class="automation-response" data-response-id="'+esc(r.id)+'"><div class="automation-response-top"><div><strong>'+esc(r.respondent_name||'Identificação pendente')+'</strong><small>'+esc(r.channel)+' · '+new Date(r.submitted_at).toLocaleString('pt-BR')+'</small></div><span class="tag '+(r.state==='accepted'?'green':'yellow')+'">'+esc(r.state)+'</span></div><details><summary>Ver respostas enviadas</summary><pre>'+esc(JSON.stringify(r.answers,null,2))+'</pre></details>'+(r.state==='pending_review'?'<div class="automation-actions"><label><small>EJ correspondente</small><select class="auto-ej"><option value="">Selecionar EJ</option>'+ejs.map(e=>'<option value="'+esc(e.id)+'" '+(e.id===r.ej_id?'selected':'')+'>'+esc(e.name)+'</option>').join('')+'</select></label><button class="btn red" type="button" data-review="accepted">Validar voto</button><button class="btn" type="button" data-review="duplicate">Duplicada</button><button class="btn" type="button" data-review="rejected">Rejeitar</button></div>':'')+'</article>').join('')||'<p class="automation-muted">Nenhuma resposta encontrada neste formulário.</p>';
 }catch(e){$('auto-report-list').textContent='Falha ao carregar resultados: '+e.message}
}
async function review(id,state,ejId){
 if(state==='accepted'&&!ejId)throw Error('Selecione primeiro a EJ da resposta.');
 await request('/forms?action=review',{method:'POST',data:{id,state,ejId}});
 toast('Situação da resposta atualizada.');
 await getReport($('auto-report-form').value);
}
$('auto-weekly-refresh').addEventListener('click',loadWeekly);
$('auto-weekly-copy').addEventListener('click',async()=>{
 try{await navigator.clipboard.writeText(overviewText());toast('Panorama semanal copiado.');}
 catch{toast('Não foi possível copiar. Use o menu do navegador para copiar as informações.')}
});
$('auto-weekly-whatsapp').addEventListener('click',()=>{
 if(!weeklyData){toast('Carregue primeiro o panorama semanal.');return}
 const message=weeklyMessage();
 // A pessoa escolhe o grupo e confirma o envio; não dispara automaticamente.
 window.open('https://api.whatsapp.com/send?text='+encodeURIComponent(message),'_blank','noopener,noreferrer');
 toast('Selecione o grupo do Conselho e confirme o envio pelo WhatsApp.');
});
$('auto-weekly-items').addEventListener('click',async e=>{
 const b=e.target.closest('[data-week-report]');if(!b)return;
 tab('relatorios');$('auto-report-form').value=b.dataset.weekReport;await getReport(b.dataset.weekReport);
});
document.querySelector('.automation-tabs').addEventListener('click',e=>{const button=e.target.closest('[data-tab]');if(button)tab(button.dataset.tab)});
document.querySelectorAll('[data-go]').forEach(button=>button.addEventListener('click',()=>tab(button.dataset.go)));
$('auto-login-form').addEventListener('submit',login);$('auto-logout').addEventListener('click',logout);
$('auto-create-form').addEventListener('submit',createForm);
$('auto-upload-form').addEventListener('submit',submitUpload);
$('auto-folder-form').addEventListener('submit',submitFolder);
$('auto-connect-google').addEventListener('click',async()=>{
 try{const r=await request('/drive?action=connect');const url=validUrl(r.url);if(!url)throw Error('Endereço Google inválido.');location.href=url}
 catch(e){toast(e.message)}
});
$('auto-create-root').addEventListener('click',async()=>{
 try{const r=await request('/drive?action=root',{method:'POST',data:{}});$('auto-drive-result').innerHTML='Pasta principal: '+link(r.folder?.url,'Abrir no Drive ↗');toast('Pasta institucional pronta.');await load()}
 catch(e){toast(e.message)}
});
$('auto-forms').addEventListener('click',async e=>{
 const button=e.target.closest('[data-activity]');if(!button)return;
 const article=button.closest('[data-form-id]');const id=article?.dataset.formId,action=button.dataset.activity;
 if(!id)return;button.disabled=true;
 try{
  if(action==='publish'||action==='close'){
   if(action==='close'&&!confirm('Encerrar este formulário no Portal NEJLON?'))return;
   await mutateForm(id,action);
  }else if(action==='sync'){
   const result=await request('/forms?action=sync',{method:'POST',data:{id}});
   toast('Google sincronizado: '+result.sync.created+' novas respostas; '+result.sync.skipped+' já existentes.');
  }else if(action==='attach'){
   const input=article.querySelector('.auto-google-url');const raw=String(input?.value||'').trim();
   const match=raw.match(/\/forms\/d\/([A-Za-z0-9_-]{12,})(?:\/edit)?/)||raw.match(/^([A-Za-z0-9_-]{12,150})$/);
   if(!match)throw Error('Cole o link de edição do Google Forms, disponível na barra do navegador quando você edita o formulário.');
   const result=await request('/forms?action=attach',{method:'POST',data:{id,googleFormId:match[1]}});
   toast('Google Forms vinculado. '+result.mapped+' perguntas reconhecidas. Confira antes de sincronizar.');await load();
  }else if(action==='report'){tab('relatorios');$('auto-report-form').value=id;await getReport(id)}
 }catch(error){toast(error.message)}
 finally{button.disabled=false}
});
$('auto-report-form').addEventListener('change',e=>getReport(e.target.value));
$('auto-report-refresh').addEventListener('click',()=>getReport($('auto-report-form').value));
$('auto-report-export').addEventListener('click',async()=>{
 const id=$('auto-report-form').value;if(!id){toast('Selecione primeiro um formulário.');return}
 const btn=$('auto-report-export');btn.disabled=true;
 try{const res=await request('/drive?action=report',{method:'POST',data:{formId:id,format:$('auto-report-format').value}});toast('Relatório salvo no Google Drive.');$('auto-report-list').insertAdjacentHTML('afterbegin','<div class="automation-result">Relatório criado: '+link(res.report.url,res.report.name)+'</div>');await load()}
 catch(e){toast(e.message)}finally{btn.disabled=false}
});
$('auto-report-list').addEventListener('click',async e=>{
 const b=e.target.closest('[data-review]');if(!b)return;
 const article=b.closest('[data-response-id]');if(!article)return;b.disabled=true;
 try{await review(article.dataset.responseId,b.dataset.review,article.querySelector('.auto-ej')?.value||'')}
 catch(err){toast(err.message)}finally{b.disabled=false}
});
fetch(API+'/drive?action=health').then(r=>r.ok?r.json():Promise.reject()).then(x=>{$('auto-setup-status').textContent=x.configured?'Backend Supabase disponível. Faça login para continuar. As integrações Google são independentes.':'O backend do Portal está configurado, mas a integração Google ainda precisa de autorização.'}).catch(()=>{$('auto-setup-status').textContent='Não foi possível confirmar o backend Supabase. Confira sua conexão e as funções do projeto.'});
if(session)load().catch(e=>{authVisible(false);$('auto-login-message').textContent=e.message||'Não foi possível validar a sessão. Verifique o servidor.'});
else authVisible(false);
})();