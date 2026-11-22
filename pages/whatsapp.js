(()=>{
'use strict';
const $=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let people=[];
const defaultTemplate="Olá, {nome}! ❤️🖤\n\nTudo bem? Passando para compartilhar com a *{ej}* o formulário *{formulario}* do Conselho do NEJ Londrina.\n\n📅 *Prazo:* {prazo}\n\nVocê pode escolher como prefere responder:\n🔴 *Pelo Portal NEJLON:* {link_portal}\n🟢 *Pelo Google Forms:* {link_google}\n\nÉ necessário preencher apenas uma vez. As respostas serão acompanhadas pelo Conselho.\n\nQualquer dúvida, estou à disposição!\n\n*Juntos pela excelência!*";
$('wa-template').value=defaultTemplate;
const toast=msg=>{$('wa-toast').textContent=msg};
const normalizePhone=input=>{
 const clean=String(input??'').replace(/[^\d]/g,'');
 if(clean.length===10||clean.length===11)return '55'+clean;
 if((clean.length===12||clean.length===13)&&clean.startsWith('55'))return clean;
 return '';
};
function makeMessage(person){
 const raw=$('wa-template').value;
 const name=person.nome||'conselheiro(a)';
 const google=$('wa-google-link').value.trim();
 const vars={nome:name,ej:person.ej,formulario:$('wa-form-title').value.trim(),prazo:$('wa-deadline').value.trim()||'a confirmar',link_portal:$('wa-portal-link').value.trim(),link_google:google||'(link Google Forms ainda não disponibilizado)'};
 let result=raw.replace(/\{(nome|ej|formulario|prazo|link_portal|link_google)\}/g,(_,key)=>vars[key]);
 if(!google)result=result.replace(/^\s*🟢\s*\*Pelo Google Forms:\*.*\n?/gm,'');
 return result.replace(/\n{3,}/g,'\n\n').trim();
}
function parseRows(content){
 const lines=content.replace(/^\uFEFF/,'').split(/\r?\n/).filter(line=>line.trim());
 const rows=[];
 for(const line of lines){
  const separator=line.includes(';')?';':line.includes('\t')?'\t':',';
  const cells=line.split(separator).map(x=>x.trim().replace(/^["']|["']$/g,''));
  if(cells[0]&&/^(ej|empresa j[uú]nior)$/i.test(cells[0]))continue;
  if(cells.length<3)continue;
  rows.push({ej:cells[0],nome:cells[1],telefone:cells.slice(2).join('')});
 }
 return rows;
}
function addPeople(rows){
 let added=0;
 for(const p of rows){
  const phone=normalizePhone(p.telefone);
  if(!p.ej||!phone)continue;
  const id=p.ej.toLowerCase()+'|'+phone;
  if(people.some(x=>x.id===id))continue;
  people.push({id,ej:p.ej,nome:p.nome,telefone:phone,opened:false});
  added++;
 }
 render();
 toast(added+' contato(s) adicionado(s); confira as mensagens antes de enviar.');
}
function render(){
 const query=$('wa-filter').value.trim().toLowerCase();
 const filtered=people.filter(p=>(p.ej+' '+p.nome).toLowerCase().includes(query));
 $('wa-count').textContent=people.length+' contato(s) válido(s) · '+people.filter(p=>p.opened).length+' conversa(s) aberta(s) (não confirmadas como enviadas)';
 $('wa-list').innerHTML=filtered.length?filtered.map(p=>{
 const index=people.indexOf(p);
 return '<article class="wa-recipient"><div class="wa-recipient-top"><div><strong>'+esc(p.ej)+'</strong><span>'+esc(p.nome||'Sem nome')+' · +'+esc(p.telefone)+'</span></div><span class="wa-status">'+(p.opened?'Conversa aberta — envio não confirmado':'Pronto para preparar')+'</span></div><details><summary>Pré-visualizar mensagem personalizada</summary><pre>'+esc(makeMessage(p))+'</pre></details><div class="wa-actions"><button type="button" data-copy="'+index+'" class="btn">Copiar mensagem</button><button type="button" data-open="'+index+'" class="btn red">Abrir no WhatsApp ↗</button></div></article>';
 }).join(''):'<p class="wa-empty">Nenhum contato válido nesta lista. Adicione uma EJ, nome e telefone com DDD.</p>';
}
$('wa-load').addEventListener('click',()=>addPeople(parseRows($('wa-import').value)));
$('wa-csv').addEventListener('change',async e=>{
 const file=e.target.files?.[0];if(!file)return;
 if(file.size>1024*1024){toast('Arquivo CSV muito grande. Limite de 1 MB.');return;}
 addPeople(parseRows(await file.text()));
});
$('wa-clear').addEventListener('click',()=>{people=[];$('wa-import').value='';$('wa-csv').value='';render();toast('Contatos limpos desta sessão.')});
$('wa-filter').addEventListener('input',render);
for(const key of ['wa-form-title','wa-deadline','wa-portal-link','wa-google-link','wa-template'])$(key).addEventListener('input',render);
$('wa-list').addEventListener('click',async e=>{
 const button=e.target.closest('button');if(!button)return;
 if(button.dataset.copy!==undefined){
  const p=people[Number(button.dataset.copy)];if(!p)return;
  try{await navigator.clipboard.writeText(makeMessage(p));toast('Mensagem de '+p.ej+' copiada.')}catch{toast('Não foi possível copiar automaticamente; selecione o texto na prévia.')}
 }
 if(button.dataset.open!==undefined){
  const p=people[Number(button.dataset.open)];if(!p)return;
  const url='https://wa.me/'+p.telefone+'?text='+encodeURIComponent(makeMessage(p));
  const opened=window.open(url,'_blank','noopener,noreferrer');
  if(!opened){toast('O navegador bloqueou a nova aba; permita pop-ups para abrir o WhatsApp.');return;}
  p.opened=true;render();toast('Conversa aberta. Confirme o envio no WhatsApp; o sistema não verifica a entrega.');
 }
});
const q=new URLSearchParams(location.search);
if(q.get('formulario'))$('wa-form-title').value=q.get('formulario').slice(0,180);
if(q.get('prazo'))$('wa-deadline').value=q.get('prazo').slice(0,100);
for(const [key,id] of [['portal','wa-portal-link'],['google','wa-google-link']]){const v=q.get(key);if(v&&/^https:\/\//i.test(v))$(id).value=v;}
render();
})();