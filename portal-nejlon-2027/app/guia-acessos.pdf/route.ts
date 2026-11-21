import {NextResponse} from 'next/server';

export const runtime='nodejs';
const ejs:[string,string][]=[
 ['3E','3e'],['APRIMORA','aprimora'],['ARTUS','artus'],['BIOMA','bioma'],
 ['BOSON','boson'],['BUSINESS','business'],['CATECZ','catecz'],['CONSOAGRO','consoagro'],
 ['COTTON','cotton'],['ECAE','ecae'],['ELO','elo'],['FERTFIELD','fertfield'],
 ['GAIA','gaia'],['KINASE','kinase'],['LEX','lex'],['LION','lion'],
 ['MECA','meca'],['NOTTON','notton'],['PARACELSO','paracelso'],['PEGASUS','pegasus'],
 ['SELECT','select'],['SETE','sete'],['SMAT JR','smatjr'],['SMARTMEC','smartmec'],
 ['SOLUCAO','solucao'],['TCP','tcp'],['THERION','therion'],['UNECT','unect'],['VET JR','vetjr']
];
const esc=(value:string)=>value.replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
function draw(x:number,y:number,value:string,size=9,font='F1',color='0 0 0'){
 return color+' rg BT /'+font+' '+size+' Tf 1 0 0 1 '+x+' '+y+' Tm ('+esc(value)+') Tj ET\n';
}
function rectangle(x:number,y:number,width:number,height:number,color:string){
 return color+' rg '+x+' '+y+' '+width+' '+height+' re f\n';
}
function pageContent(part:[string,string][],page:number,pages:number){
 let s=rectangle(0,0,842,595,'1 1 1');
 s+=rectangle(0,555,842,40,'0.78 0.14 0.17');
 s+=draw(28,572,'NEJLON 2027 | GUIA DE ACESSOS DE DEMONSTRACAO',15,'F2','1 1 1');
 s+=draw(28,532,'E-mails independentes de DIREX e Conselho por empresa junior',10,'F2');
 s+=draw(28,516,'Senha prevista das contas de TESTE: 123456. Esta lista nao comprova ativacao no Supabase.',9);
 s+=draw(28,503,'Contas PRESCON ja existentes possuem senha propria e nao sao divulgadas aqui.',9);
 s+=rectangle(25,469,792,22,'0.12 0.20 0.24');
 s+=draw(34,476,'EMPRESA JUNIOR',9,'F2','1 1 1');
 s+=draw(163,476,'E-MAIL DIREX',9,'F2','1 1 1');
 s+=draw(434,476,'E-MAIL CONSELHO',9,'F2','1 1 1');
 s+=draw(740,476,'SENHA',9,'F2','1 1 1');
 part.forEach(([name,slug],i)=>{
   const y=447-i*23;
   if(i%2===0)s+=rectangle(25,y-6,792,22,'0.94 0.96 0.97');
   s+=draw(34,y,name,8);
   s+=draw(163,y,'direx'+slug+'@nejlondrina.com',8);
   s+=draw(434,y,'conselho'+slug+'@nejlondrina.com',8);
   s+=draw(745,y,'123456',8,'F2');
 });
 s+=draw(28,62,'DIREX NUCLEO: direx@nejlondrina.com (acesso planejado; 123456 se ativado para testes).',9);
 s+=draw(28,46,'PRESCON: presconteste@nejlondrina.com (conta existente; senha individual nao publicada).',9);
 s+=draw(28,24,'Uso demonstrativo apenas. Nao inserir informacoes sigilosas com senha compartilhada.',8);
 s+=draw(772,24,page+' / '+pages,8);
 return s;
}
function makePdf():Buffer{
 const parts=[ejs.slice(0,15),ejs.slice(15)];
 const objects:string[]=['','<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Count 2 /Kids [3 0 R 4 0 R] >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 7 0 R >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 8 0 R >>',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'];
 parts.forEach((part,i)=>{
   const stream=pageContent(part,i+1,parts.length);
   objects.push('<< /Length '+Buffer.byteLength(stream,'latin1')+' >>\nstream\n'+stream+'endstream');
 });
 let output='%PDF-1.4\n%abcd\n';
 const offsets=[0];
 for(let i=1;i<objects.length;i++){
   offsets.push(Buffer.byteLength(output,'latin1'));
   output+=i+' 0 obj\n'+objects[i]+'\nendobj\n';
 }
 const xref=Buffer.byteLength(output,'latin1');
 output+='xref\n0 '+objects.length+'\n0000000000 65535 f \n';
 for(let i=1;i<objects.length;i++)output+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';
 output+='trailer\n<< /Size '+objects.length+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF';
 return Buffer.from(output,'latin1');
}
export async function GET(){
 return new NextResponse(new Uint8Array(makePdf()),{
  headers:{
   'Content-Type':'application/pdf',
   'Content-Disposition':'inline; filename="guia-acessos-nejlon-2027.pdf"',
   'Cache-Control':'no-store'
  }
 });
}
