# Correções da auditoria — Portal NEJLON 2027

## Implementado na branch main

- Central de Automações: navegação por abas e ações locais de demonstração.
- Formulário: voto independente por pergunta, justificativa condicional, sugestões e ressalvas.
- Respostas: armazenamento fictício no navegador, sem autenticação ou API institucional.
- Relatório: contagens de respostas fictícias por pergunta, impressão/PDF pelo navegador.
- Gráficos financeiros: escala com zero e valores negativos, interpretação e tabela comparativa.
- Parser: reconhecimento de painéis com cabeçalhos alternativos, totais de receitas/despesas/saldo; sem inventar valores ausentes.
- CSV: leitor com aspas, separadores e valores monetários pt-BR.
- Portabilidade: pacote JSON exportado pela PRESCON e importado em outro dispositivo; não há compartilhamento automático via URL.
- Acessibilidade: foco visível, suporte a movimento reduzido, rolagem horizontal de tabelas e ajustes móveis.
- Regressão: teste em `tests/pf-demo-smoke.test.js` para CSV e parser; execute `node tests/pf-demo-smoke.test.js`.

## Limitações declaradas

1. Não há sincronização multiusuário em tempo real. Cada dispositivo armazena seus próprios votos de teste.
2. O pacote JSON contém dados do planejamento e deve ser compartilhado somente com pessoas autorizadas. Não importar dados confidenciais em uma demonstração pública.
3. A leitura financeira é heurística; planilhas com estrutura incomum podem exigir revisão humana. Não há OCR de gráficos embutidos ou imagens.
4. Nenhum voto tem validade institucional. Relatórios locais não identificam EJs únicas e não comprovam quórum.
5. Testes de navegador, WCAG automatizado e inspeção visual em dispositivos reais ainda exigem homologação.

## Roteiro manual de homologação

1. Abrir a Central e navegar por todas as abas usando mouse e teclado.
2. Importar XLSX do IDEALIZE e conferir receitas, despesas, saldos e avisos com o arquivo original.
3. Importar CSV brasileiro com aspas e ponto de milhar; comparar valores.
4. Criar deliberação com duas perguntas e gerar formulário.
5. Votar com opções distintas em cada pergunta; conferir campos condicionais.
6. Abrir relatório e verificar contagens; testar impressão.
7. Exportar pacote JSON, importar em outro navegador e conferir gráficos e perguntas.
8. Testar temas claro/escuro, largura 360px e 1280px, foco de teclado e leitor de tela.
9. Confirmar ausência de credenciais obrigatórias e de operações institucionais reais.
