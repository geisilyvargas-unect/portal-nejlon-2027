'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
for(const p of ['api/cron-sync.js','api/forms.js','api/drive.js','api/demands.js','pages/automation.js']){
 const source=read(p);
 new vm.Script(source,{filename:p});
}
const cron=read('api/cron-sync.js'),forms=read('api/forms.js'),drive=read('api/drive.js'),ui=read('pages/automation.js'),html=read('pages/central-automacoes.html');
assert.match(cron,/MAX_FORMS=200/);
assert.match(cron,/MAX_PAGES_PER_FORM=30/);
assert.match(cron,/pending_review/);
assert.match(cron,/response\.nextPageToken/);
assert.match(cron,/status=eq\.open/);
assert.match(cron,/authorization/);
assert.match(forms,/Array\.isArray\(questions\)&&questions\.length/);
assert.match(forms,/status=eq\.'\+expected/);
assert.match(forms,/pageToken&&pages<30/);
assert.match(drive,/offset<200/);
assert.match(drive,/offset<20000/);
assert.match(drive,/evitar relatórios incompletos/);
assert.match(ui,/scenarioCount/);
assert.match(ui,/pfQuestions/);
assert.match(html,/name="scenarios"/);
const cfg=JSON.parse(read('vercel.json'));
assert.equal(cfg.framework,null);
assert.deepEqual(cfg.crons,[{path:'/api/cron-sync',schedule:'0 12 * * *'}]);
console.log('Auditoria estática: sintaxe e invariantes essenciais OK.');
