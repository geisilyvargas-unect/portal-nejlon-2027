import {requireRole} from '@/lib/auth';
import {createClient} from '@/lib/supabase/server';
import {getEjs} from '@/lib/queries';
import {AccessCreate,AccessEdit} from '@/components/access-form';
import type {Profile,Role} from '@/lib/constants';
import Link from 'next/link';

export default async function Access({searchParams}:{searchParams:Promise<{role?:string;ej?:string}>}){
 await requireRole(['prescon']);
 const db=await createClient();
 const [ejs,{data,error}]=await Promise.all([
  getEjs(),
  db.from('profiles').select('id,email,full_name,role,ej_id,active,phone,must_change_password').order('email')
 ]);
 if(error)throw Error(error.message);
 const profiles=(data||[]) as Profile[];
 const configured=true; // A função Supabase Edge guarda a credencial administrativa.
 const params=await searchParams;
 const defaultRole:Role=params?.role==='ej_direx'?'ej_direx'
   :params?.role==='nucleus_direx'?'nucleus_direx'
   :params?.role==='prescon'?'prescon':'counselor';
 const defaultEjId=(defaultRole==='counselor'||defaultRole==='ej_direx')&&ejs.some(e=>e.id===params?.ej)
   ?params.ej!:'';
 const registered=new Set(profiles.map(p=>p.email.toLowerCase()));
 const emailFor=(role:'ej_direx'|'counselor',slug:string)=>(role==='counselor'?'conselho':'direx')+slug+'@nejlondrina.com';
 const registerLink=(role:'ej_direx'|'counselor'|'nucleus_direx',ejId?:string)=>
   '/acessos?role='+role+(ejId?'&ej='+encodeURIComponent(ejId):'')+'#novo-acesso';
 const plannedCount=2*ejs.length+1;
 const alreadyPlanned=ejs.reduce((count,e)=>count+
   Number(registered.has(emailFor('ej_direx',e.slug)))+
   Number(registered.has(emailFor('counselor',e.slug))),Number(registered.has('direx@nejlondrina.com')));
 const countCouncil=profiles.filter(p=>p.role==='counselor').length;
 const countDirex=profiles.filter(p=>p.role==='ej_direx').length;
 const countNucleus=profiles.filter(p=>p.role==='nucleus_direx').length;

 return <div className="stack">
  <div>
   <div className="eyebrow">PRESCON • Administração de contas</div>
   <h1>Gestão de acessos</h1>
   <p className="muted">Cadastre usuários pelo portal. O perfil da EJ e as permissões são atribuídos automaticamente ao e-mail escolhido.</p>
  </div>
  <div className="kpi-grid">
   <div className="panel"><span className="muted small">Conselhos</span><div className="stat">{countCouncil}<span className="muted" style={{fontSize:16}}> / {ejs.length}</span></div></div>
   <div className="panel"><span className="muted small">DIREX de EJs</span><div className="stat">{countDirex}<span className="muted" style={{fontSize:16}}> / {ejs.length}</span></div></div>
   <div className="panel"><span className="muted small">DIREX do Núcleo</span><div className="stat">{countNucleus}<span className="muted" style={{fontSize:16}}> / 1</span></div></div>
   <div className="panel"><span className="muted small">Todas as contas com perfil</span><div className="stat">{profiles.length}</div></div>
  </div>

  <div className="notice" role="status">
   <strong>Cadastro integrado ao Supabase.</strong> Os novos usuários serão criados pela função administrativa protegida do Supabase, usando sua sessão PRESCON. Não é necessário copiar a chave secreta para a Vercel.
  </div>
  <div className="panel" id="novo-acesso">
   <h2>Criar um novo acesso</h2>
   <p className="muted small">
    Selecione <strong>Conselho</strong> ou <strong>DIREX da EJ</strong>, escolha a empresa e clique em criar.
    O portal gera automaticamente e-mails como <code>conselhounect@nejlondrina.com</code> e <code>direxunect@nejlondrina.com</code>.
    Cada e-mail terá conta e permissões próprias no Supabase.
   </p>
   <AccessCreate key={defaultRole+'-'+defaultEjId} ejs={ejs} enabled={configured} defaultRole={defaultRole} defaultEjId={defaultEjId}/>
  </div>
  <div className="notice">
   <strong>Acesso de demonstração:</strong> a senha <code>123456</code> está preenchida inicialmente para as contas das EJs, conforme a configuração de testes. Você pode substituí-la antes de criar a conta. A senha compartilhada não deve ser usada para decisões ou informações institucionais reais.
  </div>

  <section className="panel stack" aria-labelledby="catalogo-acessos">
   <div className="toolbar" style={{marginTop:0}}>
    <div>
     <div className="eyebrow">Planejamento de contas • 29 EJs</div>
     <h2 id="catalogo-acessos" style={{margin:'7px 0'}}>Relação dos {plannedCount} e-mails definidos</h2>
     <p className="muted small" style={{margin:0}}>A lista é gerada a partir das EJs do Supabase. Cada e-mail representa uma conta diferente, com permissões próprias.</p>
    </div>
    <span className="badge">{alreadyPlanned} com perfil / {plannedCount} previstos</span>
   </div>
   <div className="table-wrap">
    <table className="access-registry">
     <thead><tr><th>Empresa júnior</th><th>DIREX da EJ</th><th>Conselho da EJ</th></tr></thead>
     <tbody>
      {ejs.map(e=>{
       const direx=emailFor('ej_direx',e.slug);
       const conselho=emailFor('counselor',e.slug);
       const hasDirex=registered.has(direx);
       const hasConselho=registered.has(conselho);
       return <tr key={e.id}>
        <td><strong>{e.name}</strong></td>
        <td>
         <div className="access-roster-cell"><code>{direx}</code>
          <span className={'badge '+(hasDirex?'lime':'')}>{hasDirex?'Perfil cadastrado':'Pendente'}</span>
          {!hasDirex&&<Link className="link small" href={registerLink('ej_direx',e.id)}>Preparar cadastro</Link>}
         </div>
        </td>
        <td>
         <div className="access-roster-cell"><code>{conselho}</code>
          <span className={'badge '+(hasConselho?'lime':'')}>{hasConselho?'Perfil cadastrado':'Pendente'}</span>
          {!hasConselho&&<Link className="link small" href={registerLink('counselor',e.id)}>Preparar cadastro</Link>}
         </div>
        </td>
       </tr>;
      })}
      <tr>
       <td><strong>DIREX do Núcleo NEJLON</strong></td>
       <td colSpan={2}>
        <div className="access-roster-cell"><code>direx@nejlondrina.com</code>
         <span className={'badge '+(registered.has('direx@nejlondrina.com')?'lime':'')}>
          {registered.has('direx@nejlondrina.com')?'Perfil cadastrado':'Pendente'}
         </span>
         {!registered.has('direx@nejlondrina.com')&&<Link href={registerLink('nucleus_direx')} className="link small">Preparar cadastro</Link>}
        </div>
       </td>
      </tr>
     </tbody>
    </table>
   </div>
   <p className="muted small" style={{margin:0}}>Pendente significa que o perfil ainda não existe na lista de acessos do portal. Clique em Preparar cadastro e confirme o formulário no topo da página para ativar a conta no Supabase.</p>
  </section>
  <div className="panel stack">
   <div className="toolbar"><h2>Contas com perfil cadastrado ({profiles.length})</h2><span className="badge lime">{profiles.filter(p=>p.active).length} ativas</span></div>
   {profiles.map(p=><AccessEdit key={p.id} user={p} ejs={ejs}/>)}
   {profiles.length===0&&<p className="muted">Nenhum perfil cadastrado.</p>}
  </div>
 </div>;
}
