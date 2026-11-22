import test from 'node:test';
import assert from 'node:assert/strict';
import {effectivePosition,summarizeManualVotes} from '../lib/vote-rules.ts';

test('aprovação direta e com sugestões contam como aprovações',()=>{
 assert.equal(effectivePosition('favorable'),'approved');
 assert.equal(effectivePosition('suggestions'),'approved');
});
test('reprovação e abstenção não são convertidas em aprovação',()=>{
 assert.equal(effectivePosition('against'),'rejected');
 assert.equal(effectivePosition('abstention'),'abstention');
});
test('ressalva pendente continua sem decisão e NÃO conta como aprovada',()=>{
 assert.equal(effectivePosition('qualified'),'pending');
 assert.equal(effectivePosition('qualified',null),'pending');
 assert.equal(effectivePosition('qualified','under_review'),'pending');
});
test('parecer da PRESCON resolve ressalva conforme manual',()=>{
 assert.equal(effectivePosition('qualified','accepted'),'approved');
 assert.equal(effectivePosition('qualified','rejected'),'rejected');
});
test('parecer sobre uma sugestão nunca transforma aprovação direta em reprovação',()=>{
 assert.equal(effectivePosition('suggestions','rejected'),'approved');
});
test('contabiliza votos sem inventar quórum nem resultado institucional',()=>{
 const result=summarizeManualVotes([
  {position:'favorable'},
  {position:'suggestions'},
  {position:'qualified',caveatDecision:'accepted'},
  {position:'qualified',caveatDecision:'rejected'},
  {position:'qualified',caveatDecision:'under_review'},
  {position:'against'},
  {position:'abstention'}
 ]);
 assert.deepEqual(result,{
  received:7,approved:3,rejected:2,pending:1,abstentions:1,
  reviewed:2,resolved:false
 });
});
test('contagem é conclusiva só quando não há ressalvas pendentes',()=>{
 const s=summarizeManualVotes([
  {position:'suggestions'},
  {position:'qualified',caveatDecision:'accepted'},
  {position:'abstention'}
 ]);
 assert.equal(s.resolved,true);
 assert.equal(s.approved,2);
 assert.equal(s.abstentions,1);
});
