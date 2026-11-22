(()=>{
'use strict';
const $=id=>document.getElementById(id);
const template="Falaaaa, Conselho! ❤️🖤\n\nEstá disponível a *{formulario}* para deliberação da nossa Rede Pé Vermelho!\n\n📅 *Prazo para responder:* {prazo}\n\nVocês podem escolher a forma mais prática para responder:\n\n🔴 *Pelo Portal NEJLON:*\n{link_portal}\n\n🟢 *Pelo Google Forms:*\n{link_google}\n\n⚠️ É necessário responder *apenas uma vez*, por um dos dois canais. Os posicionamentos serão consolidados no acompanhamento do Conselho.\n\nConto com a participação de vocês! Qualquer dúvida, podem me chamar aqui.\n\n*Juntos pela excelência!* ❤️";
$('wa-template').value=template;
function values(){
 return {formulario:$('wa-form-title').value.trim()||'Deliberação do Conselho',prazo:$('wa-deadline').value.trim()||'a confirmar',link_portal:$('wa-portal-link').value.trim()||'[INSIRA O LINK DO PORTAL]',link_google:$('wa-google-link').value.trim()||'[INSIRA O LINK DO GOOGLE FORMS]'};
}
function message(){const v=values();return $('wa-template').value.replace(/\{(formulario|prazo|link_portal|link_google)\}/g,(_,key)=>v[key]).trim()}
function validLinks(){
 const v=values();return (!$('wa-template').value.includes('{link_portal}')||/^https:\/\//i.test(v.link_portal))&&(!$('wa-template').value.includes('{link_google}')||/^https:\/\//i.test(v.link_google));
}
function render(){
 $('wa-preview').textContent=message();
 const w=$('wa-warning');w.textContent=validLinks()?'Mensagem pronta para compartilhar após conferência.':'Preencha os links exigidos pelo modelo antes de compartilhar no grupo.';
 $('wa-share').disabled=!validLinks();
}
function toast(text){$('wa-toast').textContent=text;}
$('wa-copy').addEventListener('click',async()=>{
 try{await navigator.clipboard.writeText(message());toast('Mensagem copiada! Abra o grupo do Conselho e cole na conversa.');}
 catch{toast('Não foi possível copiar automaticamente. Selecione o texto na prévia.');}
});
$('wa-share').addEventListener('click',()=>{
 if(!validLinks()){toast('Insira os links exigidos pelo modelo antes de compartilhar.');return}
 const url='https://api.whatsapp.com/send?text='+encodeURIComponent(message());
 const win=window.open(url,'_blank','noopener,noreferrer');
 if(!win)toast('O navegador bloqueou a nova aba. Copie a mensagem e cole no grupo do Conselho.');
 else toast('Escolha o grupo do Conselho no WhatsApp e confirme o envio. O portal não verifica a entrega.');
});
for(const id of ['wa-form-title','wa-deadline','wa-portal-link','wa-google-link','wa-template'])$(id).addEventListener('input',render);
const query=new URLSearchParams(location.search);
for(const [key,id,max] of [['formulario','wa-form-title',180],['prazo','wa-deadline',100],['portal','wa-portal-link',2000],['google','wa-google-link',2000]]){const v=query.get(key);if(v&&(key==='formulario'||key==='prazo'||/^https:\/\//i.test(v)))$(id).value=v.slice(0,max)}
render();
})();