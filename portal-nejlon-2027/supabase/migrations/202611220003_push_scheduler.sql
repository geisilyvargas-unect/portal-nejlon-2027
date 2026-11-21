-- Agendador nativo Supabase. Credencial de disparo fica no schema private.
create extension if not exists pg_net;
create extension if not exists pg_cron;
select cron.schedule(
 'nejlon-push-hourly',
 '5 * * * *',
 $job$
  select public.queue_push_reminders();
  select private.invoke_push_dispatch();
 $job$
);
-- Inicializa VAPID no Edge sem divulgar credenciais, via GET publico que retorna apenas chave publica.
select net.http_get(
 url:='https://imsisbixzkqphooxyfhr.supabase.co/functions/v1/nejlon-push-dispatch',
 timeout_milliseconds:=15000
);
