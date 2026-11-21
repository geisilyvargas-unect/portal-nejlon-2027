'use client';
import {useActionState} from 'react';
import {changeMyPassword,createPortalUser,updatePortalUser,type AccessResult} from '@/app/actions';
import {ROLES,type Role,type Ej,type Profile} from '@/lib/constants';
import {ResetAccess} from '@/components/portal-reset';
const initial:AccessResult={ok:false,message:''};
export function PasswordForm(){
 const [state,action,pending]=useActionState(changeMyPassword,initial);
 return <form action={action} className="fieldset"><label>Nova senha (pelo menos 12 caracteres)<input type="password" name="password" minLength={12} autoComplete="new-password" required/></label><label>Confirme a senha<input type="password" name="confirmation" minLength={12} autoComplete="new-password" required/></label><button type="submit" disabled={pending} className="primary">{pending?'Alterando…':'Salvar nova senha'}</button>{state.message&&<div className={state.ok?'notice':'error'}>{state.message}</div>}{state.ok&&<a href="/painel" className="button lime">Acessar o portal</a>}</form>;
}
export function AccessCreate({ejs}:{ejs:Ej[]}){
 const [state,action,pending]=useActionState(createPortalUser,initial);
 return <form action={action} className="fieldset"><div className="form-grid"><label>Nome do responsável<input name="full_name" required maxLength={150}/></label><label>Perfil<select name="role" defaultValue="counselor">{Object.entries(ROLES).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label>EJ vinculada (para DIREX da EJ e Conselho)<select name="ej_id" defaultValue=""><option value="">Nenhuma / não se aplica</option>{ejs.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label><label>Telefone (opcional)<input name="phone" placeholder="43 99999-9999"/></label></div><p className="small muted">O endereço institucional é gerado automaticamente a partir do perfil e da EJ. Cada combinação possui um e-mail próprio.</p><button className="primary" disabled={pending}>Criar conta</button>{state.message&&<div className={state.ok?'notice':'error'} role="status">{state.message}{state.password&&<div style={{marginTop:12}}><strong>Senha temporária (copie agora):</strong><code className="secret">{state.password}</code></div>}</div>}</form>;
}
export function AccessEdit({user,ejs}:{user:Profile;ejs:Ej[]}){
 const [state,action,pending]=useActionState(updatePortalUser,initial);
 return <details><summary>{user.full_name} — {user.email} <span className={`badge ${user.active?'lime':'red'}`}>{user.active?'Ativo':'Inativo'}</span></summary><form action={action} className="fieldset" style={{marginTop:16}}><input type="hidden" name="id" value={user.id}/><div className="form-grid"><label>Nome<input name="full_name" defaultValue={user.full_name} required/></label><label>Perfil<select name="role" defaultValue={user.role}>{Object.entries(ROLES).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label>EJ<select name="ej_id" defaultValue={user.ej_id||''}><option value="">Nenhuma</option>{ejs.map(e=><option value={e.id} key={e.id}>{e.name}</option>)}</select></label><label>Telefone<input name="phone" defaultValue={user.phone||''}/></label></div><label className="inline-check"><input type="checkbox" name="active" defaultChecked={user.active}/> Acesso ativo</label><button disabled={pending} className="primary">Salvar mudanças</button>{state.message&&<p className={state.ok?'notice':'error'}>{state.message}</p>}</form><div style={{marginTop:14}}><ResetAccess id={user.id}/></div></details>;
}
