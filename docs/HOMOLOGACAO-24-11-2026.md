# Homologação do Portal NEJLON 2027 — preparação para 24/11

> Documento operacional de testes. **Nenhum item é considerado aprovado apenas por existir no código.** Usar somente contas e dados fictícios no ambiente de demonstração.

## Regras de execução
- Registrar para cada teste: data/hora, ambiente/URL, perfil, resultado (PASSOU/FALHOU/BLOQUEADO), evidência sem dados pessoais e issue/PR da correção.
- Não transformar votos, demandas ou dados fictícios em registros oficiais.
- Não realizar mudanças destrutivas ou publicar deliberações reais para testar.
- Se a infraestrutura impedir testes E2E, marcar **BLOQUEADO**, nunca **PASSOU**.

## P0 — a demonstração precisa funcionar
| ID | Teste reproduzível | Resultado esperado |
|---|---|---|
| H-01 | Abrir a URL pública em janela anônima no desktop e celular | Página inicial carrega sem 404 e identifica claramente dados fictícios |
| H-02 | Navegar pelas quatro visões de demonstração | PRESCON, Conselheiro, DIREX EJ e DIREX Núcleo exibem permissões coerentes sem gravação no banco |
| H-03 | Abrir o Módulo 07, navegar por agenda, formação, acompanhamento e encaminhamentos | Todos os fluxos de demonstração são navegáveis; dados são explicitamente fictícios |
| H-04 | Abrir deliberação IDEALIZE e alternar cenários do PF | Quantidades, rateios e totais permanecem coerentes com a planilha de referência; não há votos oficiais fictícios |
| H-05 | Exportar CSV de demonstração e conferir contagem de linhas e campos | Exportação completa, identificada como demonstração, sem truncamento silencioso |
| H-06 | Acessar links do manual e telas da deliberação | Navegação e instruções utilizáveis, inclusive no celular |
| H-07 | Navegar somente por teclado nos fluxos acima | Foco visível, controles rotulados, sem bloqueio de teclado |

## P1 — segurança e integridade antes de uso oficial
| ID | Teste reproduzível | Resultado esperado |
|---|---|---|
| H-08 | Tentar acessar endpoints sensíveis sem sessão | 401, sem vazamento de dados |
| H-09 | Tentar operações PRESCON com conta Conselheiro/DIREX | 403 e nenhuma gravação |
| H-10 | Tentar ler dados de outra EJ com perfil restrito | Acesso negado no servidor/banco, não apenas na interface |
| H-11 | Criar demanda fictícia, justificar e analisar | Estados válidos e trilha de auditoria íntegra |
| H-12 | Submeter duas respostas aceitas para mesma EJ/formulário | Segunda gravação rejeitada, inclusive sob concorrência |
| H-13 | Criar PF com um cenário, publicar, votar, encerrar | Transições corretas e parecer humano preservado |
| H-14 | Revisar respostas externas duplicadas e com ressalvas | Duplicatas não entram no resultado; ressalvas pendentes não são decididas automaticamente |
| H-15 | Verificar isolamento da DIREX Núcleo | Sem divulgação de votos individuais em aberto |

## P2 — integrações externas (dependências)
| ID | Teste reproduzível | Resultado esperado |
|---|---|---|
| H-16 | Autorizar Google via OAuth em ambiente de teste | Conexão funcional sem coleta de senha e sem segredo no cliente |
| H-17 | Importar a mesma resposta duas vezes | Idempotência, paginação e auditoria |
| H-18 | Exportar relatório completo para Drive/Sheets | Contagens conferem com origem; sem sobrescrever arquivo existente sem consentimento |
| H-19 | Executar cron com falha em um formulário | Outros formulários continuam; erro é registrado sem tokens |
| H-20 | Repetir exportação e importação após falha parcial | Sem duplicação ou perda silenciosa |

## Bloqueios conhecidos em 22/11
1. Vercel: quota de deploy HTTP 402 e publicação principal com 404 na última verificação documentada. **Revalidar**, não presumir resolução.
2. A interface de automações usa Edge Functions Supabase; correções isoladas em `api/` podem não afetar o backend em uso.
3. Google OAuth/Drive: consentimento e credenciais necessários; a Edge Function Drive ainda contém stub.
4. Importação fiel de PF XLSX (RF-46): planejada, não homologada.

## Política de prioridade para ciclos automáticos
1. Corrigir falhas de segurança ou perda de dados comprovadas.
2. Corrigir fluxos P0 da demonstração.
3. Implementar e testar P1 sem depender de credenciais externas.
4. Tratar P2 quando as integrações estiverem disponíveis.
5. Atualizar este registro e a especificação de requisitos conforme evidências.

**Critério de saída:** somente declarar “pronto para demonstração” quando H-01 a H-07 tiverem evidência de aprovação no ambiente efetivamente compartilhado. “Pronto para uso oficial” exige também H-08 a H-20, exceto itens explicitamente excluídos do escopo institucional.
