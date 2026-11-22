# Especificação de requisitos — Portal NEJLON 2027
**Método:** engenharia reversa do repositório `portal-nejlon-2027`, das APIs Node em `api/`, das Edge Functions `forms`, `demands`, `drive` e do esquema consultado no Supabase em 22/11/2026.  
**Legenda:** **I** implementado no código; **P** parcial ou não comprovado; **B** bloqueado por infraestrutura, credenciais ou integrações. Implementação não significa teste ponta a ponta concluído.

## 1. Atores e limites
- **PRESCON:** administração de demandas, formulários, deliberações, revisão de respostas, arquivos e relatórios.
- **Conselheiro:** consulta informações permitidas, responde por sua EJ, justifica demandas e solicita alteração de voto.
- **DIREX da EJ:** consulta demandas e indicadores permitidos da própria EJ, sem acesso a justificativas confidenciais.
- **DIREX do Núcleo:** acompanha indicadores e deliberações em visão de fiscalização, sem revelar votos individuais em aberto.
- **Visitante:** apenas demonstração fictícia e conteúdo institucional.
- **Integrações:** Supabase Auth/Postgres/Edge Functions, Google OAuth/Drive/Forms/Sheets, Vercel, GitHub e rotina agendada.

## 2. Requisitos funcionais
| ID | Requisito | Situação |
|---|---|---|
| RF-01 | Apresentar portal público com dados fictícios explicitamente identificados como demonstração. | I |
| RF-02 | Permitir alternar visões simuladas PRESCON, Conselho, DIREX EJ e DIREX Núcleo sem alterar dados reais. | I |
| RF-03 | Autenticar usuários institucionais pelo Supabase Auth. | I |
| RF-04 | Validar perfil ativo, papel e vínculo à EJ a cada operação sensível. | I |
| RF-05 | Renovar sessão expirada ou solicitar novo login quando necessário. | I |
| RF-06 | Restringir criação de demandas à PRESCON. | I |
| RF-07 | Criar demandas em lote para uma ou várias EJs com título, descrição, responsável, prazo e severidade. | I |
| RF-08 | Classificar demandas em amarela, laranja ou vermelha. | I |
| RF-09 | Listar demandas segundo papel e EJ, ocultando detalhes reservados. | I |
| RF-10 | Permitir justificativa pelo conselheiro da EJ responsável, com motivo, texto e comprovante HTTPS opcional. | I |
| RF-11 | Evitar múltiplas justificativas pendentes para a mesma demanda. | I |
| RF-12 | Permitir à PRESCON aceitar ou rejeitar justificativa com motivação obrigatória. | I |
| RF-13 | Atualizar demanda, justificativa e histórico de decisão em transação no banco. | I |
| RF-14 | Permitir à PRESCON concluir, reabrir ou alterar o estado de uma demanda, exigindo justificativa em casos críticos. | I |
| RF-15 | Registrar eventos de demandas e consultar indicadores de pendência, atraso e conclusão. | I |
| RF-16 | Criar rascunhos de formulários e deliberações com título, descrição, público, prazo e perguntas. | I |
| RF-17 | Suportar deliberação de planejamento financeiro com rateio e quantidade configurável de cenários (1–5 na interface). | I no código corrigido; publicação pendente |
| RF-18 | Validar perguntas obrigatórias e alternativas de voto permitidas. | I |
| RF-19 | Publicar apenas rascunhos e encerrar apenas formulários abertos. | I no código corrigido; publicação pendente |
| RF-20 | Restringir voto do portal a conselheiro autenticado e vinculado a EJ. | I |
| RF-21 | Impedir mais de uma resposta aceita por EJ e formulário, inclusive em gravações concorrentes. | I — índice único parcial |
| RF-22 | Permitir solicitação e análise de alteração de voto pela PRESCON. | I |
| RF-23 | Manter votos externos importados como pendentes de revisão, sem contá-los automaticamente como aceitos. | I |
| RF-24 | Permitir vincular resposta externa a EJ e aprovar, rejeitar ou marcar como duplicada. | I |
| RF-25 | Mostrar contagens agregadas sem divulgar conteúdo dos votos em aberto à DIREX do Núcleo. | I |
| RF-26 | Criar ou vincular Google Forms a formulários locais, com mapeamento de perguntas. | P/B |
| RF-27 | Importar respostas do Google Forms com paginação, deduplicação e trilha de revisão. | P/B |
| RF-28 | Executar sincronização agendada e relatar importações, duplicidades, erros e limites. | P/B |
| RF-29 | Permitir conectar Google por OAuth sem coletar senha Google. | B — backend Edge atual possui stub |
| RF-30 | Armazenar refresh token Google criptografado e renovar access token no servidor. | P/B — código Vercel, não operacional na Edge |
| RF-31 | Criar/localizar pasta institucional e subpastas no Drive com autorização da PRESCON. | P/B |
| RF-32 | Enviar documentos de até 4 MB ao Drive e registrar metadados. | P/B |
| RF-33 | Gerar relatórios CSV e Google Sheets por formulário ou pela rede. | P/B |
| RF-34 | Não truncar relatórios silenciosamente: paginar ou informar limites antes da geração. | I no código Vercel corrigido; publicação pendente |
| RF-35 | Oferecer painel semanal de deliberações, prazos e pendências de revisão. | I |
| RF-36 | Manter links e recursos oficiais do Conselho sob gestão da PRESCON. | I |
| RF-37 | Disponibilizar calendário, jornada, rede de EJs e identidade visual NEJLON. | P — alguns itens são painéis e links |
| RF-38 | Disponibilizar exportação/compartilhamento de comunicados para WhatsApp sem envio automático não autorizado. | P |
| RF-39 | Oferecer relatório consolidado final de deliberação com ressalvas, sugestões e validação humana. | P/B |
| RF-40 | Registrar falhas de automação com identificador de formulário, sem vazar tokens. | I no cron corrigido; publicação pendente |
| RF-41 | Permitir acompanhamento de status de integração e diagnosticar configurações ausentes sem revelar valores secretos. | P |
| RF-42 | Isolar a demonstração de registros oficiais. | I |
| RF-43 | Permitir ao usuário sair e revogar a sessão local. | I |
| RF-44 | Não permitir alteração de dados institucionais sem autenticação e autorização adequadas. | I no desenho; testes pendentes |
| RF-45 | Suportar integração futura com Apps Script e Drive existente sem sobrescrever documentos sem consentimento. | Requisito planejado; não implementado |
| RF-46 | Permitir importar PF XLSX preservando cenários, fórmulas e estrutura do documento original. | Requisito planejado; não implementado |

