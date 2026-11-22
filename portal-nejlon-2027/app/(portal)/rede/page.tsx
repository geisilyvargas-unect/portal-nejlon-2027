import {requireViewer} from '@/lib/auth';
import {getEjs} from '@/lib/queries';
import {EjDirectory} from '@/components/ej-directory';
export default async function Directory(){
 await requireViewer();
 const ejs=await getEjs();
 return <div className="stack">
  <div className="eyebrow">Conheça a Rede • NEJLON</div>
  <h1>Diretório de empresas juniores</h1>
  <p className="muted">As {ejs.length} EJs vinculadas ao Núcleo de Londrina, com informações do Portfólio Unificado NEJLON.</p>
  <EjDirectory ejs={ejs}/>
 </div>;
}
