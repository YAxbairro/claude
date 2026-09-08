# Ler páginas do Facebook

Esta é a parte do plano que depende da Meta, não de nós. Vale a pena
perceber o terreno antes de investir tempo.

## O que a Meta permite, exatamente

Ler os posts de uma página do Facebook faz-se pela Graph API, no endereço
`/{pagina}/posts`. O código para isso já está feito (`fontes.PaginaFacebook`).
O que decide se funciona é o **acesso** — e há dois caminhos.

### Caminho 1 — páginas que administras (funciona hoje)

Se és administrador da página, o teu token lê os posts dela. Sem pedir nada
a ninguém, sem revisão, sem espera.

Isto inclui páginas que **não são tuas**: basta que o dono te dê o papel de
administrador (ou de editor). Em Cabo Verde, onde as páginas de compra e
venda são geridas por pessoas com quem se fala, este é o caminho realista —
e tem uma vantagem que o outro não tem: quem te dá acesso já sabe que
existes, o que torna a conversa a seguir muito mais fácil.

Como fazer:
1. Falas com quem gere a página e explicas a parceria
2. Ele adiciona-te em **Definições da Página → Acesso à Página**
3. Em developers.facebook.com crias uma app e geras um token de página
4. Colas o token no ImoAuto (Configuração → META_PAGE_TOKEN)
5. Acrescentas o endereço da página no Vigia

### Caminho 2 — páginas públicas de terceiros (exige aprovação)

Para ler páginas que não administras é preciso a funcionalidade **Page
Public Content Access**. A Meta só a concede depois de rever a app, e a
revisão inclui:

- verificação do negócio (documentos da empresa)
- um vídeo a mostrar a app a usar a funcionalidade
- descrição de para que serve

Dois avisos honestos: **não dá para testar antes da aprovação** — em modo de
desenvolvimento a app só vê páginas onde o administrador também é
administrador da app; e há relatos de programadores que, mesmo depois de
aprovados, continuaram sem conseguir ler páginas de terceiros.

Ou seja: é um caminho oficial e real, mas é trabalho de semanas e sem
garantia. Não construas o negócio a contar com ele.

## O que não fazemos, e porquê

Automatizar um browser com a tua conta pessoal para percorrer páginas e
grupos — tecnicamente possível, e é o que muita gente faz. Não está aqui
de propósito:

- viola os termos do Facebook, que proíbem acesso automatizado
- a conta que arrisca ser bloqueada é a tua, e com ela a Página do ImoAuto
- parte sempre que o Facebook mexe no HTML, o que é a toda a hora

O risco não é abstrato: perder a conta significa perder o canal onde o
ImoAuto se dá a conhecer. Não compensa.

## O que fica, então

Três caminhos que funcionam mesmo, por ordem de esforço:

1. **Colar** — vês um anúncio num grupo ou numa página, copias o texto, colas
   no Telegram. Sem comando nenhum, ele analisa e devolve a mensagem pronta.
   É instantâneo e não depende de autorização nenhuma. Em Cabo Verde é onde
   está o volume.

2. **Páginas com acordo** — as páginas onde consegues acesso de
   administrador entram na ronda automática, como qualquer outra fonte.
   Começa por uma ou duas.

3. **Portais** — NhaKaza (imóveis) e Stand.cv (viaturas) são lidos
   automaticamente, sem autorização nenhuma. São magros, mas são de graça.

## Instagram

A API oficial do Instagram permite pesquisa por hashtag, mas só devolve
posts recentes de contas profissionais, e limitada. Muitos vendedores
cabo-verdianos publicam no Instagram com o número à vista ("+238 9976718,
também WhatsApp") — vale a pena experimentar mais tarde, mas não é onde
começar.
