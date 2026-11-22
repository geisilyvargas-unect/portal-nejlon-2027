// Run with: node --test tests/council-demo.test.cjs
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../pages/gestao-conselho.js'),'utf8');
function boot(){
 const elements=new Map();
 function element(id){
  if(!elements.has(id))elements.set(id,{id,value:id==='role'?'prescon':'unect',innerHTML:'',textContent:'',disabled:false,listeners:{},addEventListener(event,cb){this.listeners[event]=cb;}});
  return elements.get(id);
 }
 const storage=new Map();
 const context={document:{getElementById:element},sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},setTimeout:()=>0,Date,FormData,console};
 vm.runInNewContext(source,context,{filename:'gestao-conselho.js'});
 const change=(id,value)=>{const el=element(id);el.value=value;el.listeners.change({target:el})};
 return {element,change};
}
test('PRESCON acessa acompanhamento e criação de encaminhamentos',()=>{
 const app=boot();app.element('tabs').innerHTML.includes('Acompanhamento');
 assert.match(app.element('tabs').innerHTML,/Acompanhamento/);
 assert.match(app.element('tabs').innerHTML,/Encaminhamentos/);
});
test('DIREX EJ não vê áreas individuais nem ações administrativas',()=>{
 const app=boot();app.change('role','ej_direx');
 assert.doesNotMatch(app.element('tabs').innerHTML,/Acompanhamento|Engajamento|Encaminhamentos|Jornada/);
 assert.match(app.element('tabs').innerHTML,/Biblioteca/);
});
test('DIREX Núcleo tem apenas consulta e seleção de EJ desabilitada',()=>{
 const app=boot();app.change('role','nucleus_direx');
 assert.equal(app.element('ej').disabled,true);
 assert.doesNotMatch(app.element('tabs').innerHTML,/Acompanhamento|Encaminhamentos/);
});
test('Conselheiro vê jornada, mas não acompanhamento individual',()=>{
 const app=boot();app.change('role','counselor');
 assert.match(app.element('tabs').innerHTML,/Jornada|Encaminhamentos/);
 assert.doesNotMatch(app.element('tabs').innerHTML,/Acompanhamento/);
});
test('Trocar para perfil restrito remove abas administrativas da navegação',()=>{
 const app=boot();app.change('role','ej_direx');
 assert.doesNotMatch(app.element('tabs').innerHTML,/Acompanhamento/);
 app.change('role','prescon');
 assert.match(app.element('tabs').innerHTML,/Acompanhamento/);
});
