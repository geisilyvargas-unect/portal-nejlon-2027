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
let loginExpanded=false;
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
 if(!session?.access_token)throw Error('Você está no modo de exploração. Para consultar ou alterar dados reais, clique em “Entrar para salvar alterações”.');
 const fetchData=()=>fetch(API+endpoint,{method,headers:{'Content-Type':'application/json',apikey:PUBLIC,Authorization:'Bearer '+session.access_token},...(data===undefined?{}:{body:JSON.stringify(data)})});
 let response;
 try{response=await fetchData()}catch{throw Error('Não foi possível acessar a API no Supabase. Verifique sua conexão ou a função publicada.')}
 if(response.status===401&&retry){await refreshSession();return request(endpoint,{method,data,retry:false})}
 return jsonResponse(response);
}
function authVisible(logged){
 const guest=!logged;
 $('auto-app').hidden=false;
 $('auto-login').hidden=logged||!loginExpanded;
 $('auto-open-login').hidden=logged;
 $('auto-logout').hidden=guest;
 $('auto-access-label').textContent=logged?'ACESSO INSTITUCIONAL AUTORIZADO':'MODO DE EXPLORAÇÃO · SEM SENHA';
 $('auto-user').textContent=logged?(session?.user?.email||'PRESCON'):'Prévia da Central · Sem dados reais';
 document.body.classList.toggle('automation-preview-mode',guest);
}
async function login(ev){
 ev.preventDefault();
 const b=$('auto-login-form').querySelector('button');b.disabled=true;
 $('auto-login-message').textContent='Validando acesso…';
 try{
  const res=await fetch(SB+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:PUBLIC,'Content-Type':'application/json'},body:JSON.stringify({email:$('auto-email').value.trim(),password:$('auto-password').value})});
  session=await jsonResponse(res);sessionStorage.setItem(STORE,JSON.stringify(session));$('auto-password').value='';
  await load();loginExpanded=false;authVisible(true);
 }catch(e){$('auto-login-message').textContent=e.message||'Não foi possível entrar.';session=null;sessionStorage.removeItem(STORE);showPreview();loginExpanded=true;authVisible(false)}
 finally{b.disabled=false}
}
function logout(){session=null;sessionStorage.removeItem(STORE);loginExpanded=false;showPreview();toast('Sessão encerrada. Você pode continuar explorando a Central sem senha.')}
function showPreview(){
 session=null;
 formRows=[];currentFiles=[];ejs=[];reportRows=[];
 weeklyData=null;demandSummary=null;
 authVisible(false);
 $('auto-google-state').textContent='Prévia';
 $('auto-form-total').textContent='—';
 $('auto-file-total').textContent='—';
 $('auto-drive-result').textContent='Integração com Google Drive: conecte uma conta autorizada para salvar arquivos de verdade.';
 $('auto-files').innerHTML='<p class="automation-muted">Nenhum arquivo real é exibido sem autenticação.</p>';
 $('auto-weekly-status').textContent='Exibição demonstrativa. Faça login apenas quando precisar consultar os dados reais da Rede.';
 $('auto-weekly-stats').innerHTML=[
  ['Deliberações abertas','—'],
  ['Prazos próximos','—'],
  ['Justificativas a analisar','—'],
  ['Demandas vencidas','—']
 ].map(([title,value])=>'<article><span>'+title+'</span><strong>'+value+'</strong><small>Disponível ao entrar na gestão</small></article>').join('');
 $('auto-weekly-items').innerHTML='<article class="automation-week-item"><div class="automation-week-top"><div><strong>Exemplo de acompanhamento de deliberação</strong><span>Rateios · Cenário 1 · Cenário 2</span></div><span class="tag">PRÉVIA</span></div><p class="automation-muted">Com login institucional, esta área identifica automaticamente EJs pendentes, respostas aguardando análise e prazos.</p><a class="btn" href="./whatsapp.html#biblioteca">Explorar biblioteca de mensagens →</a></article>';
 $('auto-weekly-demand').innerHTML='<strong>Demandas da Rede:</strong> a PRESCON poderá analisar justificativas, aceitar ou recusar com comentário e acompanhar o histórico. <a href="./demandas.html">Conhecer as demandas →</a>';
 $('auto-forms').innerHTML='<article class="automation-form-card"><div class="automation-form-card-head"><div><strong>Modelo demonstrativo · Planejamento Financeiro</strong><small>Rateios, C1 e C2 · exemplo visual, sem registro</small></div><span class="tag">PRÉVIA</span></div><p class="automation-muted">Use a aba “Criar em minutos” para montar um rascunho de exemplo, ou entre para criar e publicar formulários reais.</p><div class="automation-actions"><button type="button" class="btn red" id="auto-preview-create">Explorar criador →</button></div></article>';
 $('auto-report-form').innerHTML='<option value="">Entre para consultar relatórios reais</option>';
 $('auto-report-overview').innerHTML=[['Votos aceitos','—'],['Aguardando análise','—'],['Canais de resposta','2']].map(([name,v])=>'<article><span>'+name+'</span><strong>'+v+'</strong><small>Prévia ilustrativa</small></article>').join('');
 $('auto-report-list').innerHTML='<p class="automation-muted">Os relatórios verdadeiros e dados das EJs só aparecem após login autorizado. As respostas do Portal e do Google Forms serão consolidadas nesta área quando a integração Google estiver habilitada.</p>';
 $('auto-vote-changes').innerHTML='<p class="automation-muted">A autorização de alterações de voto é exclusiva da PRESCON e exige uma conta autenticada.</p>';
 $('auto-demands-root').innerHTML='<div class="demands-root"><header class="demands-head"><div><span class="eyebrow">PRÉVIA · SEM DADOS REAIS</span><h2>Sistema de Demandas</h2><p>Veja como a PRESCON administra justificativas de cada EJ, com classificação amarela, laranja e vermelha.</p></div></header><div class="demands-list"><article class="demands-card" data-severity="amarela"><div class="demands-card-head"><h4>Exemplo · Ausência em imersão</h4><span class="demands-chip">AMARELA</span></div><p>A EJ pode enviar o motivo e um comprovante. A PRESCON avalia e registra a decisão.</p><details><summary>Como a PRESCON decide?</summary><p class="demands-review-note"><strong>Aceitar ou recusar justificativa</strong> O sistema solicita uma explicação obrigatória, oferece textos-base editáveis e registra a decisão no histórico.</p></details></article><article class="demands-card" data-severity="laranja"><div class="demands-card-head"><h4>Exemplo · Atualização no Monday</h4><span class="demands-chip">LARANJA</span></div><p>O painel acompanha prazo, situação e justificativas. A EJ vê apenas suas demandas reais quando está autenticada.</p><details><summary>Como acompanhar?</summary><p>Um histórico registra quem criou, justificou ou decidiu cada demanda, com data e comentário.</p></details></article></div><p class="automation-muted">Para criar uma demanda, justificar ou decidir de verdade, é necessário entrar como usuário autorizado.</p></div>';
 $('auto-preview-create')?.addEventListener('click',()=>tab('criacao'));
}

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
 if(!session){showPreview();return}
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
 if(!session){showPreview();return}
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
 await loadVoteChangeRequests();
}
async function loadVoteChangeRequests(){
 if(!session?.access_token)return;
 try{
  const data=await request('/forms?action=vote_change_queue');
  const requests=(data.requests||[]).filter(r=>r.source==='form'&&r.status==='requested');
  const root=$('auto-vote-changes');
  root.innerHTML=requests.length?requests.map(r=>{
   const form=formRows.find(f=>f.id===r.form_id);
   const ej=ejs.find(e=>e.id===r.ej_id);
   return '<article class="automation-form-card" data-vote-change-id="'+esc(r.id)+'">'+
    '<strong>'+esc(form?.title||'Formulário')+' · '+esc(ej?.name||'EJ')+'</strong>'+
    '<small>Solicitado em '+new Date(r.created_at).toLocaleString('pt-BR')+'</small>'+
    '<p>'+esc(r.reason)+'</p>'+
    '<label class="automation-form">Motivo da decisão da PRESCON<textarea class="auto-vote-change-note" rows="3" minlength="8" maxlength="2500" placeholder="Explique por que a alteração será autorizada ou recusada."></textarea></label>'+
    '<div class="automation-actions"><button type="button" class="btn red" data-vote-decision="approved">Autorizar uma alteração</button><button type="button" class="btn" data-vote-decision="denied">Recusar</button></div></article>';
  }).join(''):'<p class="automation-muted">Nenhuma solicitação de alteração de voto aguardando decisão.</p>';
 }catch(err){$('auto-vote-changes').textContent='Não foi possível consultar solicitações: '+err.message}
}
async function mutateForm(id,action){
 const result=await request('/forms?action='+action,{method:'POST',data:{id}});
 toast(action==='publish'?'Formulário publicado no Portal. Confirme a publicação no Google Forms separadamente, se necessário.':'Formulário encerrado no Portal.');
 await load();return result;
}
async function createForm(ev){
 ev.preventDefault();
 if(!session?.access_token){
  const data=new FormData(ev.target);
  const name=String(data.get('title')||'').trim();
  const kind=String(data.get('kind')||'pf');
  $('auto-create-result').innerHTML='<b>Prévia gerada (não salva)</b><p>'+esc(name||'Sem título')+'</p><p>Tipo: '+esc(kind==='pf'?'Planejamento Financeiro — Rateios, C1 e C2':kind==='survey'?'Pesquisa':kind==='event'?'Evento':'Formulário geral')+'</p><p>Para criar, publicar e receber respostas reais, use “Entrar para salvar alterações”. Nenhum documento foi enviado ao Google ou ao Supabase.</p>';
  toast('Prévia criada localmente. Nenhum dado foi gravado.');
  return;
 }
 const form=$('auto-create-form'),btn=form.querySelector('button[type=submit]'),x=new FormData(form);
 const title=String(x.get('title')||'').trim(),kind=String(x.get('kind')||'pf'),createGoogle=x.has('google'),createFolder=x.has('folder');
 if(!title){toast('Informe o título do formulário.');return}
 btn.disabled=true;
 const result=$('auto-create-result');result.textContent='Criando o rascunho…';
 try{
  const scenarioCount=Math.max(1,Math.min(5,Number(x.get('scenarios')||1)));
  const pfPositions=['Aprovo','Aprovo com sugestões','Aprovo com ressalvas','Reprovo','Abstenho'];
  const pfQuestions=[{id:'rateio',label:'Sistema de rateios',type:'vote',required:true,options:pfPositions},...Array.from({length:scenarioCount},(_,i)=>({id:'c'+(i+1),label:'C'+(i+1)+' — Cenário '+(i+1),type:'vote',required:true,options:pfPositions})),{id:'feedback',label:'Observações finais',type:'text',required:false}];
  const questions=kind==='pf'?pfQuestions:[{id:'pergunta1',label:kind==='event'?'Confirma sua participação?':kind==='survey'?'Como avalia a atividade?':'Sua resposta',type:kind==='event'?'choice':kind==='survey'?'choice':'text',required:true,options:kind==='event'?['Sim','Não','Talvez']:kind==='survey'?['Ótima','Boa','Regular','Ruim']:[]}];
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
$('auto-login-form').addEventListener('submit',login);
$('auto-open-login').addEventListener('click',()=>{
 loginExpanded=true;authVisible(false);
 $('auto-login').scrollIntoView({behavior:'smooth',block:'center'});
 $('auto-email').focus();
});
$('auto-close-login').addEventListener('click',()=>{
 loginExpanded=false;authVisible(!!session);
});
$('auto-logout').addEventListener('click',logout);
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
$('auto-vote-changes').addEventListener('click',async event=>{
 const button=event.target.closest('[data-vote-decision]');if(!button)return;
 const card=button.closest('[data-vote-change-id]');if(!card)return;
 const note=String(card.querySelector('.auto-vote-change-note')?.value||'').trim();
 if(note.length<8){toast('Explique sua decisão com pelo menos 8 caracteres.');return}
 const decision=button.dataset.voteDecision;
 if(!confirm((decision==='approved'?'Autorizar':'Recusar')+' esta alteração de voto? Sua decisão será registrada no histórico.'))return;
 button.disabled=true;
 try{
  const result=await request('/forms?action=review_vote_change',{method:'POST',data:{id:card.dataset.voteChangeId,decision,note}});
  toast(result.message||'Decisão registrada.');
  await loadVoteChangeRequests();
 }catch(error){toast(error.message)}finally{button.disabled=false}
});
fetch(API+'/drive?action=health').then(r=>r.ok?r.json():Promise.reject()).then(x=>{$('auto-setup-status').textContent=x.configured?'Backend Supabase disponível. Faça login para continuar. As integrações Google são independentes.':'O backend do Portal está configurado, mas a integração Google ainda precisa de autorização.'}).catch(()=>{$('auto-setup-status').textContent='Não foi possível confirmar o backend Supabase. Confira sua conexão e as funções do projeto.'});
if(session)load().catch(e=>{
 session=null;sessionStorage.removeItem(STORE);
 showPreview();
 toast('Não foi possível validar sua sessão. O modo de exploração continua disponível.');
});
else showPreview();
})();