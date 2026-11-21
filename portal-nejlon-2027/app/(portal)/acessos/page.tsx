import {requireRole} from '@/lib/auth';
import {createClient} from '@/lib/supabase/server';
import {getEjs} from '@/lib/queries';
import {AccessCreate,AccessEdit} from '@/components/access-form';
import type {Profile} from '@/lib/constants';

export default async function Access(){
 await requireRole(['prescon']);
 const db=await createClient();
 const [ejs,{data,error}]=await Promise.all([
  getEjs(),
  db.from('profiles').select('id,email,full_name,role,ej_id,active,phone,must_change_password').order('email')
 ]);
 if(error)throw Error(error.message);
 const profiles=(data||[]) as Profile[];
 const configured=!!process.env.SUPABASE_SERVICE_ROLE_KEY;
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

  {!configured&&<div className="error" role="alert">
   <strong>É necessário concluir a conexão administrativa para criar usuários.</strong>
   <p style={{marginTop:8,marginBottom:8}}>Falta configurar a variável <code>SUPABASE_SERVICE_ROLE_KEY</code> no servidor da Vercel. O formulário ficará desativado até a configuração ser concluída.</p>
   <p className="small" style={{marginBottom:0}}>
    Em <strong>Supabase → Project Settings → API Keys</strong>, obtenha a chave <code>service_role</code>. Em <strong>Vercel → Project → Settings → Environment Variables</strong>, adicione-a com o nome indicado, apenas no servidor, e faça um novo deploy. Não coloque essa chave no GitHub nem em mensagens.
   </p>
  </div>}
  <div className="panel">
   <h2>Criar um novo acesso</h2>
   <p className="muted small">
    Selecione <strong>Conselho</strong> ou <strong>DIREX da EJ</strong>, escolha a empresa e clique em criar.
    O portal gera automaticamente e-mails como <code>conselhounect@nejlondrina.com</code> e <code>direxunect@nejlondrina.com</code>.
    Cada e-mail terá conta e permissões próprias no Supabase.
   </p>
   <AccessCreate ejs={ejs} enabled={configured}/>
  </div>
  <div className="notice">
   <strong>Acesso de demonstração:</strong> a senha <code>123456</code> está preenchida inicialmente para as contas das EJs, conforme a configuração de testes. Você pode substituí-la antes de criar a conta. A senha compartilhada não deve ser usada para decisões ou informações institucionais reais.
  </div>
  <div className="panel stack">
   <div className="toolbar"><h2>Contas com perfil cadastrado ({profiles.length})</h2><span className="badge lime">{profiles.filter(p=>p.active).length} ativas</span></div>
   {profiles.map(p=><AccessEdit key={p.id} user={p} ejs={ejs}/>)}
   {profiles.length===0&&<p className="muted">Nenhum perfil cadastrado.</p>}
  </div>
 </div>;
}
