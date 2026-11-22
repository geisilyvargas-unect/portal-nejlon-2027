/* Execute: node tests/pf-demo-smoke.test.js (Node 18+) */
const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
const ctx={window:{},console};vm.createContext(ctx);
for(const file of ['demo-csv-reader.js','pf-financial-parser.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../pages',file),'utf8'),ctx,{filename:file});
const csv=['INDICADOR;PESSIMISTA;REALISTA;OTIMISTA','"RECEITAS";"1.000,00";"2.000,00";"3.000,00"','"DESPESAS";"800,00";"1.200,00";"1.800,00"'].join('\n');
const rows=ctx.window.NEJLON_DEMO_CSV.parse(csv);assert.equal(rows.length,3);assert.equal(rows[1][1],'1.000,00');
const result=ctx.window.NEJLON_PF_PARSER.parse([{name:'Projeções',rows}]);assert.equal(result.alternatives.length,1);assert.equal(result.alternatives[0].projections.realistic.balance,800);
const bad=ctx.window.NEJLON_PF_PARSER.parse([{name:'Planilha vazia',rows:[['sem dados']]}]);assert.equal(bad.alternatives.length,0);
for(const file of ['demo-portability.js','prescon-criar-deliberacao.js','formulario-deliberacao.js','relatorio.js','demo-open-access.js','pf-chart-interpretation.js'])new (require('node:vm').Script)(fs.readFileSync(path.join(__dirname,'../pages',file),'utf8'),{filename:file});
console.log('OK: CSV regional, cenários, saldo, ausência de dados e sintaxe dos módulos.');
