import test from 'node:test';
import assert from 'node:assert/strict';
import {buildEngagement,engagementStatus} from '../lib/engagement.ts';

const ejs=[
 {id:'a',name:'UNECT',slug:'unect'},
 {id:'b',name:'BÓSON',slug:'boson'},
 {id:'c',name:'3E',slug:'3e'}
];
const d=(id, status='open', opts={})=>({id,title:'Deliberação '+id,due_at:'2027-01-'+String(Number(id)||1).padStart(2,'0')+'T12:00:00Z',status,is_demo:false,...opts});

test('Sem deliberações: todos sem dados, nenhuma EJ penalizada',()=>{
 const snap=buildEngagement(ejs,[],[]);
 assert.equal(snap.overallRate,null);
 assert.equal(snap.possible,0);
 assert.equal(snap.withPending,0);
 assert.equal(snap.allDone,0);
 assert.ok(snap.cards.every(x=>x.rate===null&&x.status==='none'));
});
test('Calcula participação de todas as EJs sem duplicar respostas',()=>{
 const snap=buildEngagement(ejs,[d('1'),d('2','closed')],[
  {ej_id:'a',deliberation_id:'1'}, {ej_id:'a',deliberation_id:'1'},
  {ej_id:'a',deliberation_id:'2'}, {ej_id:'b',deliberation_id:'1'}
 ]);
 assert.equal(snap.possible,6);
 assert.equal(snap.responded,3);
 assert.equal(snap.overallRate,50);
 assert.equal(snap.allDone,1);
 assert.equal(snap.withPending,2);
 assert.equal(snap.cards.find(x=>x.slug==='unect').rate,100);
 assert.equal(snap.cards.find(x=>x.slug==='boson').rate,50);
 assert.equal(snap.cards.find(x=>x.slug==='3e').rate,0);
 assert.deepEqual(snap.trend.map(x=>x.answered),[2,1]);
});
test('Ignora rascunhos, registros históricos, dados fictícios e EJs desconhecidas',()=>{
 const snap=buildEngagement(ejs,[d('1'),d('2','draft'),d('3','open',{is_demo:true}),d('4','closed',{is_historical:true})],[
  {ej_id:'a',deliberation_id:'1'},
  {ej_id:'a',deliberation_id:'2'},
  {ej_id:'b',deliberation_id:'3'},
  {ej_id:'c',deliberation_id:'4'},
  {ej_id:'unknown',deliberation_id:'1'}
 ]);
 assert.equal(snap.deliberations,1);
 assert.equal(snap.responded,1);
 assert.equal(snap.possible,3);
 assert.equal(snap.cards.find(x=>x.slug==='boson').answered,0);
});
test('Demonstração precisa ser habilitada explicitamente',()=>{
 const fixtures=[d('1','open',{is_demo:true})];
 const votes=[{ej_id:'a',deliberation_id:'1'}];
 assert.equal(buildEngagement(ejs,fixtures,votes).deliberations,0);
 assert.equal(buildEngagement(ejs,fixtures,votes,{includeDemo:true}).responded,1);
});
test('Cores são categorias de taxa, sem juízo institucional',()=>{
 assert.equal(engagementStatus(null),'none');
 assert.equal(engagementStatus(80),'high');
 assert.equal(engagementStatus(50),'medium');
 assert.equal(engagementStatus(49),'low');
});
test('Mostra até seis deliberações recentes na evolução',()=>{
 const delibs=Array.from({length:8},(_,i)=>d(String(i+1)));
 const snap=buildEngagement(ejs,delibs,[]);
 assert.equal(snap.trend.length,6);
 assert.deepEqual(snap.trend.map(x=>x.id),['3','4','5','6','7','8']);
});
