/* Interpretação automática e conservadora dos gráficos financeiros — demonstração NEJLON. */
(()=>{'use strict';
const labels={pessimistic:'Pessimista',realistic:'Realista',optimistic:'Otimista'},keys=Object.keys(labels);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const fmt=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
const money=n=>Number.isFinite(n);
function interpret(a){
 const p=a?.projections;
 if(!p||!keys.every(k=>money(p[k]?.revenue)&&money(p[k]?.expenses)))return {valid:false,html:'Não há valores suficientes para interpretar este gráfico. Confira o XLSX original; nenhuma conclusão será presumida.'};
 const rows=keys.map(k=>({name:labels[k],revenue:p[k].revenue,expenses:p[k].expenses,balance:p[k].revenue-p[k].expenses}));
 const saldo=rows.map(r=>r.balance);
 const best=rows.reduce((x,y)=>y.balance>x.balance?y:x),worst=rows.reduce((x,y)=>y.balance<x.balance?y:x);
 const summary=rows.map(r=>r.name+': '+(r.balance>0?'superávit':r.balance<0?'déficit':'equilíbrio')+' de '+fmt(Math.abs(r.balance))).join('; ');
 const alert=saldo.every(v=>v>=0)?'Todos os cenários apresentam saldo não negativo.':saldo.every(v=>v<0)?'Todos os cenários apresentam déficit projetado.':'Há cenários com resultados positivos e negativos; a decisão depende das premissas.';
 const gap=Math.max(...saldo)-Math.min(...saldo);
 const html='<div class="pf-auto-interpretation" role="region" aria-label="Interpretação automática dos gráficos"><h4>INTERPRETAÇÃO AUTOMÁTICA · '+esc(a.label)+'</h4><p><strong>Leitura dos saldos:</strong> '+esc(summary)+'.</p><p><strong>Comparação:</strong> maior saldo em '+esc(best.name)+' ('+fmt(best.balance)+') e menor em '+esc(worst.name)+' ('+fmt(worst.balance)+'). Diferença: '+fmt(gap)+'.</p><p><strong>Ponto de atenção:</strong> '+esc(alert)+'</p><p class="pf-interpret-warning">Análise descritiva calculada somente com receitas e despesas identificadas na planilha. Não valida premissas, fórmulas, riscos, viabilidade nem recomenda voto. Confira o XLSX original antes de deliberar.</p></div>';
 return {valid:true,html,rows};
}
function chart(a){
 const p=a?.projections;if(!p||!keys.every(k=>money(p[k]?.revenue)&&money(p[k]?.expenses)))return '';
 const series=[['Receitas','revenue','#0C535E'],['Despesas','expenses','#EA4335'],['Saldo projetado','balance','#97BF1E']];
 const rows=keys.map(k=>({key:k,name:labels[k],revenue:p[k].revenue,expenses:p[k].expenses,balance:p[k].revenue-p[k].expenses}));
 const width=760,left=170,right=30,top=55,rowHeight=43,groupHeight=176,plot=width-left-right;
 
 const minValue=Math.min(0,...rows.flatMap(r=>series.map(x=>r[x[1]]))),maxValue=Math.max(0,...rows.flatMap(r=>series.map(x=>r[x[1]])));const scale=(plot-20)/Math.max(1,maxValue-minValue);const zero=left+10-minValue*scale;
 const line=(x1,y1,x2,y2,color)=>'<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+color+'" stroke-width="1"/>';
 let svg='<svg viewBox="0 0 760 630" role="img" aria-label="Gráfico comparativo de receitas, despesas e saldos projetados para os cenários pessimista, realista e otimista" style="width:100%;height:auto;max-width:900px" xmlns="http://www.w3.org/2000/svg">';
 svg+=line(zero,32,zero,595,'#888');
 rows.forEach((r,i)=>{const base=top+i*groupHeight;svg+='<text x="12" y="'+(base+5)+'" font-size="19" font-weight="800" fill="currentColor">'+esc(r.name)+'</text>';
 series.forEach(([label,key,color],j)=>{const v=r[key],y=base+18+j*rowHeight,w=Math.max(0,Math.abs(v)*scale),x=v<0?zero-w:zero;svg+='<text x="12" y="'+(y+17)+'" font-size="13" fill="currentColor">'+label+'</text><rect x="'+x+'" y="'+y+'" width="'+w+'" height="25" fill="'+color+'" rx="2"/><title>'+esc(r.name+' · '+label+': '+fmt(v))+'</title>';});
 svg+=line(12,base+153,735,base+153,'#aaa')});
 svg+='</svg>';
 const head='<div class="pf-comparison-heading"><h4>GRÁFICO COMPARATIVO · '+esc(a.label)+'</h4><p>Receitas (azul-petróleo), despesas (vermelho) e saldo (verde-limão). Barras à esquerda do eixo central indicam valores negativos.</p></div>';
 const table='<div style="overflow-x:auto"><table class="pf-comparison-table"><thead><tr><th>Indicador</th>'+rows.map(r=>'<th>'+esc(r.name)+'</th>').join('')+'</tr></thead><tbody>'+series.map(([label,key])=>'<tr><th>'+label+'</th>'+rows.map(r=>'<td>'+fmt(r[key])+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
 return '<section class="pf-comparison-chart" aria-label="Comparativo financeiro automático">'+head+svg+table+'</section>';
}
function render(data,target){if(!target)return;const alts=data?.alternatives||[];target.innerHTML=alts.length?alts.map(a=>chart(a)+interpret(a).html).join(''):'<p class="pf-interpret-warning">A planilha não contém um painel financeiro completo reconhecido. A interpretação automática não será exibida; confira os gráficos e dados originais.</p>';if(data?.warnings?.length){const p=document.createElement('p');p.className='pf-interpret-warning';p.textContent='Avisos da extração: '+data.warnings.join(' | ');target.append(p)}}
function create(){const file=document.getElementById('pf-file'),review=document.getElementById('pf-extraction-review');if(!file||!review)return;let target=document.getElementById('pf-auto-analysis');if(!target){target=document.createElement('div');target.id='pf-auto-analysis';target.setAttribute('aria-live','polite');review.after(target)}let version=0;
 document.addEventListener('nejlon:financial-ready',e=>render(e.detail,target));}

function form(){const host=document.getElementById('financial-dashboard');if(!host)return;const id=new URLSearchParams(location.search).get('id')||'financeiro';let data=null;if(id.startsWith('local-')){try{data=JSON.parse(localStorage.getItem('nejlon-demo-delib-'+id)||'null')?.financial}catch{}}const target=document.createElement('div');target.id='pf-form-interpretation';host.after(target);if(data){render(data,target)}else if(id==='idealize'){fetch('./idealize-financial.json').then(r=>{if(!r.ok)throw Error('Dados indisponíveis');return r.json()}).then(d=>render(d,target)).catch(()=>{target.textContent='Interpretação indisponível: consulte os dados financeiros originais.'})}else{target.innerHTML='<p class="pf-interpret-warning">Sem dados estruturados para interpretação automática. Consulte a planilha original.</p>'}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{create();form()});else{create();form()}
})();