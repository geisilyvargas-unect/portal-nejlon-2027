(() => {
'use strict';
const D=window.NEJLON_DEMO;
const DIRECTORY=window.NEJLON_EJ_DIRECTORY||[];
const directoryBySlug=new Map(DIRECTORY.map(e=>[e.slug,e]));
const profile=slug=>directoryBySlug.get(slug)||null;
const logo=(slug,cls='ej-logo')=>{
 const e=profile(slug);
 if(!e)return '<span class="ej-logo ej-logo-fallback">EJ</span>';
 const c=e.logoIndex%5,r=Math.floor(e.logoIndex/5);
 const ejName=D.ejs.find(v=>v.slug===slug)?.name||slug;
 return '<span class="'+cls+'" role="img" aria-label="Logo da '+esc(ejName)+
 '" style="background-image:url(./pages/logo-sprite.webp);background-size:500% 600%;background-position:'+
 (c*25)+'% '+(r*20)+'%"></span>';
};
const igUrl=e=>e?.instagram?'https://www.instagram.com/'+encodeURIComponent(e.instagram)+'/':null;
const waShare=name=>'https://api.whatsapp.com/send?text='+encodeURIComponent('Conheça a '+name+' no Portal NEJLON 2027.');
const waDirect=(entry,name)=>{
 const phone=(entry?.whatsapp||'').replace(/\D/g,'');
 return /^55\d{10,11}$/.test(phone)
  ?'https://wa.me/'+phone+'?text='+encodeURIComponent('Olá! Gostaria de falar com a '+name+'.'):null;
};
const contactButtons=entry=>{
 if(!entry)return '<p class="note">Contato não informado.</p>';
 const name=D.ejs.find(x=>x.slug===entry.slug)?.name||entry.slug;
 const ig=igUrl(entry),wa=waDirect(entry,name);
 return '<div class="ej-contact-actions">'+
 (ig?'<a class="btn" href="'+ig+'" target="_blank" rel="noopener noreferrer">✦ Instagram</a>':'')+
 (wa?'<a class="btn wa" href="'+wa+'" target="_blank" rel="noopener noreferrer">✆ Mandar mensagem no WhatsApp</a>':
 '<a class="btn outline" href="'+waShare(name)+'" target="_blank" rel="noopener noreferrer">↗ Compartilhar no WhatsApp</a>')+
 '</div>'+(wa?'':'<p class="note">Sem número confirmado neste portfólio. Compartilhar não envia mensagem à EJ diretamente.</p>');
};
if(!D){document.getElementById('view').textContent='Dados demonstrativos indisponíveis.';return;}
const nav=[
 ['painel','◫','Visão geral'],['engajamento','▦','Engajamento'],['deliberacoes','☷','Deliberações'],
 ['pendencias','◷','Pendências'],['relatorios','▤','Relatórios'],['demandas','☑','Demandas'],
 ['calendario','▦','Calendário'],['jornada','✧','Jornada'],['rede','⬡','Rede de EJs']
];
const roleMap={
 prescon:{name:'PRESCON',nav:nav.map(x=>x[0])},
 counselor:{name:'Conselho',nav:['painel','deliberacoes','calendario','jornada','rede']},
 ej_direx:{name:'DIREX da EJ',nav:['painel','deliberacoes','demandas','calendario','rede']},
 nucleus_direx:{name:'DIREX do Núcleo',nav:['painel','deliberacoes','demandas','calendario','rede']}
};
const s={role:'prescon',section:'painel',ej:'unect',selected:'unect',filter:'all',search:'',delib:'financeiro',vote:'favorable'};
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
 const detail='<div class="profile-head"><div class="avatar">EJ</div><div><span class="small-cap">FICHA DE PARTICIPAÇÃO</span><h3>'+esc(selected.name)+'</h3></div></div><div class="profile-value">'+selected.pct+'%</div><p class="sub">Taxa de resposta nos três exemplos</p><div class="progress" role="progressbar" aria-valuenow="'+selected.pct+'" aria-valuemin="0" aria-valuemax="100"><div class="fill" style="width:'+selected.pct+'%"></div></div><div class="detail-stats"><div><b>'+selected.done+'</b><span>Respondidas</span></div><div><b>'+selected.missing+'</b><span>Pendentes</span></div><div><b>3</b><span>Deliberações</span></div></div><div class="microheading">✓ COM RESPOSTA</div><ul class="bulletlist">'+(selected.answered.map(d=>'<li>'+esc(d.name)+'</li>').join('')||'<li>Nenhuma neste exemplo</li>')+'</ul><div class="microheading">◷ SEM RESPOSTA</div><ul class="bulletlist">'+(selected.pending.map(d=>'<li>'+esc(d.name)+'</li>').join('')||'<li>Todas respondidas</li>')+'</ul>';
 return '<div class="split">'+panel('Mapa de calor · 29 EJs','Clique em cada EJ para conferir sua participação.',controls+heat+(filtered.length?'':'<p class="note">Nenhuma EJ corresponde ao filtro.</p>')+legend+'<p class="note">As cores representam apenas respostas recebidas. Não medem motivação, qualidade ou comprometimento das pessoas.</p>')+panel('Perfil da EJ','Indicadores calculados a partir de exemplos fictícios.',detail)+'</div>';
}
function trend(){
 const bars=D.delibs.map(d=>({d,pct:summary(d.id).pct,count:summary(d.id).votes}));
 const b='<div class="chart" role="img" aria-label="Participação por deliberação: '+bars.map(x=>x.d.name+' '+x.pct+' por cento').join('; ')+'">'+bars.map(x=>'<div class="barcol"><strong>'+x.pct+'%</strong><div class="barplot"><span class="bar" style="height:'+x.pct+'%"></span></div><span class="charttitle" title="'+esc(x.d.name)+'">'+esc(x.d.name)+'</span><small>'+x.count+'/29 EJs</small></div>').join('')+'</div>';
 return panel('Evolução das respostas','Percentual de EJs que responderam a cada deliberação fictícia.',b);
}
function responseCharts(id){
 const v=votes(id),counts=Object.entries(D.positions).map(([key,item])=>({key,...item,n:v.filter(x=>x.position===key).length}));
 let start=0;const gradient=counts.filter(x=>x.n).map(x=>{const a=start;start+=x.n/v.length*100;return x.color+' '+a+'% '+start+'%'}).join(', ');
 const chart='<div class="donutrow"><div class="donut" style="background:conic-gradient('+gradient+')"><div class="donutinner"><strong>'+v.length+'</strong><span>VOTOS FICTÍCIOS</span></div></div><div class="legend">'+counts.map(x=>'<div class="legendrow"><i class="swatch" style="background:'+x.color+'"></i><span>'+esc(x.label)+'</span><strong>'+x.n+' · '+Math.round(x.n*100/v.length)+'%</strong></div>').join('')+'</div></div>';
 return chart;
}
function recordList(id,justFlagged=false){
 const v=votes(id).filter(x=>!justFlagged||['suggestions','qualified','against'].includes(x.position));
 return v.length?v.map(x=>{
 const name=D.ejs.find(e=>e.slug===x.slug)?.name||x.slug;
 return '<details class="record"><summary><span>'+esc(name)+'</span>'+tag(D.positions[x.position].label,x.position==='favorable'?'green':x.position==='against'?'red':'yellow')+'</summary><p>'+esc(x.note)+'</p><small class="note">Posicionamento demonstrativo · sem efeito institucional</small></details>';
 }).join(''):'<p class="note">Nenhum registro de exemplo nesta categoria.</p>';
}
function pending(){
 const id=s.delib,completed=new Set(votes(id).map(v=>v.slug)),missing=D.ejs.filter(e=>!completed.has(e.slug)),sum=summary(id);
 return '<div class="view-grid">'+panel('Selecionar deliberação','As pendências mudam com o exemplo escolhido.',titleOptions())+stats([metric('Empresas juniores',D.ejs.length,'Rede simulada','⬡'),metric('Responderam',sum.votes,'Votos fictícios','✓'),metric('EJs pendentes',sum.pending,'Ainda sem resposta','◷'),metric('Representatividade',sum.pct+'%','Cálculo automático','◉')])+panel('EJs sem resposta · '+missing.length,'Não são pendências reais; nenhuma cobrança é enviada.',missing.map(e=>'<div class="list-item"><div><strong>'+esc(e.name)+'</strong><p>Sem registro neste cenário fictício</p></div>'+tag('Pendente','yellow')+'</div>').join('')||'<p class="notice">Todas as EJs responderam!</p>')+'</div>';
}
function reports(){
 const id=s.delib,sum=summary(id),v=votes(id),approval=v.filter(x=>['favorable','suggestions'].includes(x.position)).length,caveats=v.filter(x=>x.position==='qualified').length,suggestions=v.filter(x=>x.position==='suggestions').length;
 return '<div class="view-grid">'+panel('Deliberação analisada','Alterne para visualizar os demais relatórios.',titleOptions())+stats([metric('EJs votantes',sum.votes,'De 29 EJs','◉'),metric('Aprovação direta',Math.round(approval*100/v.length)+'%','Dos votos recebidos','✓'),metric('Ressalvas',caveats,'Para análise humana','◷'),metric('Sugestões',suggestions,'Para avaliação humana','✧')])+panel('Distribuição dos posicionamentos','Os dados e o gráfico são recalculados conforme o exemplo selecionado.',responseCharts(id))+panel('Pareceres que exigem decisão da PRESCON','A plataforma organiza os registros, mas não aceita ou rejeita ressalvas automaticamente.',recordList(id,true))+'</div>';
}
function deliberations(){
 const cards=D.delibs.filter(d=>s.role!=='ej_direx'||d.visibility!=='Conselho');
 const id=s.delib,selected=delib(id);
 const rows=cards.map(d=>'<div class="list-item"><div><strong>'+esc(d.name)+'</strong><p>'+esc(d.visibility)+' • '+summary(d.id).votes+' votos fictícios</p></div><div class="right">'+tag(d.status,d.status==='Aberta'?'green':'yellow')+'<button class="btn" type="button" data-open-delib="'+d.id+'">Ver</button></div></div>').join('');
 const extra=(s.role==='prescon')?panel('Respostas da deliberação selecionada',selected.name,recordList(id)) :
 s.role==='counselor'?panel('Simulação de voto • '+esc(D.ejs.find(x=>x.slug===s.ej)?.name||'EJ'),'Nenhum voto será gravado no Supabase.',(done(s.ej,id)?'<div class="notice">Exemplo registrado: '+esc(D.positions[done(s.ej,id).position].label)+'. '+esc(done(s.ej,id).note)+'</div>':'<p class="note">Esta EJ aparece como pendente neste exemplo.</p>')+'<div class="toolrow"><select class="select" id="vote-select">'+Object.entries(D.positions).map(([k,x])=>'<option value="'+k+'" '+(s.vote===k?'selected':'')+'>'+esc(x.label)+'</option>').join('')+'</select><button class="btn red" type="button" data-simulate>Simular envio</button></div>') :panel('Permissões nesta visão','A DIREX acompanha apenas conteúdos liberados para consulta.','<div class="notice">Apenas o perfil Conselho pode registrar votos institucionais na versão real.</div>');
 return '<div class="view-grid">'+panel('Deliberações da Rede','Exemplos de diferentes tipos de votação e visibilidade.',rows)+panel('Consultar posicionamentos','Escolha uma deliberação na lista ou abaixo.',titleOptions())+extra+'</div>';
}
function overview(){
 const p=summary('financeiro');
 return '<div class="view-grid">'+stats([metric('EJs monitoradas','29','Todas da Rede','⬡'),metric('Respostas recebidas',p.votes,'Planejamento financeiro','✓'),metric('Aguardando resposta',p.pending,'Planejamento financeiro','◷'),metric('Participação',p.pct+'%','Planejamento financeiro','◉')])+heatmap()+trend()+panel('O que a plataforma já facilita','Uma visão única para identificar respostas, demandas e próximos passos.','<div class="twocol"><div class="notice">✓ Gráficos e pendências calculados sem planilha.</div><div class="notice">✓ Ficha de cada EJ aberta em um clique.</div></div>')+'</div>';
}
function listPanel(title,sub,items){
 return panel(title,sub,items.map(x=>'<div class="list-item"><div><strong>'+esc(x[0])+'</strong><p>'+esc(x[1])+'</p></div>'+tag(x[2]||'Exemplo')+'</div>').join(''));
}
function extras(){
 if(s.section==='demandas')return '<div class="view-grid">'+stats([metric('A acompanhar','3','Demandas ilustrativas','☷'),metric('Em andamento','1','Execução simulada','◷'),metric('Concluída','1','Exemplo','✓'),metric('Próximo prazo','12/03','2027','▦')])+listPanel('Demandas de exemplo','Exibição visual de responsáveis e status.',[['Atualizar cadastro institucional','Prazo: 12/03/2027 · Responsável: DIREX da EJ','Em andamento'],['Confirmar reunião do Conselho','Prazo: 15/03/2027 · Responsável: Conselho','Pendente'],['Enviar relatório mensal','Prazo: 25/03/2027 · Responsável: EJ','Concluída']])+'</div>';
 if(s.section==='calendario')return listPanel('Compromissos de exemplo','Datas inventadas apenas para apresentação.',[['15 MAR · 19h','Reunião interna do Conselho','Conselho'],['20 MAR · 18h','Encontro da Rede NEJLON','Institucional'],['27 MAR · 14h','Imersão de Lideranças','Formação']]);
 if(s.section==='jornada')return listPanel('Trilha do Conselheiro','Materiais e formações sem exigência de registro extra.',[['Introdução à Governança','Material e atividade introdutória','Concluída'],['Como analisar uma deliberação','Trilha de formação','Em andamento'],['Boas práticas de participação','Encontro formativo','A iniciar']]);
 if(s.section==='rede')return panel('Empresas juniores da Rede','Lista de 29 empresas de exemplo.','<div class="heatmap">'+D.ejs.map(x=>'<button class="heat none" type="button" data-select-rede="'+esc(x.slug)+'"><span class="name">'+esc(x.name)+'</span><span class="pct">EJ</span></button>').join('')+'</div>');
 return '';
}
function render(){
 if(s.role!=='prescon'&&!role().nav.includes(s.section))s.section='painel';
 $('roles').innerHTML=Object.entries(roleMap).map(([key,r])=>'<button class="role-option '+(key===s.role?'active':'')+'" type="button" data-role="'+key+'" aria-pressed="'+(key===s.role)+'">'+esc(r.name)+'</button>').join('');
 $('ej-picker-wrap').hidden=!['counselor','ej_direx'].includes(s.role);
 $('ej-picker').innerHTML=D.ejs.map(e=>'<option value="'+esc(e.slug)+'" '+(e.slug===s.ej?'selected':'')+'>'+esc(e.name)+'</option>').join('');
 const menu=nav.filter(n=>role().nav.includes(n[0])).map(([key,icon,name])=>'<button type="button" class="nav-button '+(key===s.section?'active':'')+'" data-nav="'+key+'" aria-current="'+(key===s.section?'page':'false')+'"><span class="nav-icon" aria-hidden="true">'+icon+'</span>'+esc(name)+'</button>').join('');
 $('desktop-nav').innerHTML=menu;$('mobile-nav').innerHTML=menu;
 heading();
 if(s.role==='prescon')$('view').innerHTML=s.section==='painel'?overview():s.section==='engajamento'?'<div class="view-grid">'+heatmap()+trend()+'</div>':s.section==='deliberacoes'?deliberations():s.section==='pendencias'?pending():s.section==='relatorios'?reports():extras();
 else $('view').innerHTML=s.section==='painel'?'<div class="view-grid">'+stats([metric('EJs da Rede','29','Cadastradas','⬡'),metric('Deliberações','3','Exemplos','☷'),metric('Eventos','3','Compromissos simulados','▦'),metric('Acesso','Consulta','Sem login nesta demo','✓')])+panel('O que este perfil pode fazer','Conheça as permissões e o acompanhamento.', '<div class="notice">Você está na visão '+esc(role().name)+'. As informações são simuladas e não alteram dados oficiais.</div>')+listPanel('Deliberações recentes','Exemplos liberados para sua visão.',D.delibs.filter(d=>s.role!=='ej_direx'||d.visibility!=='Conselho').map(d=>[d.name,summary(d.id).votes+' votos fictícios',d.status]))+'</div>':s.section==='deliberacoes'?deliberations():extras();
}
document.addEventListener('click',e=>{
 const target=e.target.closest('button');if(!target)return;
 if(target.dataset.role){s.role=target.dataset.role;s.section='painel';render();return;}
 if(target.dataset.nav){s.section=target.dataset.nav;render();return;}
 if(target.dataset.ej){s.selected=target.dataset.ej;render();return;}
 if(target.dataset.filter){s.filter=target.dataset.filter;render();return;}
 if(target.dataset.openDelib){s.delib=target.dataset.openDelib;render();return;}
 if(target.dataset.selectRede){s.selected=target.dataset.selectRede;s.section='painel';s.role='prescon';render();return;}
 if(target.hasAttribute('data-simulate')){const toast=$('toast');toast.textContent='Voto simulado! Nenhuma resposta foi registrada.';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),3500);}
});
document.addEventListener('change',e=>{
 if(e.target.id==='ej-picker'){s.ej=e.target.value;render();}
 if(e.target.id==='delib-select'){s.delib=e.target.value;render();}
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