## 3. Requisitos não funcionais
| ID | Requisito e critério de aceitação proposto | Situação |
|---|---|---|
| RNF-01 | Disponibilidade: páginas e endpoints críticos retornam códigos HTTP apropriados; não 404 por falha de deploy. | B |
| RNF-02 | Segurança: HTTPS em todos os acessos e links de comprovantes. | I/P |
| RNF-03 | Autorização: controles no servidor e no banco, nunca apenas ocultação de botões. | I |
| RNF-04 | Privilégio mínimo: DIREX EJ não lê justificativas ou votos individuais restritos. | I |
| RNF-05 | Credenciais privadas: nenhuma service role, segredo OAuth ou refresh token em JavaScript público. | I/P |
| RNF-06 | Criptografia de tokens Google em repouso com AES-256-GCM. | P/B |
| RNF-07 | OAuth: estado assinado, expiração curta, redirecionamento autorizado. | P/B |
| RNF-08 | Integridade: índices únicos para votos aceitos e respostas externas por ID Google. | I |
| RNF-09 | Atomicidade: decisões de justificativas devem ser transacionais. | I |
| RNF-10 | Idempotência: executar sincronização repetidamente não duplica respostas. | I no banco |
| RNF-11 | Auditabilidade: registrar autor, ação, momento e motivo das decisões relevantes. | I/P |
| RNF-12 | Privacidade: votos individuais em aberto não podem aparecer em visão agregada não autorizada. | I/P |
| RNF-13 | Validação: rejeitar entradas inválidas, arquivos grandes e estados incompatíveis. | I/P |
| RNF-14 | Resiliência: falha em um formulário não interrompe os demais. | I no cron corrigido |
| RNF-15 | Completude: exportação não deve omitir registros silenciosamente. | I no código corrigido |
| RNF-16 | Observabilidade: falhas de cron devem indicar formulário e tipo, sem dados sensíveis. | I no cron corrigido |
| RNF-17 | Usabilidade: ações com feedback claro de sucesso, erro e processamento. | P |
| RNF-18 | Acessibilidade: navegação por teclado, foco, rótulos e contraste adequados; auditar WCAG 2.2 AA. | P |
| RNF-19 | Responsividade: portal utilizável em desktop e celular. | P |
| RNF-20 | Identidade visual: manter cores, esquilo, ondas e demais elementos NEJLON. | I |
| RNF-21 | Compatibilidade: Chrome, Edge, Firefox e Safari atuais; testar. | Não verificado |
| RNF-22 | Performance: metas sugeridas p95 inferior a 2 s para consultas simples e 5 s para ações externas, sob carga definida. | Meta proposta |
| RNF-23 | Escalabilidade: suportar dezenas de EJs, formulários e milhares de respostas via paginação. | P |
| RNF-24 | Manutenibilidade: separar interface, API, integração e regras de negócio; manter testes automatizados. | P |
| RNF-25 | Recuperabilidade: permitir repetir operações falhadas sem duplicação ou perda de dados. | P |
| RNF-26 | Portabilidade: versionamento GitHub e configuração declarativa de deploy. | I |
| RNF-27 | Governança: operações irreversíveis ou publicações institucionais requerem confirmação e papel autorizado. | P |
| RNF-28 | Dados de teste: não misturar simulações com dados institucionais. | I |
| RNF-29 | LGPD: minimizar dados pessoais, definir retenção, acesso e exclusão; requer política institucional. | P |
| RNF-30 | Confiabilidade de agenda: monitorar último sucesso do cron e alertar falhas; sem assumir execução apenas pela configuração. | P |
| RNF-31 | Limites externos: respeitar quotas Google, Vercel e Supabase; usar lotes e backoff. | P |
| RNF-32 | Implantação: deploy deve passar por smoke tests de página inicial, login, demandas, forms e integração antes da promoção. | P |

