(()=>{
'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const STORAGE='nejlon.council.demo.v2';
const EJS=(window.NEJLON_DEMO?.ejs||[]).filter(e=>e&&typeof e.slug==='string'&&typeof e.name==='string');
const demoMembers=()=>EJS.map((ej,i)=>({id:'m_'+ej.slug,name:'Conselheiro fictício — '+ej.name,ej:ej.slug,attendance:i%5,invited:4,contributions:i%4,actions:i%3}));
const seed=()=>({
 events:[{id:1,title:'Reunião de alinhamento do Conselho',date:'2027-03-15',time:'19:00',type:'Reunião',agenda:'Governança e prioridades da Rede',visibility:'council'},{id:2,title:'Oficina de análise crítica',date:'2027-03-20',time:'18:00',type:'Formação',agenda:'Como avaliar propostas e ressalvas',visibility:'council'},{id:3,title:'Encontro da Rede',date:'2027-03-27',time:'14:00',type:'Institucional',agenda:'Integração entre EJs',visibility:'public'}],
 steps:[{id:1,title:'Introdução à governança',description:'Papel e responsabilidades do Conselho',required:true},{id:2,title:'Como analisar deliberações',description:'Critérios, argumentos e perguntas críticas',required:true},{id:3,title:'Comunicação e participação',description:'Escuta ativa e colaboração na Rede',required:false}],
 members:demoMembers(),
 progress:{},checkins:[],
 actions:[{id:1,title:'Revisar materiais de formação',owner:'m_unect',due:'2027-03-21',status:'pending',eventId:1}],
 announcements:[{id:1,title:'Boas-vindas à Jornada do Conselho',body:'Materiais introdutórios disponíveis na trilha demonstrativa.',audience:'council'}]
});
let data;try{const saved=JSON.parse(sessionStorage.getItem(STORAGE)||'null');data=saved&&Array.isArray(saved.events)&&Array.isArray(saved.members)?saved:seed()}catch{data=seed()}
const persist=()=>{try{sessionStorage.setItem(STORAGE,JSON.stringify(data));return true}catch{return false}};
const state={role:'prescon',ej:'unect',tab:'overview'};
const ejPicker=$('ej');
ejPicker.innerHTML=EJS.map(e=>'<option value="'+esc(e.slug)+'">'+esc(e.name)+'</option>').join('');
ejPicker.value=state.ej;
const tabs=[['overview','Visão geral'],['calendar','Agenda e reuniões'],['learning','Jornada'],['engagement','Engajamento'],['checkins','Acompanhamento'],['resources','Biblioteca'],['actions','Encaminhamentos']];
const isAdmin=()=>state.role==='prescon',isCouncil=()=>state.role==='counselor'||isAdmin();
const own=()=>data.members.find(m=>m.ej===state.ej)||null;
const visibleTabs=()=>tabs.filter(([id])=>isCouncil()||['overview','calendar','resources'].includes(id));
const date=d=>{if(!d)return 'Sem prazo';const parts=d.split('-');return parts.length===3?parts.reverse().join('/'):d};
const card=(title,body)=>'<article class="card"><h3>'+esc(title)+'</h3>'+body+'</article>';
const note=()=>'<p class="notice"><strong>Simulação:</strong> alterações feitas aqui permanecem somente nesta aba do navegador. Nenhum dado oficial é alterado.</p>';
const btn=(action,label,id,primary=false)=>'<button type="button" data-action="'+esc(action)+'" '+(id===undefined?'':'data-id="'+esc(id)+'"')+' class="'+(primary?'primary':'')+'">'+esc(label)+'</button>';
function resources(){
return '<div class="grid">'+[
 ['Painel institucional','Consultar as dez áreas históricas e links mantidos pela PRESCON.','./painel-conselho.html'],
 ['Demandas da Rede','Acompanhar solicitações e prazos autorizados.','./demandas.html'],
 ['Deliberações','Consultar formulários e deliberações publicados.','./responder.html'],
 ['Central de Automações','Ferramentas administrativas, com login PRESCON.','./central-automacoes.html']
].map(([t,d,url])=>card(t,'<p>'+esc(d)+'</p><a href="'+esc(url)+'">Abrir recurso →</a>')).join('')+'</div><p class="muted small">Os links levam a módulos existentes e podem exigir autenticação. Materiais antigos devem ser validados antes de uso institucional.</p>';
}
const orderedEvents=()=>[...data.events].sort((a,b)=>((a.date||'')+(a.time||'')).localeCompare((b.date||'')+(b.time||'')));
function overview(){
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const upcoming=orderedEvents().filter(e=>(e.visibility==='public'||isCouncil())&&e.date>=today()).slice(0,3);
return '<div class="grid">'+card('Próximos compromissos','<div class="stat">'+upcoming.length+'</div><p>Eventos demonstrativos disponíveis</p>')+card('Materiais de formação','<div class="stat">'+(isCouncil()?data.steps.length:'—')+'</div><p>Etapas da Jornada</p>')+card('Encaminhamentos','<div class="stat">'+(isCouncil()?data.actions.filter(a=>a.status==='pending'&&(isAdmin()||(own()&&a.owner===own().id))).length:'—')+'</div><p>Ações demonstrativas pendentes</p>')+'</div><h2>Comunicados</h2><div class="stack">'+data.announcements.filter(a=>isCouncil()||a.audience==='public').map(a=>card(a.title,'<p>'+esc(a.body)+'</p>')).join('')+'</div><h2>Próximas atividades</h2><div class="grid">'+(upcoming.length?upcoming.map(e=>card(e.title,'<p>'+esc(date(e.date))+' · '+esc(e.time)+'</p><span class="tag">'+esc(e.type)+'</span>')).join(''):'<p class="empty">Nenhuma atividade futura disponível nesta visão.</p>')+'</div>'+note();
}
function calendar(){
const events=orderedEvents().filter(e=>isCouncil()||e.visibility==='public');
return '<h2>Agenda institucional</h2><div class="stack">'+events.map(e=>card(e.title,'<p><strong>'+esc(date(e.date))+' · '+esc(e.time)+'</strong> · '+esc(e.type)+'</p><p>Pauta: '+esc(e.agenda)+'</p>'+ (isAdmin()?btn('removeEvent','Excluir evento fictício',e.id):''))).join('')+'</div>'+(isAdmin()?'<h2>Cadastrar reunião fictícia</h2><form class="card form" id="event-form"><label>Título<input name="title" maxlength="120" required></label><label>Data<input type="date" name="date" required></label><label>Horário<input type="time" name="time" required></label><label>Tipo<select name="type"><option>Reunião</option><option>Formação</option><option>Institucional</option></select></label><label>Pauta<textarea name="agenda" maxlength="600" required></textarea></label><label>Visibilidade<select name="visibility"><option value="council">Conselho</option><option value="public">Institucional</option></select></label><button class="primary">Adicionar à simulação</button></form>':'')+note();
}
function learning(){
const m=own();if(!m)return '<h2>Jornada do Conselheiro</h2><p class="notice">Não há conselheiro fictício cadastrado para esta EJ. Selecione uma das EJs disponíveis para testar o progresso da jornada.</p>'+note();const done=data.progress[m.id]||[],pct=Math.round(100*done.length/data.steps.length);
return '<h2>Jornada do Conselheiro</h2><p class="muted">Acompanhamento demonstrativo de '+esc(m.name)+' · '+esc(m.ej.toUpperCase())+'</p><div class="card"><div class="line"><strong>Progresso</strong><strong>'+pct+'%</strong></div><div class="progress" role="progressbar" aria-valuenow="'+pct+'" aria-valuemin="0" aria-valuemax="100" aria-label="Progresso na trilha"><div style="width:'+pct+'%"></div></div></div><div class="stack">'+data.steps.map((step,i)=>card('Etapa '+(i+1)+' — '+esc(step.title),'<p>'+esc(step.description)+'</p><span class="tag">'+(step.required?'Obrigatória':'Opcional')+'</span> <span class="tag">'+(done.includes(step.id)?'Concluída':'A iniciar')+'</span><p>'+btn('step',done.includes(step.id)?'Desmarcar conclusão':'Marcar concluída',step.id)+'</p>')).join('')+'</div>'+note();
}
function engagement(){
const members=data.members.filter(m=>isAdmin()||m.ej===state.ej);
return '<h2>Indicadores de participação</h2><p class="muted">Evidências fictícias; não são notas de desempenho nem classificações automáticas de pessoas.</p><div class="grid">'+members.map(m=>card(m.name,'<p>Empresa júnior: '+esc(m.ej.toUpperCase())+'</p><p>Presenças registradas: <strong>'+m.attendance+'/'+m.invited+'</strong></p><p>Contribuições: <strong>'+m.contributions+'</strong></p><p>Encaminhamentos assumidos: <strong>'+m.actions+'</strong></p><p>Formações concluídas: <strong>'+(data.progress[m.id]||[]).length+'/'+data.steps.length+'</strong></p>')).join('')+'</div><p class="notice">Ausência isolada não determina desengajamento. Contexto, justificativas e evolução exigem análise humana.</p>';
}
function checkins(){
if(!isAdmin())return '<div class="empty">Acompanhamento individual é exclusivo da PRESCON.</div>';
return '<h2>Acompanhamento individual · simulação</h2><p class="muted">Registros de conversas e próximos contatos fictícios, visíveis apenas nesta visão demonstrativa.</p><form class="card form" id="checkin-form"><label>Conselheiro<select name="member">'+data.members.map(m=>'<option value="'+esc(m.id)+'">'+esc(m.name)+'</option>').join('')+'</select></label><label>Data<input type="date" name="date" required></label><label>Resumo do encaminhamento<textarea name="summary" maxlength="500" required placeholder="Sem informações pessoais sensíveis"></textarea></label><label>Próximo contato<input type="date" name="next"></label><button class="primary">Registrar acompanhamento fictício</button></form><h3>Histórico de simulação</h3><div class="stack">'+(data.checkins.length?data.checkins.map(c=>card(data.members.find(m=>m.id===c.member)?.name||'Conselheiro','<p>'+esc(date(c.date))+' · '+esc(c.summary)+'</p><p>Próximo contato: '+esc(date(c.next))+'</p>'+btn('removeCheckin','Excluir registro',c.id))).join(''):'<p class="empty">Nenhum acompanhamento simulado.</p>')+'</div>'+note();
}
function actions(){
const m=own();const allowed=data.actions.filter(a=>isAdmin()||(m&&a.owner===m.id));
return '<h2>Encaminhamentos</h2><div class="stack">'+allowed.map(a=>card(a.title,'<p>Responsável: '+esc(data.members.find(m=>m.id===a.owner)?.name||'—')+'</p><p>Prazo: '+esc(date(a.due))+' · <strong>'+(a.status==='done'?'Concluído':'Pendente')+'</strong></p>'+btn('toggleAction',a.status==='done'?'Reabrir':'Concluir',a.id))).join('')+'</div>'+(isAdmin()?'<h2>Novo encaminhamento fictício</h2><form class="card form" id="action-form"><label>Descrição<input name="title" maxlength="140" required></label><label>Responsável<select name="owner">'+data.members.map(m=>'<option value="'+esc(m.id)+'">'+esc(m.name)+'</option>').join('')+'</select></label><label>Prazo<input name="due" type="date" required></label><button class="primary">Criar encaminhamento</button></form>':'')+note();
}
const screens={overview,calendar,learning,engagement,checkins,resources,actions};
function render(){
if(!visibleTabs().some(t=>t[0]===state.tab))state.tab='overview';
$('tabs').innerHTML=visibleTabs().map(([id,title])=>'<button type="button" data-tab="'+id+'" aria-pressed="'+(state.tab===id)+'">'+title+'</button>').join('');
$('screen').innerHTML=screens[state.tab]();
$('ej').disabled=state.role==='nucleus_direx';
}
function message(msg){$('status').textContent=msg;setTimeout(()=>{if($('status').textContent===msg)$('status').textContent=''},5000)}
$('role').addEventListener('change',e=>{state.role=e.target.value;state.tab='overview';render()});
$('ej').addEventListener('change',e=>{state.ej=e.target.value;render()});
$('reset').addEventListener('click',()=>{data=seed();try{sessionStorage.removeItem(STORAGE)}catch{}render();message('Simulação reiniciada.')});
$('tabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b){state.tab=b.dataset.tab;render()}});
$('screen').addEventListener('click',e=>{
const b=e.target.closest('[data-action]');if(!b)return;
const id=b.dataset.id,action=b.dataset.action;
if(action==='step'&&isCouncil()){const m=own();if(!m)return;const set=new Set(data.progress[m.id]||[]),n=Number(id);set.has(n)?set.delete(n):set.add(n);data.progress[m.id]=[...set]}
else if(action==='toggleAction'&&isCouncil()){const a=data.actions.find(x=>String(x.id)===id);if(!a||(!isAdmin()&&(!own()||a.owner!==own().id)))return;a.status=a.status==='done'?'pending':'done'}
else if(action==='removeEvent'&&isAdmin())data.events=data.events.filter(x=>String(x.id)!==id);
else if(action==='removeCheckin'&&isAdmin())data.checkins=data.checkins.filter(x=>String(x.id)!==id);
else return;
const saved=persist();render();message(saved?'Simulação atualizada nesta aba.':'Simulação atualizada, mas o navegador não permitiu salvá-la.');
});
$('screen').addEventListener('submit',e=>{
const form=e.target.closest('form');if(!form)return;e.preventDefault();if(!isAdmin())return;
const v=new FormData(form),id=Date.now();
if(form.id==='event-form')data.events.push({id,title:String(v.get('title')).trim(),date:v.get('date'),time:v.get('time'),type:v.get('type'),agenda:String(v.get('agenda')).trim(),visibility:v.get('visibility')});
else if(form.id==='checkin-form')data.checkins.push({id,member:v.get('member'),date:v.get('date'),summary:String(v.get('summary')).trim(),next:v.get('next')});
else if(form.id==='action-form')data.actions.push({id,title:String(v.get('title')).trim(),owner:v.get('owner'),due:v.get('due'),status:'pending'});
else return;
const saved=persist();render();message(saved?'Registro fictício criado nesta aba.':'Registro fictício criado, mas o navegador não permitiu salvá-lo.');
});
render();
})();