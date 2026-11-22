(()=>{
'use strict';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const templates=[
 {key:'reuniao',name:'Falta em reunião',title:'Ausência em reunião',description:'Registrar e justificar a ausência na reunião do Conselho.'},
 {key:'imersao',name:'Falta em imersão',title:'Ausência em imersão',description:'Justificar a ausência na imersão institucional.'},
 {key:'monday',name:'Atualização no Monday',title:'Pendência de atualização no Monday',description:'Regularizar a atualização das atividades e prazos no Monday.'},
 {key:'horas',name:'Horas semanais',title:'Pendência de horas semanais',description:'Regularizar o registro das horas de dedicação semanal.'},
 {key:'documento',name:'Entrega de documento',title:'Documento pendente',description:'Enviar o documento solicitado pela gestão dentro do prazo.'}
];
const reasonNames={ausencia:'Ausência / impossibilidade de comparecer',prazo:'Solicitação de prazo adicional',dificuldade:'Dificuldade operacional',impedimento:'Impedimento externo',outro:'Outro motivo'};
const statusNames={pendente:'Pendente',em_andamento:'Em andamento',concluida:'Concluída',justificada:'Justificativa aceita'};
const actions={created:'Demanda criada',status_updated:'Situação atualizada',justification_submitted:'Justificativa enviada',justification_accepted:'Justificativa aceita',justification_rejected:'Justificativa recusada'};
const date=x=>x?new Date(String(x).slice(0,10)+'T12:00:00').toLocaleDateString('pt-BR'):'Sem prazo';
const fullDate=x=>x?new Date(x).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):'';
const validHref=value=>{try{const url=new URL(value);return url.protocol==='https:'?url.href:null}catch{return null}};
function mount({containerId,request}){
 const root=document.getElementById(containerId);
 if(!root)throw Error('Container de demandas não encontrado');
 let info=null,query='',filter='all',ejFilter='all',template='custom',creating=false,notice='';
 const isPrescon=()=>info?.role==='prescon';
 const isGlobalReader=()=>['prescon','nucleus_direx'].includes(info?.role);
 const canJustify=()=>info?.role==='counselor';
 const isEjDirex=()=>info?.role==='ej_direx';
 const ejs=()=>info?.ejs||[];
 const list=()=>info?.demands||[];
 const justs=()=>info?.justifications||[];
 const events=()=>info?.events||[];
 const latest=d=>justs().filter(j=>j.demand_id===d.id).sort((a,b)=>b.created_at.localeCompare(a.created_at))[0];
 const jsFor=d=>justs().filter(j=>j.demand_id===d.id);
 const histories=d=>events().filter(e=>e.demand_id===d.id);
 const ejName=id=>ejs().find(e=>e.id===id)?.name||'Sua EJ';
 const isOverdue=d=>['pendente','em_andamento'].includes(d.status)&&d.due_at&&d.due_at<new Date().toISOString().slice(0,10);
 const roleNice=role=>({prescon:'PRESCON',counselor:'Conselho',ej_direx:'DIREX da EJ'})[role]||role;
 function header(){
  const s=info.summary||{};
  return '<header class="demands-head"><div><span class="eyebrow">GESTÃO DA REDE · REGISTROS REAIS</span><h2>'+(isPrescon()?'Demandas da Rede':isGlobalReader()?'Demandas da Rede (consulta)':'Demandas da minha EJ')+'</h2><p>'+(isPrescon()?'Crie demandas para uma ou várias EJs, analise justificativas e registre suas decisões em poucos cliques.':isGlobalReader()?'Consulte as demandas institucionais. A análise de justificativas é exclusiva da PRESCON.':isEjDirex()?'Consulte apenas as demandas e os prazos da sua EJ. Documentos, formulários e justificativas são exclusivos do Conselho.':'Acompanhe os prazos, explique impedimentos e consulte as decisões registradas pela PRESCON.')+'</p></div><button type="button" class="btn" data-act="refresh">Atualizar demandas</button></header>'+
  '<div class="demands-metrics">'+[['Demandas',s.total||0],['Em aberto',s.waiting||0],['Justificativas para análise',s.pendingReview||0],['Justificadas',s.justified||0]].map(([name,n])=>'<div class="demands-metric"><span>'+esc(name)+'</span><strong>'+n+'</strong></div>').join('')+'</div>';
 }
 function createForm(){
  if(!isPrescon())return '';
  return '<section class="demands-builder"><div class="demands-head"><div><h3>Criar demanda em minutos</h3><p>Escolha um modelo, defina prazo e destinatários. É possível gerar a mesma demanda para várias EJs de uma vez.</p></div><button class="btn red" type="button" data-act="toggle-create">'+(creating?'Fechar cadastro':'Nova demanda')+'</button></div>'+
  (creating?'<form class="demands-form" data-form="create">'+
  '<div class="demands-template-row">'+templates.map(t=>'<button type="button" data-template="'+t.key+'" class="'+(template===t.key?'active':'')+'">'+esc(t.name)+'</button>').join('')+'<button type="button" data-template="custom" class="'+(template==='custom'?'active':'')+'">Personalizada</button></div>'+
  '<label>Nome da demanda<input required minlength="4" maxlength="180" name="title" placeholder="Ex.: Ausência na RG de março"></label>'+
  '<label>O que a EJ precisa fazer?<textarea name="description" rows="3" minlength="8" required placeholder="Explique a demanda com clareza"></textarea></label>'+
  '<div class="demands-form-grid"><label>Prazo<input type="date" name="dueAt" required></label><label>Classificação<select name="severity"><option value="amarela">Amarela</option><option value="laranja">Laranja</option><option value="vermelha">Vermelha</option></select></label></div>'+
  '<label>Responsável pelo encaminhamento<input name="responsible" value="DIREX da EJ" required maxlength="160"></label>'+
  '<fieldset class="demands-ej-picker"><legend>Para quais EJs?</legend><div class="demands-actions"><button type="button" class="demands-select-all" data-act="select-all">Selecionar todas</button><button type="button" class="demands-select-all" data-act="select-none">Limpar seleção</button><small id="demand-ej-count">0 EJs selecionadas</small></div><div class="demands-ej-choices">'+ejs().map(e=>'<label><input type="checkbox" name="ejIds" value="'+esc(e.id)+'"><span>'+esc(e.name)+'</span></label>').join('')+'</div></fieldset>'+
  '<div class="demands-actions"><button type="submit" class="btn red">Criar demanda(s)</button></div></form>':'')+'</section>';
 }
 function history(d){
  const h=histories(d);
  if(!h.length)return '<p class="demands-help">Sem movimentações anteriores.</p>';
  return '<div class="demands-history">'+h.map(e=>'<div class="demands-history-item"><strong>'+esc(actions[e.action]||e.action)+' · '+esc(roleNice(e.actor_role))+'</strong><small>'+esc(fullDate(e.created_at))+'</small><p>'+esc(e.note||'')+'</p></div>').join('')+'</div>';
 }
 function justificationHistory(d){
  const matches=jsFor(d);
  if(!matches.length)return '<p class="demands-help">Nenhuma justificativa enviada.</p>';
  return matches.map(j=>'<div class="demands-review-note"><strong>'+esc(reasonNames[j.reason_type]||j.reason_type)+' · '+(j.state==='pending_review'?'Aguardando PRESCON':j.state==='accepted'?'Aceita':'Recusada')+'</strong>'+
    '<span>'+esc(j.explanation)+'</span>'+(validHref(j.evidence_url)?'<p><a href="'+esc(validHref(j.evidence_url))+'" target="_blank" rel="noopener noreferrer">Ver comprovante / documento ↗</a></p>':'')+
    '<small>'+esc(fullDate(j.created_at))+'</small>'+(j.decision_note?'<p><b>Decisão da PRESCON:</b> '+esc(j.decision_note)+'</p>':'')+'</div>').join('');
 }
 function justificationForm(d){
  const j=latest(d);
  if(!['pendente','em_andamento'].includes(d.status))return '<p class="demands-help">Esta demanda já está encerrada ou justificada.</p>';
  if(j?.state==='pending_review')return '<div class="demands-review-note"><strong>Justificativa enviada</strong>A PRESCON irá avaliar sua explicação. Você pode acompanhar o resultado por aqui.</div>';
  return '<details><summary>'+(j?.state==='rejected'?'Enviar nova justificativa':'Justificar esta demanda')+'</summary><form class="demands-justify" data-form="justify" data-id="'+d.id+'">'+
    '<label>Motivo<select required name="reason"><option value="">Selecione o motivo</option>'+Object.entries(reasonNames).map(([k,v])=>'<option value="'+k+'">'+esc(v)+'</option>').join('')+'</select></label>'+
    '<label>O que aconteceu?<textarea required minlength="10" maxlength="5000" rows="4" name="explanation" placeholder="Explique a situação de forma objetiva. A PRESCON avaliará a justificativa."></textarea></label>'+
    '<label>Link de comprovante (opcional)<input name="evidenceUrl" type="url" placeholder="https://drive.google.com/..."></label>'+
    '<button type="submit" class="btn red">Enviar justificativa à PRESCON</button></form></details>';
 }
 function decisionForm(d){
  const j=latest(d);
  if(j?.state!=='pending_review')return '';
  return '<details open><summary>Justificativa aguardando sua decisão</summary><div class="demands-review-note"><strong>'+esc(reasonNames[j.reason_type]||j.reason_type)+'</strong>'+esc(j.explanation)+(validHref(j.evidence_url)?'<p><a href="'+esc(validHref(j.evidence_url))+'" target="_blank" rel="noopener noreferrer">Ver comprovante ↗</a></p>':'')+'</div>'+
   '<form class="demands-decision" data-form="decide" data-id="'+esc(j.id)+'">'+
   '<label>Justificativa da decisão da PRESCON<textarea required minlength="8" maxlength="3000" name="note" rows="3" placeholder="Explique por que a justificativa foi aceita ou recusada. Esse registro será mostrado à EJ."></textarea></label>'+
   '<div class="demands-quick-notes"><button type="button" data-note="accepted">Usar texto-base de aceitação</button><button type="button" data-note="rejected">Usar texto-base de recusa</button></div>'+
   '<div class="demands-actions"><button class="btn red" type="submit" name="decision" value="accepted">Aceitar justificativa</button><button class="btn" type="submit" name="decision" value="rejected">Recusar justificativa</button></div></form></details>';
 }
 function updateForm(d){
  return '<details><summary>Alterar andamento da demanda</summary><form class="demands-status-form" data-form="status" data-id="'+d.id+'"><div><select name="status" aria-label="Situação da demanda"><option value="pendente" '+(d.status==='pendente'?'selected':'')+'>Pendente</option><option value="em_andamento" '+(d.status==='em_andamento'?'selected':'')+'>Em andamento</option><option value="concluida" '+(d.status==='concluida'?'selected':'')+'>Concluída</option></select><button class="btn" type="submit">Salvar situação</button></div><label>Nota da PRESCON (obrigatória na reabertura)<textarea name="note" rows="2" placeholder="Motivo da atualização..."></textarea></label></form></details>';
 }
 function card(d){
  const j=latest(d),overdue=isOverdue(d);
  const status=d.status==='justificada'?'justificada':statusNames[d.status]||d.status;
  return '<article class="demands-card" data-id="'+d.id+'" data-severity="'+esc(d.severity||'amarela')+'">'+
  '<div class="demands-card-head"><div><h4>'+esc(d.title)+'</h4>'+(isGlobalReader()?'<p>'+esc(ejName(d.ej_id))+'</p>':'')+'</div><span class="demands-chip">'+esc((d.severity||'amarela').toUpperCase())+'</span></div>'+
  '<p>'+esc(d.description||'')+'</p><div class="demands-card-meta"><span class="demands-chip '+(['concluida','justificada'].includes(d.status)?'done':'wait')+'">'+esc(statusNames[d.status]||status)+'</span><span class="demands-chip '+(overdue?'overdue':'')+'">Prazo '+esc(date(d.due_at))+'</span>'+(!isEjDirex()&&j?.state==='pending_review'?'<span class="demands-chip review">Justificativa em análise</span>':'')+'</div>'+
  '<p><b>Responsável:</b> '+esc(d.responsible||'EJ')+'</p>'+
  (isPrescon()?decisionForm(d)+updateForm(d):canJustify()?justificationForm(d):'<p class="demands-help">Acesso somente para consulta. O conselheiro da EJ é responsável por justificativas, documentos e formulários.</p>')+
  (isEjDirex()?'':'<details><summary>Ver justificativas anteriores</summary><div class="demands-just-history">'+justificationHistory(d)+'</div></details>')+
  (isEjDirex()?'':'<details><summary>Histórico de movimentações</summary>'+history(d)+'</details>')+'</article>';
 }
 function filtered(){
  const term=query.toLowerCase(),candidates=list().filter(d=>{
    const j=latest(d);
    const hay=(d.title+' '+d.description+' '+ejName(d.ej_id)+' '+d.responsible).toLowerCase();
    if(term&&!hay.includes(term))return false;
    if(ejFilter!=='all'&&d.ej_id!==ejFilter)return false;
    if(filter==='review')return j?.state==='pending_review';
    if(filter==='overdue')return isOverdue(d);
    if(filter!=='all')return d.status===filter;
    return true;
  });
  return candidates.sort((a,b)=>{
   const rank=d=>latest(d)?.state==='pending_review'?0:isOverdue(d)?1:['pendente','em_andamento'].includes(d.status)?2:3;
   return rank(a)-rank(b)||String(b.created_at).localeCompare(String(a.created_at));
  });
 }
 function renderList(){
  const results=filtered();
  const holder=root.querySelector('#demands-results');
  if(!holder)return;
  holder.innerHTML=results.length?results.slice(0,150).map(card).join(''):'<div class="demands-empty">Nenhuma demanda encontrada para este filtro.</div>';
  root.querySelector('#demands-count').textContent=results.length+' demanda(s) encontrada(s)'+(results.length>150?' · exibindo as primeiras 150':'');
 }
 function render(){
  root.innerHTML=header()+createForm()+
  '<section class="demands-section"><div class="demands-head"><div><h3>Acompanhar demandas</h3><p>Os dados são do banco do Portal, não da demonstração.</p></div><span id="demands-count" class="demands-help"></span></div>'+
  '<div class="demands-toolbar"><input type="search" id="demand-search" placeholder="Pesquisar por EJ ou assunto" value="'+esc(query)+'" aria-label="Pesquisar demandas">'+
  '<select id="demand-filter" aria-label="Filtrar demandas">'+
  [['all','Todas as situações'],['review','Aguardando decisão'],['overdue','Prazo vencido'],...Object.entries(statusNames)].map(([k,v])=>'<option value="'+k+'" '+(filter===k?'selected':'')+'>'+esc(v)+'</option>').join('')+'</select>'+
  (isGlobalReader()?'<select id="demand-ej-filter" aria-label="Filtrar por EJ"><option value="all">Todas as EJs</option>'+ejs().map(e=>'<option value="'+esc(e.id)+'" '+(ejFilter===e.id?'selected':'')+'>'+esc(e.name)+'</option>').join('')+'</select>':'')+'</div>'+
  '<div id="demands-results" class="demands-list"></div></section>'+
  (notice?'<div class="demands-toast" role="status">'+esc(notice)+'</div>':'');
  renderList();
 }
 async function refresh(){
  root.innerHTML='<div class="demands-toast" role="status">Carregando demandas reais…</div>';
  try{
   const response=await request('/demands?action=list');
   info=response;render();
  }catch(e){root.innerHTML='<div class="demands-toast" role="alert">Não foi possível carregar demandas: '+esc(e.message||e)+'. Verifique a publicação do servidor e sua conta.</div>';}
 }
 async function submit(ev){
  const form=ev.target.closest('form[data-form]');if(!form||!root.contains(form))return;
  ev.preventDefault();
  const data=new FormData(form),type=form.dataset.form;
  const pressed=ev.submitter;
  if(pressed)pressed.disabled=true;
  try{
   if(type==='create'){
    const selected=data.getAll('ejIds');
    if(!selected.length)throw Error('Selecione pelo menos uma EJ.');
    if(selected.length>1&&!window.confirm('Criar '+selected.length+' demandas, uma para cada EJ selecionada?'))return;
    const payload={title:data.get('title'),description:data.get('description'),dueAt:data.get('dueAt'),severity:data.get('severity'),responsible:data.get('responsible'),ejIds:selected,templateKey:template};
    const result=await request('/demands?action=create',{method:'POST',data:payload});
    notice=result.count+' demanda(s) criadas. As EJs podem visualizá-las no Portal.';
    creating=false;
   }else if(type==='justify'){
    await request('/demands?action=justify',{method:'POST',data:{demandId:form.dataset.id,reason:data.get('reason'),explanation:data.get('explanation'),evidenceUrl:data.get('evidenceUrl')}});
    notice='Justificativa enviada para a PRESCON. Aguardando análise.';
   }else if(type==='decide'){
    const decision=pressed?.value;
    if(!['accepted','rejected'].includes(decision))throw Error('Escolha aceitar ou recusar a justificativa.');
    if(!window.confirm((decision==='accepted'?'Aceitar':'Recusar')+' a justificativa e registrar sua explicação para a EJ?'))return;
    const result=await request('/demands?action=decide',{method:'POST',data:{justificationId:form.dataset.id,decision,note:data.get('note')}});
    notice=result.message;
   }else if(type==='status'){
    const result=await request('/demands?action=status',{method:'POST',data:{demandId:form.dataset.id,status:data.get('status'),note:data.get('note')}});
    notice=result.message;
   }
   await refresh();
  }catch(e){window.alert(e.message||'Não foi possível concluir a ação.');}
  finally{if(pressed)pressed.disabled=false}
 }
 function countEjs(){
  const n=root.querySelectorAll('.demands-ej-choices input:checked').length;
  const el=root.querySelector('#demand-ej-count');if(el)el.textContent=n+' EJs selecionadas';
 }
 root.addEventListener('submit',submit);
 root.addEventListener('input',e=>{
  if(e.target.id==='demand-search'){query=e.target.value;renderList()}
  if(e.target.name==='ejIds')countEjs();
 });
 root.addEventListener('change',e=>{
  if(e.target.id==='demand-filter'){filter=e.target.value;renderList()}
  if(e.target.id==='demand-ej-filter'){ejFilter=e.target.value;renderList()}
 });
 root.addEventListener('click',e=>{
  const btn=e.target.closest('button');if(!btn)return;
  const act=btn.dataset.act;
  if(act==='refresh'){refresh();return}
  if(act==='toggle-create'){creating=!creating;render();return}
  if(act==='select-all'||act==='select-none'){
   root.querySelectorAll('.demands-ej-choices input[type=checkbox]').forEach(c=>c.checked=act==='select-all');
   countEjs();return;
  }
  if(btn.dataset.template){
   template=btn.dataset.template;const t=templates.find(x=>x.key===template);
   const form=root.querySelector('[data-form=create]');if(!form)return;
   form.querySelector('[name=title]').value=t?.title||'';
   form.querySelector('[name=description]').value=t?.description||'';
   form.querySelectorAll('[data-template]').forEach(b=>b.classList.toggle('active',b.dataset.template===template));return;
  }
  if(btn.dataset.note){
   const form=btn.closest('form');const field=form?.querySelector('textarea[name=note]');if(field){
    field.value=btn.dataset.note==='accepted'?'Justificativa aceita após análise das informações apresentadas.':'Justificativa não aceita após análise. É necessário regularizar a pendência apresentada.';
    field.focus();
   }
  }
 });
 return {refresh,role:()=>info?.role};
}
window.NEJLON_DemandUI={mount};
})();