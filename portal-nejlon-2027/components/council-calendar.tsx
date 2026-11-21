'use client';
import {useMemo, useState} from 'react';
import {updateEventVisibility} from '@/app/actions';
import {googleCalendarUrl} from '@/lib/google-calendar-url';

export type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  kind: string;
  starts_at: string;
  ends_at:string|null;
  visible_to_ej_direx:boolean;
};

const zone = 'America/Sao_Paulo';
const kindName: Record<string,string> = {
  reuniao_conselho: 'Reunião do Conselho',
  institucional: 'Institucional',
  formacao: 'Formação',
  prazo: 'Prazo',
  outro: 'Outro',
};
const palette: Record<string,string> = {
  reuniao_conselho: 'red',
  institucional: 'petrol',
  formacao: 'lime',
  prazo: 'orange',
  outro: 'gray',
};
function keyOf(value:string | Date) {
  const parts = new Intl.DateTimeFormat('en-US', {timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value));
  const p = Object.fromEntries(parts.map(x=>[x.type,x.value]));
  return p.year + '-' + p.month + '-' + p.day;
}
function localDateKey(d:Date) {
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
const dateLabel = (value:string) => new Intl.DateTimeFormat('pt-BR',{timeZone:zone,dateStyle:'full'}).format(new Date(value + 'T12:00:00-03:00'));
const timeLabel = (value:string) => new Intl.DateTimeFormat('pt-BR',{timeZone:zone,hour:'2-digit',minute:'2-digit'}).format(new Date(value));
const week = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

export function CouncilCalendar({events,canEditVisibility=false}:{events:CalendarEvent[];canEditVisibility?:boolean}) {
  const today=keyOf(new Date());
  const [month,setMonth]=useState(today.slice(0,7));
  const [selected,setSelected]=useState(today);
  const [view,setView]=useState<'month'|'agenda'>('month');
  const [onlyKind,setOnlyKind]=useState('all');
  const [search,setSearch]=useState('');
  const filtered=useMemo(()=>events.filter(e=>
    (onlyKind==='all'||e.kind===onlyKind) &&
    (!search.trim() || (e.title+' '+(e.description||'')).toLocaleLowerCase('pt-BR').includes(search.trim().toLocaleLowerCase('pt-BR')))
  ).sort((a,b)=>a.starts_at.localeCompare(b.starts_at)),[events,onlyKind,search]);
  const byDay=useMemo(()=>{
    const map=new Map<string,CalendarEvent[]>();
    for(const event of filtered){ const key=keyOf(event.starts_at);map.set(key,[...(map.get(key)||[]),event]); }
    return map;
  },[filtered]);
  const [y,m]=month.split('-').map(Number);
  const currentStart=new Date(y,m-1,1);
  const gridStart=new Date(y,m-1,1-currentStart.getDay());
  const cells=Array.from({length:42},(_,i)=>new Date(gridStart.getFullYear(),gridStart.getMonth(),gridStart.getDate()+i));
  const label=new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(currentStart);
  const monthEvents=filtered.filter(e=>keyOf(e.starts_at).slice(0,7)===month);
  const selectedEvents=byDay.get(selected)||[];
  function jump(delta:number){
    const d=new Date(y,m-1+delta,1);
    setMonth(localDateKey(d).slice(0,7));
    setSelected(localDateKey(d));
  }
  function select(d:Date){
    const next=localDateKey(d);
    setSelected(next);
    setMonth(next.slice(0,7));
  }
  return <div className="calendar-layout">
    <div className="panel calendar-main">
      <div className="calendar-toolbar">
        <div>
          <div className="eyebrow">Agenda da Rede</div>
          <h2 className="calendar-title">{label.charAt(0).toUpperCase()+label.slice(1)}</h2>
        </div>
        <div className="calendar-controls no-print">
          <button type="button" className="outline" onClick={()=>jump(-1)} aria-label="Mês anterior">‹</button>
          <button type="button" className="outline" onClick={()=>{setMonth(today.slice(0,7));setSelected(today);}}>Hoje</button>
          <button type="button" className="outline" onClick={()=>jump(1)} aria-label="Próximo mês">›</button>
          <div className="calendar-switch">
            <button type="button" className={view==='month'?'calendar-selected':''} onClick={()=>setView('month')}>Mês</button>
            <button type="button" className={view==='agenda'?'calendar-selected':''} onClick={()=>setView('agenda')}>Agenda</button>
          </div>
        </div>
      </div>
      <div className="calendar-filters no-print">
        <label>Buscar evento<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Reunião, formação, prazo..." aria-label="Buscar eventos"/></label>
        <label>Tipo de evento<select value={onlyKind} onChange={e=>setOnlyKind(e.target.value)}><option value="all">Todos os tipos</option>{Object.entries(kindName).map(([key,name])=><option value={key} key={key}>{name}</option>)}</select></label>
      </div>
      {view==='month'?<div className="calendar-grid" role="grid" aria-label="Calendário do mês">
        {week.map(day=><div key={day} className="calendar-weekday" role="columnheader">{day}</div>)}
        {cells.map(d=>{
          const key=localDateKey(d);
          const items=byDay.get(key)||[];
          return <button type="button" role="gridcell" key={key} aria-label={dateLabel(key)+', '+items.length+' evento(s)'}
            className={'calendar-day '+(key.slice(0,7)===month?'':'outside ')+(key===today?'today ':'')+(key===selected?'selected ':'')}
            onClick={()=>select(d)}>
            <span className="calendar-day-number">{d.getDate()}</span>
            <span className="calendar-chips">
              {items.slice(0,2).map(event=><span key={event.id} className={'calendar-chip '+(palette[event.kind]||'gray')}>
                <span className="calendar-dot"/><span className="calendar-chip-text">{event.title}</span>
              </span>)}
              {items.length>2&&<span className="calendar-more">+{items.length-2} mais</span>}
            </span>
          </button>;
        })}
      </div>:<div className="calendar-agenda">
        {monthEvents.length===0&&<p className="muted">Nenhum evento neste mês para os filtros selecionados.</p>}
        {Array.from(new Set(monthEvents.map(e=>keyOf(e.starts_at)))).map(key=><section key={key} className="calendar-agenda-day">
          <h3>{dateLabel(key)}</h3>
          {(byDay.get(key)||[]).map(e=><article key={e.id} className="calendar-agenda-event">
            <span className={'calendar-event-stripe '+(palette[e.kind]||'gray')}/>
            <div><strong>{timeLabel(e.starts_at)} · {e.title}</strong><p className="muted small">{kindName[e.kind]||e.kind}{e.description?' · '+e.description:''}</p></div>
          </article>)}
        </section>)}
      </div>}
    </div>
    <aside className="panel calendar-sidebar">
      <div className="eyebrow">Dia selecionado</div>
      <h2>{dateLabel(selected)}</h2>
      {selectedEvents.length===0&&<p className="muted">Nenhum compromisso neste dia.</p>}
      {selectedEvents.map(e=><article key={e.id} className="calendar-detail">
        <span className={'calendar-detail-mark '+(palette[e.kind]||'gray')}/>
        <div style={{flex:1,minWidth:0}}>
          <strong>{e.title}</strong>
          <div className="muted small">{timeLabel(e.starts_at)} · {kindName[e.kind]||e.kind}</div>
          {e.description&&<p className="whitespace small">{e.description}</p>}
          <a href={googleCalendarUrl(e)} className="button outline calendar-google-link" target="_blank" rel="noopener noreferrer" title="Abre o formulário de evento no Google Agenda para você confirmar e salvar">Adicionar ao Google Agenda ↗</a>
          {canEditVisibility&&<form action={updateEventVisibility} className="calendar-visibility-form no-print">
            <input type="hidden" name="event_id" value={e.id}/>
            <label className="inline-check">
              <input type="checkbox" name="visible_to_ej_direx" defaultChecked={e.visible_to_ej_direx} key={e.id+'-'+String(e.visible_to_ej_direx)}/>
              Visível para DIREX de EJ?
            </label>
            <button type="submit" className="outline">Salvar visibilidade</button>
          </form>}
        </div>
      </article>)}
      <hr/>
      <h3>Próximos compromissos</h3>
      {filtered.filter(e=>keyOf(e.starts_at)>=today).slice(0,5).map(e=><div key={e.id} className="calendar-next"><strong>{e.title}</strong><span className="muted small">{new Intl.DateTimeFormat('pt-BR',{timeZone:zone,day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(e.starts_at))}</span></div>)}
      {!filtered.some(e=>keyOf(e.starts_at)>=today)&&<p className="muted small">Não há eventos futuros cadastrados.</p>}
    </aside>
  </div>;
}
