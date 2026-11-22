# Identidade visual — Portal NEJLON 2027

Referência: slides institucionais fornecidos pela PRESCON, com fundo grafite, vermelho, azul petróleo, títulos brancos e formas orgânicas.

## Tokens
| Papel | Cor |
|---|---|
| Fundo | `#1C1A1A` |
| Fundo lateral | `#161616` |
| Superfícies/cards | `#242222` |
| Vermelho principal | `#CE2D32` |
| Vermelho escuro / sombra | `#9E2028` |
| Azul petróleo / cabeçalho de cards | `#005762` |
| Texto | `#FFFFFF` |
| Texto secundário | `#D0C8C8` |
| Bordas | `#494040` |

## Regras
- Layout responsivo com temas escuro e claro; cards com cantos arredondados e superfícies de alto contraste.
- Títulos de destaque em caixa alta e fontes pesadas (Impact/Arial Black; fallback Space Grotesk); em telas operacionais, evitar sombra sobre texto pequeno.
- Cards expositivos: cabeçalho azul petróleo + corpo vermelho com texto branco; componentes financeiros e tabelas podem usar superfície grafite para legibilidade.
- Botão primário vermelho; secundário azul petróleo; foco visível e acessível.
- Formas orgânicas e ondas vermelhas como decoração, nunca sobre os números/tabelas.
- Assinatura “PELA EXCELÊNCIA” nas capas, manuais e rodapés apropriados.
- O verde não é mais a cor principal; cores semânticas de status permanecem permitidas em indicadores.
- Manuais automáticos: telas 16:9, capa em grande tipografia branca com contorno escuro e sombra vermelha; variações de composição mantendo tokens e formas.

## Regra funcional da deliberação de PF (modelo Idealize)
A planilha CSV/XLSX é ENTRADA do planejamento financeiro. Seus dados alimentam a exposição dos cenários e do rateio; não viram uma votação por linha, e votos não são exportados como CSV financeiro.

A votação segue o formulário de referência: **sistema de rateios, cenário 1 e cenário 2**, com cinco opções (Aprova, Aprova com sugestões, Aprova com ressalvas, Reprova, Abstenho), justificativas e considerações finais. A PRESCON decide sobre ressalvas; a plataforma não as acata automaticamente.

## Implementação
As páginas carregam o CSS legado e, por último, `pages/ux-system.css`, que contém as variáveis semânticas e ajustes responsivos. O arquivo `pages/ux-theme.js` adiciona o controle claro/escuro em dashboard, deliberação, institucional e biblioteca de mensagens, guardando a escolha neste navegador.

O estilo novo é uma camada de compatibilidade; componentes novos devem usar `--ux-*` e **não** inserir cores fixas de fundo/texto em componentes operacionais.

A configuração de tema é só de apresentação; não concede permissões nem substitui autenticação. Testes manuais no Vercel ainda são necessários.


## Sistema consolidado: claro e escuro

| Papel | Escuro | Claro |
|---|---|---|
| Fundo | `#19191B` | `#F7F5F2` |
| Superfície | `#252528` | `#FFFFFF` |
| Texto principal | `#F9F8F6` | `#222124` |
| Texto auxiliar | `#D3CED1` | `#49474A` |
| Vermelho dos botões | `#CE333E` | `#A92732` |
| Azul-petróleo dos botões | `#00616D` | `#005663` |
| Borda | `#535054` | `#B8B2B0` |

- Capas institucionais e faixas decorativas permanecem escuras mesmo no tema claro para preservar o contraste do texto branco e a identidade do material.
- Fonte operacional: DM Sans. Títulos grandes: Arial Black/Impact, com `letter-spacing` positivo (~0,027em) e `line-height` >= 1,2; evitar sobreposição da sombra.
- Alvos clicáveis e controles importantes: mínimo aproximado de 44px; estados de foco visíveis e estados selecionados não dependentes apenas da cor.
- Tabelas devem permitir rolagem horizontal em celular; cards devem se reordenar sem cortar valores financeiros.
- Preferência de tema salva localmente; a aparência não sincroniza com a conta.
- Evitar branco em superfícies claras: use `var(--ux-text)` e `var(--ux-muted)`. Em botões vermelhos ou azul-petróleo, usar branco.
- Layouts alvo para conferência visual: 320, 375, 768, 1024, 1440px, em ambos os temas.
- Diferenciar visualmente dados **fictícios** de referências institucionais de 2026 e de registros oficiais.

## Revisão do fluxo de PRESCON

- Priorizar a tarefa principal e reduzir conteúdo concorrente no dashboard.
- Manter deliberações, pendências e análises com acesso direto; funções secundárias agrupadas no desktop.
- Na biblioteca, permitir selecionar, pesquisar, pré-visualizar e salvar modelos sem digitar o comunicado toda vez.
- O compartilhamento do WhatsApp abre uma mensagem preparada; selecionar o grupo e confirmar o envio ainda são ações humanas.
- No formulário financeiro, as projeções pessimista/realista/otimista são **simulações financeiras**, e não votos adicionais.

## Checklist de validação para a implantação

1. Conferir contraste de todos os campos preenchidos, placeholders, cartões e textos de ajuda nos dois modos.
2. Conferir títulos longos e nomes extensos de EJs nas larguras indicadas.
3. Testar navegação por teclado, foco, áreas de toque, rolagem de tabelas e preferências de movimento reduzido.
4. Testar entradas CSV/XLSX válidas e inválidas, formulário de voto e links externos.
5. Conferir que os dados fictícios continuem identificados e não sejam enviados ao banco.

**Escopo desta revisão:** CSS, temas, organização visual, acessibilidade de interface e responsividade. Não certifica compatibilidade de navegador, integração Google Forms, credenciais ou segurança de backend sem testes específicos.
