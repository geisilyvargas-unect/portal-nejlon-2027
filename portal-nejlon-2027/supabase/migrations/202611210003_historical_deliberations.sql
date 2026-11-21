-- Histórico de deliberações 2026: agregados oficiais, sem criar votos fictícios por EJ.
alter table public.deliberations
  add column if not exists is_historical boolean not null default false,
  add column if not exists historical_source_id text unique,
  add column if not exists historical_data jsonb not null default '{}'::jsonb,
  add column if not exists historical_report_text text;

alter table public.deliberations
  add constraint deliberations_historical_closed
  check (not is_historical or (status='closed' and is_demo=false));
alter table public.deliberations
  add constraint deliberations_historical_data_object
  check (jsonb_typeof(historical_data)='object');

-- Nota: o relatório histórico contém apenas agregados e comentários dos PDFs originais.
-- Não criar registros em public.responses, pois faltam votos individuais atribuídos às EJs.
