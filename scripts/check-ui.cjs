#!/usr/bin/env node
/* Static UI smoke check. Does not replace real browser or screen reader tests. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const pages=['index.html','pages/idealize.html','pages/institucional.html','pages/whatsapp.html'];
const scripts=['pages/site.js','pages/idealize.js','pages/visual-analytics.js','pages/ux-theme.js','pages/whatsapp.js','pages/message-library.js','pages/pf-import.js'];
const css=['pages/ux-system.css'];
let failures=0;
function fail(message){console.error('FAIL: '+message);failures++;}
for(const file of pages){
 const html=fs.readFileSync(file,'utf8');
 if(!html.includes('ux-system.css'))fail(file+' missing UX stylesheet');
 if(!html.includes('ux-theme.js'))fail(file+' missing theme controller');
 if(!html.includes('id="conteudo"'))fail(file+' missing accessible main anchor');
 const refs=[...html.matchAll(/<(?:link|script)\b[^>]*(?:href|src)="([^"]+)"/g)].map(m=>m[1]);
 for(const ref of refs){
  if(!ref.startsWith('./')&&!ref.startsWith('../'))continue;
  const target=path.resolve(path.dirname(file),ref.split('?')[0]);
  if(!fs.existsSync(target))fail(file+' missing asset '+ref);
 }
 const localStyles=refs.filter(x=>x.endsWith('.css'));
 if(!localStyles.at(-1)?.includes('ux-system.css'))fail(file+' UX CSS not loaded last');
}
for(const file of scripts){
 if(!fs.existsSync(file)){fail('missing JS '+file);continue}
 try{new vm.Script(fs.readFileSync(file,'utf8'),{filename:file})}catch(e){fail('syntax '+file+' '+e.message)}
}
for(const file of css){
 const c=fs.readFileSync(file,'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
 const opens=(c.match(/\{/g)||[]).length,closes=(c.match(/\}/g)||[]).length;
 if(opens!==closes)fail(file+' unbalanced braces');
 if(!c.includes('html[data-theme="light"]')||!c.includes('html[data-theme="dark"]'))fail(file+' missing theme tokens');
}
if(failures){console.error(failures+' UI smoke check(s) failed');process.exit(1)}
console.log('UI smoke checks passed: 4 pages, assets, JS syntax and theme stylesheet.');
