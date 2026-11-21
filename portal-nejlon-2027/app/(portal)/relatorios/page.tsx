import Link from 'next/link';
import {requireRole} from '@/lib/auth';
import {getDeliberations} from '@/lib/queries';
import {formatDate} from '@/lib/constants';
export default async function Reports(){await requireRole(['prescon']);const delibs=(await getDeliberations()).filter(d=>!d.is_demo);return <div className="stack"><div><div className="eyebrow">PRESCON • Consolidação</div><h1>Relatórios</h1><p className="muted">Consolide respostas e pendências por deliberação. Documentos para análise institucional, não atas validadas automaticamente.</p></div><div className="panel">{delibs.map(d=><div className="list-card" key={d.id}><div><h3>{d.title}</h3><div className="small muted">{formatDate(d.due_at)} • {d.status}</div></div><Link className="button outline" href={`/relatorios/${d.id}`}>Abrir relatório</Link></div>)}{!delibs.length&&<p className="muted">Crie uma deliberação real para gerar seu relatório.</p>}</div></div>}
