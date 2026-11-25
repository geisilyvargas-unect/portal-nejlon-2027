(() => {
'use strict';
const D=window.NEJLON_DEMO;
// Adiciona a deliberação IDEALIZE exclusivamente à demonstração estática.
if(D&&window.NEJLON_IDEALIZE_VOTES&&!D.delibs.some(x=>x.id==='idealize')){
 D.delibs.push({id:'idealize',name:'IDEALIZE 2026 — PF (simulação aberta)',status:'Aberta',visibility:'DIREX e Conselho',due:'Sem prazo oficial — demonstração'});
 D.votes.idealize=(Array.isArray(window.NEJLON_IDEALIZE_VOTES)?window.NEJLON_IDEALIZE_VOTES:[])
  .filter(v=>v&&typeof v.ej==='string'&&Array.isArray(v.answers)&&v.answers[0]&&typeof v.answers[0].position==='string')
  .map(v=>({slug:v.ej,position:v.answers[0].position,note:v.answers[0].justification||''}));
}

if(!D){document.getElementById('view').textContent='Dados demonstrativos indisponíveis.';return;}
const nav=[['deliberacoes','☷','Deliberações'],['engajamento','▦','Participação'],['demandas','▤','Demandas'],['dmc','◎','Desenvolvimento Conselheiro']];
const roleMap={prescon:{name:'PRESCON',nav:nav.map(x=>x[0])},counselor:{name:'Conselho',nav:nav.map(x=>x[0])},ej_direx:{name:'DIREX de EJ',nav:['engajamento','demandas']},nucleus_direx:{name:'DIREX do Núcleo',nav:['deliberacoes','engajamento','demandas']}};
const s={role:'prescon',section:'deliberacoes',ej:'unect',selected:'unect',filter:'all',search:'',delib:'financeiro',vote:'favorable',positionFilter:'all'};
s.level='macro';s.responseFilter='missing';s.delibFilter='all';
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const aliases=['3E-UEL','Aprimora','Artus','Bioma','Bóson Consultoria','Business Consultoria',"CATEC'z",'CONSOAGRO','Cotton','ECAE UEL','Elo Consultoria','FertField','Gaia Júnior','Kinase Consultoria','LEX','Lion','MECA Engenharia','NOTTON','Paracelso Consultoria','Pegasus','SELECT','Sete','SmartMec Jr','SMat Jr','Solução Jr.','TCP Engenharia Civil','Therion','Unect Jr.','VetJr'];
const matchEj=v=>D.ejs.find(e=>[e.slug,e.name].some(n=>norm(n)===norm(v)))||D.ejs.find(e=>norm(v).startsWith(norm(e.slug))&&norm(e.slug).length>=3)||D.ejs.find(e=>norm(v)==='3euel'&&e.slug==='3e');
for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith('nejlon-demo-delib-')){const d=read(k,null);if(d?.id&&!/idealize.*26|26.*idealize/i.test(d.title||'')&&!D.delibs.some(x=>x.id===d.id))D.delibs.push({...d,name:d.title,status:'Aberta',visibility:'Conselho'})}}
const currentYear=Number(new Intl.DateTimeFormat('en',{year:'numeric',timeZone:'America/Sao_Paulo'}).format(new Date()));
const allDelibs=D.delibs.map(d=>({...d,year:Number(d.year)|| (d.id.startsWith('local-')?Number(new Intl.DateTimeFormat('en',{year:'numeric',timeZone:'America/Sao_Paulo'}).format(new Date(parseInt(d.id.slice(6),36)))):d.id==='idealize'?2026:2027)}));
const demoRoster=D.ejs.slice();
const years=()=>[...new Set([currentYear,...allDelibs.map(d=>d.year)])].sort((a,b)=>b-a);
s.year=currentYear;
const archived=()=>s.year<currentYear;
function selectYear(year){s.year=year;D.delibs=allDelibs.filter(d=>d.year===year);s.delib=D.delibs[0]?.id||'';s.delibFilter='all';s.level='macro'}
selectYear(currentYear);
const reportState=id=>read('nejlon-report-v1-'+id,{});
const isOpen=d=>s.year===currentYear&&d.status==='Aberta'&&!reportState(d.id).closed&&!reportState(d.id).published;
const stage=d=>d.id==='edex-26-2'?'published':reportState(d.id).published?'published':isOpen(d)?'open':'analysis';
const $=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ejLogo=(slug)=>'<img class="ej-original-logo" src="./pages/logos/'+esc(({catecz:'catec-z',gaia:'gaia-jr',smatjr:'smat',vetjr:'vet-jr'})[slug]||slug)+'.svg" alt="" loading="lazy">';
const fmt=n=>Math.round(n)+'%';
const role=()=>roleMap[s.role];
const votes=id=>{
 const seen=new Map();
 for(const v of D.votes[id]||[])if(D.ejs.some(e=>e.slug===v.slug)&&D.positions[v.position])seen.set(v.slug,v);
 for(const v of read('nejlon-demo-answers-'+id,[])){const e=matchEj(v.respondent?.ej),a=v.answers?.[0];if(e&&D.positions[a?.position])seen.set(e.slug,{slug:e.slug,position:a.position,note:a.justification||''})}
 return [...seen.values()];
};
const delib=id=>D.delibs.find(x=>x.id===id)||D.delibs[0];
const done=(ej,id)=>votes(id).find(v=>v.slug===ej);
const summary=id=>{const n=votes(id).length,total=D.ejs.length;return {votes:n,pending:Math.max(0,total-n),pct:total?Number((n*100/total).toFixed(2)):0}};
const perEj=ej=>{const n=D.delibs.filter(d=>done(ej.slug,d.id)).length;const total=D.delibs.length;return {...ej,done:n,missing:total-n,pct:Number((total?n*100/total:0).toFixed(2)),status:n/total>=.8?'high':n/total>=.5?'medium':'low',answered:D.delibs.filter(d=>done(ej.slug,d.id)),pending:D.delibs.filter(d=>!done(ej.slug,d.id))}};
const ejData=()=>D.ejs.map(perEj).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
const metric=(label,value,footer,icon='◇')=>'<article class="stat-card"><span class="stat-icon">'+icon+'</span><span class="stat-label">'+esc(label)+'</span><strong>'+esc(value)+'</strong><span class="stat-footer">'+esc(footer)+'</span></article>';
const stats=(items)=>'<div class="stats">'+items.join('')+'</div>';
const panel=(title,sub,content)=>'<section class="panel"><div class="section-row"><div><h3>'+title+'</h3><p class="sub">'+sub+'</p></div></div>'+content+'</section>';
const tag=(txt,cls='')=>'<span class="tag '+cls+'">'+esc(txt)+'</span>';
const titleOptions=()=>'<label class="mini-heading" for="delib-select">DELIBERAÇÃO DEMONSTRATIVA</label><div class="toolrow"><select class="select" id="delib-select">'+D.delibs.map(d=>'<option value="'+d.id+'" '+(d.id===s.delib?'selected':'')+'>'+esc(d.name)+'</option>').join('')+'</select></div>';
const labels={painel:['VISÃO PRESCON','Visão geral da Rede','Acompanhe os principais números, pendências e prioridades em uma única tela.'],
 dmc:['MÍNIMO CONSELHO VIÁVEL','Desenvolvimento Conselheiro','Diagnóstico de Maturidade Conselheira'],
 engajamento:['PARTICIPAÇÃO DAS EJs','Participação','Acompanhe as respostas às deliberações.'],
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
 const heat='<div class="heatmap">'+filtered.map(e=>'<button type="button" class="heat '+e.status+(selected.slug===e.slug?' active':'')+'" data-ej="'+esc(e.slug)+'" aria-pressed="'+(selected.slug===e.slug)+'" title="'+esc(e.name+': '+e.pct+'%')+'"><span class="name">'+ejLogo(e.slug)+esc(e.name)+'</span><span class="pct">'+e.pct+'%</span></button>').join('')+'</div>';
 const legend='<div class="heat-info"><span><i class="swatch high"></i>80–100%</span><span><i class="swatch medium"></i>50–79%</span><span><i class="swatch low"></i>0–49%</span></div>';
 const detail='<div class="profile-head"><div class="avatar">'+ejLogo(selected.slug)+'</div><div><span class="small-cap">FICHA DE PARTICIPAÇÃO</span><h3>'+esc(selected.name)+'</h3></div></div><div class="profile-value">'+selected.pct+'%</div><p class="sub">Taxa de resposta nas deliberações fictícias</p><div class="progress" role="progressbar" aria-valuenow="'+selected.pct+'" aria-valuemin="0" aria-valuemax="100"><div class="fill" style="width:'+selected.pct+'%"></div></div><div class="detail-stats"><div><b>'+selected.done+'</b><span>Respondidas</span></div><div><b>'+selected.missing+'</b><span>Pendentes</span></div><div><b>'+selected.done+' / '+D.delibs.length+'</b><span>Participação</span></div></div><div class="microheading">✓ COM RESPOSTA</div><ul class="bulletlist">'+(selected.answered.map(d=>'<li>'+esc(d.name)+'</li>').join('')||'<li>Nenhuma neste exemplo</li>')+'</ul><div class="microheading">◷ SEM RESPOSTA</div><ul class="bulletlist">'+(selected.pending.map(d=>'<li>'+esc(d.name)+'</li>').join('')||'<li>Todas respondidas</li>')+'</ul>';
 return '<div class="split">'+panel('Mapa de calor · 29 EJs','Clique em cada EJ para conferir sua participação.',controls+heat+(filtered.length?'':'<p class="note">Nenhuma EJ corresponde ao filtro.</p>')+legend+'<p class="note">As cores representam apenas respostas recebidas. Não medem motivação, qualidade ou comprometimento das pessoas.</p>')+panel('Perfil da EJ','Selecione uma das '+all.length+' EJs para consultar seus indicadores.','<div class="toolrow"><label for="profile-ej-select">Selecionar EJ</label><select class="select" id="profile-ej-select" style="width:100%">'+all.map(e=>'<option value="'+esc(e.slug)+'" '+(e.slug===selected.slug?'selected':'')+'>'+esc(e.name)+'</option>').join('')+'</select></div>'+detail)+'</div>';
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
 return '<details class="record"><summary><span>'+ejLogo(x.slug)+esc(name)+'</span>'+tag(D.positions[x.position].label,x.position==='favorable'?'green':x.position==='against'?'red':'yellow')+'</summary><p>'+esc(x.note)+'</p><small class="note">Exemplo fictício · sem efeito institucional</small></details>';
 }).join(''):'<p class="note">Nenhum registro demonstrativo neste filtro.</p>';
}
function pending(){
 const id=s.delib,completed=new Set(votes(id).map(v=>v.slug)),missing=D.ejs.filter(e=>!completed.has(e.slug)),sum=summary(id);
 return '<div class="view-grid">'+panel('Selecionar deliberação','As pendências mudam com o exemplo escolhido.',titleOptions())+stats([metric('Empresas juniores',D.ejs.length,'Rede simulada','⬡'),metric('Responderam',sum.votes,'Votos fictícios','✓'),metric('EJs pendentes',sum.pending,'Ainda sem resposta','◷'),metric('Representatividade',sum.pct+'%','Cálculo automático','◉')])+panel('EJs sem resposta · '+missing.length,'Não são pendências reais; nenhuma cobrança é enviada.',missing.map(e=>'<div class="list-item"><div><strong>'+ejLogo(e.slug)+esc(e.name)+'</strong><p>Sem registro neste cenário fictício</p></div>'+tag('Pendente','yellow')+'</div>').join('')||'<p class="notice">Todas as EJs responderam!</p>')+'</div>';
}
function reportDocument(){
 const id=s.delib,d=delib(id),v=votes(id),sum=summary(id),now=new Intl.DateTimeFormat('pt-BR',{dateStyle:'long',timeStyle:'short',timeZone:'America/Sao_Paulo'}).format(new Date());
 const counts=Object.entries(D.positions).map(([key,p])=>({key,label:p.label,count:v.filter(x=>x.position===key).length}));
 const rows=counts.map(x=>'<tr><td>'+esc(x.label)+'</td><td>'+x.count+'</td><td>'+ (v.length?Math.round(x.count*100/v.length):0)+'%</td></tr>').join('');
 const blocks=counts.map(x=>'<div class="result-line"><span>'+esc(x.label)+'</span><span class="result-track"><i style="width:'+(v.length?Math.round(x.count*100/v.length):0)+'%"></i></span><b>'+x.count+'</b></div>').join('');
 const entries=positions=>v.filter(x=>positions.includes(x.position)&&x.note&&x.note.trim()).map(x=>'<li><strong>'+esc(D.ejs.find(e=>e.slug===x.slug)?.name||x.slug)+'</strong> — '+esc(x.note)+'</li>').join('');
 const rejections=entries(['against']),suggestions=entries(['suggestions']),caveats=entries(['qualified']);
 const missing=D.ejs.filter(e=>!v.some(x=>x.slug===e.slug)).map(e=>esc(e.name)).join(', ')||'Nenhuma';
 const caveat=id==='idealize'?'<p class="warning"><strong>Limitação:</strong> o IDEALIZE apresenta apenas os votos fictícios do cenário C1; não consolida C2 nem rateios.</p>':'';
 const css=`@page{size:A4;margin:36mm 19mm 28mm}*{box-sizing:border-box}html{background:#fff}body{margin:0;font-family:Arial,Helvetica,sans-serif;font-size:10.5pt;line-height:1.48;color:#414141;-webkit-print-color-adjust:exact;print-color-adjust:exact}header,footer,.watermark{position:fixed;left:0;right:0}header{top:-29mm;height:27mm;border-bottom:1px solid #c83339;display:flex;align-items:center;justify-content:space-between;padding:0 1mm 3mm;z-index:3;background:#fff}.brand{display:flex;align-items:center;gap:8px;color:#123d46}.brand img{width:55px;height:55px;object-fit:contain;background:#171717;border-radius:5px}.brand strong{font-family:Georgia,serif;font-weight:normal;font-size:13pt;display:block}.brand small{display:block;font-size:6pt;letter-spacing:.7px}.prescon{text-align:right;color:#c42d35}.prescon strong{font-size:13pt;display:block}.prescon span{font-size:9pt;font-weight:bold}footer{bottom:-23mm;height:22mm;text-align:center;color:#777;border-top:1px solid #c83339;padding-top:4mm;font-size:8.5pt;z-index:3;background:linear-gradient(to bottom,#fff 0%,#fff 80%,transparent 80%)}footer:after{content:'';position:fixed;bottom:-28mm;left:-19mm;right:-19mm;height:6mm;background:linear-gradient(to right,#ca3039 0 20%,#94bf0b 20% 40%,#00515d 40% 60%,#ca3039 60% 80%,#94bf0b 80% 90%,#00515d 90%)}.watermark{z-index:-1;top:30%;height:48%;opacity:.21;pointer-events:none}.triangle{position:absolute;display:block;clip-path:polygon(0 0,100% 0,45% 100%)}.triangle.a{background:#e9ef60;width:54%;height:35%;left:0;top:0;transform:rotate(-9deg)}.triangle.b{background:#1d9aa7;width:48%;height:70%;right:0;top:0;transform:rotate(16deg)}.triangle.c{background:#ec777b;width:35%;height:32%;left:31%;bottom:0;transform:rotate(170deg)}main{position:relative;z-index:1}h1{font-size:17pt;line-height:1.35;text-align:center;color:#c42d35;margin:1mm 0 6mm}h2{font-size:11.5pt;text-transform:uppercase;margin:8mm 0 3mm;color:#414141;break-after:avoid}h3{font-size:10.5pt;margin:5mm 0 2mm;break-after:avoid}.intro{font-style:italic;color:#6e6e6e;text-align:justify}.warning{padding:8px 11px;border-left:3px solid #c42d35;background:#fff5f5;font-size:9pt}.metrics{margin:4mm 0 7mm;padding-left:8mm}.metrics li{margin:2mm 0}.result-line{display:flex;align-items:center;gap:8px;margin:2mm 0;font-size:9pt}.result-line span:first-child{width:40%;flex-shrink:0}.result-track{height:10px;flex:1;background:#e8e8e8;border-radius:9px;overflow:hidden}.result-track i{height:100%;display:block;background:#c42d35}.result-line b{min-width:22px;text-align:right}.entries{padding-left:7mm}.entries li{margin:2.5mm 0;break-inside:avoid}.muted{color:#777}.decision{border-left:2px solid #b7b7b7;padding-left:10px;color:#666;font-style:italic}.approval{display:inline-block;font-weight:bold;padding:0 3px}.approval.yes{background:#8bdf71}.approval.no{background:#ef6666;color:white}table{border-collapse:collapse;width:100%;margin:3mm 0}th,td{padding:7px;border-bottom:1px solid #ddd;text-align:left}th{color:#b62e36}tr{break-inside:avoid}small{color:#777}section{break-inside:auto}@media screen{body{max-width:794px;margin:auto;padding:145px 60px 110px;box-shadow:0 0 25px #ddd}header{top:0;padding:20px 60px;height:108px}footer{bottom:0;padding:12px 0;height:72px}.watermark{top:31%}footer:after{bottom:0;left:0;right:0;height:8px}}`;
 const logo='<img src="'+new URL('./pages/logos/nejlon.svg',location.href).href+'" alt="NEJ Londrina">';
 const header='<header><div class="brand">'+logo+'<div><strong>NEJ LONDRINA</strong><small>NÚCLEO DAS EMPRESAS JUNIORES<br>DE LONDRINA</small></div></div><div class="prescon"><strong>Presidência do Conselho</strong><span>Portal NEJLON 2027</span></div></header>';
 const footer='<footer>presconselho@nejlondrina.com | @nej.londrina<div>Rodovia Celso Garcia Cid, 2500 — Londrina, PR</div></footer>';
 return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório de Deliberação — '+esc(d.name)+'</title><style>'+css+'</style></head><body>'+header+footer+'<div class="watermark"><i class="triangle a"></i><i class="triangle b"></i><i class="triangle c"></i></div><main>'+
 '<h1>Relatório da Deliberação — '+esc(d.name)+'</h1><p class="intro">Este documento apresenta o panorama e os posicionamentos referentes à deliberação selecionada, para consulta da Presidência do Conselho do Núcleo das Empresas Juniores de Londrina.</p>'+
 '<p class="warning"><strong>DEMONSTRAÇÃO — SEM VALIDADE INSTITUCIONAL.</strong> Os votos, os comentários e os resultados são fictícios. Emitido em '+esc(now)+'.</p>'+caveat+
 '<section><h2>1. Panorama geral</h2><ol class="metrics"><li><strong>Votantes:</strong> '+sum.votes+' Empresas Juniores (simulação)</li><li><strong>Representatividade:</strong> '+sum.pct+'% das '+D.ejs.length+' EJs do conjunto demonstrativo</li><li><strong>Pendentes:</strong> '+sum.pending+' EJs</li><li><strong>Situação:</strong> '+esc(d.status)+'</li></ol></section>'+
 '<section><h2>2. '+esc(d.name)+'</h2><h3>2.1. Resultado</h3>'+blocks+'<table><thead><tr><th>Posicionamento</th><th>Votos</th><th>Percentual</th></tr></thead><tbody>'+rows+'</tbody></table>'+
 '<h3>2.2. Pontos que levaram à reprovação</h3><ul class="entries">'+(rejections||'<li>Não há justificativas de reprovação nos exemplos disponíveis.</li>')+'</ul>'+
 '<h3>2.3. Sugestões</h3><ul class="entries">'+(suggestions||'<li>Não há sugestões nos exemplos disponíveis.</li>')+'</ul>'+
 '<h3>2.4. Ressalvas</h3><ul class="entries">'+(caveats||'<li>Não há ressalvas nos exemplos disponíveis.</li>')+'</ul>'+
 '<p class="decision"><strong>Análise da PRESCON:</strong> os comentários acima não possuem parecer de aceitação ou reprovação registrado nesta demonstração. Cabe à Presidência do Conselho analisar e deliberar sobre cada sugestão e ressalva.</p></section>'+
 '<section><h2>3. Empresas Juniores pendentes</h2><p>'+missing+'</p></section>'+
 '<p><small>Documento gerado automaticamente pelo Portal NEJLON 2027 a partir de dados fictícios. Layout inspirado no relatório institucional de deliberação do 1º trimestre de 2026.</small></p></main></body></html>';
}
function exportReport(format){
 if(s.role!=='prescon')return;
 const html=reportDocument();
 if(format==='pdf'){
  const w=window.open('','_blank');
  if(!w){alert('Permita pop-ups para abrir a versão de impressão do relatório.');return}
  w.document.open();w.document.write(html);w.document.close();
  w.focus();w.print();return;
 }
 if(format==='doc'){
  const blob=new Blob(['\\ufeff',html],{type:'application/msword;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='relatorio-deliberacao-'+String(s.delib).replace(/[^a-z0-9_-]/gi,'-')+'.doc';
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
}
function reports(){return panel('Central de relatórios','Apuração por cenário, pareceres e publicação.','<a class="btn red" href="./pages/relatorio.html?role='+ (s.role==='prescon'?'prescon':'counselor') +'">Abrir central de relatórios →</a>');}
function deliberations(){
 const filters=[['all','Todas'],['open','Abertas'],['analysis','Em análise'],['published','Finalizadas']];
 const controls='<div class="toolrow">'+filters.map(([k,t])=>'<button class="filter '+(s.delibFilter===k?'active':'')+'" data-delib-filter="'+k+'">'+t+'</button>').join('')+'</div>';
 const rows=D.delibs.filter(d=>s.delibFilter==='all'||stage(d)===s.delibFilter).map(d=>{
 const st=stage(d),open=isOpen(d),pub=!!reportState(d.id).published,admin=s.role==='prescon',voted=!!done(s.ej,d.id),id=encodeURIComponent(d.id),form=(d.id==='idealize'?'./pages/idealize.html?':'./pages/formulario-deliberacao.html?id='+id+'&')+'role='+s.role+'&ej='+encodeURIComponent(s.ej)+'&mode='+(admin||!open?'view':'vote');
 const report='./pages/relatorio.html?id='+id+'&role='+s.role;
 const count=summary(d.id);
 if(d.id==='edex-26-2')return '<section class="delib-card"><div class="delib-card-head"><div><span class="delib-kicker">HISTÓRICO 2026</span><h3>'+esc(d.name)+'</h3></div>'+tag('Encerrada')+'</div><p>10/09/2026 a 15/09/2026 — “data fictícia, sem registro”</p><p>Participação e resultado: sem registro.</p><div style="overflow-x:auto"><table class="demand-map"><thead><tr><th>Cenário</th><th>Entradas</th><th>Despesas</th><th>Saldo</th></tr></thead><tbody>'+ (d.financial?.scenarios||[]).map(x=>'<tr><th>'+esc(x.name)+'</th>'+[x.income,x.expenses,x.balance].map(n=>'<td>'+Number(n).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})+'</td>').join('')+'</tr>').join('')+'</tbody></table></div></section>';
 return '<section class="delib-card"><div class="delib-card-head"><div><span class="delib-kicker">DELIBERAÇÃO</span><h3>'+esc(d.name)+'</h3></div><span class="delib-status '+st+'">'+(st==='open'?'Votação aberta':st==='published'?'Finalizada':'Em apuração')+'</span></div><div class="delib-progress"><div><span>'+count.votes+' de '+D.ejs.length+' EJs responderam</span><strong>'+count.pct+'%</strong></div><div class="delib-track" role="progressbar" aria-valuenow="'+count.pct+'" aria-valuemin="0" aria-valuemax="100"><i style="width:'+count.pct+'%"></i></div>'+(!admin?'<small>'+ (voted?'Seu voto registrado':open?'Seu voto pendente':'Sua EJ não respondeu')+'</small>':'')+'</div><div class="delib-actions"><div><a class="delib-action primary" href="'+form+'"><span>▤</span> Ver formulário <span>↗</span></a><small>'+(open&&!admin?'Disponível para votação':'Disponível para consulta')+'</small></div><div>'+(admin||pub?'<a class="delib-action secondary" href="'+report+'"><span>▥</span> Ver relatório <span>↗</span></a>':'<button class="delib-action secondary" disabled>Ver relatório</button>')+'<small>'+(pub?'Publicado — última versão disponível':admin?'Disponível para apuração':open?'Aguardando encerramento':'Em elaboração pela PRESCON')+'</small></div></div></section>';
 }).join('');
 return '<div class="view-grid">'+(s.role==='prescon'&&s.year===currentYear?'<div class="toolrow"><a class="btn red" href="./pages/prescon-criar-deliberacao.html">＋ Nova deliberação</a></div>':'')+controls+(rows||'<p class="note">Nenhuma deliberação neste filtro.</p>')+'</div>';
}
function participation(){
 if(!D.delibs.length)return '<p class="note">Nenhuma deliberação registrada neste ano. Não há indicadores disponíveis.</p>';
 if(s.role==='nucleus_direx')return '<div class="view-grid">'+stats([metric('EJs da Rede',D.ejs.length,'Elegíveis'),metric('Deliberações',D.delibs.length,'Total'),metric('Participação média',(D.delibs.reduce((a,d)=>a+summary(d.id).pct,0)/D.delibs.length).toFixed(2)+'%','Rede')])+trend()+'</div>';
 const individual=e=>stats([metric('Taxa de participação',e.pct+'%','Respostas registradas'),metric('Respondidas',e.done,'Deliberações'),metric('Sem resposta',e.missing,'Deliberações')])+panel('Histórico de participação',esc(e.name),D.delibs.map(d=>'<div class="list-item"><strong>'+esc(d.name)+'</strong>'+tag(done(e.slug,d.id)?'Respondida':isOpen(d)?'Pendente':'Não respondeu',done(e.slug,d.id)?'green':'yellow')+'</div>').join(''));
 if(!['prescon','counselor'].includes(s.role))return '<div class="view-grid">'+individual(perEj(D.ejs.find(e=>e.slug===s.ej)))+'</div>';
 const tabs='<div class="toolrow">'+[['macro','Macro'],['delib','Por deliberação'],['micro','Micro']].map(([k,t])=>'<button class="filter '+(s.level===k?'active':'')+'" data-level="'+k+'">'+t+'</button>').join('')+'</div>';
 if(s.level==='macro')return '<div class="view-grid">'+tabs+stats([metric('EJs da Rede',D.ejs.length,'Elegíveis'),metric('Deliberações',D.delibs.length,'Total'),metric('Participação média',(D.delibs.reduce((a,d)=>a+summary(d.id).pct,0)/D.delibs.length).toFixed(2)+'%','Rede')])+trend()+heatmap()+'</div>';
 if(s.level==='micro'){const all=ejData(),e=all.find(e=>e.slug===s.selected)||all[0];return '<div class="view-grid">'+tabs+panel('Selecionar EJ','','<select class="select" id="profile-ej-select">'+all.map(x=>'<option value="'+esc(x.slug)+'" '+(x.slug===e.slug?'selected':'')+'>'+esc(x.name)+'</option>').join('')+'</select>')+individual(e)+'</div>'}
 const d=delib(s.delib),sum=summary(d.id),all=ejData(),missing=all.filter(e=>!done(e.slug,d.id));
 return '<div class="view-grid">'+tabs+panel('Selecionar deliberação','Consulte a situação de cada EJ.',titleOptions())+stats([metric('Elegíveis',D.ejs.length,'EJs'),metric('Responderam',sum.votes,'EJs'),metric('Sem resposta',sum.pending,'EJs'),metric('Representatividade',sum.pct+'%','Participação')])+panel('Situação das EJs','', '<div class="toolrow">'+[['all','Todas'],['done','Responderam'],['missing','Não responderam']].map(([k,t])=>'<button class="filter '+(s.responseFilter===k?'active':'')+'" data-response-filter="'+k+'">'+t+'</button>').join('')+'</div>'+all.filter(e=>s.responseFilter==='all'||(s.responseFilter==='done'?!!done(e.slug,d.id):!done(e.slug,d.id))).map(e=>'<div class="list-item"><strong>'+ejLogo(e.slug)+esc(e.name)+'</strong>'+tag(done(e.slug,d.id)?'Respondida':isOpen(d)?'Pendente':'Não respondeu',done(e.slug,d.id)?'green':'yellow')+'</div>').join('')+'<button class="btn" data-copy-missing>Copiar lista de EJs sem resposta ('+missing.length+')</button>')+'</div>';
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
 if(s.section==='rede')return panel('Empresas juniores da Rede','Lista de 29 empresas de exemplo.','<div class="heatmap">'+D.ejs.map(x=>'<button class="heat none" type="button" data-select-rede="'+esc(x.slug)+'"><span class="name">'+ejLogo(x.slug)+esc(x.name)+'</span><span class="pct">EJ</span></button>').join('')+'</div>');
 return '';
}
function roleLanding(){
 if(s.role==='ej_direx')return '<div class="view-grid">'+panel('Demandas da sua EJ','A DIREX da EJ consulta apenas título, classificação, prazo e situação das próprias demandas. Não acessa documentos ou formulários.','<a class="btn red" href="./pages/demandas.html">Consultar minhas demandas →</a>')+'</div>';
 if(s.role==='nucleus_direx')return '<div class="view-grid">'+panel('Fiscalização da Rede','Acompanhe demandas, deliberações e formulários, sem editar registros ou consultar votos individuais.','<p class="note">Consulta demonstrativa de deliberações, sem acesso a votos individuais.</p>')+'</div>';
 return '<div class="view-grid">'+panel('Painel do Conselho','As dez áreas históricas num só lugar. Consulte demandas de todas as EJs apenas em visão geral.','<div class="toolrow"><a class="btn red" href="./pages/painel-conselho.html">Painel do Conselho →</a><a class="btn" href="./pages/demandas.html">Panorama de demandas →</a></div>')+'</div>';
}
function render(){
 if(!role().nav.includes(s.section))s.section=role().nav[0];
 $('roles').innerHTML=Object.entries(roleMap).map(([key,r])=>'<button class="role-option '+(key===s.role?'active':'')+'" type="button" data-role="'+key+'" aria-pressed="'+(key===s.role)+'">'+esc(r.name)+'</button>').join('');
 $('ej-picker-wrap').hidden=!['counselor','ej_direx'].includes(s.role);
 $('ej-picker').innerHTML=D.ejs.map(e=>'<option value="'+esc(e.slug)+'" '+(e.slug===s.ej?'selected':'')+'>'+esc(e.name)+'</option>').join('');
 const primary=nav.map(n=>n[0]);
 const navButton=([key,icon,name])=>key==='demandas'?'<details class="demand-nav" '+(s.section==='demandas'?'open':'')+'><summary class="nav-button '+(s.section==='demandas'?'active':'')+'">▤ Demandas <span>⌄</span></summary>'+[['geral','Visão geral'],['lancar','Lançar demandas'],['mapa','Mapa de demandas'],['justificativas','Justificativas'],['historico','Histórico'],['politica','Política de participação']].filter(([k])=>k!=='lancar'||s.role==='prescon').map(([k,t])=>'<button type="button" class="nav-button demand-sub" data-demand-section="'+k+'">'+t+'</button>').join('')+'</details>':'<button type="button" class="nav-button '+(key===s.section?'active':'')+'" data-nav="'+key+'" aria-current="'+(key===s.section?'page':'false')+'"><span class="nav-icon" aria-hidden="true">'+icon+'</span>'+esc(name)+'</button>';
 const allowed=nav.filter(n=>role().nav.includes(n[0]));
 const mainNav=allowed.filter(n=>primary.includes(n[0]));
 const secondaryNav=allowed.filter(n=>!primary.includes(n[0]));
 const yearButton=y=>'<button type="button" class="nav-button '+(s.year===y?'active':'')+'" data-year="'+y+'">'+y+(y===currentYear?' · Ano vigente':y>currentYear?' · Prévia futura':' · Histórico')+'</button>';
 const yearMenu=yearButton(currentYear)+(years().some(y=>y<currentYear)?'<details '+(archived()?'open':'')+'><summary>Anos anteriores</summary>'+years().filter(y=>y<currentYear).map(yearButton).join('')+'</details>':'')+years().filter(y=>y>currentYear).map(yearButton).join('');
 const menu=mainNav.map(navButton).join('')+(secondaryNav.length?'<details class="nav-more" '+(secondaryNav.some(n=>n[0]===s.section)?'open':'')+'><summary>Outras áreas <span aria-hidden="true">⌄</span></summary>'+secondaryNav.map(navButton).join('')+'</details>':'');
 const createDelib=s.role==='prescon'?'<a class="nav-button new-deliberation" href="./pages/prescon-criar-deliberacao.html" style="background:#e00000;color:#fff;font-weight:800;border:2px solid #e00000;border-radius:8px;margin:8px 0 12px;padding:12px;display:flex;align-items:center;gap:8px"><span aria-hidden="true">＋</span> Nova deliberação</a>':'';
 $('desktop-nav').innerHTML=menu;
 // Em telas pequenas, navegação linear: evita opções ocultas em <details> dentro do carrossel.
 $('mobile-nav').innerHTML=allowed.map(navButton).join('');
 heading();const yearHost=$('current-date');yearHost.innerHTML='<label for="management-year" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">Ano da gestão <select id="management-year" class="select" aria-label="Ano da gestão">'+years().map(y=>'<option value="'+y+'" '+(s.year===y?'selected':'')+'>'+y+(y<currentYear?' · Histórico':y>currentYear?' · Prévia':' · Vigente')+'</option>').join('')+'</select></label>';yearHost.querySelector('select').onchange=e=>{selectYear(Number(e.target.value));render()};$('section-eyebrow').textContent+=' · '+s.year+(archived()?' · CONSULTA':'');
 if(s.section==='demandas'){window.NEJLON_DEMANDAS.render($('view'),{role:s.role,year:s.year,ej:s.ej,ejs:D.ejs,section:s.demandSection||'geral',delibs:D.delibs,votes,closed:d=>stage(d)==='published'||reportState(d.id).closed===true});return;}
 if(s.section==='dmc'){window.NEJLON_DMC.render($('view'),s.role,s.year);return;}
 if(s.section==='engajamento'){ $('view').innerHTML=participation();return; }
 if(s.role==='prescon')$('view').innerHTML=s.section==='painel'?overview():s.section==='engajamento'?'<div class="view-grid">'+heatmap()+trend()+'</div>':s.section==='deliberacoes'?deliberations():s.section==='pendencias'?pending():s.section==='relatorios'?reports():extras();
 else $('view').innerHTML=s.section==='relatorios'?reports():s.section==='painel'?roleLanding():s.section==='deliberacoes'&&s.role==='counselor'?deliberations():s.section==='deliberacoes'&&s.role==='nucleus_direx'?panel('Relatórios de deliberação','Consulta exclusiva aos relatórios publicados pela PRESCON.',D.delibs.map(d=>'<div class="list-item"><div><strong>'+esc(d.name)+'</strong><p>'+ (reportState(d.id).published?'Publicado':'Aguardando publicação')+'</p></div>'+(reportState(d.id).published?'<a class="btn red" href="./pages/relatorio.html?role=counselor&id='+encodeURIComponent(d.id)+'">Ver relatório</a>':'<button class="btn" disabled>Ver relatório</button>')+'</div>').join('')):extras();
}
document.addEventListener('click',e=>{
 const target=e.target.closest('button');if(!target)return;
 if(target.dataset.demandSection){s.section='demandas';s.demandSection=target.dataset.demandSection;render();return;}
 if(target.dataset.year){selectYear(Number(target.dataset.year));render();return;}
 if(target.dataset.level){s.level=target.dataset.level;render();return;}
 if(target.dataset.delibFilter){s.delibFilter=target.dataset.delibFilter;render();return;}
 if(target.dataset.responseFilter){s.responseFilter=target.dataset.responseFilter;render();return;}
 if(target.hasAttribute('data-copy-missing')){const list=ejData().filter(e=>!done(e.slug,s.delib)).map(e=>e.name).join('\n');navigator.clipboard.writeText(list).then(()=>{target.textContent='Lista copiada!'}).catch(()=>prompt('Copie a lista:',list));return;}
 if(target.dataset.exportReport){exportReport(target.dataset.exportReport);return;}
 if(target.dataset.role){s.role=target.dataset.role;s.section='deliberacoes';render();return;}
 if(target.dataset.nav){s.section=target.dataset.nav;render();return;}
 if(target.dataset.ej){s.selected=target.dataset.ej;render();return;}
 if(target.dataset.filter){s.filter=target.dataset.filter;render();return;}
 if(target.dataset.position){s.positionFilter=target.dataset.position;render();return;}
 if(target.dataset.openDelib){s.delib=target.dataset.openDelib;s.section='deliberacoes';render();return;}
 if(target.dataset.selectRede){s.selected=target.dataset.selectRede;s.section='deliberacoes';s.role='prescon';render();return;}
 if(target.hasAttribute('data-simulate')){const toast=$('toast');toast.textContent='Voto simulado! Nenhuma resposta foi registrada.';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),3500);}
});
document.addEventListener('change',e=>{
 if(e.target.id==='profile-ej-select'){s.selected=e.target.value;render();$('profile-ej-select')?.focus();return;}
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