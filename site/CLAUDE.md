# Site Lutuima Veiga — contexto e regras

## Como responder

O cliente (Yanick) não programa. Pediu explicitamente:

1. **Sempre que uma conta ou serviço for mencionado, dizer qual o email/conta a usar.**
   Ele gere várias contas e perde-se. Nunca escrever "entra no Vercel" sem dizer com que email.
2. **Sempre link direto e clicável**, nunca "vai a Definições → X → Y". Se o link exacto não for
   conhecido com certeza, dizer isso em vez de inventar um que aterra na página errada.
3. **Resumo curto no fim de cada resposta**, para não ter de ler tudo.
4. **Explicar o porquê**, não só o que fazer — ele quer aprender.
5. Português de Portugal.
6. **Antes de lhe pedir para fazer alguma coisa, verificar se eu próprio consigo.**
   Testar a ferramenta, não assumir. Se não der, dizer o que foi tentado e porque falhou.

## Que conta usar em cada serviço

| Serviço | Para quê | Conta |
|---|---|---|
| **Vercel** | Alojamento do site | `afroberd@gmail.com` |
| **Supabase** | Base de dados, pagamentos, emails | `yaxtechcv@gmail.com` |
| **Namecheap** | Domínio | `yanickdrs@gmail.com` |
| **GitHub** | Código | utilizador `YAxbairro` |
| **Stripe** | Receber pagamentos | conta do cliente final (Lutuima), Yanick entra como membro convidado |
| **Painel /admin do site** | Ver marcações | `lutuimaveiga694@gmail.com` |
| **Resend** | Emails de aviso de marcação | `yanickdrs@gmail.com` |

## Identificadores

| O quê | Valor |
|---|---|
| Domínio | `lutuimaveiga.com` (redireciona para `www.`) |
| Projeto Vercel | `project-5xpb7` · `prj_7BaoQmUhSNNmhzQedkvnPFXBwBmO` |
| Equipa Vercel | `team_Gmqje9uLQxZhyhoNfQT6tZOq` |
| Projeto Supabase | `lutuima-veiga` · `ktdbdhsjznajrlklmmri` (eu-west-3) |
| Repositório | `YAxbairro/claude`, pasta `site/`, branch `claude/youthful-brown-34xzmj` |
| Segredo do Stripe | `STRIPE_SECRET_KEY` (segredos das Edge Functions do Supabase) |
| Segredo do Resend | `RESEND_API_KEY` (mesmo sítio) |

## Limitações conhecidas desta configuração

- **O conector Vercel é só de leitura.** Criar projetos, alterar definições, adicionar domínios e
  gravar variáveis de ambiente devolvem `403`. Só `create_deployment` funciona. Tudo o resto tem
  de ser o cliente a fazer no painel.
- **Não há conector Stripe nem Namecheap.** Essas partes são sempre guiadas, nunca executadas.
- A rede da sessão bloqueia `epargmcwrvspkdxatgny.supabase.co` (o projeto antigo, perdido).

## Emails de marcação

A `verify-payment` envia o aviso à administração depois de confirmar o pagamento.
O domínio **não** está verificado no Resend, por isso o plano gratuito obriga a:

- remetente `onboarding@resend.dev`
- destinatário apenas `yanickdrs@gmail.com` (o email da conta Resend)

Para enviar de `marcacoes@lutuimaveiga.com` e para qualquer endereço, é preciso
verificar `lutuimaveiga.com` em https://resend.com/domains e acrescentar 4 registos
DNS na Namecheap (DKIM `resend._domainkey`, CNAME `rsend`, CNAME `send`, TXT `_dmarc`).
O CNAME `send` colide com o TXT/MX antigos do mesmo nome — esses já foram removidos.
Feito isso, só mudam `REMETENTE` e `DESTINATARIOS` no topo da função.

O cliente recebe o recibo do Stripe, não um email nosso.

## Histórico

O site original foi feito no Lovable e perdeu-se o acesso por 2FA. A base de dados pertencia à
organização do Lovable, logo perdeu-se também. O frontend foi reconstruído a partir do bundle
publicado; a base de dados foi recriada de raiz. As marcações e clientes antigos não foram
recuperados.
