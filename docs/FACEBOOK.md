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

## "E se eu iniciar sessão num browser automatizado?"

É a pergunta óbvia, e a resposta tem três partes — a técnica, a prática e
a do risco.

**A técnica.** Escrever isso é fácil. O código existe em qualquer lado.

**A prática, que é onde cai.** Uma sessão automatizada não vive num sítio
fixo: cada arranque é uma máquina nova, sem cookies, sem sessão. Ou seja,
teria de iniciar sessão de novo todos os dias — com a palavra-passe
guardada algures e o código de dois fatores a chegar ao teu telemóvel de
madrugada. E esse início de sessão vem de um centro de dados noutro país.
Para o Facebook isso é o padrão exato de uma conta comprometida: a resposta
normal é um bloqueio de segurança logo à primeira, com pedido de documento
de identificação.

**O risco.** Mesmo que passasse, o acesso automatizado viola os termos. A
conta que fica em causa é a tua pessoal — e é a ela que a Página do ImoAuto
está agarrada. Perdê-la é perder o canal onde o negócio se dá a conhecer,
para poupar dois segundos por anúncio.

Não é prudência exagerada: é que o custo do pior caso é desproporcionado
face ao que se ganha.

## O que resolve o mesmo problema

Manda uma **captura de ecrã**. Vês o anúncio no grupo, fotografas o ecrã,
envias ao bot do Telegram. O robô lê a imagem — texto, preço, nome de quem
publicou, e o número de telefone quando lá está — e devolve a ficha com a
mensagem pronta.

São dois toques no telemóvel, e tem uma vantagem sobre a varredura
automática: nos grupos as pessoas escrevem o número no próprio post
("991 47 23, tambem WhatsApp"), coisa que nos portais nunca aparece. A
captura apanha-o; um scraper de portal não.

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
