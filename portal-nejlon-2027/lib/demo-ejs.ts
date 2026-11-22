/** Relação pública das EJs para apresentação e preenchimento de e-mails.
 * A fonte autoritativa de permissões e de contas continua sendo o Supabase.
 * Atualizar esta lista quando a rede oficial de EJs for alterada.
 */
export const EJS_DEMO=[
 {name:'3E',slug:'3e'}, {name:'APRIMORA',slug:'aprimora'},
 {name:'ARTUS',slug:'artus'}, {name:'BIOMA',slug:'bioma'},
 {name:'BÓSON',slug:'boson'}, {name:'BUSINESS',slug:'business'},
 {name:'CATEC’Z',slug:'catecz'}, {name:'CONSOAGRO',slug:'consoagro'},
 {name:'COTTON',slug:'cotton'}, {name:'ECAE',slug:'ecae'},
 {name:'ELO',slug:'elo'}, {name:'FERTFIELD',slug:'fertfield'},
 {name:'GAIA',slug:'gaia'}, {name:'KINASE',slug:'kinase'},
 {name:'LEX',slug:'lex'}, {name:'LION',slug:'lion'},
 {name:'MECA',slug:'meca'}, {name:'NOTTON',slug:'notton'},
 {name:'PARACELSO',slug:'paracelso'}, {name:'PEGASUS',slug:'pegasus'},
 {name:'SELECT',slug:'select'}, {name:'SETE',slug:'sete'},
 {name:'SMARTMEC',slug:'smartmec'}, {name:'SMAT JR',slug:'smatjr'},
 {name:'SOLUÇÃO',slug:'solucao'}, {name:'TCP',slug:'tcp'},
 {name:'THERION',slug:'therion'}, {name:'UNECT',slug:'unect'},
 {name:'VET JR',slug:'vetjr'}
] as const;
export type DemoRole='prescon'|'counselor'|'ej_direx'|'nucleus_direx';
export const DEMO_ROLES:ReadonlyArray<{value:DemoRole;name:string;description:string}>= [
 {value:'prescon',name:'PRESCON',description:'Administração, relatórios e acompanhamento das EJs'},
 {value:'counselor',name:'Conselho',description:'Deliberações, respostas e agenda do Conselho'},
 {value:'ej_direx',name:'DIREX da EJ',description:'Informações públicas para a diretoria da própria EJ'},
 {value:'nucleus_direx',name:'DIREX do Núcleo',description:'Demandas, eventos e gestão do núcleo'}
];
export function expectedEmail(role:DemoRole,slug:string) {
 if(role==='prescon')return 'presconteste@nejlondrina.com';
 if(role==='nucleus_direx')return 'direx@nejlondrina.com';
 return (role==='counselor'?'conselho':'direx')+slug+'@nejlondrina.com';
}
