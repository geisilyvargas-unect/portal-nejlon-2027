import {requireViewer} from '@/lib/auth';
import {getEjs} from '@/lib/queries';
export default async function Directory(){
 await requireViewer();
 const ejs=await getEjs();
 return <div className="stack"><div><div className="eyebrow">Conheça a Rede • NEJLON</div><h1>Diretório de empresas juniores</h1><p className="muted">As {ejs.length} EJs vinculadas ao Núcleo de Londrina. Dados de contato pessoais não são compartilhados aqui.</p></div>
 <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))'}}>{ejs.map(e=><div className="panel" key={e.id}><div className="eyebrow">EMPRESA JÚNIOR</div><h2 style={{marginTop:9,marginBottom:0}}>{e.name}</h2></div>)}</div>
 </div>;
}
