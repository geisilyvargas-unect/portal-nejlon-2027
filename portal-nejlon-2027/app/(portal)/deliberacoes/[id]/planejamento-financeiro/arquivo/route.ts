import {NextResponse} from 'next/server';
import {requireRole} from '@/lib/auth';
import {createClient} from '@/lib/supabase/server';
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
 await requireRole(['prescon','counselor']);
 const {id}=await params;
 if(!/^[0-9a-f-]{36}$/i.test(id))return new NextResponse('Arquivo não encontrado',{status:404});
 const db=await createClient();
 const {data:deliberation}=await db.from('deliberations').select('id').eq('id',id).maybeSingle();
 if(!deliberation)return new NextResponse('Deliberação não disponível',{status:404});
 const {data:pf}=await db.from('deliberation_pf_files').select('storage_path,file_name').eq('deliberation_id',id).maybeSingle();
 if(!pf)return new NextResponse('Arquivo não encontrado',{status:404});
 const {data,error}=await db.storage.from('deliberation-pf').download(pf.storage_path);
 if(error||!data)return new NextResponse('Arquivo indisponível',{status:404});
 const filename=pf.file_name.replace(/[^a-zA-Z0-9._-]/g,'_');
 const disposition=new URL(_req.url).searchParams.get('view')==='1'?'inline':'attachment';
 return new NextResponse(data,{headers:{'Content-Type':filename.endsWith('.csv')?'text/csv; charset=utf-8':'application/octet-stream','Content-Disposition':disposition+'; filename="'+filename+'"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}