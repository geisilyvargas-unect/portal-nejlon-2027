/**
 * Portal NEJLON — MVP Apps Script.
 * Executar setupPortal() uma vez antes de implantar.
 * Ativar serviço avançado Drive API no editor do Apps Script.
 */
const CFG = {PROP:'NEJLON_DB_ID', SCENARIOS:'Cenarios', DELIB:'Deliberacoes', REVIEWS:'Manifestacoes'};
function setupPortal(){
  const p=PropertiesService.getScriptProperties();
  if(p.getProperty(CFG.PROP)) return p.getProperty(CFG.PROP);
  const ss=SpreadsheetApp.create('NEJLON | Banco de Deliberações');
  const defs={
    Deliberacoes:['id','titulo','arquivoOriginalId','formId','formUrl','status','criadoEm','publicadoEm'],
    Cenarios:['deliberacaoId','cenarioId','nome','origem','descricao'],
    Manifestacoes:['id','deliberacaoId','cenarioId','tipo','texto','decisao','justificativa','atualizadoEm']
  };
  Object.keys(defs).forEach((name,i)=>{const sh=i===0?ss.getSheets()[0].setName(name):ss.insertSheet(name);sh.appendRow(defs[name]);sh.setFrozenRows(1)});
  p.setProperty(CFG.PROP,ss.getId());return ss.getId();
}
function db_(){const id=PropertiesService.getScriptProperties().getProperty(CFG.PROP);if(!id)throw Error('Execute setupPortal() antes.');return SpreadsheetApp.openById(id)}
function records_(name){const a=db_().getSheetByName(name).getDataRange().getValues();const h=a.shift();return a.filter(r=>r[0]!=='').map(r=>Object.fromEntries(h.map((k,i)=>[k,r[i]])))}
function add_(name,values){db_().getSheetByName(name).appendRow(values)}
function doGet(e){
 const t=HtmlService.createTemplateFromFile('Index');
 t.reportId=e&&e.parameter&&e.parameter.id||'';
 return t.evaluate().setTitle('NEJLON | Portal de Deliberações').addMetaTag('viewport','width=device-width, initial-scale=1');
}
function dashboardData(){return records_(CFG.DELIB).map(d=>({...d,cenarios:records_(CFG.SCENARIOS).filter(c=>c.deliberacaoId===d.id)}))}
function parseScenarios_(ss){
 const found=[];const seen={};
 ss.getSheets().forEach(sh=>{
  const rows=sh.getDataRange().getDisplayValues();
  rows.forEach((row,ri)=>row.forEach((v,ci)=>{
   const s=String(v||'').trim();
   // Reconhece explicitamente C1, C2, Cenário 1, Proposta 2; não classifica projeções como votos.
   const m=s.match(/^(?:cen[aá]rio|proposta)\s*[-:#º°]?\s*(\d+|[A-Z])\b|^C(\d+)\s*[-:–]\s*(.+)$/i);
   if(!m)return;
   const id='C'+(m[1]||m[2]);
   const key=id.toUpperCase();
   if(seen[key])return;
   seen[key]=true;
   found.push({id:key,nome:s,origem:sh.getName()+'!'+String.fromCharCode(65+ci)+(ri+1),descricao:row.slice(ci+1).filter(Boolean).join(' | ').slice(0,500)});
  }));
 });
 return found;
}
/** Recebe XLSX em base64 do navegador; conserva original no Drive e converte cópia para Sheets. */
function analyzeXlsx(file){
 if(!file||!file.name||!(/\.xlsx$/i).test(file.name))throw Error('Envie um arquivo .xlsx.');
 const bytes=Utilities.base64Decode(file.base64);
 if(bytes.length>12*1024*1024)throw Error('Limite inicial: 12 MB.');
 const blob=Utilities.newBlob(bytes,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',file.name);
 const original=DriveApp.createFile(blob);
 const converted=Drive.Files.create({name:'ANALISE - '+file.name,mimeType:'application/vnd.google-apps.spreadsheet'},blob,{fields:'id,name'});
 const ss=SpreadsheetApp.openById(converted.id);
 const cenarios=parseScenarios_(ss);
 DriveApp.getFileById(converted.id).setTrashed(true);
 return {originalId:original.getId(),nome:file.name,cenarios,avisos:cenarios.length?[]:['Nenhum cenário inequívoco encontrado. Cadastre e confirme os cenários antes de gerar o formulário.']};
}
function createDeliberation(data){
 if(!data||!data.originalId||!Array.isArray(data.cenarios)||!data.cenarios.length)throw Error('Confirme ao menos um cenário.');
 const id=Utilities.getUuid(),title=String(data.titulo||data.nome||'Planejamento Financeiro').slice(0,150);
 const form=FormApp.create('Deliberação — '+title);
 form.setDescription('Cada cenário deve ser avaliado separadamente. Responda com atenção.');
 data.cenarios.forEach((c,i)=>{
  const nome=String(c.nome||('Cenário '+(i+1))).slice(0,200),cid=String(c.id||('C'+(i+1)));
  form.addSectionHeaderItem().setTitle(nome).setHelpText(String(c.descricao||''));
  form.addMultipleChoiceItem().setTitle('['+cid+'] Posicionamento').setChoiceValues(['Aprova','Aprova com sugestões','Aprova com ressalvas','Reprova','Abstém']).setRequired(true);
  form.addParagraphTextItem().setTitle('['+cid+'] Justificativa do voto').setRequired(true);
  form.addParagraphTextItem().setTitle('['+cid+'] Sugestões (se houver)');
  form.addParagraphTextItem().setTitle('['+cid+'] Ressalvas (se houver)');
  form.addScaleItem().setTitle('['+cid+'] Clareza da proposta').setBounds(1,5).setLabels('Pouco clara','Muito clara');
  form.addScaleItem().setTitle('['+cid+'] Dificuldade de análise').setBounds(1,5).setLabels('Baixa','Alta');
 });
 const dest=SpreadsheetApp.create('Respostas — '+title);form.setDestination(FormApp.DestinationType.SPREADSHEET,dest.getId());
 add_(CFG.DELIB,[id,title,data.originalId,form.getId(),form.getPublishedUrl(),'ABERTA',new Date(),'']);
 data.cenarios.forEach((c,i)=>add_(CFG.SCENARIOS,[id,String(c.id||'C'+(i+1)),String(c.nome||''),String(c.origem||''),String(c.descricao||'')]));
 return {id,formUrl:form.getPublishedUrl(),editUrl:form.getEditUrl()};
}
function getReport(id){
 const d=records_(CFG.DELIB).find(x=>x.id===id);if(!d)throw Error('Deliberação não encontrada.');
 const form=FormApp.openById(d.formId);
 const cenarios=records_(CFG.SCENARIOS).filter(x=>x.deliberacaoId===id);
 const respostas=form.getResponses().map(r=>Object.fromEntries(r.getItemResponses().map(x=>[x.getItem().getTitle(),x.getResponse()])));
 const results=cenarios.map(c=>{
  const votos=respostas.map(r=>({posicionamento:r['['+c.cenarioId+'] Posicionamento']||'',justificativa:r['['+c.cenarioId+'] Justificativa do voto']||'',sugestao:r['['+c.cenarioId+'] Sugestões (se houver)']||'',ressalva:r['['+c.cenarioId+'] Ressalvas (se houver)']||''}));
  const contagem={};votos.forEach(v=>{if(v.posicionamento)contagem[v.posicionamento]=(contagem[v.posicionamento]||0)+1});
  return {...c,votos,contagem};
 });
 return {deliberacao:d,cenarios:results,totalRespostas:respostas.length,manifestacoes:records_(CFG.REVIEWS).filter(x=>x.deliberacaoId===id)};
}
function closeDeliberation(id){
 const sh=db_().getSheetByName(CFG.DELIB),v=sh.getDataRange().getValues();
 for(let i=1;i<v.length;i++)if(v[i][0]===id){FormApp.openById(v[i][3]).setAcceptingResponses(false);sh.getRange(i+1,6).setValue('EM_ANALISE');return true}
 throw Error('Deliberação não encontrada.');
}
function publishReport(id){
 const report=getReport(id);
 if(report.deliberacao.status!=='EM_ANALISE')throw Error('Encerre a votação antes de publicar.');
 const sh=db_().getSheetByName(CFG.DELIB),v=sh.getDataRange().getValues();
 for(let i=1;i<v.length;i++)if(v[i][0]===id){sh.getRange(i+1,6).setValue('PUBLICADA');sh.getRange(i+1,8).setValue(new Date());return true}
 return false;
}
