-- Complemento do modelo de Forms/Relatório de Deliberação NEJLON 2026.
-- Compatível com as deliberações e respostas já existentes.
alter type public.vote_position add value if not exists 'suggestions';

alter table public.deliberations
  add column if not exists scenarios jsonb not null default '[]'::jsonb;
alter table public.responses
  add column if not exists scenario_answers jsonb not null default '[]'::jsonb,
  add column if not exists final_feedback jsonb not null default '{}'::jsonb;

alter table public.deliberations
  add constraint deliberation_scenarios_array check (jsonb_typeof(scenarios)='array');
alter table public.responses
  add constraint response_scenario_answers_array check (jsonb_typeof(scenario_answers)='array'),
  add constraint response_final_feedback_object check (jsonb_typeof(final_feedback)='object');

-- A manifestação da PRESCON é independente do conteúdo enviado pelo conselheiro.
create table if not exists public.response_reviews (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.responses(id) on delete cascade,
  scenario_key text not null,
  aspect text not null check (aspect in ('rejection','suggestion','caveat')),
  decision text not null default 'under_review' check (decision in ('under_review','accepted','rejected')),
  comment text not null default '',
  reviewed_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(response_id,scenario_key,aspect)
);
create trigger trg_response_reviews_updated before update on public.response_reviews
  for each row execute function public.set_updated_at();
alter table public.response_reviews enable row level security;
create policy "Somente PRESCON consulta análises" on public.response_reviews
  for select to authenticated using (public.is_active_role(array['prescon']::public.portal_role[]));
create policy "Somente PRESCON cria análises" on public.response_reviews
  for insert to authenticated with check (public.is_active_role(array['prescon']::public.portal_role[]));
create policy "Somente PRESCON atualiza análises" on public.response_reviews
  for update to authenticated using (public.is_active_role(array['prescon']::public.portal_role[]))
  with check (public.is_active_role(array['prescon']::public.portal_role[]));
create policy "Somente PRESCON exclui análises" on public.response_reviews
  for delete to authenticated using (public.is_active_role(array['prescon']::public.portal_role[]));
