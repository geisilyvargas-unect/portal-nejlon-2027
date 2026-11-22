(()=>{
'use strict';
const $=id=>document.getElementById(id);
const STORE='nejlon.message.templates.v1';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const presets=[
{id:'deliberacao',name:'Abertura de deliberação',category:'Deliberações',description:'Convite completo com Portal e Google Forms.',text:"Falaaaa, Conselho! ❤️🖤\n\nEstá disponível a *{formulario}* para deliberação da nossa Rede Pé Vermelho!\n\n📅 *Prazo:* {prazo}\n\nVocês podem escolher como preferem responder:\n🔴 *Portal NEJLON:* {link_portal}\n🟢 *Google Forms:* {link_google}\n\n⚠️ É necessário responder *apenas uma vez*, por um dos dois canais.\n\nConto com a participação de todos! Qualquer dúvida, podem me chamar aqui.\n\n*Juntos pela excelência!* ❤️"},
{id:'pf',name:'Deliberação de PF',category:'Deliberações',description:'Manual, rateios, C1 e C2.',text:"Falaaaa, Conselho! ❤️🐿️\n\nEstá aberta a *{formulario}*!\n\nConfiram o planejamento financeiro e o manual antes de votar. Vamos analisar o *sistema de rateios, C1 e C2*.\n\n📅 *Prazo:* {prazo}\n🔴 *Portal NEJLON:* {link_portal}\n🟢 *Google Forms:* {link_google}\n\n⚠️ Cada EJ deve registrar uma única resposta. Conversem e avaliem os cenários antes de deliberar!\n\nEstou à disposição para esclarecer dúvidas. ❤️"},
{id:'lembrete',name:'Lembrete de prazo',category:'Prazos e lembretes',description:'Reforço de prazo sem cobrança agressiva.',text:"Falaaaa, Conselho! 👀❤️\n\nPassando para lembrar que o prazo de *{formulario}* termina em *{prazo}*.\n\nQuem ainda não respondeu, não deixe para a última hora!\n🔴 Portal: {link_portal}\n🟢 Google Forms: {link_google}\n\nLembrando: basta responder por um dos canais. Obrigada pela participação! 🐿️"},
{id:'ultimodia',name:'Último dia para responder',category:'Prazos e lembretes',description:'Aviso de encerramento da deliberação.',text:"🚨 *ATENÇÃO, CONSELHO!*\n\nHoje é o último dia para responder *{formulario}*.\n⏰ *Encerramento:* {prazo}\n\n🔴 Portal: {link_portal}\n🟢 Google Forms: {link_google}\n\nSe surgir alguma dúvida, me chamem antes do encerramento! ❤️"},
{id:'reuniao',name:'Convocação para reunião',category:'Reuniões e eventos',description:'Chamada coletiva para reunião do Conselho.',text:"Falaaaa, Conselho! ❤️🐿️\n\nPassando para convocar vocês para *{formulario}*!\n\n📅 *Quando:* {prazo}\n\nA participação de cada EJ é muito importante para construirmos as decisões da nossa Rede. Conto com vocês!\n\nMais informações serão compartilhadas por aqui. 🖤"},
{id:'comunicado',name:'Comunicado institucional',category:'Comunicados',description:'Recado objetivo ao grupo.',text:"Boa noite, Conselho! ❤️\n\n*{formulario}*\n\nCompartilho este comunicado para alinhar as informações com todas as EJs da Rede Pé Vermelho.\n\nPeço atenção ao conteúdo e, caso surjam dúvidas, estou à disposição.\n\nObrigada, Conselho! 🐿️"},
{id:'encerramento',name:'Agradecimento e encerramento',category:'Comunicados',description:'Agradece e explica próximos passos.',text:"Falaaaa, Conselho! ❤️\n\nEncerramos a etapa de respostas de *{formulario}*.\n\nMuito obrigada pela participação e pelo cuidado na análise! 🐿️\n\nOs encaminhamentos e resultados serão divulgados após a consolidação e, quando necessário, a análise de ressalvas pela PRESCON.\n\n*Juntos pela excelência!* ❤️"}
];
let custom=[];
try{const result=JSON.parse(localStorage.getItem(STORE)||'[]');if(Array.isArray(result))custom=result.filter(x=>x&&typeof x.name==='string'&&typeof x.text==='string'&&typeof x.id==='string').slice(0,100)}catch{}
let selected='deliberacao';
function all(){return presets.concat(custom)}
function notice(t){$('wa-toast').textContent=t}
function apply(t){selected=t.id;$('wa-template').value=t.text;$('wa-template').dispatchEvent(new Event('input',{bubbles:true}));render();notice('Modelo selecionado: '+t.name)}
function render(){
 const q=$('wa-search').value.trim().toLocaleLowerCase('pt-BR'),cat=$('wa-category').value;
 const filtered=all().filter(t=>(cat==='all'||cat===t.category)&&(t.name+' '+t.category+' '+(t.description||'')).toLocaleLowerCase('pt-BR').includes(q));
 $('wa-template-count').textContent=presets.length+' prontos · '+custom.length+' personalizados';
 $('wa-template-list').innerHTML=filtered.map(t=>'<article class="wa-template-card '+(selected===t.id?'is-active':'')+'"><div class="wa-template-meta"><span>'+esc(t.category)+'</span>'+(selected===t.id?'<b>Em uso</b>':'')+'</div><h3>'+esc(t.name)+'</h3><p>'+esc(t.description||'Modelo personalizado')+'</p><div class="wa-template-actions"><button type="button" class="btn '+(selected===t.id?'':'red')+'" data-choose="'+esc(t.id)+'">'+(selected===t.id?'Reaplicar':'Usar modelo')+'</button>'+(t.id.startsWith('custom:')?'<button type="button" class="btn" data-remove="'+esc(t.id)+'">Excluir</button>':'')+'</div></article>').join('')||'<p class="wa-help">Nenhum modelo encontrado.</p>';
}
$('wa-template-list').addEventListener('click',e=>{
 const btn=e.target.closest('button');if(!btn)return;
 if(btn.dataset.choose){const t=all().find(x=>x.id===btn.dataset.choose);if(t)apply(t);return}
 if(btn.dataset.remove){const t=custom.find(x=>x.id===btn.dataset.remove);if(!t||!confirm('Excluir o modelo “'+t.name+'”?'))return;
 const next=custom.filter(x=>x.id!==t.id);
 try{localStorage.setItem(STORE,JSON.stringify(next));custom=next;if(selected===t.id)selected='';render();notice('Modelo removido.')}catch{notice('Não foi possível remover o modelo.')}}
});
$('wa-save-template').addEventListener('click',()=>{
 const name=$('wa-custom-name').value.trim(),body=$('wa-template').value.trim();
 if(name.length<3||body.length<10){notice('Informe um nome e uma mensagem para salvar.');return}
 if(custom.length>=100){notice('Limite de 100 modelos personalizados neste navegador.');return}
 const t={id:'custom:'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),name,description:'Modelo criado pela PRESCON',category:'Personalizados',text:body};
 try{const next=custom.concat(t);localStorage.setItem(STORE,JSON.stringify(next));custom=next;selected=t.id;$('wa-custom-name').value='';render();notice('Modelo salvo neste navegador.')}catch{notice('Falha ao salvar. Verifique o armazenamento do navegador.') }
});
$('wa-search').addEventListener('input',render);
$('wa-category').addEventListener('change',render);
const fromUrl=new URLSearchParams(location.search).get('modelo');
apply(presets.find(t=>t.id===fromUrl)||presets[0]);
})();