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

### Grupos: a porta está fechada, e é definitivo

Antes de perderes tempo a procurar: **a API de Grupos do Facebook acabou.**
A Meta anunciou o fim em janeiro de 2024 e removeu-a de todas as versões a
22 de abril de 2024. E foi mais longe — deixou de ser possível a um
administrador de grupo instalar aplicações no grupo, mesmo sendo ele o dono.

Ou seja, ao contrário das páginas, nos grupos **não há caminho nenhum**, nem
sendo administrador. Nenhuma ferramenta lê grupos legitimamente hoje. Quem
diz que o faz, está a automatizar contas — com o risco que isso traz.

O que sobra para os grupos são os três caminhos em cima.

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

## "Não tenho tempo para andar nos grupos"

Justo — e é a objeção certa. Aqui estão os caminhos em que o trabalho não é
teu, por ordem de custo.

### 1. Avisos por email (o bot vê os grupos sozinho)

Ligas as notificações do grupo em "Todas as publicações" **com email**. O
Facebook passa a mandar-te uma mensagem por cada post novo. O robô lê a tua
caixa de correio e trata cada aviso como um anúncio.

Repara no que isto é: o robô lê o **teu email**, não o Facebook. Não há
termos a violar, não há conta em risco, não há sessão a iniciar. E funciona
sem tu abrires nada.

Está construído (`fontes.CaixaDeEmail`). Precisa do teu email e de uma
palavra-passe de aplicação (no Gmail: Conta Google → Segurança →
Palavras-passe de aplicações — não é a tua senha normal).

**O que ainda não sabemos, e convém saber antes de contar com isto:** o
Facebook tem vindo a encurtar o conteúdo destes avisos ao longo dos anos, e
o que vem em cada um varia. Fomos ver a tua caixa de correio e não havia lá
nenhum aviso de grupo — só um do Meta Pay —, o que quer dizer que as
notificações estão desligadas. Liga num grupo só, espera um dia, e vê o que
chega. Se vier o texto do post, resolveu-se. Se vier só "o Djim publicou no
grupo", serve para te avisar mas não para analisar.

É um teste de dez minutos e vale a pena fazê-lo antes de tudo o resto.

### 2. Alguém recolhe por ti

Uma pessoa em part-time, algumas horas por semana, a percorrer os grupos e a
reencaminhar capturas ao bot. Custa pouco em Cabo Verde e funciona hoje.

O robô faz o resto todo: analisa, pontua, escreve a mensagem, negoceia
depois, cria a publicação, faz o flyer, publica. A parte humana são vinte
minutos de dedo no ecrã — precisamente a parte que nenhuma API permite.

Está construído: pões o ID de Telegram dela em `TELEGRAM_AJUDANTES` e ela
passa a poder mandar anúncios. **Não vê mais nada** — nem leads, nem
contactos, nem aprovações. Recebe só "Recebido, obrigado."

### 3. Virar o problema ao contrário

Em vez de ires atrás dos anúncios, faz com que venham ter contigo: publica
tu nos grupos ("publica o teu imóvel ou carro no ImoAuto, de graça"). Quem
responder está a iniciar a conversa — e a partir daí o robô trata de tudo
sozinho, sem restrição nenhuma, porque responder a quem te contactou é
exatamente aquilo para que ele foi feito.

É o único caminho que escala sem trabalho humano por anúncio. Os outros dois
dão-te volume já; este constrói-te um canal.

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
