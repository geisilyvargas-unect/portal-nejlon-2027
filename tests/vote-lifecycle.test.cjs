// Unit tests of the real responder UI with mocked Supabase HTTP responses.
// No requests are sent to Supabase and no institutional vote is created.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../pages/responder.js'),'utf8');
const ID='11111111-1111-4111-8111-111111111111';
const FORM={id:ID,title:'Deliberação de teste',questions:[{id:'q1',label:'Posicionamento',type:'choice',required:true,options:['Favorável','Contrário']}]};
const tick=()=>new Promise(resolve=>setImmediate(resolve));

async function setup(statuses, opts={}){
 const calls=[], elements=new Map(),storage=new Map([['nejlon.conselheiro.session.v1',JSON.stringify({access_token:'token-de-teste',refresh_token:'refresh-de-teste',user:{email:'teste@example.invalid'}})]]);
 function el(id){
  if(!elements.has(id)){
   const obj={id,hidden:false,disabled:false,value:'',textContent:'',innerHTML:'',listeners:{},
    addEventListener(name,fn){this.listeners[name]=fn},
    querySelector(){return {disabled:false,textContent:''}},
    querySelectorAll(){return []},
    reset(){this.resetCalled=true}};
   if(id==='respond-answer-form'){
    obj.button={disabled:false,textContent:''};
    obj.querySelector=()=>obj.button;
    obj.querySelectorAll=()=>[];
    obj.values={q1:'Favorável'};
   }
   if(id==='respond-change-request-form'){
    obj.button={disabled:false};obj.querySelector=()=>obj.button;obj.values={reason:'Corrigir justificativa'};
   }
   elements.set(id,obj);
  }
  return elements.get(id);
 }
 const queue=[...statuses];
 const fetch=async(url,init={})=>{
  const action=new URL(url).searchParams.get('action');
  calls.push({action,method:init.method||'GET',body:init.body?JSON.parse(init.body):null});
  if(action==='form')return {ok:true,status:200,json:async()=>({form:FORM})};
  if(action==='my_vote_status'){
   if(!queue.length)throw Error('Status não preparado');
   const value=queue.shift();
   if(value instanceof Error)throw value;
   return {ok:true,status:200,json:async()=>value};
  }
  if(opts.onMutation)return opts.onMutation(action,init);
  return {ok:true,status:200,json:async()=>({message:'Operação de teste registrada'})};
 };
 class MockFormData{constructor(form){this.values=form.values||{}}get(key){return this.values[key]??null}}
 const context={document:{getElementById:el},location:{search:'?id='+ID},URL,URLSearchParams,
  sessionStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},
  fetch,FormData:MockFormData,confirm:()=>opts.confirm!==false,setTimeout:()=>0,console};
 vm.runInNewContext(source,context,{filename:'responder.js'});
 await tick();await tick();await tick();
 const submit=async(id)=>{
  const form=el(id),event={preventDefault(){},target:form};
  await form.listeners.submit(event);
  await tick();
 };
 return {el,calls,submit};
}
const notRegistered={registered:false};
const registered={registered:true,can_request:true,request:null};
const requested={registered:true,can_request:true,request:{status:'requested'}};
const approved={registered:true,can_request:true,request:{status:'approved',id:'autorizacao-teste'}};

test('envio inicial usa action submit e formId correto',async()=>{
 const app=await setup([notRegistered,registered]);
 await app.submit('respond-answer-form');
 const writes=app.calls.filter(x=>x.method==='POST');
 assert.equal(writes.length,1);
 assert.equal(writes[0].action,'submit');
 assert.equal(writes[0].body.formId,ID);
 assert.equal(writes[0].body.answers.q1,'Favorável');
 assert.equal(app.el('respond-answer-form').hidden,true);
});
test('campo obrigatório vazio impede envio',async()=>{
 const app=await setup([notRegistered]);
 app.el('respond-answer-form').values.q1='  ';
 await app.submit('respond-answer-form');
 assert.equal(app.calls.filter(x=>x.method==='POST').length,0);
 assert.match(app.el('respond-submit-feedback').textContent,/obrigatória/);
});
test('voto já registrado não expõe formulário de envio',async()=>{
 const app=await setup([registered]);
 assert.equal(app.el('respond-answer-form').hidden,true);
 assert.equal(app.el('respond-change-request-form').hidden,false);
});
test('solicitação de alteração envia motivo e formId',async()=>{
 const app=await setup([registered,requested]);
 await app.submit('respond-change-request-form');
 const writes=app.calls.filter(x=>x.method==='POST');
 assert.equal(writes.length,1);
 assert.equal(writes[0].action,'request_vote_change');
 assert.equal(writes[0].body.formId,ID);
 assert.equal(writes[0].body.reason,'Corrigir justificativa');
 assert.equal(app.el('respond-change-request-form').hidden,true);
});
test('solicitação pendente não permite nova solicitação pela interface',async()=>{
 const app=await setup([requested]);
 assert.equal(app.el('respond-change-request-form').hidden,true);
 assert.equal(app.el('respond-answer-form').hidden,true);
});
test('substituição aprovada usa authorizationId, sem enviar novo submit',async()=>{
 const app=await setup([approved,{registered:true,can_request:false,request:null}]);
 assert.equal(app.el('respond-answer-form').hidden,false);
 assert.match(app.el('respond-answer-form').button.textContent,/Substituir voto/);
 await app.submit('respond-answer-form');
 const writes=app.calls.filter(x=>x.method==='POST');
 assert.equal(writes.length,1);
 assert.equal(writes[0].action,'apply_vote_change');
 assert.equal(writes[0].body.authorizationId,'autorizacao-teste');
 assert.equal(writes[0].body.answers.q1,'Favorável');
});
test('falha ao consultar status depois de enviar não incentiva reenvio',async()=>{
 const app=await setup([notRegistered,new Error('Rede indisponível')]);
 await app.submit('respond-answer-form');
 assert.equal(app.calls.filter(x=>x.action==='submit').length,1);
 assert.equal(app.el('respond-answer-form').hidden,true);
 assert.match(app.el('respond-submit-feedback').textContent,/Resposta enviada/);
});
test('erro do servidor libera botão para tentar novamente',async()=>{
 const app=await setup([notRegistered],{onMutation:async()=>({ok:false,status:409,json:async()=>({error:'Voto já registrado'})})});
 await app.submit('respond-answer-form');
 assert.equal(app.el('respond-answer-form').button.disabled,false);
 assert.match(app.el('respond-submit-feedback').textContent,/Voto já registrado/);
});
