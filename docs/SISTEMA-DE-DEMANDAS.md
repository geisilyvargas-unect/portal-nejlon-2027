# Sistema de Demandas — Portal NEJLON 2027

## Objetivo

Gerenciar demandas e justificativas das empresas juniores sem planilhas paralelas. A PRESCON cadastra, acompanha, decide sobre justificativas e registra suas razões. Conselho e DIREX da EJ consultam apenas as demandas vinculadas à própria EJ.

## Acesso

- **PRESCON:** Central de Automações → **Demandas**, ou `pages/demandas.html` com conta PRESCON.
- **Conselho / DIREX da EJ:** menu **Demandas** → `pages/demandas.html`, com login institucional e EJ vinculada.
- **DIREX do Núcleo:** não recebe permissão para decidir sobre justificativas neste novo fluxo. Configurações de outras telas não substituem a verificação da API.

## Etapas

1. A PRESCON escolhe um modelo, edita título/descrição, define prazo e gravidade (**Amarela / Laranja / Vermelha**) e marca uma ou várias EJs. O sistema cria uma demanda independente para cada EJ.
2. O conselheiro ou a DIREX da EJ pode enviar **justificativa** com motivo, texto explicativo e link HTTPS de comprovante opcional.
3. A justificativa aparece como **Aguardando análise** no painel da PRESCON. A EJ pode acompanhar o status, sem decidir.
4. A PRESCON analisa o conteúdo e **aceita ou recusa**, obrigatoriamente deixando uma explicação. Há textos-base editáveis, mas a decisão nunca é automática.
5. **Aceita:** a demanda passa a **Justificada**. **Recusada:** permanece com sua situação de pendência/andamento, e a EJ pode enviar nova justificativa.
6. PRESCON pode marcar a demanda como **Em andamento**, **Concluída** ou reabrir a pendência, mantendo histórico das alterações. Reaberturas de situações encerradas exigem explicação.
7. Todas as movimentações e decisões são registradas no histórico da demanda, que também aparece à EJ.

**Concluída** (atividade efetivamente executada) e **Justificada** (justificativa acatada) são resultados diferentes e não devem ser confundidos.

## Dados e segurança

- Tabela já existente `public.demands` ganhou `severity`, `created_by`, `updated_at`, `completed_at` e `template_key`.
- `public.portal_demand_justifications`: mantém justificativas, evidência, estado e explicação da PRESCON.
- `public.portal_demand_events`: trilha de auditoria com autor, ação, data e nota.
- Novas tabelas têm RLS habilitada e acessos diretos de `anon` e `authenticated` revogados; a API `/api/demands` valida o JWT e o perfil na base antes de acessar dados pelo servidor.
- Apenas a PRESCON pode finalizar uma justificativa pela função PostgreSQL `portal_decide_demand_justification`, transacional, disponível exclusivamente a `service_role`.
- Duplicidade: no máximo uma justificativa aguardando decisão por demanda; uma justificativa recusada permite novo envio. Ações duplicadas de decisão são bloqueadas.
- O painel semanal da PRESCON consulta demandas abertas, justificativas aguardando avaliação e prazos ultrapassados. Não encaminha a explicação individual ao grupo do WhatsApp.

## Modelos iniciais

Falta em reunião, falta em imersão, atualização no Monday, horas semanais, entrega de documento e personalizada.

Os modelos são sugestões editáveis; os critérios institucionais e a gravidade de cada situação devem ser definidos pela gestão do NEJLON.

## Estado de implantação

Código incluído no GitHub e migração aplicada no Supabase. Sintaxe JavaScript, esquema e permissões da função transacional foram conferidos. **Ainda não validado com contas reais de PRESCON e EJ no site publicado.**

O Vercel exige a variável de ambiente de servidor `SUPABASE_SERVICE_ROLE_KEY` para executar esta API; configure-a como segredo, nunca no frontend. Também é necessário publicar o commit mais recente no Vercel. A ativação do Google Drive/Forms depende ainda das credenciais OAuth.

O banco não possui demandas históricas importadas: nenhum dado foi inventado. Novos registros só surgirão depois de criados por uma PRESCON autorizada.

## Teste de aceitação recomendado

1. Entrar com PRESCON, criar uma demanda para uma EJ e conferir se aparece somente no perfil dessa EJ.
2. Entrar com Conselho/DIREX da EJ, justificar com um motivo e evidência opcional, e verificar que a justificativa fica pendente.
3. Entrar como PRESCON, recusar com comentário e verificar se a EJ vê o motivo e pode enviar outra justificativa.
4. Aceitar uma justificativa com comentário e confirmar o estado **Justificada**, distinto de **Concluída**.
5. Testar acesso direto a `/api/demands?action=decide` com conta Conselho: a API deve negar.
6. Conferir o histórico e os números do panorama semanal da Central.
