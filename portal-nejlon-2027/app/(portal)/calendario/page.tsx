import {requireViewer} from '@/lib/auth';
import {createClient} from '@/lib/supabase/server';
import {canManageEvents} from '@/lib/constants';
import {createEvent} from '@/app/actions';
import {CouncilCalendar, type CalendarEvent} from '@/components/council-calendar';

export default async function Calendar() {
  const viewer=await requireViewer();
  const db=await createClient();
  const {data:events,error}=await db.from('events').select('id,title,description,kind,starts_at').order('starts_at');
  if(error)throw Error(error.message);
  return <div className="stack">
    <div><div className="eyebrow">Governança • Rede</div><h1>Calendário institucional</h1>
      <p className="muted">Navegue pelos meses, selecione um dia ou visualize todos os compromissos no formato agenda.</p>
    </div>
    {canManageEvents(viewer.role)&&<details className="panel no-print">
      <summary>+ Cadastrar novo evento</summary>
      <form action={createEvent} className="fieldset" style={{marginTop:20}}>
        <div className="form-grid">
          <label>Nome do evento<input name="title" maxLength={250} required placeholder="Ex.: Reunião do Conselho"/></label>
          <label>Categoria<select name="kind"><option value="reuniao_conselho">Reunião do Conselho</option><option value="institucional">Institucional</option><option value="formacao">Formação</option><option value="prazo">Prazo</option><option value="outro">Outro</option></select></label>
        </div>
        <label>Data e horário<input type="datetime-local" name="starts_at" required/></label>
        <label>Descrição / informações adicionais<textarea name="description" placeholder="Link, pauta, local ou outras informações"/></label>
        <button type="submit" className="primary">Adicionar à agenda</button>
      </form>
    </details>}
    <CouncilCalendar events={(events||[]) as CalendarEvent[]}/>
  </div>;
}
