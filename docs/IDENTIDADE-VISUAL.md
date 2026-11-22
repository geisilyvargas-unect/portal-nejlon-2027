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
- Layout responsivo e escuro em todas as telas; cards com cantos arredondados.
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
`index.html` carrega `pages/site.css` e depois `pages/visual-identity.css`. A segunda folha concentra as substituições visuais sem modificar a lógica existente em `pages/site.js`. Para telas novas, reutilizar estes tokens e padrões. Mudanças de função, importação XLSX/CSV, autenticação e publicação do manual exigem implementação própria e não são entregues apenas pelo CSS.
