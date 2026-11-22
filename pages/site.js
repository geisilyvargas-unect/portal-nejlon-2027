(() => {
'use strict';
const D=window.NEJLON_DEMO;
// Adiciona a deliberação IDEALIZE exclusivamente à demonstração estática.
if(D&&window.NEJLON_IDEALIZE_VOTES&&!D.delibs.some(x=>x.id==='idealize')){
 D.delibs.push({id:'idealize',name:'IDEALIZE 2026 — PF (simulação aberta)',status:'Aberta',visibility:'DIREX e Conselho',due:'Sem prazo oficial — demonstração'});
 D.votes.idealize=window.NEJLON_IDEALIZE_VOTES.map(v=>({slug:v.ej,position:v.answers[0].position,note:v.answers[0].justification}));
}

if(!D){document.getElementById('view').textContent='Dados demonstrativos indisponíveis.';return;}
const nav=[
 ['painel','◫','Visão geral'],['engajamento','▦','Engajamento'],['deliberacoes','☷','Deliberações'],
 ['pendencias','◷','Pendências'],['relatorios','▤','Relatórios'],['demandas','☑','Demandas'],
 ['calendario','▦','Calendário'],['jornada','✧','Jornada'],['rede','⬡','Rede de EJs']
];
const roleMap={
 prescon:{name:'PRESCON',nav:nav.map(x=>x[0])},
 counselor:{name:'Conselho',nav:['painel','deliberacoes','demandas','calendario','jornada','rede']},
 ej_direx:{name:'DIREX da EJ',nav:['painel','demandas']},
 nucleus_direx:{name:'DIREX do Núcleo',nav:['painel','deliberacoes','demandas']}
};
const s={role:'prescon',section:'painel',ej:'unect',selected:'unect',filter:'all',search:'',delib:'financeiro',vote:'favorable',positionFilter:'all'};
const $=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Math.round(n)+'%';
const role=()=>roleMap[s.role];
const votes=id=>D.votes[id]||[];
const delib=id=>D.delibs.find(x=>x.id===id)||D.delibs[0];
const done=(ej,id)=>votes(id).find(v=>v.slug===ej);
const summary=id=>({votes:votes(id).length,pending:D.ejs.length-votes(id).length,pct:Math.round(votes(id).length*100/D.ejs.length)});
const perEj=ej=>{const n=D.delibs.filter(d=>done(ej.slug,d.id)).length;const total=D.delibs.length;return {...ej,done:n,missing:total-n,pct:Math.round(n*100/total),status:n/total>=.8?'high':n/total>=.5?'medium':'low',answered:D.delibs.filter(d=>done(ej.slug,d.id)),pending:D.delibs.filter(d=>!done(ej.slug,d.id))}};
const ejData=()=>D.ejs.map(perEj).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
const metric=(label,value,footer,icon='◇')=>'<article class="stat-card"><span class="stat-icon">'+icon+'</span><span class="stat-label">'+esc(label)+'</span><strong>'+esc(value)+'</strong><span class="stat-footer">'+esc(footer)+'</span></article>';
const stats=(items)=>'<div class="stats">'+items.join('')+'</div>';
const panel=(title,sub,content)=>'<section class="panel"><div class="section-row"><div><h3>'+title+'</h3><p class="sub">'+sub+'</p></div></div>'+content+'</section>';
const tag=(txt,cls='')=>'<span class="tag '+cls+'">'+esc(txt)+'</span>';
const titleOptions=()=>'<label class="mini-heading" for="delib-select">DELIBERAÇÃO DEMONSTRATIVA</label><div class="toolrow"><select class="select" id="delib-select">'+D.delibs.map(d=>'<option value="'+d.id+'" '+(d.id===s.delib?'selected':'')+'>'+esc(d.name)+'</option>').join('')+'</select></div>';
const labels={painel:['VISÃO PRESCON','Visão geral da Rede','Acompanhe os principais números, pendências e prioridades em uma única tela.'],
 engajamento:['PARTICIPAÇÃO DAS EJs','Radar visual da Rede','Mapa interativo, ficha individual de cada EJ e evolução das respostas.'],
 deliberacoes:['CONSELHO DELIBERATIVO','Deliberações','Acompanhe os cenários e os posicionamentos enviados pelas EJs.'],
 pendencias:['ACOMPANHAMENTO','Central de Pendências','Veja quem respondeu e quem ainda está pendente, sem procurar planilhas.'],
 relatorios:['CONSOLIDAÇÃO','Relatórios institucionais','Resultados calculados automaticamente a partir de votos de demonstração.'],
 demandas:['ACOMPANHAMENTO DE ENTREGAS','Demandas da Rede','Organização visual de prazos, responsáveis e encaminhamentos.'],
 calendario:['AGENDA 2027','Calendário institucional','Eventos e reuniões ilustrativos do Conselho e da Rede.'],
 jornada:['JORNADA DO CONSELHEIRO','Jornada de desenvolvimento','Acompanhamento de formações e materiais sem cobranças extras.'],
 rede:['REDE NEJLON','Empresas juniores','As 29 EJs representadas na plataforma.']};
const heading=()=>{const info=labels[s.section].slice();if(s.role!=='prescon')info[0]='VISÃO '+role().name.toUpperCase();$('section-eyebrow').textContent=info[0];$('section-title').textContent=info[1];$('section-subtitle').textContent=info[2]};
function heatmap(){
 const all=ejData();
 const filtered=all.filter(e=>(s.filter==='all'||e.status===s.filter)&&e.name.toLocaleLowerCase('pt-BR').includes(s.search.trim().toLocaleLowerCase('pt-BR')));
 const selected=all.find(e=>e.slug===s.selected)||all[0];
 const controls='<div class="toolrow"><input type="search" class="search" id="ej-search" placeholder="Buscar empresa júnior..." aria-label="Buscar EJ" value="'+esc(s.search)+'"/><button type="button" data-filter="all" class="filter '+(s.filter==='all'?'active':'')+'">Todas ('+all.length+')</button>'+[['high','80–100%'],['medium','50–79%'],['low','0–49%']].map(([k,v])=>'<button type="button" data-filter="'+k+'" class="filter '+(s.filter===k?'active':'')+'">'+v+' ('+all.filter(e=>e.status===k).length+')</button>').join('')+'</div>';
 const heat='<div class="heatmap">'+filtered.map(e=>'<button type="button" class="heat '+e.status+(selected.slug===e.slug?' active':'')+'" data-ej="'+esc(e.slug)+'" aria-pressed="'+(selected.slug===e.slug)+'" title="'+esc(e.name+': '+e.pct+'%')+'"><span class="name">'+esc(e.name)+'</span><span class="pct">'+e.pct+'%</span></button>').join('')+'</div>';
 const legend='<div class="heat-info"><span><i class="swatch high"></i>80–100%</span><span><i class="swatch medium"></i>50–79%</span><span><i class="swatch low"></i>0–49%</span></div>';
 const detail='<div class="profile-head"><div class="avatar">EJ</div><div><span class="small-cap">FICHA DE PARTICIPAÇÃO</span><h3>'+esc(selected.name)+'</h3></div></div><div class="profile-value">'+selected.pct+'%</div><p class="sub">Taxa de resposta nas deliberações fictícias</p><div class="progress" role="progressbar" aria-valuenow="'+selected.pct+'" aria-valuemin="0" aria-valuemax="100"><div class="fill" style="width:'+selected.pct+'%"></div></div><div class="detail-stats"><div><b>'+selected.done+'</b><span>Respondidas</span></div><div><b>'+selected.missing+'</b><span>Pendentes</span></div><div><b>'+selected.done+' / '+D.delibs.length+'</b><span>Participação</span></div></div><div class="microheading">✓ COM RESPOSTA</div><ul class="bulletlist">'+(selected.answered.map(d=>'<li>'+esc(d.name)+'</li>').join('')||'<li>Nenhuma neste exemplo</li>')+'</ul><div class="microheading">◷ SEM RESPOSTA</div><ul class="bulletlist">'+(selected.pending.map(d=>'<li>'+esc(d.name)+'</li>').join('')||'<li>Todas respondidas</li>')+'</ul>';
 return '<div class="split">'+panel('Mapa de calor · 29 EJs','Clique em cada EJ para conferir sua participação.',controls+heat+(filtered.length?'':'<p class="note">Nenhuma EJ corresponde ao filtro.</p>')+legend+'<p class="note">As cores representam apenas respostas recebidas. Não medem motivação, qualidade ou comprometimento das pessoas.</p>')+panel('Perfil da EJ','Indicadores calculados a partir de exemplos fictícios.',detail)+'</div>';
}
function trend(){
 const bars=D.delibs.map(d=>({d,pct:summary(d.id).pct,count:summary(d.id).votes}));
 const b='<div class="chart" role="img" aria-label="Participação por deliberação: '+bars.map(x=>x.d.name+' '+x.pct+' por cento').join('; ')+'">'+bars.map(x=>'<div class="barcol"><strong>'+x.pct+'%</strong><div class="barplot"><span class="bar" style="height:'+x.pct+'%"></span></div><span class="charttitle" title="'+esc(x.d.name)+'">'+esc(x.d.name)+'</span><small>'+x.count+'/29 EJs</small></div>').join('')+'</div>';
 return panel('Evolução das respostas','Percentual de EJs que responderam a cada deliberação fictícia.',b);
}
function responseCharts(id){
 const v=votes(id);
 const counts=Object.entries(D.positions).map(([key,item])=>({key,...item,n:v.filter(x=>x.position===key).length}));
 const max=Math.max(1,...counts.map(x=>x.n));
 const total=v.length;
 const selected=s.positionFilter;
 return '<div class="analytics-bars" role="group" aria-label="Filtrar respostas por posicionamento">'+
 counts.map(x=>'<button type="button" class="analytics-bar '+(selected===x.key?'selected':'')+'" data-position="'+x.key+'" aria-pressed="'+(selected===x.key)+'"><span class="analytics-bar-header"><b>'+esc(x.label)+'</b><strong>'+x.n+' <small>('+Math.round(total?100*x.n/total:0)+'%)</small></strong></span><span class="analytics-track"><i style="width:'+(x.n/max*100)+'%;background:'+x.color+'"></i></span></button>').join('')+
 '<button type="button" class="btn analytics-reset" data-position="all" '+(selected==='all'?'disabled':'')+'>Mostrar todos os posicionamentos</button></div>';
}
function recordList(id,justFlagged=false){
 const filtered=votes(id).filter(x=>(!justFlagged||['suggestions','qualified','against'].includes(x.position))&&(s.positionFilter==='all'||x.position===s.positionFilter));
 return filtered.length?filtered.map(x=>{
 const name=D.ejs.find(e=>e.slug===x.slug)?.name||x.slug;
 return '<details class="record"><summary><span>'+esc(name)+'</span>'+tag(D.positions[x.position].label,x.position==='favorable'?'green':x.position==='against'?'red':'yellow')+'</summary><p>'+esc(x.note)+'</p><small class="note">Exemplo fictício · sem efeito institucional</small></details>';
 }).join(''):'<p class="note">Nenhum registro demonstrativo neste filtro.</p>';
}
function pending(){
 const id=s.delib,completed=new Set(votes(id).map(v=>v.slug)),missing=D.ejs.filter(e=>!completed.has(e.slug)),sum=summary(id);
 return '<div class="view-grid">'+panel('Selecionar deliberação','As pendências mudam com o exemplo escolhido.',titleOptions())+stats([metric('Empresas juniores',D.ejs.length,'Rede simulada','⬡'),metric('Responderam',sum.votes,'Votos fictícios','✓'),metric('EJs pendentes',sum.pending,'Ainda sem resposta','◷'),metric('Representatividade',sum.pct+'%','Cálculo automático','◉')])+panel('EJs sem resposta · '+missing.length,'Não são pendências reais; nenhuma cobrança é enviada.',missing.map(e=>'<div class="list-item"><div><strong>'+esc(e.name)+'</strong><p>Sem registro neste cenário fictício</p></div>'+tag('Pendente','yellow')+'</div>').join('')||'<p class="notice">Todas as EJs responderam!</p>')+'</div>';
}
function reports(){
 const id=s.delib,sum=summary(id),v=votes(id),approval=v.filter(x=>['favorable','suggestions'].includes(x.position)).length,caveats=v.filter(x=>x.position==='qualified').length,suggestions=v.filter(x=>x.position==='suggestions').length;
 const count=v.length;
 const warning=id==='idealize'?'<div class="notice">IDEALIZE: os indicadores deste painel resumem apenas C1 (UEL) dos exemplos fictícios. Para comparar C1/C2, rateios e seus dados financeiros, abra o <a href="./pages/idealize.html">painel do Idealize</a>. Não existem votos simulados de rateio.</div>':'';
 const decisions='<div class="prescon-focus"><div class="prescon-focus-card"><span>EJs sem resposta</span><strong>'+sum.pending+'</strong><button class="btn" type="button" data-nav="pendencias">Ver pendentes →</button></div><div class="prescon-focus-card"><span>Ressalvas para análise humana</span><strong>'+caveats+'</strong><p>Não são aceitas nem rejeitadas automaticamente.</p></div><div class="prescon-focus-card"><span>Sugestões registradas</span><strong>'+suggestions+'</strong><p>Comentários demonstrativos disponíveis abaixo.</p></div></div>';
 return '<div class="view-grid">'+warning+panel('Deliberação analisada','Escolha o conjunto de exemplos para consultar.',titleOptions())+
 panel('Prioridades da PRESCON','Pendências e opiniões fictícias, sem providências institucionais reais.',decisions)+
 stats([metric('EJs votantes',sum.votes,'De 29 EJs','◉'),metric('Aprovação direta',count?Math.round(approval*100/count)+'%':'—','Aprova + aprova com sugestões','✓'),metric('Ressalvas',caveats,'Aguardam decisão humana','◷'),metric('Sugestões',suggestions,'Para avaliação humana','✧')])+
 panel('Distribuição dos posicionamentos','Clique em uma barra para filtrar os comentários. Contagem e percentuais fictícios.',responseCharts(id))+
 panel('Pareceres para avaliação','Filtrados pela barra selecionada; não há decisão automática da PRESCON.',recordList(id,false))+'</div>';
}
function deliberations(){
 const cards=D.delibs.filter(d=>s.role!=='ej_direx'||d.visibility!=='Conselho');
 const id=s.delib,selected=delib(id);
 const rows=cards.map(d=>'<div class="list-item"><div><strong>'+esc(d.name)+'</strong><p>'+esc(d.visibility)+' • '+(s.role==='prescon'?summary(d.id).votes+' votos fictícios':'votos ocultos durante a deliberação')+'</p></div><div class="right">'+tag(d.status,d.status==='Aberta'?'green':'yellow')+(d.id==='idealize'?'<a class="btn red" href="./pages/idealize.html">Abrir PF</a>':'<button class="btn" type="button" data-open-delib="'+d.id+'">Ver</button>')+'</div></div>').join('');
 const extra=(s.role==='prescon')?panel('Respostas da deliberação selecionada',selected.name,recordList(id)) :
 s.role==='counselor'?panel('Simulação de voto • '+esc(D.ejs.find(x=>x.slug===s.ej)?.name||'EJ'),'Nenhum voto será gravado no Supabase.','<p class="note">Os votos individuais não são mostrados durante a deliberação. Alterações reais exigem autorização da PRESCON.</p>'+'<div class="toolrow"><select class="select" id="vote-select">'+Object.entries(D.positions).map(([k,x])=>'<option value="'+k+'" '+(s.vote===k?'selected':'')+'>'+esc(x.label)+'</option>').join('')+'</select><button class="btn red" type="button" data-simulate>Simular envio</button></div>') :panel('Permissões nesta visão','A DIREX acompanha apenas conteúdos liberados para consulta.','<div class="notice">Apenas o perfil Conselho pode registrar votos institucionais na versão real.</div>');
 return '<div class="view-grid">'+panel('Deliberações da Rede','Exemplos de diferentes tipos de votação e visibilidade.',rows)+panel('Consultar posicionamentos','Escolha uma deliberação na lista ou abaixo.',titleOptions())+extra+'</div>';
}
function overview(){
 const p=summary('financeiro');
 const actions='<div class="quick-actions"><a class="quick-action" href="./pages/central-automacoes.html"><b>Central de Automações</b><span>Crie deliberações, envie documentos ao Drive e acompanhe tudo num único lugar.</span><strong>Gerenciar →</strong></a><button type="button" class="quick-action" data-nav="deliberacoes"><b>01 · Deliberações</b><span>Consultar propostas, votos e o exemplo do Idealize.</span><strong>Abrir →</strong></button><button type="button" class="quick-action" data-nav="pendencias"><b>02 · Pendências</b><span>Descobrir quais EJs ainda não responderam.</span><strong>Ver pendências →</strong></button><button type="button" class="quick-action" data-nav="relatorios"><b>03 · Análise PRESCON</b><span>Conferir posicionamentos, sugestões e ressalvas.</span><strong>Analisar →</strong></button></div>';
 return '<div class="view-grid">'+panel('Por onde começar','Acesse primeiro as atividades que exigem atenção.',actions)+stats([metric('Respostas recebidas',p.votes,'Planejamento financeiro fictício','✓'),metric('EJs pendentes',p.pending,'Exemplo demonstrativo','◷'),metric('Participação',p.pct+'%','Respostas da simulação','◉')])+panel('Quer explorar os dados?','Análises detalhadas estão organizadas nas áreas específicas.','<div class="toolrow"><button class="btn" type="button" data-nav="engajamento">Ver engajamento →</button><button class="btn" type="button" data-nav="rede">Consultar Rede de EJs →</button><a class="btn" href="./pages/institucional.html">Conheça o NEJLON →</a><a class="btn red" href="./pages/whatsapp.html">Biblioteca de mensagens →</a></div>')+'</div>';
}
function listPanel(title,sub,items){
 return panel(title,sub,items.map(x=>'<div class="list-item"><div><strong>'+esc(x[0])+'</strong><p>'+esc(x[1])+'</p></div>'+tag(x[2]||'Exemplo')+'</div>').join(''));
}
function extras(){
 if(s.section==='demandas')return '<div class="view-grid">'+panel('Demandas reais da Rede','A gestão de demandas funciona com login institucional e decisões registradas, separadamente dos indicadores fictícios desta demonstração.','<a class="btn red" href="./pages/demandas.html">Abrir Sistema de Demandas →</a>')+'</div>';
 if(s.section==='calendario')return listPanel('Compromissos de exemplo','Datas inventadas apenas para apresentação.',[['15 MAR · 19h','Reunião interna do Conselho','Conselho'],['20 MAR · 18h','Encontro da Rede NEJLON','Institucional'],['27 MAR · 14h','Imersão de Lideranças','Formação']]);
 if(s.section==='jornada')return listPanel('Trilha do Conselheiro','Materiais e formações sem exigência de registro extra.',[['Introdução à Governança','Material e atividade introdutória','Concluída'],['Como analisar uma deliberação','Trilha de formação','Em andamento'],['Boas práticas de participação','Encontro formativo','A iniciar']]);
 if(s.section==='rede')return panel('Empresas juniores da Rede','Lista de 29 empresas de exemplo.','<div class="heatmap">'+D.ejs.map(x=>'<button class="heat none" type="button" data-select-rede="'+esc(x.slug)+'"><span class="name">'+esc(x.name)+'</span><span class="pct">EJ</span></button>').join('')+'</div>');
 return '';
}
function roleLanding(){
 if(s.role==='ej_direx')return '<div class="view-grid">'+panel('Demandas da sua EJ','A DIREX da EJ consulta apenas título, classificação, prazo e situação das próprias demandas. Não acessa documentos ou formulários.','<a class="btn red" href="./pages/demandas.html">Consultar minhas demandas →</a>')+'</div>';
 if(s.role==='nucleus_direx')return '<div class="view-grid">'+panel('Fiscalização da Rede','Acompanhe demandas, deliberações e formulários, sem editar registros ou consultar votos individuais.','<a class="btn red" href="./pages/fiscalizacao.html">Abrir fiscalização →</a>')+'</div>';
 return '<div class="view-grid">'+panel('Painel do Conselho','As dez áreas históricas num só lugar. Consulte demandas de todas as EJs apenas em visão geral.','<div class="toolrow"><a class="btn red" href="./pages/painel-conselho.html">Painel do Conselho →</a><a class="btn" href="./pages/demandas.html">Panorama de demandas →</a></div>')+'</div>';
}
function render(){
 if(s.role!=='prescon'&&!role().nav.includes(s.section))s.section='painel';
 $('roles').innerHTML=Object.entries(roleMap).map(([key,r])=>'<button class="role-option '+(key===s.role?'active':'')+'" type="button" data-role="'+key+'" aria-pressed="'+(key===s.role)+'">'+esc(r.name)+'</button>').join('');
 $('ej-picker-wrap').hidden=!['counselor','ej_direx'].includes(s.role);
 $('ej-picker').innerHTML=D.ejs.map(e=>'<option value="'+esc(e.slug)+'" '+(e.slug===s.ej?'selected':'')+'>'+esc(e.name)+'</option>').join('');
 const primary=['painel','deliberacoes','pendencias','relatorios'];
 const navButton=([key,icon,name])=>key==='demandas'?'<a class="nav-button" href="./pages/demandas.html"><span class="nav-icon" aria-hidden="true">'+icon+'</span>'+esc(name)+'</a>':'<button type="button" class="nav-button '+(key===s.section?'active':'')+'" data-nav="'+key+'" aria-current="'+(key===s.section?'page':'false')+'"><span class="nav-icon" aria-hidden="true">'+icon+'</span>'+esc(name)+'</button>';
 const allowed=nav.filter(n=>role().nav.includes(n[0]));
 const mainNav=allowed.filter(n=>primary.includes(n[0]));
 const secondaryNav=allowed.filter(n=>!primary.includes(n[0]));
 const menu=mainNav.map(navButton).join('')+(secondaryNav.length?'<details class="nav-more" '+(secondaryNav.some(n=>n[0]===s.section)?'open':'')+'><summary>Outras áreas <span aria-hidden="true">⌄</span></summary>'+secondaryNav.map(navButton).join('')+'</details>':'');
 $('desktop-nav').innerHTML=menu+(s.role==='prescon'?'<a class="nav-button auto-portal-link" href="./pages/central-automacoes.html">⚙ Automações</a>':s.role==='counselor'?'<a class="nav-button auto-portal-link" href="./pages/painel-conselho.html">☷ Painel do Conselho</a>':s.role==='nucleus_direx'?'<a class="nav-button auto-portal-link" href="./pages/fiscalizacao.html">◉ Fiscalização</a>':'');
 // Em telas pequenas, navegação linear: evita opções ocultas em <details> dentro do carrossel.
 $('mobile-nav').innerHTML=allowed.map(navButton).join('')+(s.role==='prescon'?'<a class="nav-button auto-portal-link" href="./pages/central-automacoes.html">⚙ Automações</a>':s.role==='counselor'?'<a class="nav-button auto-portal-link" href="./pages/painel-conselho.html">☷ Conselho</a>':s.role==='nucleus_direx'?'<a class="nav-button auto-portal-link" href="./pages/fiscalizacao.html">◉ Fiscalização</a>':'');
 heading();
 if(s.role==='prescon')$('view').innerHTML=s.section==='painel'?overview():s.section==='engajamento'?'<div class="view-grid">'+heatmap()+trend()+'</div>':s.section==='deliberacoes'?deliberations():s.section==='pendencias'?pending():s.section==='relatorios'?reports():extras();
 else $('view').innerHTML=s.section==='painel'?roleLanding():s.section==='deliberacoes'&&s.role==='counselor'?deliberations():s.section==='deliberacoes'&&s.role==='nucleus_direx'?panel('Deliberações e formulários','A DIREX do Núcleo acompanha pelo painel autenticado de fiscalização, sem editar nem ver votos individuais.','<a class="btn red" href="./pages/fiscalizacao.html">Abrir fiscalização →</a>'):extras();
}
document.addEventListener('click',e=>{
 const target=e.target.closest('button');if(!target)return;
 if(target.dataset.role){s.role=target.dataset.role;s.section='painel';render();return;}
 if(target.dataset.nav){s.section=target.dataset.nav;render();return;}
 if(target.dataset.ej){s.selected=target.dataset.ej;render();return;}
 if(target.dataset.filter){s.filter=target.dataset.filter;render();return;}
 if(target.dataset.position){s.positionFilter=target.dataset.position;render();return;}
 if(target.dataset.openDelib){s.delib=target.dataset.openDelib;s.section='deliberacoes';render();return;}
 if(target.dataset.selectRede){s.selected=target.dataset.selectRede;s.section='painel';s.role='prescon';render();return;}
 if(target.hasAttribute('data-simulate')){const toast=$('toast');toast.textContent='Voto simulado! Nenhuma resposta foi registrada.';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),3500);}
});
document.addEventListener('change',e=>{
 if(e.target.id==='ej-picker'){s.ej=e.target.value;render();}
 if(e.target.id==='delib-select'){s.delib=e.target.value;s.positionFilter='all';render();}
 if(e.target.id==='vote-select')s.vote=e.target.value;
});
document.addEventListener('input',e=>{
 if(e.target.id==='ej-search'){
  const cursor=e.target.selectionStart;
  s.search=e.target.value;render();
  const next=$('ej-search');if(next){next.focus();next.setSelectionRange(cursor,cursor);}
 }
});
$('current-date').textContent=new Intl.DateTimeFormat('pt-BR',{dateStyle:'long',timeZone:'America/Sao_Paulo'}).format(new Date());
render();
})();