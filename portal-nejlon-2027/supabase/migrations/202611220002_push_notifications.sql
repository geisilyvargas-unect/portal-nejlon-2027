
-- Notificações Web Push: inscrição por usuário e fila sem repetição por gatilho.
create schema if not exists private;
revoke all on schema private from public,anon,authenticated;
create table if not exists public.push_settings (
 id int primary key check (id=1),
 vapid_public_key text not null default ''
);
alter table public.push_settings enable row level security;
create policy "Chave VAPID publica" on public.push_settings for select to anon,authenticated using (true);
insert into public.push_settings(id) values(1) on conflict do nothing;

create table if not exists private.push_secrets(
 id int primary key check(id=1),
 vapid_public_key text,
 vapid_private_key text,
 scheduler_secret text not null default encode(gen_random_bytes(32),'hex')
);
insert into private.push_secrets(id) values(1) on conflict do nothing;
revoke all on private.push_secrets from public,anon,authenticated;

create table if not exists public.push_subscriptions(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 endpoint text not null unique,
 p256dh text not null,
 auth_secret text not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint push_endpoint_https check(left(endpoint,8)='https://')
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);
create trigger trg_push_subscriptions_updated before update on public.push_subscriptions
 for each row execute function public.set_updated_at();
alter table public.push_subscriptions enable row level security;
create policy "Dispositivos proprios" on public.push_subscriptions for select to authenticated using(user_id=(select auth.uid()));
create policy "Registrar proprio dispositivo" on public.push_subscriptions for insert to authenticated with check(
 user_id=(select auth.uid()) and public.is_active_role(array['prescon','counselor']::public.portal_role[])
);
create policy "Alterar proprio dispositivo" on public.push_subscriptions for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "Remover proprio dispositivo" on public.push_subscriptions for delete to authenticated using(user_id=(select auth.uid()));

create table if not exists public.push_outbox(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 event_key text not null,
 kind text not null,
 ref_id uuid,
 title text not null,
 body text not null,
 path text not null,
 status text not null default 'pending' check(status in('pending','processing','sent','failed')),
 attempts int not null default 0,
 locked_until timestamptz,
 created_at timestamptz not null default now(),
 delivered_at timestamptz,
 unique(user_id,event_key)
);
create index if not exists push_queue_idx on public.push_outbox(status,locked_until,created_at);
alter table public.push_outbox enable row level security;
-- Sem policies: fila acessível apenas a service_role.

create table if not exists public.push_deliveries(
 outbox_id uuid not null references public.push_outbox(id) on delete cascade,
 subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
 sent_at timestamptz not null default now(),
 primary key(outbox_id,subscription_id)
);
alter table public.push_deliveries enable row level security;

create or replace function public.get_push_private_config()
returns table(vapid_public_key text,vapid_private_key text,scheduler_secret text)
language sql stable security definer set search_path='' as $$
 select vapid_public_key,vapid_private_key,scheduler_secret
 from private.push_secrets where id=1;
$$;
revoke all on function public.get_push_private_config() from public,anon,authenticated;
grant execute on function public.get_push_private_config() to service_role;

create or replace function public.init_push_vapid(public_key text,private_key text)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 if length(public_key)<60 or length(private_key)<40 then raise exception 'Invalid VAPID keys'; end if;
 update private.push_secrets set vapid_public_key=public_key,vapid_private_key=private_key
  where id=1 and vapid_private_key is null;
 if found then
  update public.push_settings set vapid_public_key=public_key where id=1;
  return true;
 end if;
 return false;
end; $$;
revoke all on function public.init_push_vapid(text,text) from public,anon,authenticated;
grant execute on function public.init_push_vapid(text,text) to service_role;

create or replace function public.claim_push_outbox(batch_size integer default 35)
returns setof public.push_outbox
language plpgsql security definer set search_path='' as $$
begin
 return query
 with claims as (
  select q.id from public.push_outbox q
  where (q.status='pending' or(q.status='processing' and q.locked_until<now()))
    and q.attempts<5
  order by q.created_at
  limit least(greatest(batch_size,1),100)
  for update skip locked
 )
 update public.push_outbox q set status='processing',
   attempts=q.attempts+1,locked_until=now()+interval '5 minutes'
 from claims where q.id=claims.id returning q.*;
end; $$;
revoke all on function public.claim_push_outbox(integer) from public,anon,authenticated;
grant execute on function public.claim_push_outbox(integer) to service_role;

create or replace function private.on_deliberation_published()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status='open' and not new.is_demo and not new.is_historical
    and (tg_op='INSERT' or old.status is distinct from 'open') then
  insert into public.push_outbox(user_id,event_key,kind,ref_id,title,body,path)
  select p.id,'published:'||new.id,'new_deliberation',new.id,
   'Nova deliberação NEJLON',new.title||' — confira e registre a resposta da sua EJ.',
   '/deliberacoes/'||new.id
  from public.profiles p where p.active and p.role in ('prescon','counselor')
  on conflict(user_id,event_key) do nothing;
 end if;
 return new;
