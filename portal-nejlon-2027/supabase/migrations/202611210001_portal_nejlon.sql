-- PORTAL NEJLON 2027 - Executar integralmente no SQL Editor do Supabase.
-- Segredos e contas de autenticação NUNCA são gravados aqui.
create extension if not exists pgcrypto;

create type public.portal_role as enum ('prescon','nucleus_direx','ej_direx','counselor');
create type public.deliberation_status as enum ('draft','open','closed');
create type public.vote_position as enum ('favorable','qualified','against','abstention');

create table public.ejs (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role public.portal_role not null,
  ej_id uuid references public.ejs(id),
  phone text,
  active boolean not null default true,
  must_change_password boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint role_ej_consistency check (
    (role in ('prescon','nucleus_direx') and ej_id is null) or
    (role in ('ej_direx','counselor') and ej_id is not null)
  )
);
create index profiles_ej_idx on public.profiles(ej_id);

-- Helper functions SECURITY DEFINER: sem parâmetros de perfil, nunca confiam no cliente.
create function public.is_active_role(allowed public.portal_role[])
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.active and not p.must_change_password and p.role = any(allowed)
  );
$$;
create function public.my_ej_id() returns uuid language sql stable security definer set search_path = '' as $$
  select p.ej_id from public.profiles p where p.id = (select auth.uid()) and p.active and not p.must_change_password limit 1;
$$;
create function public.has_active_profile() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.active and not p.must_change_password);
$$;
revoke all on function public.is_active_role(public.portal_role[]) from public;
revoke all on function public.my_ej_id() from public;
revoke all on function public.has_active_profile() from public;
grant execute on function public.is_active_role(public.portal_role[]), public.my_ej_id(), public.has_active_profile() to authenticated;

create function public.enforce_last_prescon() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.role = 'prescon' and old.active and (TG_OP = 'DELETE' or (TG_OP = 'UPDATE' and (new.role <> 'prescon' or not new.active))) then
    perform pg_catalog.pg_advisory_xact_lock(7404127);
    if (select count(*) from public.profiles where role='prescon' and active and id <> old.id) = 0 then
      raise exception 'Não é possível desativar, excluir ou rebaixar o último administrador.';
    end if;
  end if;
  if TG_OP = 'DELETE' then return old; end if;
  return new;
end;
$$;
create trigger trg_last_prescon before update or delete on public.profiles for each row execute function public.enforce_last_prescon();
create function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger trg_profiles_updated before update on public.profiles for each row execute function public.set_updated_at();

create table public.deliberations (
  id uuid primary key default gen_random_uuid(),
  title text not null check(char_length(title) between 3 and 250),
  description text not null default '',
  due_at timestamptz not null,
  status public.deliberation_status not null default 'draft',
  direx_visible boolean not null default false,
  is_demo boolean not null default false,
  report_notes text,
  report_followup text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_deliberations_updated before update on public.deliberations for each row execute function public.set_updated_at();

create table public.responses (
  id uuid primary key default gen_random_uuid(),
  deliberation_id uuid not null references public.deliberations(id) on delete cascade,
  ej_id uuid not null references public.ejs(id),
  position public.vote_position not null,
  justification text,
  caveats text,
  suggestions text,
  submitted_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(deliberation_id, ej_id)
);
create index responses_deliberation_idx on public.responses(deliberation_id);
create trigger trg_responses_updated before update on public.responses for each row execute function public.set_updated_at();
-- Bloqueia troca de EJ/deliberação numa atualização; o conselheiro sucessor pode atualizar a resposta da EJ.
create function public.guard_response_update() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.ej_id <> old.ej_id or new.deliberation_id <> old.deliberation_id then
    raise exception 'Não é possível transferir a resposta para outra EJ ou deliberação.';
  end if;
  return new;
end;
$$;
create trigger trg_guard_response before update on public.responses for each row execute function public.guard_response_update();

create table public.demo_responses (
  id uuid primary key default gen_random_uuid(),
  deliberation_id uuid not null references public.deliberations(id) on delete cascade,
  ej_id uuid not null references public.ejs(id),
  position public.vote_position not null,
  note text not null default 'Dados fictícios, apenas para apresentação',
  unique(deliberation_id,ej_id)
);

create table public.demands (
  id uuid primary key default gen_random_uuid(),
  ej_id uuid not null references public.ejs(id),
  title text not null,
  description text not null default '',
  due_at date,
  status text not null default 'pendente' check(status in ('pendente','em_andamento','concluida')),
  responsible text,
  created_at timestamptz not null default now()
);
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  kind text not null default 'institucional',
  starts_at timestamptz not null,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  url text not null check(url ~* '^https://'),
  visibility text not null default 'all' check(visibility in ('all','council','direx')),
  created_at timestamptz not null default now()
);
create table public.journey_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  material_url text check(material_url is null or material_url ~* '^https://'),
  session_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.journey_progress (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.journey_items(id) on delete cascade,
  counselor_id uuid not null references public.profiles(id) on delete cascade,
  attended boolean not null default false,
  feedback text,
  unique(journey_id,counselor_id)
);

