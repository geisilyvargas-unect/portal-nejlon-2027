import {requireViewer} from '@/lib/auth';
import {PasswordForm} from '@/components/access-form';
export default async function ChangePassword(){ await requireViewer();return <div className="login-wrap"><div className="login-card"><div className="eyebrow">Segurança do acesso</div><h1>Defina sua senha</h1><p className="muted">Para continuar, troque a senha temporária por uma senha pessoal e forte.</p><PasswordForm/></div></div>; }
