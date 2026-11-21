'use client';
import {useActionState} from 'react';
import {resetPortalPassword,type AccessResult} from '@/app/actions';
const initial:AccessResult={ok:false,message:''};
export function ResetAccess({id}:{id:string}){
 const [state,action,pending]=useActionState(resetPortalPassword,initial);
 return <div className="fieldset"><form action={action}><input type="hidden" name="id" value={id}/><button disabled={pending} type="submit" className="outline">{pending?'Gerando…':'Redefinir senha temporária'}</button></form>{state.message&&<div className={state.ok?'notice':'error'} role="status">{state.message}{state.password&&<code className="secret">{state.password}</code>}</div>}</div>;
}