alter table public.ejs enable row level security;
alter table public.profiles enable row level security;
alter table public.deliberations enable row level security;
alter table public.responses enable row level security;
alter table public.demo_responses enable row level security;
alter table public.demands enable row level security;
alter table public.events enable row level security;
alter table public.documents enable row level security;
alter table public.journey_items enable row level security;
alter table public.journey_progress enable row level security;

create policy "EJs visíveis a usuários ativos" on public.ejs for select to authenticated using (public.has_active_profile());
create policy "Perfis próprios e PRESCON" on public.profiles for select to authenticated using (id=(select auth.uid()) or public.is_active_role(array['prescon']::public.portal_role[]));
-- Administração de perfis SOMENTE pela API do servidor autenticada como PRESCON (service role).
-- A liberação após a troca de senha ocorre APENAS no servidor,
-- após auth.updateUser() concluir com sucesso, usando service_role.

create policy "Ler deliberações permitidas" on public.deliberations for select to authenticated using (
  public.is_active_role(array['prescon']::public.portal_role[])
  or (status <> 'draft' and not is_demo and (
    public.is_active_role(array['counselor']::public.portal_role[])
    or (direx_visible and public.is_active_role(array['nucleus_direx','ej_direx']::public.portal_role[]))
  ))
);
create policy "PRESCON cria deliberações" on public.deliberations for insert to authenticated with check (public.is_active_role(array['prescon']::public.portal_role[]));
create policy "PRESCON atualiza deliberações" on public.deliberations for update to authenticated using (public.is_active_role(array['prescon']::public.portal_role[])) with check (public.is_active_role(array['prescon']::public.portal_role[]));

create policy "Somente Conselho da EJ e PRESCON veem respostas" on public.responses for select to authenticated using (
  public.is_active_role(array['prescon']::public.portal_role[])
  or (public.is_active_role(array['counselor']::public.portal_role[]) and ej_id=public.my_ej_id())
);
create policy "Conselheiro responde pela própria EJ" on public.responses for insert to authenticated with check (
  public.is_active_role(array['counselor']::public.portal_role[]) and
  ej_id = public.my_ej_id() and submitted_by=(select auth.uid()) and
  exists (select 1 from public.deliberations d where d.id=deliberation_id and d.status='open' and not d.is_demo and d.due_at > now())
);
create policy "Conselheiro atualiza própria resposta aberta" on public.responses for update to authenticated using (
  public.is_active_role(array['counselor']::public.portal_role[]) and ej_id=public.my_ej_id() and
  exists (select 1 from public.deliberations d where d.id=deliberation_id and d.status='open' and not d.is_demo and d.due_at > now())
) with check (
  public.is_active_role(array['counselor']::public.portal_role[]) and ej_id=public.my_ej_id() and
  submitted_by=(select auth.uid()) and
  exists (select 1 from public.deliberations d where d.id=deliberation_id and d.status='open' and not d.is_demo and d.due_at > now())
);
create policy "Demonstração só para PRESCON" on public.demo_responses for select to authenticated using (public.is_active_role(array['prescon']::public.portal_role[]));

