-- Eventos internos protegidos no banco, nao apenas escondidos na interface.
alter table public.events add column if not exists visible_to_ej_direx boolean not null default false;

drop policy if exists "Eventos visíveis a membros ativos" on public.events;
create policy "Eventos por publico autorizado" on public.events
 for select to authenticated using (
  public.is_active_role(array['prescon','nucleus_direx','counselor']::public.portal_role[])
  or (
    visible_to_ej_direx
    and public.is_active_role(array['ej_direx']::public.portal_role[])
  )
);
comment on column public.events.visible_to_ej_direx is
 'Falso por padrao: DIREX de EJ nao pode consultar este evento nem por API.';
