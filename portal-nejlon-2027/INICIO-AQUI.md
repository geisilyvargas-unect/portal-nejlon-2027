# NEJLON 2027 — comece por aqui

**Status:** você recebeu o projeto-fonte, **não um site já publicado**. Não existe senha `1234` em produção. O teste real depende do Supabase e da Vercel.

## O mínimo para publicar

1. **Supabase:** abra https://supabase.com/dashboard, crie um projeto e copie as credenciais em um arquivo `.env.local` com base no `.env.example`.
2. **Banco:** em **SQL Editor → New query**, copie e execute `supabase/migrations/202611210001_portal_nejlon.sql` **uma única vez em um projeto vazio**. Isso cadastra as 29 EJs, cria tabelas e ativa regras de segurança.
3. **Conta PRESCON:** em um computador com Node.js 22+, abra a pasta extraída no terminal, execute `npm install` e depois `npm run bootstrap:admin` (a senha inicial de 12+ caracteres fica no `.env.local`). Guarde a senha e troque-a ao entrar.
4. **GitHub:** crie um repositório **privado** chamado `portal-nejlon-2027` em https://github.com/new e envie o conteúdo **descompactado** da pasta. Nunca envie `.env.local`, `node_modules` ou `acessos-iniciais.csv`.
5. **Vercel:** entre em https://vercel.com/new, escolha **Import Git Repository**, selecione o repositório e configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` em Environment Variables. Clique **Deploy**.
6. **Supabase:** em **Authentication → URL Configuration**, configure a URL real do site da Vercel como Site URL e adicione `https://SEU-SITE.vercel.app/auth/callback` às Redirect URLs.

Depois, siga o **README.md** para os testes finais, o cadastro das 58 contas e instruções detalhadas.

## Teste principal: 29 → 28 pendências

Entre como PRESCON, crie uma deliberação publicada e veja as **29 EJs pendentes**. Cadastre um usuário Conselho da UNECT em Gestão de Acessos e entre nessa conta. Troque a senha temporária e registre a resposta. Ao voltar para PRESCON, deve haver **28 pendências** naquela deliberação. O voto da UNECT deve constar no relatório.

**Atenção:** os exemplos de deliberação são fictícios e não entram nas cobranças reais. Antes do uso institucional, valide as regras do Conselho, teste as permissões e evite inserir dados pessoais de terceiros sem autorização.
