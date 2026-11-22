# Auditoria UI/UX — Portal NEJLON 2027
Data: 2026-11-22
Escopo prioritário: GitHub Pages; avaliação inicial estática do repositório. Não representa teste visual ou teste com usuários.

## Inventário inicial
Páginas identificadas: index.html, painel-conselho, gestao-conselho, prescon-criar-deliberacao, formulario-deliberacao, responder, relatorio, demandas, fiscalizacao, idealize, institucional, whatsapp, central-automacoes, portfolio.

## Achados priorizados
| Prioridade | Área | Evidência | Impacto | Situação |
| --- | --- | --- | --- | --- |
| P1 | Aparência global | ux-theme.js oferecia apenas light/dark, apesar da exigência de tema vermelho | Falta de opção institucional e incoerência entre telas | Corrigido no código: terceiro tema |
| P1 | Nova deliberação | prescon-criar-deliberacao.js transforma automaticamente abas selecionadas em perguntas sugeridas | Confusão entre alternativas financeiras e objetos de votação; requer revisão de produto antes de alterar a lógica | Corrigido no fluxo de demonstração: perguntas adicionadas manualmente |
| P1 | Nova deliberação | Arquivo XLSX é armazenado em localStorage na demonstração | Limites de armazenamento e perda do conteúdo ao trocar navegador/dispositivo | Pendente, requer arquitetura |
| P1 | Acesso | GitHub Pages é demonstração sem autenticação | Não pode ser anunciado como acesso real | Comunicar claramente; já indicado no HTML |
| P2 | Aparência | formulario-deliberacao.css contém cores petrol/verde legadas | Inconsistência com branco/preto/vermelho | Pendente: revisão visual de ambos os formulários |
| P2 | Criação de deliberação | Vários estilos inline em HTML e JS | Dificulta manutenção e padronização | Parcial: componentes principais e tabelas migrados para classes |
| P2 | Seletor de aparência | Não havia fechamento por Escape | Fricção para navegação por teclado | Corrigido no código |
| P2 | Responsividade | Tabela financeira tem min-width:520px com contêiner de rolagem | Necessário verificar compreensão em telas pequenas | Pendente de teste visual |
| P3 | CSS | Sobreposição de ux-system.css, nejlon-idv-consistency.css e estilos específicos | Maior risco de regressões | Pendente: consolidar tokens e reduzir !important |

## Alterações implementadas neste ciclo
- pages/ux-theme.js: terceiro tema vermelho e tecla Escape.
- pages/ux-system.css: tokens de contraste para tema vermelho.

## Próximos ciclos
1. Verificar interface renderizada e contrastes de todas as páginas nos três temas.
2. Revisar hierarquia e navegação por perfil, com fluxos reais de tarefas.
3. Reestruturar visualmente o assistente de deliberação sem alterar regras de negócio.
4. Testar acessibilidade e responsividade.
5. Executar testes automatizados e confirmar publicação do GitHub Pages.

## Limites da verificação
Até este registro, houve inspeção estática de arquivos e commits no GitHub. Não foram realizados testes de navegador, validação visual de screenshots, teste de acessibilidade automatizado nem teste com usuários. Commits não comprovam publicação.

## Ciclo 2 — Implementação parcial
- Nova deliberação: separação explícita entre abas financeiras e perguntas de votação; nenhuma pergunta é criada automaticamente ao importar XLSX.
- Validação adicional dos títulos das perguntas.
- Ajustes de rotulagem, campos, editor de perguntas e tabelas responsivas.
- Cache busting de CSS/JS da página de criação.
- **Limitação:** sem teste de navegador nem confirmação da publicação; os problemas remanescentes do inventário continuam abertos.
