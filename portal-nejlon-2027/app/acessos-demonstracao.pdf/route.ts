import {NextResponse} from 'next/server';
export const runtime='nodejs';
export const dynamic='force-dynamic';

const ejs:[string,string][]=[
 ['3E','3e'],['APRIMORA','aprimora'],['ARTUS','artus'],['BIOMA','bioma'],
 ['BOSON','boson'],['BUSINESS','business'],['CATECZ','catecz'],
 ['CONSOAGRO','consoagro'],['COTTON','cotton'],['ECAE','ecae'],
 ['ELO','elo'],['FERTFIELD','fertfield'],['GAIA','gaia'],['KINASE','kinase'],
 ['LEX','lex'],['LION','lion'],['MECA','meca'],['NOTTON','notton'],
 ['PARACELSO','paracelso'],['PEGASUS','pegasus'],['SELECT','select'],
 ['SETE','sete'],['SMARTMEC','smartmec'],['SMAT JR','smatjr'],
 ['SOLUCAO','solucao'],['TCP','tcp'],['THERION','therion'],['UNECT','unect'],['VET JR','vetjr']
];

/** PDF simples, gerado sem dependencias externas, para consulta na tela de login.
 *  Todos os logins de EJs abaixo estao PLANEJADOS; a criacao de contas Auth e separada.
 *  Nunca inclui a senha pessoal da PRESCON.
 */
function pdf():Buffer{
  const commands:string[]=[];
  const txt=(s:string,x:number,y:number,size=9,bold=false)=>{
    const t=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7E]/g,'')
      .replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
    commands.push('BT /'+(bold?'F2':'F1')+' '+size+' Tf '+x+' '+y+' Td ('+t+') Tj ET');
  };
  const fill=(r:number,g:number,b:number,x:number,y:number,w:number,h:number)=>{
    commands.push(r+' '+g+' '+b+' rg '+x+' '+y+' '+w+' '+h+' re f');
  };

  fill(.98,.99,.99,0,0,842,595);
  fill(.02,.33,.38,0,565,842,30);
  txt('NEJLON 2027 | ACESSOS DE DEMONSTRACAO',29,576,15,true);
  txt('Lista de planejamento: os 58 acessos das EJs e a DIREX do Nucleo ainda NAO estao ativados.',29,543,10,true);
  txt('Senha PREVISTA para teste: 123456. Nao funciona ate as contas serem criadas no Supabase.',29,526,9,true);
  txt('Cada e-mail sera um usuario independente: Conselho vota; DIREX acompanha, sem votar.',29,511,8.5);
  txt('Nao usar em deliberacoes reais; a senha pessoal da PRESCON nao e divulgada.',29,496,8.5);

  fill(.02,.33,.38,23,469,796,27);
  txt('EJ',32,478,9,true);
  txt('DIREX DA EJ',126,478,9,true);
  txt('CONSELHO DA EJ',352,478,9,true);
  txt('SENHA PREVISTA',575,478,9,true);
  txt('STATUS',713,478,9,true);
  for(let i=0;i<ejs.length;i++){
    const [ej,slug]=ejs[i];
    const y=456-i*12;
    if(i%2===1)fill(.92,.95,.95,25,y-4,792,13);
    txt(ej,32,y,8);
    txt('direx'+slug+'@nejlondrina.com',126,y,8);
    txt('conselho'+slug+'@nejlondrina.com',352,y,8);
    txt('123456',591,y,8,true);
    txt('PENDENTE',713,y,8,true);
  }
  fill(.9,.93,.94,23,90,796,17);
  txt('DIREX do Nucleo',32,95,8,true);
  txt('direx@nejlondrina.com',126,95,8);
  txt('123456 (teste)',590,95,8,true);
  txt('PENDENTE',713,95,8,true);
  txt('PRESCON ATIVA: presconteste@nejlondrina.com | Senha particular definida pela administradora.',29,73,8,true);
  txt('Contas pendentes nao conseguem entrar. Para a PRESCON, use a senha ja cadastrada no Supabase.',29,58,8);
  fill(.77,.16,.19,0,22,842,2);
  txt('NEJLON 2027 - documento demonstrativo | Acessos e permissoes definidos por perfil e EJ.',29,11,7);

  const stream=commands.join('\n')+'\n';
  const objs=[
    '<</Type /Catalog /Pages 2 0 R>>',
    '<</Type /Pages /Kids [5 0 R] /Count 1>>',
    '<</Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding>>',
    '<</Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding>>',
    '<</Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources <</Font <</F1 3 0 R /F2 4 0 R>>>> /Contents 6 0 R>>',
    '<</Length '+Buffer.byteLength(stream,'latin1')+'>>\nstream\n'+stream+'endstream'
  ];
  let output='%PDF-1.4\n';
  const offsets:number[]=[0];
  for(let i=0;i<objs.length;i++){
    offsets.push(Buffer.byteLength(output,'latin1'));
    output+=(i+1)+' 0 obj\n'+objs[i]+'\nendobj\n';
  }
  const xref=Buffer.byteLength(output,'latin1');
  output+='xref\n0 '+(objs.length+1)+'\n0000000000 65535 f \n';
  for(let i=1;i<offsets.length;i++)output+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';
  output+='trailer\n<</Size '+(objs.length+1)+' /Root 1 0 R>>\nstartxref\n'+xref+'\n%%EOF\n';
  return Buffer.from(output,'latin1');
}

export async function GET(){
  const data=pdf();
  return new NextResponse(new Uint8Array(data),{
    headers:{
      'Content-Type':'application/pdf',
      'Content-Disposition':'inline; filename="acessos-demonstracao-nejlon-2027.pdf"',
      'Cache-Control':'public, max-age=300'
    }
  });
}
