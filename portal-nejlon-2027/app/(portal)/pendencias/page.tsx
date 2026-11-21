import Link from 'next/link';
import {requireRole} from '@/lib/auth';
import {getDeliberations,getEjs,getResponses} from '@/lib/queries';
import {createClient} from '@/lib/supabase/server';
import {getPendingEjs,reminderText} from '@/lib/pending';
import {formatDate} from '@/lib/constants';
import {CopyButton,RealtimePending} from '@/components/clipboard';
export const dynamic='force-dynamic';
export default async function Pending(){await requireRole(['prescon']);
 const [dels,ejs,responses]=await Promise.all([getDeliberations(),getEjs(),getResponses()]);
 const db=await createClient();const {data:contacts}=await db.from('profiles').select('ej_id,full_name,phone,email').eq('role','counselor').eq('active',true);
 const open=dels.filter(d=>d.status==='open'&&!d.is_demo);
 const allPending=open.flatMap(d=>getPendingEjs(ejs,responses.filter(r=>r.deliberation_id===d.id)).map(e=>({d,e})));
 const messageBundle=allPending.map(({d,e})=>reminderText(d.title,e.name,formatDate(d.due_at))).join('\n\n──────────────\n\n');
 return <div className="stack"><div className="toolbar"><div><div className="eyebrow">Prioridade máxima • PRESCON</div><h1>Central de Pendências</h1><p className="muted" style={{margin:0}}>Lista calculada a partir das 29 EJs e das respostas reais registradas.</p></div><RealtimePending/></div>
 <div className="kpi-grid"><div className="panel"><div className="muted small">EJs cadastradas</div><div className="stat">{ejs.length}</div></div><div className="panel"><div className="muted small">Deliberações em aberto</div><div className="stat">{open.length}</div></div><div className="panel"><div className="muted small">Pendências (EJ × deliberação)</div><div className="stat">{allPending.length}</div></div><div className="panel"><div className="muted small">Respostas recebidas</div><div className="stat">{open.reduce((n,d)=>n+responses.filter(r=>r.deliberation_id===d.id).length,0)}</div></div></div>
 {allPending.length>0&&<div className="panel"><div className="toolbar"><div><h2 style={{margin:0}}>Cobrança geral</h2><p className="muted small" style={{margin:0}}>Copie todas as mensagens das deliberações abertas.</p></div><CopyButton value={messageBundle} label={`Copiar ${allPending.length} cobranças`} className="primary"/></div></div>}
 {open.map(d=>{const missed=getPendingEjs(ejs,responses.filter(r=>r.deliberation_id===d.id));const batch=missed.map(e=>reminderText(d.title,e.name,formatDate(d.due_at))).join('\n\n──────────────\n\n');return <div className="panel" key={d.id}><div className="toolbar"><div><h2 style={{margin:0}}>{d.title}</h2><p className="muted small" style={{margin:0}}>Prazo: {formatDate(d.due_at)} • {ejs.length-missed.length} respostas • <strong>{missed.length} pendências</strong></p></div><div className="action-row"><CopyButton value={batch} label="Copiar cobranças desta deliberação"/><Link className="button outline" href={`/relatorios/${d.id}`}>Relatório</Link></div></div>{missed.length?<div className="table-wrap"><table><thead><tr><th>EJ</th><th>Conselheiro</th><th>Contato</th><th>Prazo</th><th>Cobrança</th></tr></thead><tbody>{missed.map(e=>{const person=contacts?.find(c=>c.ej_id===e.id);return <tr key={e.id}><td><strong>{e.name}</strong></td><td>{person?.full_name||'Não cadastrado'}</td><td><span className="small">{person?.phone||person?.email||'Sem contato'}</span></td><td className="small">{formatDate(d.due_at)}</td><td><CopyButton value={reminderText(d.title,e.name,formatDate(d.due_at))}/></td></tr>})}</tbody></table></div>:<div className="notice">Todas as EJs responderam esta deliberação! ✓</div>}</div>})}
 {!open.length&&<div className="panel"><h2>Nenhuma pendência ativa</h2><p className="muted">Publique uma deliberação real para começar o acompanhamento. Os registros fictícios nunca entram nesta central.</p><Link href="/deliberacoes" className="button primary">Criar deliberação</Link></div>}</div>;
}
