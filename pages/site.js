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
const nav=[
 ['painel','◫','Início'],['deliberacoes','☷','Deliberações'],
 ['pendencias','◷','Pendências'],['relatorios','▤','Relatórios'],['demandas','☑','Demandas'],
 ['calendario','▦','Calendário'],['rede','⬡','Rede de EJs']
];
const roleMap={
 prescon:{name:'PRESCON',nav:nav.map(x=>x[0])},
 counselor:{name:'Conselho',nav:['painel','calendario','deliberacoes','demandas','rede']},
 ej_direx:{name:'DIREX da EJ',nav:['painel','calendario','demandas']},
 nucleus_direx:{name:'DIREX do Núcleo',nav:['painel','calendario','deliberacoes','demandas']}
};
const s={role:'prescon',section:'painel',ej:'unect',selected:'unect',filter:'all',search:'',delib:'financeiro',vote:'favorable',positionFilter:'all',calendarMonth:new Date().getMonth(),calendarYear:new Date().getFullYear()};
const $=id=>document.getElementById(id);
// Perfis institucionais verificados em fonte universitária; não inferir URLs das demais EJs.
const ejInstagram=Object.freeze({unect:'https://www.instagram.com/unectjr/',select:'https://www.instagram.com/select.eng/',elo:'https://www.instagram.com/eloconsultoria/',ecae:'https://www.instagram.com/ecaeuel/','3e':'https://www.instagram.com/3euel/',bioma:'https://www.instagram.com/biomambiental/',smartmec:'https://www.instagram.com/smartmec.ej/',smatjr:'https://www.instagram.com/smat.jr/',lex:'https://www.instagram.com/lexempresajr/',boson:'https://www.instagram.com/bosonconsultoria/',notton:'https://www.instagram.com/notton.ej/',cotton:'https://www.instagram.com/cottonconsultoria/',sete:'https://www.instagram.com/sete.consultoria/',therion:'https://www.instagram.com/therion.ej/',aprimora:'https://www.instagram.com/aprimora.ej/',gaia:'https://www.instagram.com/gaiajr_ambiental/',consoagro:'https://www.instagram.com/consoagro/',meca:'https://www.instagram.com/meca.jr/'});
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Math.round(n)+'%';
const role=()=>roleMap[s.role];
const votes=id=>{
 const valid=new Set(D.ejs.map(e=>e.slug));
 const seen=new Set();
 return (Array.isArray(D.votes[id])?D.votes[id]:[]).filter(v=>{
  if(!v||!valid.has(v.slug)||!D.positions[v.position]||seen.has(v.slug))return false;
  seen.add(v.slug);return true;
 });
};
const delib=id=>D.delibs.find(x=>x.id===id)||D.delibs[0];
const done=(ej,id)=>votes(id).find(v=>v.slug===ej);
const summary=id=>{const n=votes(id).length,total=D.ejs.length;return {votes:n,pending:Math.max(0,total-n),pct:total?Math.round(n*100/total):0}};
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
function reportDocument(){
 const id=s.delib,d=delib(id),v=votes(id),sum=summary(id),now=new Intl.DateTimeFormat('pt-BR',{dateStyle:'long',timeStyle:'short',timeZone:'America/Sao_Paulo'}).format(new Date());
 const counts=Object.entries(D.positions).map(([key,p])=>({key,label:p.label,count:v.filter(x=>x.position===key).length}));
 const rows=counts.map(x=>'<tr><td>'+esc(x.label)+'</td><td>'+x.count+'</td><td>'+ (v.length?Math.round(x.count*100/v.length):0)+'%</td></tr>').join('');
 const blocks=counts.map(x=>'<div class="result-line"><span>'+esc(x.label)+'</span><span class="result-track"><i style="width:'+(v.length?Math.round(x.count*100/v.length):0)+'%"></i></span><b>'+x.count+'</b></div>').join('');
 const anonymousNote=note=>{let clean=String(note||'');for(const e of [...D.ejs].sort((a,b)=>b.name.length-a.name.length))clean=clean.replaceAll(e.name,'[EJ]');clean=clean.replace(/^\s*(?:A|O|As|Os)\s+.{1,70}?\s+(?=considera|entende|sugere|solicita|propõe|recomenda|aponta|pede|defende|avalia)/iu,'A EJ ');return clean;};
 const entries=positions=>v.filter(x=>positions.includes(x.position)&&x.note&&x.note.trim()).map(x=>'<li>'+esc(anonymousNote(x.note))+'</li>').join('');
 const rejections=entries(['against']),suggestions=entries(['suggestions']),caveats=entries(['qualified']);
 const missingCount=D.ejs.filter(e=>!v.some(x=>x.slug===e.slug)).length;const missing=missingCount?missingCount+' Empresa(s) Júnior(es) sem voto registrado.':'Nenhuma pendência.';
 const caveat=id==='idealize'?'<p class="warning"><strong>Limitação:</strong> o IDEALIZE apresenta apenas os votos fictícios do cenário C1; não consolida C2 nem rateios.</p>':'';
 const css=`@page{size:A4;margin:36mm 19mm 28mm}*{box-sizing:border-box}html{background:#fff}body{margin:0;font-family:Arial,Helvetica,sans-serif;font-size:10.5pt;line-height:1.48;color:#414141;-webkit-print-color-adjust:exact;print-color-adjust:exact}header,footer,.watermark{position:fixed;left:0;right:0}header{top:-29mm;height:27mm;border-bottom:1px solid #c83339;display:flex;align-items:center;justify-content:space-between;padding:0 1mm 3mm;z-index:3;background:#fff}.brand{display:flex;align-items:center;gap:8px;color:#123d46}.brand svg{width:39px;height:43px}.brand strong{font-family:Georgia,serif;font-weight:normal;font-size:13pt;display:block}.brand small{display:block;font-size:6pt;letter-spacing:.7px}.prescon{text-align:right;color:#c42d35}.prescon strong{font-size:13pt;display:block}.prescon span{font-size:9pt;font-weight:bold}footer{bottom:-23mm;height:22mm;text-align:center;color:#777;border-top:1px solid #c83339;padding-top:4mm;font-size:8.5pt;z-index:3;background:linear-gradient(to bottom,#fff 0%,#fff 80%,transparent 80%)}footer:after{content:'';position:fixed;bottom:-28mm;left:-19mm;right:-19mm;height:6mm;background:linear-gradient(to right,#ca3039 0 20%,#94bf0b 20% 40%,#00515d 40% 60%,#ca3039 60% 80%,#94bf0b 80% 90%,#00515d 90%)}.watermark{z-index:-1;top:30%;height:48%;opacity:.21;pointer-events:none}.triangle{position:absolute;display:block;clip-path:polygon(0 0,100% 0,45% 100%)}.triangle.a{background:#e9ef60;width:54%;height:35%;left:0;top:0;transform:rotate(-9deg)}.triangle.b{background:#1d9aa7;width:48%;height:70%;right:0;top:0;transform:rotate(16deg)}.triangle.c{background:#ec777b;width:35%;height:32%;left:31%;bottom:0;transform:rotate(170deg)}main{position:relative;z-index:1}h1{font-size:17pt;line-height:1.35;text-align:center;color:#c42d35;margin:1mm 0 6mm}h2{font-size:11.5pt;text-transform:uppercase;margin:8mm 0 3mm;color:#414141;break-after:avoid}h3{font-size:10.5pt;margin:5mm 0 2mm;break-after:avoid}.intro{font-style:italic;color:#6e6e6e;text-align:justify}.warning{padding:8px 11px;border-left:3px solid #c42d35;background:#fff5f5;font-size:9pt}.metrics{margin:4mm 0 7mm;padding-left:8mm}.metrics li{margin:2mm 0}.result-line{display:flex;align-items:center;gap:8px;margin:2mm 0;font-size:9pt}.result-line span:first-child{width:40%;flex-shrink:0}.result-track{height:10px;flex:1;background:#e8e8e8;border-radius:9px;overflow:hidden}.result-track i{height:100%;display:block;background:#c42d35}.result-line b{min-width:22px;text-align:right}.entries{padding-left:7mm}.entries li{margin:2.5mm 0;break-inside:avoid}.muted{color:#777}.decision{border-left:2px solid #b7b7b7;padding-left:10px;color:#666;font-style:italic}.approval{display:inline-block;font-weight:bold;padding:0 3px}.approval.yes{background:#8bdf71}.approval.no{background:#ef6666;color:white}table{border-collapse:collapse;width:100%;margin:3mm 0}th,td{padding:7px;border-bottom:1px solid #ddd;text-align:left}th{color:#b62e36}tr{break-inside:avoid}small{color:#777}section{break-inside:auto}
/* Modelo institucional 2026: logo oficial em SVG e identificação fiel. */
.brand img{display:block;width:185px;height:74px;object-fit:contain;object-position:left center}
.prescon strong{font-size:15pt}.prescon span{font-size:10pt}
footer{font-size:8pt;line-height:1.4}
header{border-bottom-color:#c52d35}
@media print{header,footer,.watermark{-webkit-print-color-adjust:exact;print-color-adjust:exact}header{background:white}footer{background:white}}
@media screen{body{max-width:794px;margin:auto;padding:145px 60px 110px;box-shadow:0 0 25px #ddd}header{top:0;padding:20px 60px;height:108px}footer{bottom:0;padding:12px 0;height:72px}.watermark{top:31%}footer:after{bottom:0;left:0;right:0;height:8px}}`;
 const header='<header><div class="brand"><img src="./logos/nejlon.svg?v=nejlon-20261122-8" alt="NEJ Londrina"></div><div class="prescon"><strong>Presidência do Conselho</strong><span>Geisily Vargas</span></div></header>';
 const footer='<footer><div>Núcleo das Empresas Juniores de Londrina | @nej.londrina</div><div>Rodovia Celso Garcia Cid, 2500 - Jardim Portal Versalhes 1, Londrina - PR, 86.057-970</div></footer>';
 const templateUrl=new URL('./pages/templates/relatorio-deliberacao-modelo-original.svg',document.baseURI).href;
 const printCss=`@page{size:A4;margin:36mm 19mm 30mm;background-image:url('${templateUrl}');background-size:210mm 297mm;background-repeat:no-repeat;background-position:center center}header,footer,.watermark,.official-template{display:none!important}main{position:relative;z-index:1}body{background:transparent}@media screen{body{max-width:794px;margin:0 auto;padding:140px 60px 110px;min-height:1122px;box-shadow:0 0 25px #ddd;background:#fff url('${templateUrl}') center top/100% 1122px no-repeat}}@media print{html,body{margin:0!important;padding:0!important;background:transparent!important}h1,h2,h3{break-after:avoid-page}tr,.entries li{break-inside:avoid-page}thead{display:table-header-group}p{orphans:3;widows:3}}`;

 return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório de Deliberação — '+esc(d.name)+'</title><style>'+css+'</style><style>'+printCss+'</style></head><body><img class="official-template" src="'+esc(templateUrl)+'" alt=""><main>'+
 '<h1>Relatório da Deliberação — '+esc(d.name)+'</h1><p class="intro">Este documento apresenta o panorama e os posicionamentos referentes à deliberação selecionada, para consulta da Presidência do Conselho do Núcleo das Empresas Juniores de Londrina.</p>'+
 '<p class="warning"><strong>DEMONSTRAÇÃO — SEM VALIDADE INSTITUCIONAL.</strong> Os votos, os comentários e os resultados são fictícios. Emitido em '+esc(now)+'.</p>'+caveat+
 '<section><h2>1. Panorama geral</h2><ol class="metrics"><li><strong>Votantes:</strong> '+sum.votes+' Empresas Juniores (simulação)</li><li><strong>Representatividade:</strong> '+sum.pct+'% das '+D.ejs.length+' EJs do conjunto demonstrativo</li><li><strong>Pendentes:</strong> '+sum.pending+' EJs</li><li><strong>Situação:</strong> '+esc(d.status)+'</li></ol></section>'+
 '<section><h2>2. '+esc(d.name)+'</h2><h3>2.1. Resultado</h3>'+blocks+'<table><thead><tr><th>Posicionamento</th><th>Votos</th><th>Percentual</th></tr></thead><tbody>'+rows+'</tbody></table>'+
 '<h3>2.2. Pontos que levaram à reprovação</h3><ul class="entries">'+(rejections||'<li>Não há justificativas de reprovação nos exemplos disponíveis.</li>')+'</ul>'+
 '<h3>2.3. Sugestões</h3><ul class="entries">'+(suggestions||'<li>Não há sugestões nos exemplos disponíveis.</li>')+'</ul>'+
 '<h3>2.4. Ressalvas</h3><ul class="entries">'+(caveats||'<li>Não há ressalvas nos exemplos disponíveis.</li>')+'</ul>'+
 '<p class="decision"><strong>Análise da PRESCON:</strong> os comentários acima não possuem parecer de aceitação ou reprovação registrado nesta demonstração. Cabe à Presidência do Conselho analisar e deliberar sobre cada sugestão e ressalva.</p></section>'+
 '<section><h2>3. Participação pendente</h2><p>'+missing+'</p></section>'+
 '<p><small>Relatório anonimizado: a identificação de cada voto é restrita à Presidência do Conselho. Documento gerado automaticamente pelo Portal NEJLON 2027 a partir de dados fictícios. Identidade institucional de referência: modelo de relatório de deliberação enviado pela Presidência do Conselho.</small></p></main></body></html>';
}
function exportReport(format){
 if(s.role!=='prescon')return;
 const html=reportDocument();
 if(format==='pdf'||format==='view'){
  // Store only the already anonymized report HTML in the current browser session.
  // Never put votes, comments or EJ identities in the URL.
  const parsed=new DOMParser().parseFromString(html,'text/html');
  const main=parsed.querySelector('main');
  if(!main){alert('Não foi possível preparar a visualização.');return}
  const snapshot={title:parsed.title,html:main.innerHTML,createdAt:Date.now(),demo:true};
  const key='nejlon-report-'+Date.now()+'-'+Math.random().toString(36).slice(2);
  try{sessionStorage.setItem(key,JSON.stringify(snapshot));}catch(e){alert('O navegador não permitiu preparar o relatório.');return}
  const url=new URL('./pages/relatorio.html',document.baseURI);
  url.searchParams.set('ref',key);
  url.searchParams.set('v','20261122-web-report-fix');
  const w=window.open(url.href,'_blank');
  if(!w){sessionStorage.removeItem(key);alert('Permita pop-ups para visualizar o relatório em outra aba.')}
  return;
 }
 if(format==='doc'){
  const blob=new Blob(['\\ufeff',html],{type:'application/msword;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='relatorio-deliberacao-'+String(s.delib).replace(/[^a-z0-9_-]/gi,'-')+'.doc';
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
}
function reports(){
 const id=s.delib,sum=summary(id),v=votes(id),approval=v.filter(x=>['favorable','suggestions'].includes(x.position)).length,caveats=v.filter(x=>x.position==='qualified').length,suggestions=v.filter(x=>x.position==='suggestions').length;
 const count=v.length;
 const warning=id==='idealize'?'<div class="notice">IDEALIZE: os indicadores deste painel resumem apenas C1 (UEL) dos exemplos fictícios. Para comparar C1/C2, rateios e seus dados financeiros, abra o <a href="./pages/idealize.html">painel do Idealize</a>. Não existem votos simulados de rateio.</div>':'';
 const decisions='<div class="prescon-focus"><div class="prescon-focus-card"><span>EJs sem resposta</span><strong>'+sum.pending+'</strong><button class="btn" type="button" data-nav="pendencias">Ver pendentes →</button></div><div class="prescon-focus-card"><span>Ressalvas para análise humana</span><strong>'+caveats+'</strong><p>Não são aceitas nem rejeitadas automaticamente.</p></div><div class="prescon-focus-card"><span>Sugestões registradas</span><strong>'+suggestions+'</strong><p>Comentários demonstrativos disponíveis abaixo.</p></div></div>';
 return '<div class="view-grid">'+warning+panel('Deliberação analisada','Escolha o conjunto de exemplos para consultar.',titleOptions()+'<div class="toolrow" style="margin-top:18px;display:flex;flex-wrap:wrap;gap:10px"><button class="btn red" type="button" data-export-report="view">👁️ Visualizar relatório em nova aba</button><button class="btn" type="button" data-export-report="doc">📝 Exportar para Google Docs (.doc)</button></div><p class="note">O relatório abre em nova aba, com opção de imprimir ou salvar em PDF; escolha Salvar como PDF. O .doc pode ser aberto no Google Docs.</p>')+
 panel('Exportar relatório','PDF pelo navegador ou arquivo compatível com Word e importação no Google Docs. Dados exclusivamente fictícios.','<div class="toolrow"><button class="btn red" type="button" data-export-report="view">Visualizar relatório</button><button class="btn" type="button" data-export-report="doc">Exportar para Docs (.doc)</button></div><p class="note">Na nova aba, clique em Imprimir / Salvar como PDF e selecione Salvar como PDF. O arquivo .doc pode ser aberto no Word ou enviado ao Google Drive e aberto no Google Docs.</p>')+panel('Prioridades da PRESCON','Pendências e opiniões fictícias, sem providências institucionais reais.',decisions)+
 stats([metric('EJs votantes',sum.votes,'De 29 EJs','◉'),metric('Aprovação direta',count?Math.round(approval*100/count)+'%':'—','Aprova + aprova com sugestões','✓'),metric('Ressalvas',caveats,'Aguardam decisão humana','◷'),metric('Sugestões',suggestions,'Para avaliação humana','✧')])+
 panel('Distribuição dos posicionamentos','Clique em uma barra para filtrar os comentários. Contagem e percentuais fictícios.',responseCharts(id))+
 panel('Pareceres para avaliação','Filtrados pela barra selecionada; não há decisão automática da PRESCON.',recordList(id,false))+'</div>';
}
function deliberations(){
 const cards=D.delibs.filter(d=>s.role!=='ej_direx'||d.visibility!=='Conselho');
 const id=s.delib,selected=delib(id);
 const rows=cards.map(d=>'<div class="list-item"><div><strong>'+esc(d.name)+'</strong><p>'+esc(d.visibility)+' • '+(s.role==='prescon'?summary(d.id).votes+' votos fictícios':'votos ocultos durante a deliberação')+'</p></div><div class="right">'+tag(d.status,d.status==='Aberta'?'green':'yellow')+('<a class="btn red" href="./pages/formulario-deliberacao.html?id='+encodeURIComponent(d.id)+'" target="_blank" rel="noopener">Abrir formulário ↗</a><button class="btn" type="button" data-open-delib="'+d.id+'">Ver</button>')+'</div></div>').join('');
 const extra=(s.role==='prescon')?panel('Respostas da deliberação selecionada',selected.name,recordList(id)) :
 s.role==='counselor'?panel('Simulação de voto • '+esc(D.ejs.find(x=>x.slug===s.ej)?.name||'EJ'),'Nenhum voto será gravado no Supabase.','<p class="note">Os votos individuais não são mostrados durante a deliberação. Alterações reais exigem autorização da PRESCON.</p>'+'<div class="toolrow"><select class="select" id="vote-select">'+Object.entries(D.positions).map(([k,x])=>'<option value="'+k+'" '+(s.vote===k?'selected':'')+'>'+esc(x.label)+'</option>').join('')+'</select><button class="btn red" type="button" data-simulate>Simular envio</button></div>') :panel('Permissões nesta visão','A DIREX acompanha apenas conteúdos liberados para consulta.','<div class="notice">Apenas o perfil Conselho pode registrar votos institucionais na versão real.</div>');
 return '<div class="view-grid">'+(s.role==='prescon'?panel('Criar deliberação financeira','A criação e a publicação são centralizadas na Central de Automações.','<p class="note">Para importar XLSX, gerar a análise e preparar a votação, use a aba Automação de PF.</p>'):'')+panel('Deliberações da Rede','Exemplos de diferentes tipos de votação e visibilidade.',rows)+panel('Consultar posicionamentos','Escolha uma deliberação na lista ou abaixo.',titleOptions())+extra+'</div>';
}
const calendarStorageKey='nejlon2027.calendar.demo.v1';
function calendarEntries(){
 try {const a=JSON.parse(localStorage.getItem(calendarStorageKey)||'[]');return Array.isArray(a)?a.filter(x=>x&&/^\\d{4}-\\d{2}-\\d{2}$/.test(x.date)&&typeof x.title==='string'):[]}catch{return []}
}
function calendarSave(entries){try{localStorage.setItem(calendarStorageKey,JSON.stringify(entries));return true}catch{return false}}
function calendarView(){
 const y=s.calendarYear,m=s.calendarMonth,first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();
 const month=new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(new Date(y,m,1));
 const entries=calendarEntries().sort((a,b)=>a.date.localeCompare(b.date));
 const shown=entries.filter(e=>e.date.startsWith(y+'-'+String(m+1).padStart(2,'0')+'-'));
 const cells=Array.from({length:Math.ceil((first+days)/7)*7},(_,i)=>{
  const d=i-first+1,valid=d>=1&&d<=days,date=y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0'),today=valid&&new Date().toDateString()===new Date(y,m,d).toDateString();
  const items=valid?shown.filter(e=>e.date===date):[];
  return '<div class="portal-calendar-day '+(valid?'':'outside')+(today?' today':'')+'">'+(valid?'<span>'+d+'</span>'+items.map(e=>'<div class="portal-calendar-event" title="'+esc(e.title)+'">'+esc(e.title)+'</div>').join(''):'')+'</div>';
 }).join('');
 const manage=s.role==='prescon'?'<details class="portal-calendar-manager"><summary>Gerenciar agenda de teste</summary><p class="sub">Cadastre compromissos fictícios nesta demonstração. Eles ficam somente neste navegador, sem sincronização nem publicação oficial.</p><form id="portal-calendar-form" class="portal-calendar-form"><label>Data<input name="date" type="date" required></label><label>Compromisso<input name="title" maxlength="100" required placeholder="Nome do evento"></label><label>Categoria<select name="category"><option>Reunião</option><option>Deliberação</option><option>Prazo</option><option>Formação</option><option>Evento</option></select></label><button class="btn red" type="submit">Adicionar à agenda de teste</button></form></details>':'';
 const list=shown.length?shown.map(e=>'<div class="portal-calendar-entry"><div><strong>'+esc(e.date.split('-').reverse().join('/'))+' · '+esc(e.title)+'</strong><p>'+esc(e.category||'Evento')+' · Demonstração local</p></div>'+(s.role==='prescon'?'<button type="button" data-calendar-remove="'+esc(e.id)+'" aria-label="Excluir compromisso '+esc(e.title)+'">Excluir</button>':'')+'</div>').join(''):'<p class="sub">Nenhum compromisso cadastrado para este mês.</p>';
 return '<section class="panel portal-calendar-panel"><div class="portal-calendar-heading"><div><span class="mini-heading">AGENDA DO CONSELHO</span><h3>Calendário</h3><p class="sub">Agenda demonstrativa, sem eventos oficiais publicados.</p></div><div class="portal-calendar-controls"><button type="button" data-calendar-shift="-1" aria-label="Mês anterior">‹</button><strong>'+esc(month)+'</strong><button type="button" data-calendar-shift="1" aria-label="Próximo mês">›</button><button type="button" data-calendar-today>Hoje</button></div></div><div class="portal-calendar-week">'+['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d=>'<span>'+d+'</span>').join('')+'</div><div class="portal-calendar-grid">'+cells+'</div><div class="portal-calendar-empty"><strong>Compromissos do mês</strong>'+list+'</div>'+manage+'</section>';
}

function overview(){
 const p=summary('financeiro');
 return '<div class="view-grid">'+calendarView()+stats([metric('Respostas recebidas',p.votes,'Planejamento financeiro fictício','✓'),metric('EJs pendentes',p.pending,'Exemplo demonstrativo','◷'),metric('Participação',p.pct+'%','Respostas da simulação','◉')])+'</div>';
}
function listPanel(title,sub,items){
 return panel(title,sub,items.map(x=>'<div class="list-item"><div><strong>'+esc(x[0])+'</strong><p>'+esc(x[1])+'</p></div>'+tag(x[2]||'Exemplo')+'</div>').join(''));
}
function extras(){
 if(s.section==='demandas')return '<div class="view-grid">'+panel('Demandas reais da Rede','A gestão de demandas funciona com login institucional e decisões registradas, separadamente dos indicadores fictícios desta demonstração.','<a class="btn red" href="./pages/demandas.html">Abrir Sistema de Demandas →</a>')+'</div>';
 if(s.section==='calendario')return calendarView();
 if(s.section==='rede')return panel('Empresas juniores da Rede','Clique para abrir o Instagram oficial confirmado da EJ. Perfis ainda não verificados ficam identificados, sem redirecionamentos incorretos.','<div class="heatmap">'+D.ejs.map(x=>ejInstagram[x.slug]?'<a class="heat none" href="'+ejInstagram[x.slug]+'" target="_blank" rel="noopener noreferrer" title="Abrir Instagram oficial de '+esc(x.name)+'"><span class="name">'+esc(x.name)+'</span><small style="display:block;font-size:10px">Instagram ↗</small></a>':'<span class="heat none" aria-label="Instagram de '+esc(x.name)+' ainda não confirmado" title="Instagram oficial ainda não confirmado"><span class="name">'+esc(x.name)+'</span><small style="display:block;font-size:10px">A confirmar</small></span>').join('')+'</div>');
 return '';
}
function roleLanding(){
 if(s.role==='ej_direx')return '<div class="view-grid">'+panel('Demandas da sua EJ','Consulte título, classificação, prazo e situação na área Demandas do menu. O perfil não acessa formulários nem documentos internos.','<p class="note">Use a navegação principal para abrir suas demandas.</p>')+'</div>';
 if(s.role==='nucleus_direx')return '<div class="view-grid">'+panel('Fiscalização da Rede','Acompanhe demandas, deliberações e formulários sem editar registros ou consultar votos individuais.','<p class="note">A fiscalização está disponível no menu do seu perfil.</p>')+'</div>';
 return '<div class="view-grid">'+panel('Painel do Conselho','Consulte deliberações, demandas e informações da Rede pelas áreas do menu.','<p class="note">O acesso à votação é feito pelo link autenticado de cada deliberação.</p>')+'</div>';
}
function render(){
 if(s.role!=='prescon'&&!role().nav.includes(s.section))s.section='painel';
 $('roles').innerHTML=Object.entries(roleMap).map(([key,r])=>'<button class="role-option '+(key===s.role?'active':'')+'" type="button" data-role="'+key+'" aria-pressed="'+(key===s.role)+'">'+esc(r.name)+'</button>').join('');
 $('ej-picker-wrap').hidden=!['counselor','ej_direx'].includes(s.role);
 $('ej-picker').innerHTML=D.ejs.map(e=>'<option value="'+esc(e.slug)+'" '+(e.slug===s.ej?'selected':'')+'>'+esc(e.name)+'</option>').join('');
 const councilAccess=$('council-test-access');if(councilAccess){councilAccess.hidden=s.role!=='counselor';const email=$('council-test-email');if(email)email.textContent='conselho'+s.ej+'@nejlondrina.com';}
 const navButton=([key,icon,name])=>key==='calendario'?'<a class="nav-button" href="./pages/calendar-live.html"><span class="nav-icon" aria-hidden="true">'+icon+'</span>'+esc(name)+'</a>':key==='demandas'?'<a class="nav-button" href="./pages/demandas.html"><span class="nav-icon" aria-hidden="true">'+icon+'</span>'+esc(name)+'</a>':'<button type="button" class="nav-button '+(key===s.section?'active':'')+'" data-nav="'+key+'" aria-current="'+(key===s.section?'page':'false')+'"><span class="nav-icon" aria-hidden="true">'+icon+'</span>'+esc(name)+'</button>';
 const publicKeys=['painel','calendario','deliberacoes','demandas','engajamento','rede'];
 const allowed=nav.filter(n=>role().nav.includes(n[0]));
 const common=allowed.filter(n=>publicKeys.includes(n[0])&&n[0]!=='engajamento');
 const adminLinks=[
  ['Automações',[['Criar formulários e PF','./pages/central-automacoes.html#pf'],['Formulários gerais','./pages/central-automacoes.html#criacao'],['Relatórios e resultados','./pages/central-automacoes.html#relatorios']]],
  ['Gestão de demandas',[['Analisar justificativas','./pages/demandas.html'],['Acompanhar demandas','./pages/central-automacoes.html#demandas']]],
  ['Gestão de deliberações',[['Criar deliberação','./pages/prescon-criar-deliberacao.html'],['Publicar e acompanhar','./pages/central-automacoes.html#formularios'],['Relatórios','./pages/relatorio.html']]],
  ['Gestão do Conselho',[['Conselheiros e formação','./pages/gestao-conselho.html'],['Contas de teste e permissões','./pages/test-accounts.html'],['Calendário oficial','./pages/calendar-live.html'],['Gestão de deliberações e relatórios','./pages/deliberation-hub.html'],['Fiscalização','./pages/fiscalizacao.html']]],
 ];
 const admin=s.role==='prescon'?'<div class="portal-admin-heading">ADMINISTRAÇÃO · PRESCON</div>'+adminLinks.map(([label,links])=>'<details class="portal-admin-group"><summary>'+esc(label)+'</summary>'+links.map(([name,url])=>'<a href="'+url+'">'+esc(name)+'</a>').join('')+'</details>').join(''):'';
 const indicators=s.role==='prescon'?'<div class="portal-admin-heading">ANÁLISE · PRESCON</div>'+navButton(['engajamento','▦','Indicadores']):'';
 const supplemental='<a class="nav-button" href="./pages/ej-profile.html">⬡ Perfil da EJ</a>'+(s.role==='nucleus_direx'?'<a class="nav-button" href="./pages/fiscalizacao.html">◉ Fiscalização</a>':'');
 $('desktop-nav').innerHTML=common.map(navButton).join('')+admin+supplemental+indicators;
 $('mobile-nav').innerHTML=common.map(navButton).join('')+admin+supplemental+indicators;
 heading();
 if(s.role==='prescon')$('view').innerHTML=s.section==='painel'?overview():s.section==='engajamento'?'<div class="view-grid">'+heatmap()+trend()+'</div>':s.section==='deliberacoes'?deliberations():s.section==='pendencias'?pending():s.section==='relatorios'?reports():extras();
 else $('view').innerHTML=s.section==='painel'?roleLanding():s.section==='deliberacoes'&&s.role==='counselor'?deliberations():s.section==='deliberacoes'&&s.role==='nucleus_direx'?panel('Deliberações e formulários','A DIREX do Núcleo acompanha pelo painel autenticado de fiscalização, sem editar nem ver votos individuais.','<a class="btn red" href="./pages/fiscalizacao.html">Abrir fiscalização →</a>'):extras();
}
document.addEventListener('click',e=>{
 const target=e.target.closest('button');if(!target)return;
 if(target.dataset.calendarRemove&&s.role==='prescon'){const id=target.dataset.calendarRemove;if(calendarSave(calendarEntries().filter(x=>x.id!==id)))render();else alert('Não foi possível atualizar a agenda neste navegador.');return;}
 if(target.dataset.calendarShift){const d=new Date(s.calendarYear,s.calendarMonth+Number(target.dataset.calendarShift),1);s.calendarYear=d.getFullYear();s.calendarMonth=d.getMonth();render();return;}
 if(target.hasAttribute('data-calendar-today')){s.calendarYear=new Date().getFullYear();s.calendarMonth=new Date().getMonth();render();return;}
 if(target.dataset.exportReport){exportReport(target.dataset.exportReport);return;}
 if(target.dataset.role){s.role=target.dataset.role;s.section='painel';render();return;}
 if(target.dataset.nav){s.section=target.dataset.nav;render();return;}
 if(target.dataset.ej){s.selected=target.dataset.ej;render();return;}
 if(target.dataset.filter){s.filter=target.dataset.filter;render();return;}
 if(target.dataset.position){s.positionFilter=target.dataset.position;render();return;}
 if(target.dataset.openDelib){s.delib=target.dataset.openDelib;s.section='deliberacoes';render();return;}
 if(target.dataset.selectRede){s.selected=target.dataset.selectRede;s.section='painel';s.role='prescon';render();return;}
 if(target.hasAttribute('data-simulate')){const toast=$('toast');toast.textContent='Voto simulado! Nenhuma resposta foi registrada.';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),3500);}
});
document.addEventListener('submit',e=>{if(e.target.id!=='portal-calendar-form'||s.role!=='prescon')return;e.preventDefault();const form=e.target,fd=new FormData(form),date=String(fd.get('date')||''),title=String(fd.get('title')||'').trim(),category=String(fd.get('category')||'Evento');if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(date)||!title)return;const entries=calendarEntries();entries.push({id:String(Date.now())+'-'+Math.random().toString(36).slice(2,8),date,title,category});if(!calendarSave(entries)){alert('Não foi possível salvar neste navegador.');return}const parts=date.split('-');s.calendarYear=Number(parts[0]);s.calendarMonth=Number(parts[1])-1;render();});
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