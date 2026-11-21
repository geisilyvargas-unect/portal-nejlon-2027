import test from 'node:test';
import assert from 'node:assert/strict';
import {getPendingEjs,reminderText} from '../lib/pending.ts';
const ejs=[{id:'a',name:'UNECT',slug:'unect'},{id:'b',name:'3E',slug:'3e'},{id:'c',name:'BÓSON',slug:'boson'}];
test('29/EJs: identifica ausentes sem interferir no cadastro',()=>{
 assert.deepEqual(getPendingEjs(ejs,[{ej_id:'b'}]).map(e=>e.id),['a','c']);
 assert.equal(ejs.length,3);
});
test('EJ some das pendências assim que responde',()=>{
 let received=[];
 assert.equal(getPendingEjs(ejs,received).length,3);
 received.push({ej_id:'a'});assert.equal(getPendingEjs(ejs,received).length,2);
 received.push({ej_id:'b'},{ej_id:'c'});assert.equal(getPendingEjs(ejs,received).length,0);
});
test('respostas duplicadas não alteram o total de EJs pendentes',()=>{
 assert.equal(getPendingEjs(ejs,[{ej_id:'a'},{ej_id:'a'}]).length,2);
});
test('texto de cobrança contém deliberação EJ e prazo',()=>{
 const m=reminderText('Uma decisão','UNECT','24/11/2026');
 assert.match(m,/Uma decisão/);assert.match(m,/UNECT/);assert.match(m,/24\/11\/2026/);
});
