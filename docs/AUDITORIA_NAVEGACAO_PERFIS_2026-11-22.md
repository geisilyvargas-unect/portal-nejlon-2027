# Auditoria de navegação e ações duplicadas — Portal NEJLON 2027
Data: 22/11/2026. Escopo: 15 páginas HTML do repositório, incluindo mapa-portal, e controladores de navegação/ações relevantes. Análise estática do código (não equivale a homologação visual em todos os navegadores).

## Critério
Cada ação principal tem um local canônico por perfil. Não são duplicatas: ações distintas de um mesmo fluxo (criar/publicar/encerrar), visualização e impressão, menu desktop versus menu mobile responsivo, nem ações contextuais de lembrete.

## Matriz de locais canônicos
| Perfil | Ação | Local |
| --- | --- | --- |
| PRESCON | Criar PF a partir de XLSX | Central de Automações > Automação de PF > Criar deliberação financeira |
| PRESCON | Criar formulário não financeiro | Central de Automações > Formulários gerais |
| PRESCON | Publicar, encerrar e acompanhar formulários | Central de Automações > Formulários |
| PRESCON | Analisar respostas e solicitações de alteração de voto | Central de Automações > Resultados |
| PRESCON | Administrar demandas | Central de Automações > Demandas |
| PRESCON | Arquivos e integração Drive | Central de Automações > Google Drive |
| Conselho | Votar em deliberação publicada | Link autenticado responder.html?id=... |
| Conselho | Consultar seu painel e gestão | Painel do Conselho / Gestão do Conselho (ações diferentes) |
| Conselho | Demandas visíveis | Demandas |
| DIREX EJ | Consultar demandas da própria EJ | Demandas |
| DIREX Núcleo | Fiscalizar dados autorizados | Fiscalização |
| Visitante | História, regras, portfólio | Institucional e Portfólio |
| Todos, conforme acesso | Preparar modelos de mensagens | WhatsApp / biblioteca |
| Demonstração | IDEALIZE com votos fictícios | idealize.html |
| Demonstração | Voto local sem registro institucional | formulario-deliberacao.html |
| Ferramenta auxiliar | Editar mapa de fluxos | mapa-portal/index.html |

## Páginas verificadas
- index.html: navegação por perfis, painel inicial e ações renderizadas via site.js.
- central-automacoes.html: abas Início, Formulários gerais, Automação de PF, Drive, Formulários, Demandas, Resultados.
- demandas.html: gestão/consulta de demandas por perfil.
- fiscalizacao.html: consulta DIREX Núcleo, link contextual para demandas.
- formulario-deliberacao.html: formulário de simulação local.
- gestao-conselho.html: demonstração interativa da gestão.
- idealize.html: modelo de deliberação e votação fictícia.
- institucional.html: informação institucional e portfólio.
- painel-conselho.html: painel do Conselho e acesso à gestão.
- portfolio.html: portfólio e download PDF.
- prescon-criar-deliberacao.html: importação, análise e criação do PF.
- relatorio.html: relatório e impressão/exportação PDF pelo navegador.
- responder.html: autenticação e registro de voto compartilhado.
- whatsapp.html: mensagens e modelos.
- mapa-portal/index.html: ferramenta isolada de edição de fluxos.

## Duplicações corrigidas
1. Central: removidos atalhos de início que repetiam abas; eliminado iframe do criador PF e botão redundante de retorno; mantido único link para modelo IDEALIZE.
2. Central: removida opção PF do criador genérico, evitando dois pontos concorrentes de criação de PF.
3. Portal inicial/site.js: removido criador PF embutido em iframe, com botão próprio; mantida criação na Central.
4. Portal inicial/site.js: removido CTA adicional "Criar nova deliberação" dos menus desktop/mobile, pois a Central já é o destino canônico.
5. Portal inicial/site.js: removidos atalhos de painel que duplicavam navegação principal, preservando indicadores.
6. Painéis de Conselho, DIREX EJ e DIREX Núcleo: removidos botões de destino que já constavam no menu do perfil; mantido texto de orientação.
7. Central: link com hash #pf passa a abrir a aba correta.

## Repetições intencionais preservadas
- Menus desktop/mobile: são alternativas responsivas, não dois botões visíveis simultaneamente.
- Fiscalização e Demandas: uma apresenta panorama de supervisão e outra trata das demandas; link de transição é contextual.
- Resultados da Central e relatorio.html: gestão de respostas versus apresentação/impressão de relatório.
- IDEALIZE e responder.html: simulação histórica versus voto autenticado real.
- Botões de voltar, copiar link e enviar: ações de navegação/contexto, não novas implementações da mesma função.
- Painel do Conselho e Gestão do Conselho: consulta geral versus demonstração interativa de gestão.

## Validação realizada e limitações
- Código JS site.js, automation.js, prescon-criar-deliberacao.js e responder.js compilado estaticamente sem erro de sintaxe após alterações.
- Arquivos e ações inventariados por leitura direta do repositório.
- Não foram realizados testes visuais interativos de todos os perfis em navegador autenticado; permissões efetivas e acessibilidade precisam de homologação de ponta a ponta.
- Outras automações podem editar os mesmos arquivos; revalidar a árvore publicada antes de homologar.
