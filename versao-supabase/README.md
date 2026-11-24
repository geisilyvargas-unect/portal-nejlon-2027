# Portal NEJLON 2027 — versão autenticada

A raiz do repositório continua sendo a demonstração pública, sem login. Esta pasta é a entrada independente da versão institucional. Os estilos em ../pages são compartilhados; alterações de negócio devem ser implementadas e testadas nos dois ambientes.

## Implantação
Hospedar na Vercel, com Supabase Auth e políticas RLS. Não publicar chaves secretas. Não usar dados fictícios ou localStorage da demonstração como fonte institucional.

## Permissões
- prescon: criar, apurar, publicar, participação completa.
- counselor: votar, consultar formulários e relatórios publicados, participação completa sem votos de terceiros.
- ej_direx: participação da própria EJ, sem conteúdo de votos.
- nucleus_direx: relatórios publicados e indicadores agregados da rede.

## Estado
Preparação da arquitetura. A integração de autenticação, persistência, políticas e testes de isolamento precisa ser concluída antes de disponibilizar dados institucionais. Não apontar a produção para a demonstração.
