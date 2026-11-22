# Central de Automações — PRESCON NEJLON 2027

## O que já foi preparado

A Central está em `pages/central-automacoes.html`, acessível pelo dashboard do perfil PRESCON. O código usa o Supabase como fonte de dados, Vercel Functions para ações autorizadas e Google APIs para Drive, Forms e Sheets.

- **Acesso seguro:** login Supabase, validação da conta ativa e do perfil `prescon` no servidor.
- **Google Drive:** conectar conta, criar pasta principal, subpastas por deliberação e enviar documentos de até 4 MB.
- **Formulários:** criar rascunhos com perguntas, inclusive o modelo PF (Sistema de Rateios, C1 e C2); opcionalmente criar uma versão Google.
- **Duplo canal:** respostas do Portal em `pages/responder.html` e importação de respostas Google para `portal_form_submissions`.
- **Relatórios:** consolidação dos dois canais; exportar CSV para o Drive ou criar uma planilha no Google Sheets.
- **Revisão da PRESCON:** respostas Google pendentes de identificação podem ser associadas à EJ, aceitas, rejeitadas ou marcadas como duplicadas.
- **WhatsApp:** abrir a Biblioteca de Mensagens com nome, link do Portal e Google Forms pré-preenchidos, para compartilhar no grupo do Conselho.
- **Sincronização Google:** botão manual e agendamento opcional diário via Vercel Cron (12:00 UTC / 09:00 em Brasília).
- **Banco:** tabelas `portal_forms`, `portal_form_submissions`, `portal_google_connections`, `portal_drive_settings` e `portal_drive_files`.

## Para ativar — falta autorização / configuração de 3 credenciais

No Vercel, projeto `portal-nejlon-2027`, abra **Settings → Environment Variables** e configure, para Production e Preview, as três variáveis restantes:

| Variável | Onde obter | Tratamento |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API Keys → service_role / secret key | **Segredo de servidor. Nunca usar no frontend ou enviar pelo chat.** |
| `GOOGLE_CLIENT_ID` | Google Cloud → APIs & Services → Credentials → OAuth Client (Web application) | Configurar no servidor |
| `GOOGLE_CLIENT_SECRET` | No mesmo OAuth Client do Google Cloud | **Segredo de servidor. Nunca usar no frontend ou enviar pelo chat.** |

Já foram configuradas automaticamente no Vercel: `GOOGLE_TOKEN_ENCRYPTION_KEY`, `CRON_SECRET`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `PORTAL_PUBLIC_ORIGIN` e `PORTAL_UI_URL`. **Não regenere a chave de criptografia após conectar o Google**: trocar a chave impede a leitura das conexões já guardadas.

### Configuração da conta Google

