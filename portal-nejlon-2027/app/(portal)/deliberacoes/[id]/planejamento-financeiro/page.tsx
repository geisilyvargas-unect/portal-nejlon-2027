import Link from 'next/link';
import {notFound} from 'next/navigation';
import {requireRole} from '@/lib/auth';
import {createClient} from '@/lib/supabase/server';
import {PfWorkbookViewer} from '@/components/pf-workbook-viewer';
export default async function PfPage({params}:{params:Promise<{id:string}>}){
 await requireRole(['prescon','counselor']);
 const {id}=await params;
 const db=await createClient();
 const {data:pf}=await db.from('deliberation_pf_files').select('file_name').eq('deliberation_id',id).maybeSingle();
 const {data:d}=await db.from('deliberations').select('title').eq('id',id).maybeSingle();
 if(!pf||!d)notFound();
 return <div className="stack"><div className="no-print"><Link href={'/deliberacoes/'+id}>← Voltar à deliberação</Link></div><div className="panel"><div className="eyebrow">NEJLON · PLANEJAMENTO FINANCEIRO</div><h1>{d.title}</h1><p className="muted">Arquivo original: {pf.file_name} · Consulta somente leitura</p><a className="button outline" href={'/deliberacoes/'+id+'/planejamento-financeiro/arquivo'}>Baixar arquivo original</a><p className="muted small">Este é o arquivo que a PRESCON anexou à deliberação. O acesso é individual e exige login ativo.</p></div><PfWorkbookViewer fileUrl={'/deliberacoes/'+id+'/planejamento-financeiro/arquivo'} fileName={pf.file_name}/></div>;
}