create policy "Demandas permitidas" on public.demands for select to authenticated using (
  public.is_active_role(array['prescon','nucleus_direx']::public.portal_role[]) or
  (public.has_active_profile() and ej_id=public.my_ej_id())
);
create policy "PRESCON e DIREX Núcleo criam demandas" on public.demands for insert to authenticated with check(public.is_active_role(array['prescon','nucleus_direx']::public.portal_role[]));
create policy "PRESCON e DIREX Núcleo atualizam demandas" on public.demands for update to authenticated using(public.is_active_role(array['prescon','nucleus_direx']::public.portal_role[])) with check(public.is_active_role(array['prescon','nucleus_direx']::public.portal_role[]));
create policy "Eventos visíveis a membros ativos" on public.events for select to authenticated using(public.has_active_profile());
create policy "Gestores criam eventos" on public.events for insert to authenticated with check(public.is_active_role(array['prescon','nucleus_direx']::public.portal_role[]));
create policy "Gestores atualizam eventos" on public.events for update to authenticated using(public.is_active_role(array['prescon','nucleus_direx']::public.portal_role[])) with check(public.is_active_role(array['prescon','nucleus_direx']::public.portal_role[]));
create policy "Documentos conforme perfil" on public.documents for select to authenticated using (
  public.is_active_role(array['prescon']::public.portal_role[]) or
  (public.has_active_profile() and (visibility='all' or
   (visibility='council' and public.is_active_role(array['counselor']::public.portal_role[])) or
   (visibility='direx' and public.is_active_role(array['ej_direx','nucleus_direx']::public.portal_role[]))))
);
create policy "PRESCON cadastra documentos" on public.documents for insert to authenticated with check(public.is_active_role(array['prescon']::public.portal_role[]));
create policy "PRESCON atualiza documentos" on public.documents for update to authenticated using(public.is_active_role(array['prescon']::public.portal_role[])) with check(public.is_active_role(array['prescon']::public.portal_role[]));
create policy "Jornada visível a membros ativos" on public.journey_items for select to authenticated using(public.has_active_profile());
create policy "PRESCON cadastra Jornada" on public.journey_items for insert to authenticated with check(public.is_active_role(array['prescon']::public.portal_role[]));
create policy "PRESCON atualiza Jornada" on public.journey_items for update to authenticated using(public.is_active_role(array['prescon']::public.portal_role[])) with check(public.is_active_role(array['prescon']::public.portal_role[]));
create policy "Progresso privado" on public.journey_progress for select to authenticated using(
  public.is_active_role(array['prescon']::public.portal_role[]) or
  (public.is_active_role(array['counselor']::public.portal_role[]) and counselor_id=(select auth.uid()))
);
create policy "Conselheiro informa seu feedback" on public.journey_progress for insert to authenticated with check(public.is_active_role(array['counselor']::public.portal_role[]) and counselor_id=(select auth.uid()) and not attended);
create policy "Conselheiro edita feedback" on public.journey_progress for update to authenticated using(public.is_active_role(array['counselor']::public.portal_role[]) and counselor_id=(select auth.uid())) with check(public.is_active_role(array['counselor']::public.portal_role[]) and counselor_id=(select auth.uid()));
-- Conselheiros não podem marcar a própria presença via edição direta.
create function public.guard_attendance() returns trigger language plpgsql set search_path = '' as $$
begin
 if auth.role() <> 'service_role' and new.attended is distinct from old.attended then
   raise exception 'Somente a administração registra presença.';
 end if;
 return new;
end; $$;
create trigger trg_guard_attendance before update on public.journey_progress
  for each row execute function public.guard_attendance();
-- Presença só pode ser registrada pela PRESCON, via painel administrativo / futura extensão.

insert into public.ejs(name,slug) values
('3E','3e'),('APRIMORA','aprimora'),('ARTUS','artus'),('BUSINESS','business'),
('BÓSON','boson'),('BIOMA','bioma'),('CATEC’Z','catecz'),('CONSOAGRO','consoagro'),
('COTTON','cotton'),('ECAE','ecae'),('ELO','elo'),('FERTFIELD','fertfield'),
('GAIA','gaia'),('KINASE','kinase'),('LEX','lex'),('LION','lion'),
('MECA','meca'),('NOTTON','notton'),('PARACELSO','paracelso'),('PEGASUS','pegasus'),
('SELECT','select'),('SETE','sete'),('SMAT JR','smatjr'),('SMARTMEC','smartmec'),
('SOLUÇÃO','solucao'),('TCP','tcp'),('THERION','therion'),('UNECT','unect'),('VET JR','vetjr')
on conflict (slug) do nothing;

insert into public.deliberations(title,description,due_at,status,direx_visible,is_demo)
values
('Padronização das demandas do Conselho','DEMONSTRAÇÃO: proposta de padronização dos registros de demandas da Rede.',now()+interval '7 days','open',true,true),
('Calendário anual de reuniões','DEMONSTRAÇÃO: proposta de calendário de reuniões do Conselho para o próximo ciclo.',now()+interval '10 days','open',true,true),
('Diretrizes de comunicação','DEMONSTRAÇÃO: diretrizes para comunicação institucional entre EJs e Conselho.',now()+interval '14 days','open',false,true);

-- Respostas fictícias armazenadas separadamente, SEM CONTAR nas pendências oficiais.
insert into public.demo_responses(deliberation_id,ej_id,position)
select d.id,e.id,v.position::public.vote_position
from (values ('Padronização das demandas do Conselho','unect','favorable'),
             ('Padronização das demandas do Conselho','3e','qualified'),
             ('Calendário anual de reuniões','boson','abstention')) v(title,slug,position)
join public.deliberations d on d.title=v.title and d.is_demo
join public.ejs e on e.slug=v.slug;

-- Para atualização em tempo real, habilita replicação segura para respostas.
do $$ begin
  if exists (select 1 from pg_publication where pubname='supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='responses'
     ) then
     alter publication supabase_realtime add table public.responses;
  end if;
end $$;
