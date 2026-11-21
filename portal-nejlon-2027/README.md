# Portal de Governança NEJLON 2027

**JUNTOS PELA EXCELÊNCIA · PÉ VERMELHO**

Código-fonte para um portal Next.js + TypeScript com Supabase Auth e PostgreSQL/RLS, preparado para implantação na Vercel. **Ainda requer configuração, execução da migração, build e testes de integração antes do uso real.** Visual grafite, vermelho, lima e azul-petróleo, layout responsivo.

## O que está implementado

- Autenticação de e-mail/senha e sessão em cookies, login/logout, redefinição por e-mail quando disponível e troca obrigatória de senha inicial.
- Perfis: PRESCON, DIREX do Núcleo, DIREX de cada EJ e Conselho de cada EJ. Acesso definido pelo cadastro, jamais escolhido no login.
- 29 EJs cadastradas na migração, com nomenclatura oficial normalizada de e-mails.
- Deliberações: criar/publicar/encerrar, visualizar conforme permissão, registrar ou atualizar um posicionamento oficial por EJ.
- **Central de Pendências:** identifica EJs sem respostas oficiais, exclui respostas fictícias e atualiza via Supabase Realtime + atualização periódica de segurança. Copiar cobrança por EJ, deliberação ou em lote.
- Relatórios: contagens, respostas individuais, justificativas, ressalvas, sugestões, pendentes e notas da PRESCON. Copiar, exportar TXT ou usar Imprimir > Salvar como PDF.
- Gestão de usuários: criar conta com senha aleatória, editar permissões/EJ/nome/telefone, desativar acesso e emitir nova senha temporária.
- Demandas, diretório de EJs, calendário, biblioteca de links e Jornada com feedback inicial.
- Três deliberações e três respostas **fictícias em tabelas separadas**; não influenciam votos ou pendências oficiais.

## Passo a passo para colocar no ar

### 1. Supabase (gratuito para começar)

1. Acesse <https://supabase.com/dashboard> > **New project** e crie um projeto.
2. Menu esquerdo **SQL Editor** > **New query**. Abra o arquivo `supabase/migrations/202611210001_portal_nejlon.sql`, copie o conteúdo inteiro, cole no editor e clique **Run**. Execute **uma única vez** em um projeto novo.
3. No Supabase, em **Project Settings** > **API Keys** (ou **Connect** na interface mais recente), copie a URL do projeto, chave pública *anon/publishable* e chave secreta *service_role*.
4. **Não compartilhe a chave service_role e não a envie ao GitHub.** Ela fica apenas no ambiente servidor.

### 2. Preparar sua primeira conta PRESCON

Recomendado: instale Node.js 22 ou mais recente em seu computador. Extraia o ZIP do projeto em uma pasta e abra um terminal nela (Windows: clique na barra de endereço do Explorer e digite `powershell`). Execute:

```powershell
npm install
Copy-Item .env.example .env.local
```

Abra `.env.local` (Bloco de Notas ou VS Code) e substitua as informações pelos valores do Supabase. Escolha uma senha provisória forte de 12 caracteres ou mais para `BOOTSTRAP_ADMIN_PASSWORD`. Não use `1234`.

```powershell
npm run bootstrap:admin
```

O script cria `prescon@nejlondrina.com` no Auth, confirma a conta sem precisar que o e-mail exista e atribui o perfil PRESCON. Ele não recria uma conta existente. **Faça login e altere a senha na primeira entrada.**

Para testar localmente: `npm run dev` e abra <http://localhost:3000>.

### 3. Opcional: criar contas para as 29 EJs em lote

Quando quiser provisionar **58 contas** (uma DIREX e um Conselho por EJ), sem criar uma por uma:

```powershell
npm run provision:users
```

Ele gera o arquivo **local, privado** `acessos-iniciais.csv` com senhas aleatórias temporárias. Compartilhe cada credencial somente com o responsável e **apague o CSV quando não for mais necessário**. O arquivo está incluído no `.gitignore`. O script ignora perfis já provisionados. Também é possível criar as contas individualmente em **Gestão de Acessos**.

### 4. GitHub

1. Acesse <https://github.com/new> com `geisilyvargas-unect`.
2. Em **Repository name**, digite `portal-nejlon-2027`. Selecione **Private** e **Create repository**.
3. No novo repositório, clique em **uploading an existing file** (ou **Add file > Upload files**). Envie os **arquivos e pastas descompactados**, preservando a estrutura. Não envie o ZIP como único arquivo do repositório.
4. Antes de confirmar, **verifique que `.env.local`, `node_modules`, `.next` e `acessos-iniciais.csv` não foram enviados**. Confirme o commit.

### 5. Vercel

1. Acesse <https://vercel.com/new> > **Import Git Repository** e autorize o GitHub se solicitado.
2. Selecione `portal-nejlon-2027`. Framework deve ser **Next.js**, diretório raiz `./`.
3. Em **Environment Variables**, configure exatamente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. **Não coloque** `BOOTSTRAP_ADMIN_PASSWORD` na Vercel; ele só serve para criar a primeira conta localmente.
5. Clique em **Deploy**. Acesse o domínio `.vercel.app` exibido após deploy bem-sucedido.
6. No Supabase, abra **Authentication > URL Configuration**. Defina a URL da Vercel como **Site URL** e adicione `https://SEU-SITE.vercel.app/auth/callback` às **Redirect URLs** para recuperação de senha.

A Vercel faz novos deploys automaticamente nos próximos commits do GitHub.

## Papéis e segurança

| Perfil | Deliberações | Respostas | Pendências | Gestão de usuários |
|---|---|---|---|---|
| PRESCON | Cria/edita | Todas | Todas | Sim |
| DIREX do Núcleo | Consulta as liberadas | Não vota | Não | Não |
| DIREX da EJ | Consulta as liberadas | Não vota | Não | Não |
| Conselho da EJ | Consulta as publicadas | Só sua EJ | Acompanha a própria EJ | Não |

As políticas **Row Level Security** do Supabase impedem acesso a dados privados de outras EJs, mesmo usando API diretamente. Funções administrativas usam `service_role` apenas no servidor e verificam o perfil da PRESCON antes de qualquer operação. Desativar ou excluir o último administrador é bloqueado no banco.

## Verificações

```powershell
npm run test
npm run typecheck
npm run build
```

Em um Supabase de teste, faça: (1) entrar com PRESCON; (2) criar uma deliberação; (3) confirmar 29 pendências; (4) entrar como conselheiro da UNECT; (5) votar; (6) retornar à PRESCON e conferir 28 pendências; (7) verificar que DIREX da EJ não vota nem lê as respostas de outras EJs; (8) exportar relatório; (9) trocar a senha temporária de um usuário.

**Limitações:** não há envio automático via WhatsApp nem integração nativa com Google Drive; a biblioteca usa links externos. O relatório não substitui uma ata validada juridicamente. Nomes e contas são institucionais; confirme a permissão de uso do domínio antes de enviar convites para e-mails reais. Dados de demonstração são sempre rotulados. Não use dados pessoais reais sem as aprovações necessárias.

## Situação da entrega (21/11/2026)

- Código-fonte, navegação, formulários, regras RLS e scripts de cadastro: **preparados localmente**.
- Testes unitários da lógica de pendências: **executados com Node 22**.
- Build Next.js e teste de integração com Supabase: **não executados**; a instalação de pacotes não concluiu neste ambiente.
- Banco Supabase, repositório do GitHub e publicação Vercel: **não criados nem publicados** por estas instruções.
- As integrações conectadas ao ChatGPT não substituem a configuração das credenciais e o teste do ambiente publicado.
