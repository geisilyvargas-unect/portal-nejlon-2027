# Módulo 07 — Gestão do Conselho · Especificação e implementação híbrida

## Escopo aprovado
- **Consulta institucional funcional:** diretório e links existentes, painel institucional, demandas, deliberações e comunicados; o acesso aos módulos reais mantém autenticação e permissões originais.
- **Demonstração interativa isolada:** agenda, reuniões, trilha formativa, indicadores de participação, acompanhamento individual e encaminhamentos. Dados fictícios persistem apenas em `sessionStorage` do navegador e não usam APIs do Supabase.
- **Público da demonstração:** todos os conselheiros podem explorar as visões sem conta real; controles são de apresentação, não de autenticação.

## Fluxos
1. **Consulta:** portal → Gestão do Conselho → Biblioteca → recurso institucional → autenticação real do recurso quando necessária.
2. **Reuniões:** PRESCON fictícia → Agenda → cadastrar evento → visualizar → excluir; outras visões só consultam eventos classificados para elas.
3. **Jornada:** conselheiro fictício/EJ → Jornada → concluir ou desmarcar etapa → progresso atualizado; obrigatórias e opcionais identificadas.
4. **Engajamento:** PRESCON vê evidências de todos os conselheiros fictícios; conselheiro vê apenas os dados do perfil de EJ selecionado; DIREX sem visão individual.
5. **Acompanhamento:** PRESCON fictícia → registrar resumo de contato e próximo encontro → consultar histórico → excluir registro fictício.
6. **Encaminhamentos:** PRESCON cria e atribui; conselheiro conclui apenas encaminhamentos atribuídos ao perfil fictício da sua EJ.

## Cobertura das EJs na demonstração
- A seleção de EJ utiliza o mesmo catálogo público de **29 EJs** de `pages/demo-data.js`, evitando listas divergentes entre os módulos.
- Cada EJ recebe um conselheiro **inteiramente fictício**, com indicadores sintéticos e progresso individual independente. Nenhum nome ou dado de membro real é necessário.
- A chave `sessionStorage` da demonstração passa à versão `v2` para evitar dados legados incompatíveis com o catálogo completo.
- A seleção de EJ em DIREX Núcleo permanece desabilitada na interface; isso não é autenticação nem autorização real.

## Entidades da demonstração
- `events`: id, title, date, time, type, agenda, visibility
- `steps`: id, title, description, required
- `members`: id, name, ej, attendance, invited, contributions, actions
- `progress`: member_id → step IDs concluídas
- `checkins`: id, member, date, summary, next
- `actions`: id, title, owner, due, status, eventId opcional
- `announcements`: id, title, body, audience

Estas estruturas são apenas JavaScript fictício. Não criar tabelas de produção sem revisão de privacidade e modelo de permissões.

## Regras de negócio
- **RN07-01:** demonstração nunca escreve no banco institucional.
- **RN07-02:** interface de simulação sempre identifica os dados como fictícios.
- **RN07-03:** PRESCON pode simular gestão; conselheiro pode simular seu progresso e seus encaminhamentos; DIREX tem visão reduzida.
- **RN07-04:** acompanhamento individual é oculto às visões não PRESCON.
- **RN07-05:** engajamento é apresentado como evidências separadas, nunca como nota ou rótulo automático.
- **RN07-06:** ausência isolada não caracteriza desengajamento; justificativas e contexto devem ser considerados na versão oficial.
- **RN07-07:** recursos reais exigem autorização no destino; a escolha de papel no protótipo não concede permissões.
- **RN07-08:** reiniciar simulação apaga somente dados fictícios locais.
- **RN07-09:** datas de eventos e prazos da demonstração não criam obrigações reais.
- **RN07-10:** a futura implantação deverá preservar histórico institucional e limitar acesso a registros pessoais.

## Critérios de aceite e testes
- CA07-01: link para Gestão do Conselho aparece na página inicial e no Painel do Conselho.
- CA07-02: as sete áreas são navegáveis na visão PRESCON.
- CA07-03: DIREX não vê telas de acompanhamento, jornada ou engajamento individual.
- CA07-04: cadastrar/excluir evento atualiza lista da simulação.
- CA07-05: concluir/desmarcar etapa altera barra de progresso do conselheiro fictício.
- CA07-06: registrar acompanhamento aparece no histórico apenas da PRESCON.
- CA07-07: criar/concluir encaminhamento altera situação apenas na simulação.
- CA07-08: reiniciar remove alterações locais e restaura os dados fictícios iniciais.
- CA07-09: nenhuma ação de `gestao-conselho.js` realiza `fetch` ou usa cliente Supabase.
- CA07-10: entradas exibidas no HTML passam por escape de caracteres especiais.

## Pendências para produção
- Integrar agenda real com persistência, controle de acesso e calendário externo.
- Definir autenticação individual, política de retenção, consentimento e acesso aos registros de acompanhamento.
- Criar registro de participação/justificativas e critérios de indicadores com validação humana.
- Vincular encaminhamentos às reuniões reais e implementar trilha de auditoria.
- Testar em navegadores e dispositivos reais, inclusive teclado e leitor de tela.
- Homologar deploy Vercel e fluxos com autenticação; o protótipo não substitui essa etapa.