## 4. Fluxos e estados
- **Demanda:** `pendente` → `em_andamento` → `concluida`; justificativa aceita pode levar a `justificada`; reabertura pela PRESCON com nota.
- **Justificativa:** `pending_review` → `accepted` ou `rejected`; somente PRESCON decide.
- **Formulário:** `draft` → `open` → `closed`; não reabrir sem regra explícita.
- **Resposta:** `pending_review` → `accepted`, `duplicate` ou `rejected`; apenas `accepted` entra na apuração validada.
- **Google OAuth:** desconectado → autorização externa → conexão criptografada → token renovável → eventual revogação/reconexão.

## 5. Critérios mínimos de homologação antes de uso oficial
1. `/`, páginas institucionais e APIs publicadas respondem corretamente, inclusive 401/403 para acessos indevidos.
2. Testar perfis PRESCON, conselheiro, DIREX EJ e DIREX Núcleo, inclusive tentativas cruzadas.
3. Criar demanda fictícia, justificar, decidir, concluir e verificar trilha no banco.
4. Criar PF de 1 cenário, publicar, votar com duas EJs, impedir duplicação, encerrar e conferir resultado.
5. Conectar Google por OAuth com consentimento, importar resposta de teste, repetir importação sem duplicar.
6. Gerar arquivo de teste no Drive, exportar CSV/Sheet e comparar contagens integralmente.
7. Executar cron de teste autenticado, verificar paginação, erro parcial e registro de execução.
8. Validar acessibilidade, mobile, recuperação de erros e ausência de segredos expostos.

## 6. Bloqueios conhecidos em 22/11/2026
- Deploys adicionais do Vercel retornaram **HTTP 402** por limite diário de publicações; código novo no GitHub não pôde ser homologado em produção.
- A versão publicada no domínio principal retornava 404 para páginas e APIs; o repositório tem `index.html` estático e `api/*.js`, sem `package.json` na raiz. A configuração do projeto foi alterada para framework **Other**, mas ainda falta um deploy bem-sucedido.
- A interface `pages/automation.js` chama **Supabase Edge Functions**, não as APIs do Vercel; portanto, corrigir somente `api/` não atualiza o backend efetivamente usado.
- As Edge Functions `forms`, `demands` e `drive` possuem uma implementação monolítica; o endpoint Drive ainda é um stub e retorna 503 para ações Google.
- No Supabase consultado não havia formulários, respostas, demandas ou conexões Google reais.
- A integração Google depende de credenciais OAuth e consentimento do titular; não pode ser concluída sem esses atos.

**Importante:** requisitos marcados como planejados ou parciais não devem ser apresentados como funcionalidades prontas. Esta especificação é o estado inferido do sistema e o backlog verificável para homologação.
