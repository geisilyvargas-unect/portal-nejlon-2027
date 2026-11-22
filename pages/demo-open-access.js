/* NEJLON 2027 — demonstração pública sem credenciais.
   Nenhuma chamada a API, Supabase ou endpoints institucionais. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const sample=[{ej:'UNECT',name:'Planejamento financeiro IDEALIZE 2026',status:'Em análise',date:'28/11/2026'},{ej:'BÓSON',name:'Atualização cadastral',status:'Pendente',date:'30/11/2026'},{ej:'LEX',name:'Acompanhamento de deliberações',status:'Concluída',date:'20/11/2026'}];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tag=(s)=>'<span class="tag">'+esc(s)+'</span>';
const card=(title,body)=>'<article class="automation-panel"><h3>'+esc(title)+'</h3>'+body+'</article>';
const note='<p class="automation-muted"><strong>DEMONSTRAÇÃO:</strong> dados fictícios; nenhuma informação é enviada a servidores.</p>';
const btn=(label,href)=>'<a class="btn red" href="'+href+'">'+label+'</a>';
function set(id,html){const n=$(id);if(n)n.innerHTML=html}
function openApp(id){const n=$(id);if(n)n.hidden=false}
function removeAuth(id){const n=$(id);if(n)n.remove()}
function banner(){const hero=document.querySelector('.automation-hero');if(hero){const n=document.createElement('div');n.className='automation-note';n.innerHTML='<strong>MODO DE TESTE · ACESSO LIVRE</strong> — Navegue sem e-mail ou senha. As ações desta página são simulações locais.';hero.after(n)}document.querySelectorAll('[id$="-logout"],#auto-open-login,#auto-connect-google').forEach(n=>n.remove())}
function demands(){
 removeAuth('demands-login');openApp('demands-app');set('demands-user','Visitante · prévia sem autenticação');
 set('demands-root','<section class="automation-panel"><h2>DEMANDAS DA REDE · EXEMPLOS</h2>'+note+'<div class="automation-grid">'+sample.map(d=>card(d.ej+' · '+d.name,'<p>Prazo: '+d.date+'</p>'+tag(d.status)+'<p><label>Justificativa (simulação)<textarea placeholder="Escreva sua justificativa de teste"></textarea></label></p><button type="button" class="btn red" data-demo-save>Salvar rascunho local</button>')).join('')+'</div></section>');
}
function oversight(){
 removeAuth('oversight-login');openApp('oversight-app');set('oversight-user','Visitante · DIREX Núcleo (simulado)');
 set('oversight-metrics','<div class="stat-card"><span>Empresas juniores (amostra)</span><strong>3</strong></div><div class="stat-card"><span>Demandas fictícias</span><strong>3</strong></div><div class="stat-card"><span>Deliberações demonstrativas</span><strong>1</strong></div>');
 set('oversight-deliberations',card('IDEALIZE 2026','<p>Planejamento financeiro · cenário demonstrativo</p>'+btn('Consultar deliberação','./idealize.html')));
 set('oversight-forms',card('Formulário demonstrativo','<p>Sem votação oficial ou coleta de dados.</p>'+btn('Abrir formulário','./formulario-deliberacao.html')));
}
function council(){
 removeAuth('council-login');openApp('council-app');set('council-email-display','Conselho NEJLON · visitante');
 set('council-highlights','<div class="stat-card"><span>Áreas institucionais</span><strong>10</strong></div><div class="stat-card"><span>Deliberação demonstrativa</span><strong>1</strong></div>');
 const areas=['Reuniões gerais','Documentos institucionais','Deliberações','Demandas','Planejamento financeiro','Gestão do Conselho','Fiscalização','Relatórios','Comunicação','Portfólio'];
 const links=['../index.html','./institucional.html','./idealize.html','./demandas.html','./prescon-criar-deliberacao.html','./gestao-conselho.html','./fiscalizacao.html','./relatorio.html','./whatsapp.html','./portfolio.html'];
 set('council-directory','<div class="automation-grid">'+areas.map((a,i)=>card(a,btn('Explorar →',links[i]))).join('')+'</div>');
 set('council-forms',card('IDEALIZE 2026','<p>Deliberação demonstrativa de planejamento financeiro.</p>'+btn('Visualizar','./idealize.html')));
}
function respond(){
 removeAuth('respond-login');openApp('respond-app');set('respond-user','Conselheiro(a) visitante · simulação');
 set('respond-form-header','<h2>DELIBERAÇÃO DE DEMONSTRAÇÃO</h2>'+note+'<p>Planejamento financeiro IDEALIZE 2026 · seu voto não será registrado.</p>');
 const opts=['Aprova','Aprova com sugestões','Aprova com ressalvas','Reprova','Abstém'];
 set('respond-questions','<section class="automation-panel"><h3>Seu posicionamento</h3><div class="automation-form">'+opts.map((o,i)=>'<label><input type="radio" name="demo-vote" value="'+i+'" required> '+o+'</label>').join('')+'<label>Justificativa / sugestões / ressalvas<textarea name="demo-note" placeholder="Escreva sua contribuição"></textarea></label></div></section>');
 const form=$('respond-answer-form');if(form){form.hidden=false;form.addEventListener('submit',e=>{e.preventDefault();const selected=document.querySelector('input[name="demo-vote"]:checked');set('respond-submit-feedback',selected?'Resposta simulada: '+opts[Number(selected.value)]+'. Nenhum voto foi registrado.':'Selecione uma opção para continuar.');})}
 const change=$('respond-vote-change');if(change)change.hidden=true;
}
function setupTabs(){const tabs=[...document.querySelectorAll('[data-tab]')],panels=[...document.querySelectorAll('[data-panel]')];function show(key){tabs.forEach(t=>{const active=t.dataset.tab===key;t.classList.toggle('active',active);t.setAttribute('aria-current',active?'page':'false')});panels.forEach(p=>p.hidden=p.dataset.panel!==key)}document.addEventListener('click',e=>{const el=e.target.closest('[data-tab],[data-go]');if(el)show(el.dataset.tab||el.dataset.go)});show('inicio');const refresh=$('auto-weekly-refresh');if(refresh)refresh.onclick=()=>set('auto-weekly-status','Indicadores fictícios atualizados.');const copy=$('auto-weekly-copy');if(copy)copy.onclick=()=>{navigator.clipboard?.writeText('NEJLON 2027: 1 deliberação e 3 demandas fictícias.').then(()=>set('auto-weekly-status','Panorama copiado.')).catch(()=>set('auto-weekly-status','Cópia indisponível.'))};const reminder=$('auto-weekly-whatsapp');if(reminder)reminder.onclick=()=>location.href='./whatsapp.html';const root=$('auto-create-root');if(root)root.onclick=()=>set('auto-drive-result','Integração Google desativada na demonstração.');const form=$('auto-report-form');if(form)form.innerHTML='<option value="idealize">IDEALIZE 2026 · demonstração</option>';const exportBtn=$('auto-report-export');if(exportBtn)exportBtn.onclick=()=>{const blob=new Blob(['tipo,descricao,status\nDeliberacao,IDEALIZE 2026,Demonstracao\n'],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='nejlon-demonstracao.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);set('auto-report-list','CSV fictício baixado localmente.')};const update=$('auto-report-refresh');if(update)update.onclick=()=>set('auto-report-list','Dados demonstrativos atualizados.');}
function automation(){
 removeAuth('auto-login');openApp('auto-app');set('auto-access-label','MODO DE TESTE · ACESSO LIVRE');set('auto-user','PRESCON · ambiente de demonstração');
 set('auto-weekly-stats','<div class="stat-card"><span>Deliberações</span><strong>1</strong></div><div class="stat-card"><span>Demandas fictícias</span><strong>3</strong></div>');
 set('auto-weekly-items',sample.map(d=>card(d.ej+' · '+d.name,'<p>'+esc(d.status)+' · '+esc(d.date)+'</p>')).join(''));
 set('auto-weekly-demand',note);set('auto-google-state','Integrações reais desativadas nesta demonstração.');
 set('auto-form-total','1 formulário fictício');set('auto-file-total','Nenhum arquivo enviado a servidores');
 set('auto-forms',card('IDEALIZE 2026','<p>Formulário demonstrativo</p>'+btn('Visualizar','./idealize.html')));
 set('auto-files',note);set('auto-demands-root',sample.map(d=>card(d.ej,d.name+' · '+d.status)).join(''));
 set('auto-report-overview','<div class="stat-card"><span>Deliberações de teste</span><strong>1</strong></div>');
 set('auto-report-list',btn('Consultar painel de gráficos','../index.html'));set('auto-vote-changes',note);setupTabs();
 const form=$('auto-create-form');if(form)form.addEventListener('submit',e=>{e.preventDefault();set('auto-create-result','Formulário simulado criado nesta tela. Nenhum dado foi publicado. '+btn('Abrir criador de deliberação','./prescon-criar-deliberacao.html'))});
 ['auto-folder-form','auto-upload-form','auto-report-form'].forEach(id=>{const f=$(id);if(f)f.addEventListener('submit',e=>{e.preventDefault();const output=id==='auto-folder-form'?'auto-drive-result':id==='auto-upload-form'?'auto-files':'auto-report-list';set(output,'Operação simulada localmente. Nenhum arquivo ou dado foi enviado.');})});
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-demo-save]');if(b){b.textContent='Rascunho de demonstração salvo nesta tela';b.disabled=true}});
document.addEventListener('DOMContentLoaded',()=>{banner();const path=location.pathname.split('/').pop();if(path==='demandas.html')demands();else if(path==='fiscalizacao.html')oversight();else if(path==='painel-conselho.html')council();else if(path==='responder.html')respond();else if(path==='central-automacoes.html')automation()});
})();