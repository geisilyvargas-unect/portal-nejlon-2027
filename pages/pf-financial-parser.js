/* Interpretação conservadora do painel PF. Não adivinha valores ausentes. */
(()=>{'use strict';
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
const money=v=>{if(typeof v==='number')return Number.isFinite(v)?v:null;let s=String(v??'').replace(/\s/g,'').replace(/R\$/gi,'').replace(/[−–]/g,'-');if(!s||s==='-')return null;const negative=/^\(.*\)$/.test(s);s=s.replace(/[()]/g,'');if(!/^-?[\d.,]+$/.test(s))return null;if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');else if(/^\d{1,3}(\.\d{3})+$/.test(s))s=s.replace(/\./g,'');const n=Number(s);return Number.isFinite(n)?(negative?-n:n):null};
const names=['pessimistic','realistic','optimistic'];
function parse(sheets){const alternatives=[];const warnings=[];const groups=[];
 for(const sheet of sheets){const rows=sheet.rows||[];const text=norm(sheet.name+' '+rows.slice(0,8).flat().join(' '));const isPanel=/PAINEL DE PROJE|PAINEL FINANCEIR|PLANEJAMENTO FINANCEIR|PROJE[CÇ][AÃ]O|CENARIO/.test(text);if(!isPanel&&!rows.some(r=>r.some(v=>/PESSIMISTA/i.test(String(v)))&&r.some(v=>/REALISTA/i.test(String(v)))&&r.some(v=>/OTIMISTA/i.test(String(v)))))continue;
 let header=-1,cols=[];for(let i=0;i<rows.length;i++){const n=rows[i].map(norm);const p=n.findIndex(x=>x==='PESSIMISTA'),r=n.findIndex(x=>x==='REALISTA'),o=n.findIndex(x=>x==='OTIMISTA');if(p>=0&&r>=0&&o>=0){header=i;cols=[p,r,o];break}}
 if(header<0){warnings.push(sheet.name+': cabeçalho de projeções não encontrado.');continue}
 const sectionRows={expenses:null,revenue:null,balance:null};let section='';
 for(let i=header+1;i<rows.length;i++){const row=rows[i],label=norm(row.slice(0,Math.min(...cols)).join(' '));if(/DESPESAS|CUSTOS|GASTOS|SAIDAS/.test(label))section='expenses';if(/ENTRADAS|RECEITAS|FATURAMENTO/.test(label))section='revenue';if(/SALDO|RESULTADO|SUPERAVIT/.test(label))section='balance';if(/^(TOTAL|SALDO FINAL)$/.test(norm(row.find(x=>norm(x)==='TOTAL'||norm(x)==='SALDO FINAL')))){const key=label.includes('SALDO FINAL')?'balance':section;if(key==='expenses'||key==='balance'){const values=cols.map(c=>money(row[c]));if(values.every(Number.isFinite))sectionRows[key]=values}}
 if(section==='revenue'&&/^(PESSIMISTA|REALISTA|OTIMISTA)$/.test(norm(row.find(x=>names.some((_,j)=>norm(x)===['PESSIMISTA','REALISTA','OTIMISTA'][j]))))){const labelIndex=row.findIndex(x=>['PESSIMISTA','REALISTA','OTIMISTA'].includes(norm(x)));const labelName=norm(row[labelIndex]);const target=['PESSIMISTA','REALISTA','OTIMISTA'].indexOf(labelName);const nums=row.slice(labelIndex+1).map(money).filter(x=>x!==null);if(nums.length){if(!sectionRows.revenue)sectionRows.revenue=[null,null,null];sectionRows.revenue[target]=nums[nums.length-1]}}
 }
 if(!sectionRows.revenue){sectionRows.revenue=[null,null,null]}for(let i=header+1;i<rows.length;i++){const row=rows[i],label=norm(row.slice(0,Math.min(...cols)).join(' '));const vals=cols.map(c=>money(row[c]));if(vals.every(Number.isFinite)){if(/^(TOTAL|SOMA)?\s*(RECEITAS|ENTRADAS|FATURAMENTO)/.test(label))sectionRows.revenue=vals;if(/^(TOTAL|SOMA)?\s*(DESPESAS|CUSTOS|GASTOS|SAIDAS)/.test(label))sectionRows.expenses=vals;if(/^(SALDO|RESULTADO|SUPERAVIT)/.test(label))sectionRows.balance=vals;}}if(!sectionRows.expenses||sectionRows.revenue.some(x=>x===null)){warnings.push(sheet.name+': despesas ou receitas incompletas; confira os dados.');continue}
 const projections={};names.forEach((key,i)=>{projections[key]={expenses:sectionRows.expenses[i],revenue:sectionRows.revenue[i],balance:sectionRows.revenue[i]-sectionRows.expenses[i]};if(sectionRows.balance&&Math.abs(sectionRows.balance[i]-projections[key].balance)>.02)warnings.push(sheet.name+': divergência de saldo em '+['pessimista','realista','otimista'][i])});
 groups.push({sheet:sheet.name,projections});alternatives.push({id:'alt-'+alternatives.length,label:sheet.name,projections});
 }
 if(!alternatives.length)warnings.push('Nenhum painel completo reconhecido. Mantenha a planilha original e revise manualmente.');
 return {alternatives,warnings,sourceSheets:groups.map(x=>x.sheet),status:alternatives.length?'needs-review':'unrecognized'} }

/* Camada gratuita: descoberta flexível de tabelas, sem API paga.
   Nunca substitui uma extração existente que já foi reconhecida. */
function flexibleParse(sheets){
 const warnings=[],alternatives=[],provenance=[];
 const tokens=['PESSIMISTA','REALISTA','OTIMISTA'];
 const typeOfLabel=t=>/^(TOTAL\\s+)?(RECEITAS?|ENTRADAS?|FATURAMENTO)(\\s+TOTAL)?$/.test(t)?'revenue':/^(TOTAL\\s+)?(DESPESAS?|CUSTOS?|GASTOS|SAIDAS)(\\s+TOTAL)?$/.test(t)?'expenses':/^(SALDO|RESULTADO|SUPERAVIT|DEFICIT)(\\s+(FINAL|PREVISTO|PROJETADO))?$/.test(t)?'balance':null;
 for(const sheet of sheets){
  const rows=sheet.rows||[];let blocks=[];
  for(let i=0;i<rows.length;i++){
   const cells=rows[i].map(norm),cols=tokens.map(t=>cells.findIndex(x=>x===t||x.startsWith(t+' ')));
   if(cols.some(c=>c<0)||new Set(cols).size!==3)continue;
   const data={revenue:null,expenses:null,balance:null},sources={};
   for(let j=i+1;j<Math.min(rows.length,i+100);j++){
    const row=rows[j]||[],next=row.map(norm);
    if(tokens.every(t=>next.some(x=>x===t)))break;
    const left=row.slice(0,Math.min(...cols)).map(norm).filter(Boolean);
    const label=left.join(' ').replace(/\\s+/g,' ').trim();
    const type=typeOfLabel(label)||left.map(typeOfLabel).find(Boolean);
    if(!type)continue;
    const vals=cols.map(c=>money(row[c]));
    if(vals.some(v=>v===null))continue;
    if(!data[type]||/TOTAL|SALDO/.test(label)){
     data[type]=vals;
     sources[type]={sheet:sheet.name,row:j+1,columns:cols.map(c=>c+1),label};
    }
   }
   if(!data.revenue||!data.expenses){warnings.push(sheet.name+': projeções encontradas, mas totais de receitas/despesas não identificados na região da linha '+(i+1)+'.');continue}
   const projections={};['pessimistic','realistic','optimistic'].forEach((key,k)=>{
    const revenue=data.revenue[k],expenses=data.expenses[k],balance=revenue-expenses;
    projections[key]={revenue,expenses,balance};
    if(data.balance&&Math.abs(data.balance[k]-balance)>0.02)warnings.push(sheet.name+': saldo divergente na projeção '+tokens[k]+' (linha '+sources.balance.row+').');
   });
   blocks.push({projections,sources,headerRow:i+1});
  }
  blocks.forEach((b,i)=>{
   const label=blocks.length>1?sheet.name+' · bloco '+(i+1):sheet.name;
   alternatives.push({id:'alt-'+alternatives.length,label,projections:b.projections,source:b.sources});
   provenance.push({label,headerRow:b.headerRow,sources:b.sources});
  });
 }
 if(!alternatives.length)warnings.push('Não foram encontrados totais financeiros confiáveis. Confira o arquivo original antes de gerar gráficos.');
 return {alternatives,warnings,sourceSheets:[...new Set(alternatives.map(a=>a.source.revenue.sheet))],provenance,status:alternatives.length?(warnings.length?'needs-review':'validated'):'unrecognized',engine:'free-rules-v2'};
}
function parseFree(sheets){
 const primary=parse(sheets);
 const flexible=flexibleParse(sheets);
 if(!primary.alternatives.length)return flexible;
 const seen=new Set(primary.alternatives.map(a=>a.label));
 const extras=flexible.alternatives.filter(a=>!seen.has(a.label));
 return {...primary,alternatives:[...primary.alternatives,...extras],warnings:[...new Set([...primary.warnings,...flexible.warnings.filter(w=>!w.includes('projeções encontradas'))])],provenance:flexible.provenance,engine:'free-rules-v3',status:primary.warnings.length?'needs-review':'validated'};
}
 window.NEJLON_PF_PARSER={parse:parseFree,money,flexibleParse};
})();