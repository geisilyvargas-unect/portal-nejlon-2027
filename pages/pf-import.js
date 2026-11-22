(()=>{
'use strict';
const input=document.getElementById('pf-upload'),status=document.getElementById('pf-import-status'),preview=document.getElementById('pf-import-preview');
if(!input||!status||!preview)return;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=x=>String(x??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function csv(text){
 const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/),header=lines.slice(0,8).join('\n');
 const sep=[';',',','\t'].sort((a,b)=>header.split(b).length-header.split(a).length)[0];
 const rows=[],re=new RegExp('(?:^|'+(sep==='\t'?'\\t':sep)+')("(?:[^"]|"")*"|[^'+sep+'\\r\\n]*)','g');
 for(const line of lines){if(!line.trim())continue;const cells=[];let match;re.lastIndex=0;while((match=re.exec(line))!==null){cells.push(match[1].replace(/^"|"$/g,'').replace(/""/g,'"'));if(!match[0].length)break;}rows.push(cells)}
 return rows;
}
function classify(sheet){
 const t=norm(sheet.name+' '+sheet.rows.slice(0,20).map(row=>row.join(' ')).join(' '));
 return {rateio:/rateio|localidade|distancia/.test(t),c1:/\bc1\b|cenario 1|uel/.test(t),c2:/\bc2\b|cenario 2|aurora/.test(t)};
}
input.addEventListener('change',async()=>{
 const file=input.files?.[0];if(!file)return;preview.innerHTML='';
 if(!/\.(csv|xls|xlsx)$/i.test(file.name)){status.textContent='Selecione CSV, XLS ou XLSX.';return}
 if(file.size>15*1024*1024){status.textContent='O arquivo ultrapassa o limite de 15 MB.';return}
 try{
  status.textContent='Lendo o planejamento…';
  const buffer=await file.arrayBuffer();
  let sheets=[];
  if(/\.csv$/i.test(file.name)){sheets=[{name:'Tabela CSV',rows:csv(new TextDecoder().decode(buffer))}]}
  else {if(!window.XLSX)throw Error('Biblioteca XLSX não carregou. Use CSV ou verifique a conexão.');const w=XLSX.read(buffer,{type:'array'});sheets=w.SheetNames.map(name=>({name,rows:XLSX.utils.sheet_to_json(w.Sheets[name],{header:1,defval:'',raw:false})}))}
  if(!sheets.some(s=>s.rows.some(r=>r.some(x=>String(x).trim()))))throw Error('Planilha sem conteúdo legível.');
  const categories=[['rateio','Sistema de rateios'],['c1','C1'],['c2','C2']];
  const summary=categories.map(([key,label])=>'<article class="pf-group"><strong>'+label+'</strong><span>'+esc(sheets.filter(sh=>classify(sh)[key]).map(sh=>sh.name).join(', ')||'Não identificado automaticamente')+'</span></article>').join('');
  const tables=sheets.map(sh=>'<details class="pf-sheet"><summary>'+esc(sh.name)+' · '+sh.rows.length+' linhas</summary><div class="pf-table-wrap"><table><tbody>'+sh.rows.slice(0,20).map(row=>'<tr>'+row.slice(0,14).map(cell=>'<td>'+esc(cell)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div></details>').join('');
  preview.innerHTML='<div class="pf-group-grid">'+summary+'</div>'+tables+'<p class="pf-disclaimer"><b>Conferência necessária:</b> este importador lê e identifica possíveis abas de rateio, C1 e C2, mas não substitui os valores de demonstração pelos valores importados sem validar seu mapeamento. A importação não gera votos.</p>';
  status.textContent='Arquivo lido localmente. Confira os grupos e as tabelas antes do uso institucional.';
 }catch(e){status.textContent='Não foi possível importar: '+String(e.message||e)}
});
})();