1. No [Google Cloud Console](https://console.cloud.google.com/), escolha um projeto administrado pelo NEJLON.
2. Habilite **Google Drive API**, **Google Forms API** e **Google Sheets API**.
3. Configure **OAuth consent screen** e adicione a conta institucional da PRESCON como usuária de teste, quando o aplicativo estiver em modo de teste.
4. Crie **OAuth Client ID → Web application**.
5. Em **Authorized redirect URIs**, use exatamente:

   `https://portal-nejlon-2027.vercel.app/api/google-callback`

6. Guarde o Client ID e o Client Secret nas variáveis do Vercel acima.
7. Faça um novo deployment e entre na Central usando o e-mail institucional autorizado. Clique em **Conectar conta Google** e aprove os escopos necessários.

Escopos solicitados: `openid`, `email`, `drive.file`, `forms.body`, `forms.responses.readonly`, `spreadsheets`. A conexão não garante acesso a documentos de outras contas que não foram compartilhados com a conta autorizada.

### Importante sobre o Google Forms

A API do Google Forms **não permite inserir uma resposta nativa** que tenha sido enviada pelo Portal. A consolidação oficial acontece no Supabase do NEJLON, não na aba nativa de respostas do Google Forms.

As respostas enviadas pelo Google são importadas como `pending_review`, pois não há garantia de que o nome da EJ digitado seja autenticado. Só a PRESCON pode vinculá-las a uma EJ e registrá-las como `accepted`. Uma resposta já aceita para essa EJ e formulário impede outra aceitação.

Se um formulário do Google já existir, a Central permite vincular o **ID da URL de edição** e sincronizar as respostas. Perguntas com títulos iguais às do Portal são mapeadas automaticamente; as demais precisam de conferência.

O botão **Publicar** atualmente publica o formulário no Portal. A publicação/aceitação de respostas no Google pode exigir uma etapa separada na interface do Google Forms.

### Organização do Drive

A primeira conexão pode criar a pasta `NEJLON — Documentos do Conselho` dentro da conta Google autorizada. A Central gera subpastas por deliberação e registra metadados dos arquivos criados. Não importa nem altera automaticamente arquivos antigos do Drive.

Esta versão permite arquivos de até **4 MB** por envio. Não substitui um backup completo do banco.

### Vercel Cron

`vercel.json` agenda `/api/cron-sync` diariamente. O servidor só permite executá-la quando `CRON_SECRET` estiver configurado. Também é possível sincronizar a qualquer momento pelo botão na Central.

O agendamento pode ter atraso de até um dia. Não é sincronização em tempo real; para alertas imediatos, considere no futuro um gatilho Google Apps Script / Pub/Sub após uma análise de segurança. Erros de sincronização exigem consulta aos logs do Vercel.

## Uso cotidiano da PRESCON

1. Entre na **Central de Automações**.
2. Escolha **Criar em minutos**, informe nome, tipo e prazo.
3. Opcionalmente crie também o Google Forms e a pasta no Drive.
4. Revise, publique e use **Preparar mensagem** para compartilhar no grupo do Conselho.
5. Acompanhe respostas no Portal e clique em **Sincronizar Google** se necessário.
6. Vincule respostas Google à EJ e aceite/recuse após análise.
7. Gere planilha/CSV no Drive e consulte o histórico.

## Segurança e limites

- **Não** usar senhas compartilhadas como `1234` em produção. O fluxo requer perfis ativos e autenticação individual.
- A chave `service_role` fica somente no servidor. Nunca a inclua no HTML, em repositórios ou prints.
- O seletor de perfis da demonstração **não** libera acesso à Central.
- Links Google/Drive e respostas pessoais devem respeitar autorizações e critérios de retenção da rede.
- O WhatsApp abre o compartilhamento: o envio efetivo é confirmado por quem administra o grupo.
- Ainda não existem geração automática de PDF de manual, rotina completa de cogestão, automação de demandas, integração Calendar, lembretes por WhatsApp sem intervenção ou publicação automática Google garantida.
- Antes de colocar em operação: testar login PRESCON/Conselho, importação de respostas, bloqueio de duplicatas, conteúdo PF, RLS, permissões, erros de rede e exportação no domínio de produção.

**Estado:** código e estruturas preparados no GitHub/Supabase; a ativação depende das credenciais e de validação real no Vercel. Não considerar o sistema pronto para votação institucional antes desses testes.

## Panorama semanal da PRESCON — implementação adicionada

- A aba **Visão geral** agora mostra a seção **Sua semana na PRESCON**, com dados obtidos sob autenticação do Supabase.
- Indicadores: deliberações abertas, prazos nos próximos sete dias, respostas Google aguardando validação e prazos já ultrapassados.
- Cada deliberação traz quantidade e lista expandível de EJs **sem resposta aceita**. Respostas Google pendentes de validação não contam como concluídas.
- Botões: atualizar indicadores, copiar panorama detalhado, preparar lembrete ao grupo no WhatsApp e abrir relatório individual.
- Prazo é guardado em `portal_forms.due_at` e validado pelo servidor na submissão pelo Portal.
- Este panorama **não gera mensagens automáticas** nem avalia motivos de ausência; o envio ao WhatsApp depende da escolha do grupo e da confirmação humana.
- Demandas, calendário e integração Google Calendar **ainda não fazem parte do resumo** porque não estão conectados a dados operacionais reais.
- A seção atualiza quando a PRESCON entra na Central ou usa **Atualizar prioridades**. Não é um resumo distribuído automaticamente por e-mail.

## Demandas integradas (novembro de 2026)

A Central recebeu uma aba **Demandas**, com criação em lote por EJ, modelos reutilizáveis, classificações Amarela/Laranja/Vermelha, justificativas e histórico. Conselho e DIREX acessam a página autenticada `pages/demandas.html` e podem justificar suas próprias demandas. **Somente a PRESCON decide se aceita ou recusa**, sempre deixando um comentário. A seção semanal destaca demandas vencidas e justificativas aguardando análise. Para regras e limites, leia [Sistema de Demandas](./SISTEMA-DE-DEMANDAS.md).
