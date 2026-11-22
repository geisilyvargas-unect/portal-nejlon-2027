(() => {
'use strict';
const P=window.NEJLON_IDEALIZE,D=window.NEJLON_DEMO,V=window.NEJLON_IDEALIZE_VOTES;
if(!P||!D||!V){document.body.textContent='Dados da demonstração indisponíveis.';return;}
const $=id=>document.getElementById(id);
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>v==null?'—':new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v);
const projNames={pessimistic:'Pessimista',realistic:'Realista',optimistic:'Otimista'};
const choiceNames={favorable:'Aprova',suggestions:'Aprova com sugestões',qualified:'Aprova com ressalvas',against:'Reprova',abstention:'Abstem'};
const descriptions={
 favorable:'O(a) conselheiro(a) concorda integralmente com o que foi apresentado no documento.',
 suggestions:'O(a) conselheiro(a) concorda integralmente e apresenta sugestões; a deliberação é contabilizada como aprovação.',
 qualified:'O(a) conselheiro(a) concorda parcialmente, condicionado(a) ao acolhimento das ressalvas pela PRESCON. Caso não acatadas, contabiliza como reprovação.',
 against:'O(a) conselheiro(a) não aprova a proposta e apresenta motivos relevantes à Presidência do Conselho.',
 abstention:'O(a) conselheiro(a) se abstém e opta por não votar.'
};
const states={projection:'realistic',rateio:true,submission:null};
const stats=(label,value,small)=>'<div class="stat-card"><span class="stat-label">'+escape(label)+'</span><strong>'+escape(value)+'</strong><span class="stat-footer">'+escape(small)+'</span></div>';
const table=(headers,rows)=>'<div class="idealize-overflow"><table><thead><tr>'+headers.map(x=>'<th>'+escape(x)+'</th>').join('')+'</tr></thead><tbody>'+
 rows.map(row=>'<tr>'+row.map(x=>'<td>'+escape(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
function drawFinances(){
 const k=states.projection,i=Object.keys(projNames).indexOf(k),rate=states.rateio;
 $('projections').innerHTML=Object.entries(projNames).map(([key,label])=>
  '<button type="button" data-projection="'+key+'" class="'+(k===key?'active':'')+'" aria-pressed="'+(k===key)+'">'+label+'</button>').join('');
 $('financial-grid').innerHTML=P.alternatives.map(a=>{
  const p=a.projections[k],revenue=rate?p.revenueWithRateio:p.revenue,
   balance=revenue-p.expenses;
  const expenses=a.expenseLines.map(l=>[l.coordination,l.description+' — '+l.details,money(l.values[i])]);
  const tickets=a.ticketPrices.map((price,j)=>[['Lote 1','Lote 2','Extra'][j],money(price),a.ticketCounts[k][j]]);
  const rateio=a.rates.map((r,j)=>[r.city,r.km+' km',(r.rate*100).toLocaleString('pt-BR',{maximumFractionDigits:2})+'%',money(a.rateioPrices[j][0])]);
  return '<article class="idealize-financial-card"><span class="tag red">'+escape(a.label)+'</span><h3>'+escape(a.venue)+'</h3>'+
   '<div class="idealize-financial-stats">'+
   '<div><span>Congressistas</span><strong>'+p.attendees+'</strong></div>'+
   '<div><span>Despesas previstas</span><strong>'+money(p.expenses)+'</strong></div>'+
   '<div><span>Receita '+(rate?'com':'sem')+' rateio</span><strong>'+money(revenue)+'</strong></div>'+
   '<div class="'+(balance>=0?'positive':'negative')+'"><span>Saldo previsto</span><strong>'+money(balance)+'</strong></div></div>'+
   '<details><summary>Detalhar despesas, lotes e rateio</summary>'+
   '<h4>Projeção de despesas</h4>'+table(['Coordenação','Descrição','Valor'],expenses)+
   '<h4>Ingressos por lote (sem rateio)</h4>'+table(['Lote','Valor unitário','Congressistas'],tickets)+
   '<h4>Ingresso com rateio por localidade</h4>'+table(['Núcleo','Distância','Rateio','1º lote'],rateio)+'</details></article>';
 }).join('');
}
function drawForm(){
 $('ej').innerHTML=D.ejs.map(e=>'<option value="'+escape(e.slug)+'">'+escape(e.name)+'</option>').join('');
 $('vote-guide').innerHTML=Object.entries(choiceNames).map(([key,v])=>
  '<div class="idealize-guide-item"><strong>'+escape(v.toUpperCase())+'</strong><p>'+escape(descriptions[key])+'</p></div>').join('');
 for(const id of ['clarity','difficulty']){
  const option=$(''+id);
  option.innerHTML='<option value="">Selecione</option>'+[0,1,2,3,4,5].map(n=>'<option value="'+n+'">'+n+(n===0?(id==='clarity'?' — Nada claro':' — Sem dificuldade'):n===5?(id==='clarity'?' — Muito claro':' — Muita dificuldade'):'')+'</option>').join('');
 }
 $('vote-scenarios').innerHTML=P.alternatives.map((a,index)=>
  '<section class="idealize-scenario"><span class="eyebrow">[C'+(index+1)+'] CENÁRIO '+(index+1)+'</span>'+
  '<h3>'+escape(a.title)+'</h3><p class="sub">Após analisar a proposta financeira da '+escape(a.venue)+', escolha uma posição para esta alternativa.</p>'+
  '<fieldset><legend>Sobre o [C'+(index+1)+'] CENÁRIO '+(index+1)+', você... *</legend>'+
   '<div class="idealize-choices">'+Object.entries(choiceNames).map(([k,v])=>
    '<label><input type="radio" name="position_'+a.scenarioKey+'" value="'+k+'" required><span>'+escape(v)+'</span></label>').join('')+
  '</div></fieldset>'+
  '<label id="just_'+a.scenarioKey+'" hidden>Justifique a sua decisão e insira seus pontos: <textarea rows="3" name="justification_'+a.scenarioKey+'"></textarea></label>'+
  '<label id="sugg_'+a.scenarioKey+'" hidden>Sugestões de melhoria * <textarea rows="3" name="suggestions_'+a.scenarioKey+'"></textarea></label>'+
  '<label id="cave_'+a.scenarioKey+'" hidden>Ressalvas / condições para aprovação * <textarea rows="3" name="caveats_'+a.scenarioKey+'" placeholder="Aprovo, desde que..."></textarea></label>'+
  '</section>').join('');
}
function toggleChoice(key){
 const choice=document.querySelector('input[name="position_'+key+'"]:checked')?.value||'';
 const configs=[['just_',choice&&choice!=='abstention',choice==='against'],['sugg_',choice==='suggestions',true],['cave_',choice==='qualified',true]];
 for(const [prefix,show,required] of configs){
  const label=$(prefix+key);label.hidden=!show;
  const textarea=label.querySelector('textarea');textarea.required=Boolean(show&&required);
 }
 document.querySelectorAll('input[name="position_'+key+'"]').forEach(r=>r.closest('label')?.classList.toggle('chosen',r.checked));
}
function drawResults(){
 $('summary-stats').innerHTML=stats('EJs votantes',V.length,'Registros fictícios')+
  stats('EJs pendentes',D.ejs.length-V.length,'Exemplo aberto')+
  stats('Representatividade',Math.round(V.length/D.ejs.length*100)+'%','Calculada automaticamente')+
  stats('Locais analisados','2','UEL e AURORA');
 $('results').innerHTML=P.alternatives.map(a=>
  '<div class="idealize-result"><h3>'+escape(a.label)+'</h3>'+
  Object.entries(choiceNames).map(([key,label])=>{
   const count=V.filter(v=>v.answers.some(x=>x.scenarioKey===a.scenarioKey&&x.position===key)).length;
   return '<div class="idealize-result-row"><span>'+escape(label)+'</span><div class="idealize-track"><span style="width:'+count/V.length*100+'%"></span></div><strong>'+count+'</strong></div>';
  }).join('')+'</div>').join('');
}
function field(fd,key){return String(fd.get(key)||'').trim()}
function csvRows(){
 const headers=['Carimbo de data/hora','Nome Completo','EJ','Sobre o [C1] CENÁRIO 1, você...',
 'Justifique a sua decisão e insira seus pontos: [C1]','Sugestões [C1]','Ressalvas [C1]',
 'Sobre o [C2] CENÁRIO 2, você...','Justifique a sua decisão e insira seus pontos: [C2]',
 'Sugestões [C2]','Ressalvas [C2]','O quão claro ficou as opções e as formas de votação?',
 'O quanto você sentiu dificuldade na deliberação','Como podemos melhorar?','Tipo de registro'];
 const record=v=>{
  const a=Object.fromEntries(v.answers.map(x=>[x.scenarioKey,x])),x=a.c1||{},y=a.c2||{};
  return [v.updatedAt,v.fullName,v.ej,choiceNames[x.position]||'',x.justification,x.suggestions,x.caveats,
   choiceNames[y.position]||'',y.justification,y.suggestions,y.caveats,v.clarity,v.difficulty,v.improvements,'FICTÍCIO — DEMONSTRAÇÃO'];
 };
 return [headers,...V.map(record),...(states.submission?[record(states.submission)]:[])];
}
function exportCsv(){
 const safe=v=>{let s=String(v??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
 const content='\uFEFF'+csvRows().map(r=>r.map(safe).join(';')).join('\r\n')+'\r\n';
 const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'}));
 const anchor=document.createElement('a');anchor.download='idealize-2026-respostas-ficticias.csv';anchor.href=url;anchor.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function submit(ev){
 ev.preventDefault();
 const form=ev.currentTarget,fd=new FormData(form);
 if(!form.reportValidity())return;
 const answers=P.alternatives.map(a=>({scenarioKey:a.scenarioKey,
  position:field(fd,'position_'+a.scenarioKey),
  justification:field(fd,'justification_'+a.scenarioKey),
  suggestions:field(fd,'suggestions_'+a.scenarioKey),caveats:field(fd,'caveats_'+a.scenarioKey)}));
 if(answers.some(x=>!x.position))return;
 states.submission={fullName:field(fd,'full_name'),ej:field(fd,'ej'),updatedAt:new Date().toISOString(),
  answers,clarity:Number(field(fd,'clarity')),difficulty:Number(field(fd,'difficulty')),improvements:field(fd,'improvements')};
 $('submit-status').textContent='Simulação registrada apenas nesta tela. Os dados oficiais não foram alterados. Baixe o CSV para conferir sua resposta junto aos exemplos.';
}
document.addEventListener('click',e=>{const b=e.target.closest('button[data-projection]');if(b){states.projection=b.dataset.projection;drawFinances();}});
$('with-rateio').addEventListener('change',e=>{states.rateio=e.target.checked;drawFinances();});
$('idealize-vote-form').addEventListener('change',e=>{
 if(e.target.matches('input[type="radio"]'))toggleChoice(e.target.name.replace('position_',''));
});
$('idealize-vote-form').addEventListener('submit',submit);
$('export-csv').addEventListener('click',exportCsv);
$('export-csv-bottom').addEventListener('click',exportCsv);
drawFinances();drawForm();drawResults();
})();