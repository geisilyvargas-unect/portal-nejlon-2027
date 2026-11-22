#!/usr/bin/env node
/* Static UI smoke check. Does not replace real browser or screen reader tests. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const pages=['index.html','pages/idealize.html','pages/institucional.html','pages/whatsapp.html','pages/central-automacoes.html','pages/responder.html'];
const scripts=['pages/site.js','pages/idealize.js','pages/visual-analytics.js','pages/ux-theme.js','pages/whatsapp.js','pages/message-library.js','pages/pf-import.js','pages/automation.js','pages/responder.js','api/_shared.js','api/drive.js','api/forms.js','api/google-callback.js','api/cron-sync.js'];
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
// Verificações básicas WCAG AA (texto normal >= 4,5:1) para os tokens centrais.
function luminance(hex){
 const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
 const c=rgb.map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4));
 return .2126*c[0]+.7152*c[1]+.0722*c[2];
}
function contrastRatio(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
const pairs=[
 ['#f9f8f6','#252528','dark body'],
 ['#d3ced1','#252528','dark muted'],
 ['#222124','#ffffff','light body'],
 ['#49474a','#ffffff','light muted'],
 ['#ffffff','#ce333e','dark primary button'],
 ['#ffffff','#a92732','light primary button'],
 ['#ffffff','#00616d','dark secondary button'],
 ['#ffffff','#005663','light secondary button']
];
for(const [fg,bg,label] of pairs){if(contrastRatio(fg,bg)<4.5)fail('low contrast '+label+' '+contrastRatio(fg,bg).toFixed(2)+':1')}
if(failures){console.error(failures+' UI smoke check(s) failed');process.exit(1)}
console.log('UI smoke checks passed: '+pages.length+' pages, assets, JS syntax and theme stylesheet.');
