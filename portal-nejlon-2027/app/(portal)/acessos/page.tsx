import {requireRole} from '@/lib/auth';
import {createClient} from '@/lib/supabase/server';
import {getEjs} from '@/lib/queries';
import {AccessCreate,AccessEdit} from '@/components/access-form';
import type {Profile} from '@/lib/constants';
export default async function Access(){await requireRole(['prescon']);const db=await createClient();const [ejs,{data,error}]=await Promise.all([getEjs(),db.from('profiles').select('id,email,full_name,role,ej_id,active,phone,must_change_password').order('email')]);if(error)throw Error(error.message);const profiles=(data||[]) as Profile[];
 return <div className="stack"><div><div className="eyebrow">PRESCON • Segurança</div><h1>Gestão de acessos</h1><p className="muted">Crie e gerencie os usuários das 29 EJs, da DIREX do Núcleo e da PRESCON. O perfil vem da conta, nunca da tela de login.</p></div><div className="panel"><h2>Criar usuário</h2><p className="muted small">Contas criadas com senha temporária aleatória, exibida uma única vez. Compartilhe por canal seguro, sem usar a senha demonstrativa 1234.</p><AccessCreate ejs={ejs}/></div><div className="panel stack"><div className="toolbar"><h2>Contas cadastradas ({profiles.length})</h2><span className="badge lime">{profiles.filter(p=>p.active).length} ativas</span></div>{profiles.map(p=><AccessEdit key={p.id} user={p} ejs={ejs}/>)}{!profiles.length&&<p className="muted">Nenhum perfil cadastrado. Faça o bootstrap inicial da PRESCON conforme README.</p>}</div></div>;
}