end; $$;
create trigger trg_new_deliberation_push after insert or update of status on public.deliberations
 for each row execute function private.on_deliberation_published();

create or replace function public.queue_push_reminders()
returns jsonb language plpgsql security definer set search_path='' as $$
declare local_day date := (now() at time zone 'America/Sao_Paulo')::date;
 affected integer := 0;
begin
 -- Só conselheiro cuja EJ ainda não respondeu, 3 dias antes ou no dia do vencimento.
 insert into public.push_outbox(user_id,event_key,kind,ref_id,title,body,path)
 select p.id,
   case when (d.due_at at time zone 'America/Sao_Paulo')::date-local_day=3
   then 'delib-3d:' else 'delib-today:' end || d.id,
  'deliberation_reminder',d.id,
  case when (d.due_at at time zone 'America/Sao_Paulo')::date-local_day=3
   then 'Faltam 3 dias para deliberar' else 'Último dia para deliberar!' end,
  d.title||' — sua EJ ainda não registrou a resposta.',
  '/deliberacoes/'||d.id
 from public.deliberations d join public.profiles p on p.role='counselor' and p.active and p.ej_id is not null
 where d.status='open' and not d.is_demo and not d.is_historical and d.due_at>now()
  and ((d.due_at at time zone 'America/Sao_Paulo')::date-local_day) in(3,0)
  and not exists(select 1 from public.responses r where r.deliberation_id=d.id and r.ej_id=p.ej_id)
 on conflict(user_id,event_key) do nothing;
 get diagnostics affected=row_count;

 -- PRESCON: 3 dias antes, último dia e encerramento.
 insert into public.push_outbox(user_id,event_key,kind,ref_id,title,body,path)
 select p.id,
  case when (d.due_at at time zone 'America/Sao_Paulo')::date-local_day=3
   then 'prescon-3d:' else 'prescon-today:' end||d.id,
  'prescon_deadline',d.id,
  case when (d.due_at at time zone 'America/Sao_Paulo')::date-local_day=3
   then 'Prazo encerra em 3 dias' else 'Deliberação encerra hoje' end,
  d.title||' — acompanhe as pendências no portal.',
  '/pendencias'
 from public.deliberations d join public.profiles p on p.role='prescon' and p.active
 where d.status='open' and not d.is_demo and not d.is_historical and d.due_at>now()
  and ((d.due_at at time zone 'America/Sao_Paulo')::date-local_day) in(3,0)
 on conflict(user_id,event_key) do nothing;

 insert into public.push_outbox(user_id,event_key,kind,ref_id,title,body,path)
 select p.id,'prescon-closed:'||d.id,'prescon_closed',d.id,
 'Prazo da deliberação encerrado',d.title||' — confira resultados e ressalvas.',
 '/relatorios/'||d.id
 from public.deliberations d join public.profiles p on p.role='prescon' and p.active
 where d.status='open' and not d.is_demo and not d.is_historical
  and d.due_at<=now() and d.due_at>now()-interval '7 days'
 on conflict(user_id,event_key) do nothing;

 -- Reuniões (kind=reuniao_conselho), 3 dias antes e no próprio dia.
 insert into public.push_outbox(user_id,event_key,kind,ref_id,title,body,path)
 select p.id,
  case when (e.starts_at at time zone 'America/Sao_Paulo')::date-local_day=3
   then 'meeting-3d:' else 'meeting-today:' end||e.id,
  'meeting_reminder',e.id,
  case when (e.starts_at at time zone 'America/Sao_Paulo')::date-local_day=3
   then 'Reunião do Conselho em 3 dias' else 'Reunião do Conselho hoje' end,
  e.title||' — consulte a agenda para detalhes.',
  '/calendario'
 from public.events e
 join public.profiles p on p.active and p.role in('prescon','counselor')
 where e.kind='reuniao_conselho' and e.starts_at>now()
  and ((e.starts_at at time zone 'America/Sao_Paulo')::date-local_day) in(3,0)
 on conflict(user_id,event_key) do nothing;
 return jsonb_build_object('new_counselor_reminders',affected,'date',local_day);
end; $$;
revoke all on function public.queue_push_reminders() from public,anon,authenticated;
grant execute on function public.queue_push_reminders() to service_role;

-- Apenas roles administrativas podem disparar o agendador via conexão interna.
create or replace function private.invoke_push_dispatch()
returns void language plpgsql security definer set search_path='' as $$
declare secret text;
begin
 select scheduler_secret into secret from private.push_secrets where id=1;
 perform net.http_post(
  url:='https://imsisbixzkqphooxyfhr.supabase.co/functions/v1/nejlon-push-dispatch',
  headers:=jsonb_build_object('Content-Type','application/json','x-cron-secret',secret),
  body:='{}'::jsonb,
  timeout_milliseconds:=15000
 );
end; $$;
revoke all on function private.invoke_push_dispatch() from public,anon,authenticated;
