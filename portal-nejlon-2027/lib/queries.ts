import {createClient} from '@/lib/supabase/server';
import type {Ej,Deliberation,ResponseRow} from '@/lib/constants';
export async function getEjs():Promise<Ej[]>{const db=await createClient();const {data,error}=await db.from('ejs').select('id,name,slug').order('name');if(error)throw Error(error.message);return (data||[]) as Ej[];}
export async function getDeliberations():Promise<Deliberation[]>{const db=await createClient();const {data,error}=await db.from('deliberations').select('*').order('created_at',{ascending:false});if(error)throw Error(error.message);return (data||[]) as Deliberation[];}
export async function getResponses(deliberationIds?:string[]):Promise<ResponseRow[]>{if(deliberationIds?.length===0)return [];const db=await createClient();let q=db.from('responses').select('*');if(deliberationIds)q=q.in('deliberation_id',deliberationIds);const {data,error}=await q;if(error)throw Error(error.message);return (data||[]) as ResponseRow[];}
