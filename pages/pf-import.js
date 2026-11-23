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
window.NEJLON_PF_IMPORT=async(file)=>{
 if(!file)return;preview.innerHTML='';
 if(!/\.(csv|xls|xlsx)$/i.test(file.name)){status.textContent='Selecione CSV, XLS ou XLSX.';return}
 if(file.size>15*1024*1024){status.textContent='O arquivo ultrapassa o limite de 15 MB.';return}
 try{
  status.textContent='Lendo o planejamento…';
  
  let sheets=[];
  if(/\.csv$/i.test(file.name)){sheets=[{name:'Tabela CSV',rows:(window.NEJLON_DEMO_CSV?.parse||csv)(new TextDecoder().decode(await file.arrayBuffer()))}]}
  else {sheets=await window.NEJLON_XLSX_VIEW.rows(file)}
  if(!sheets.some(s=>s.rows.some(r=>r.some(x=>String(x).trim()))))throw Error('Planilha sem conteúdo legível.');
  const letter=n=>{let out='';for(n++;n;n=Math.floor((n-1)/26))out=String.fromCharCode(65+(n-1)%26)+out;return out};
  // Keep every row/column of the imported workbook; never replace with extracted financial summaries.
  const renderSheet=index=>{
   const sh=sheets[index],rows=sh.rows;
   const maxCols=Math.max(1,...rows.map(row=>row.length));
   const headers=Array.from({length:maxCols},(_,i)=>'<th scope="col">'+letter(i)+'</th>').join('');
   const body=rows.map((row,i)=>'<tr><th scope="row">'+(i+1)+'</th>'+Array.from({length:maxCols},(_,k)=>'<td>'+esc(row[k]??'')+'</td>').join('')+'</tr>').join('');
   const table='<div class="pf-grid-scroll" role="region" aria-label="Planilha '+esc(sh.name)+'" tabindex="0"><table class="pf-grid"><thead><tr><th aria-label="Linha e coluna"></th>'+headers+'</tr></thead><tbody>'+body+'</tbody></table></div>';
   preview.querySelector('#pf-sheet-view').innerHTML=table;
   preview.querySelectorAll('[data-pf-sheet]').forEach((button,i)=>{button.setAttribute('aria-selected',String(i===index));button.classList.toggle('active',i===index)});
   preview.querySelector('#pf-active-sheet').textContent=sh.name+' · '+rows.length+' linhas · '+maxCols+' colunas';
  };
  preview.innerHTML='<div class="pf-viewer"><div class="pf-viewer-heading"><strong>Visualização da planilha original</strong><span id="pf-active-sheet"></span></div><div class="pf-tabs" role="tablist" aria-label="Abas do planejamento financeiro">'+sheets.map((sh,i)=>'<button type="button" role="tab" data-pf-sheet="'+i+'" aria-selected="false">'+esc(sh.name)+'</button>').join('')+'</div><div id="pf-sheet-view"></div><p class="pf-disclaimer">Consulta somente leitura. Todas as linhas e colunas importadas ficam disponíveis, com rolagem horizontal e vertical. A grade preserva os valores exibidos das células, mas não reproduz fielmente cores, mesclagens, gráficos ou fórmulas do Excel. A planilha permanece no navegador e não é enviada ao servidor.</p></div>';
  preview.querySelectorAll('[data-pf-sheet]').forEach(button=>button.addEventListener('click',()=>renderSheet(Number(button.dataset.pfSheet))));
  renderSheet(0);
  status.textContent='Planilha carregada para consulta. Selecione uma aba e navegue pela grade.';

 }catch(e){status.textContent='Não foi possível importar: '+String(e.message||e)}
};
})();