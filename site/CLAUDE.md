# Site Lutuima Veiga — contexto e regras

## Como responder

O cliente (Yanick) não programa. Pediu explicitamente:

1. **Sempre que uma conta ou serviço for mencionado, dizer qual o email/conta a usar.**
   Ele gere várias contas e perde-se. Nunca escrever "entra no Vercel" sem dizer com que email.
2. **Resumo curto no fim de cada resposta**, para não ter de ler tudo.
3. **Explicar o porquê**, não só o que fazer — ele quer aprender.
4. Português de Portugal.

## Que conta usar em cada serviço

| Serviço | Para quê | Conta |
|---|---|---|
| **Vercel** | Alojamento do site | `afroberd@gmail.com` |
| **Supabase** | Base de dados, pagamentos, emails | `yaxtechcv@gmail.com` |
| **Namecheap** | Domínio | `yanickdrs@gmail.com` |
| **GitHub** | Código | utilizador `YAxbairro` |
| **Stripe** | Receber pagamentos | conta do cliente final (Lutuima), Yanick entra como membro convidado |
| **Painel /admin do site** | Ver marcações | `lutuimaveiga694@gmail.com` |

## Identificadores

| O quê | Valor |
|---|---|
| Domínio | `lutuimaveiga.com` (redireciona para `www.`) |
| Projeto Vercel | `project-5xpb7` · `prj_7BaoQmUhSNNmhzQedkvnPFXBwBmO` |
| Equipa Vercel | `team_Gmqje9uLQxZhyhoNfQT6tZOq` |
| Projeto Supabase | `lutuima-veiga` · `ktdbdhsjznajrlklmmri` (eu-west-3) |
| Repositório | `YAxbairro/claude`, pasta `site/`, branch `claude/youthful-brown-34xzmj` |
| Segredo do Stripe | `STRIPE_SECRET_KEY` (segredos das Edge Functions do Supabase) |

## Limitações conhecidas desta configuração

- **O conector Vercel é só de leitura.** Criar projetos, alterar definições, adicionar domínios e
  gravar variáveis de ambiente devolvem `403`. Só `create_deployment` funciona. Tudo o resto tem
  de ser o cliente a fazer no painel.
- **Não há conector Stripe nem Namecheap.** Essas partes são sempre guiadas, nunca executadas.
- A rede da sessão bloqueia `epargmcwrvspkdxatgny.supabase.co` (o projeto antigo, perdido).

## Histórico

O site original foi feito no Lovable e perdeu-se o acesso por 2FA. A base de dados pertencia à
organização do Lovable, logo perdeu-se também. O frontend foi reconstruído a partir do bundle
publicado; a base de dados foi recriada de raiz. As marcações e clientes antigos não foram
recuperados.
