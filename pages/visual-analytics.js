(()=>{
'use strict';
const P=window.NEJLON_IDEALIZE,V=window.NEJLON_IDEALIZE_VOTES;
const root=document.getElementById('interactive-comparison');
if(!P||!root)return;
const pt=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={pessimistic:'Pessimista',realistic:'Realista',optimistic:'Otimista'};
let metric='balance',selected='all';
const choiceLabels={favorable:'Aprova',suggestions:'Aprova c/ sugestões',qualified:'Aprova c/ ressalvas',against:'Reprova',abstention:'Abstenção'};
const voteKeys=['c1','c2'];
function bar(value,max){const percent=Math.min(100,Math.abs(value)/Math.max(1,max)*100);return '<div class="comparison-bar-track"><span style="width:'+percent+'%" class="'+(value<0?'negative':'positive')+'"></span></div>'}
function render(){
 const projection=document.querySelector('[data-projection].active')?.dataset.projection||'realistic';
 const withRateio=document.getElementById('with-rateio')?.checked??true;
 const data=P.alternatives.map((a,i)=>{
  const p=a.projections[projection],revenue=withRateio?p.revenueWithRateio:p.revenue;
  return {name:a.label,venue:a.venue,revenues:revenue,expenses:p.expenses,balance:revenue-p.expenses,attendees:p.attendees};
 });
 const numMetric={balance:'Saldo previsto',revenues:'Receita prevista',expenses:'Despesas previstas'};
 const max=Math.max(1,...data.map(x=>Math.abs(x[metric])));
 const difference=data[0].balance-data[1].balance;
 root.innerHTML='<div class="comparison-header"><div><span class="eyebrow">ANÁLISE VISUAL · DADOS DE REFERÊNCIA</span><h2>Compare C1 e C2</h2><p class="sub">Projeção: <b>'+names[projection]+'</b> · '+(withRateio?'Com rateio':'Sem rateio')+'. Altere os controles acima para recalcular.</p></div><span class="tag yellow">NÃO É VOTAÇÃO</span></div>'+
 '<div class="comparison-toggle" role="group" aria-label="Indicador financeiro">'+Object.entries(numMetric).map(([key,label])=>'<button type="button" class="'+(metric===key?'active':'')+'" data-fin-metric="'+key+'" aria-pressed="'+(metric===key)+'">'+label+'</button>').join('')+'</div>'+
 '<div class="comparison-cards">'+data.map(x=>'<article class="comparison-card"><h3>'+escape(x.name)+'</h3><strong>'+pt(x[metric])+'</strong>'+bar(x[metric],max)+'<p>'+escape(x.venue)+' · '+x.attendees+' congressistas</p><div class="comparison-card-foot"><span>Receita '+pt(x.revenues)+'</span><span>Despesa '+pt(x.expenses)+'</span></div></article>').join('')+'</div>'+
 '<p class="comparison-insight">Diferença de saldo (C1 − C2): <b>'+pt(difference)+'</b>. '+(difference>0?'O saldo previsto do C1 é maior neste recorte.':difference<0?'O saldo previsto do C2 é maior neste recorte.':'Os saldos previstos são iguais neste recorte.')+' Isso não constitui recomendação automática de voto.</p>';
 renderVotes();
}
function renderVotes(){
 const holder=document.getElementById('interactive-votes');
 if(!holder||!Array.isArray(V))return;
 const keys=[['c1','C1 · UEL'],['c2','C2 · AURORA']];
 const selectedVotes=V.flatMap(v=>(v.answers||[]).filter(a=>voteKeys.includes(a.scenarioKey)).map(a=>({ej:v.ej,...a})));
 const colors={favorable:'#3dbc88',suggestions:'#005762',qualified:'#f1bc54',against:'#ce2d32',abstention:'#9c9696'};
 holder.innerHTML='<div class="comparison-header"><div><span class="eyebrow">RESULTADOS ILUSTRATIVOS</span><h2>Posicionamentos por cenário</h2><p class="sub">17 respostas fictícias somente em C1 e C2. Nenhum voto fictício de rateio foi criado.</p></div></div>'+
 '<div class="comparison-toggle" role="group" aria-label="Filtrar por cenário"><button data-vote-scenario="all" aria-pressed="'+(selected==='all')+'" class="'+(selected==='all'?'active':'')+'">Comparar C1 e C2</button>'+keys.map(([key,label])=>'<button data-vote-scenario="'+key+'" aria-pressed="'+(selected===key)+'" class="'+(selected===key?'active':'')+'">'+label+'</button>').join('')+'</div>'+
 keys.filter(([key])=>selected==='all'||selected===key).map(([key,label])=>{
  const found=selectedVotes.filter(v=>v.scenarioKey===key);
  return '<div class="voting-graph"><h3>'+label+' <small>'+found.length+' exemplos</small></h3>'+Object.entries(choiceLabels).map(([pos,title])=>{
   const n=found.filter(v=>v.position===pos).length;
   return '<div class="vote-graph-row"><span>'+title+'</span><div class="comparison-bar-track"><span style="width:'+(found.length?n/found.length*100:0)+'%;background:'+colors[pos]+'"></span></div><b>'+n+'</b></div>';
  }).join('')+'</div>';
 }).join('')+'<p class="pf-disclaimer">Resultados simulados sem validade institucional; ressalvas dependeriam de análise humana da PRESCON.</p>';
}
document.addEventListener('click',e=>{
 const btn=e.target.closest('button');
 if(!btn)return;
 if(btn.dataset.finMetric){metric=btn.dataset.finMetric;render();}
 else if(btn.dataset.voteScenario){selected=btn.dataset.voteScenario;renderVotes();}
 else if(btn.dataset.projection){queueMicrotask(render);}
});
document.getElementById('with-rateio')?.addEventListener('change',()=>queueMicrotask(render));
render();
})();