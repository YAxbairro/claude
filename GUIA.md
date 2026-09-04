# Como usar o robô ImoAuto

Guia para quem não é da área. Não precisas de perceber de programação — só de
seguir isto uma vez.

---

## 0. Trazer os ficheiros para o teu computador

Os ficheiros estão no GitHub. Para os teres na tua máquina:

**[⬇️ Carrega aqui para descarregar](https://github.com/YAxbairro/claude/archive/refs/heads/claude/imoauto-robot-subagents-41gdvr.zip)**

Descarrega um ficheiro `.zip`. Depois:

1. Vai à pasta **Transferências** (ou Downloads)
2. Clica com o botão direito no ficheiro → **Extrair tudo** (Windows) ou
   duplo clique (Mac)
3. Aparece uma pasta chamada `claude-claude-imoauto-robot-subagents-41gdvr`
4. Arrasta-a para o **Ambiente de trabalho** e muda-lhe o nome para `ImoAuto`
   (fica mais fácil de encontrar)

Dentro dessa pasta é que estão o `ARRANCAR.bat` e o `ARRANCAR.command`.

> **Nota:** se preferires, no site do GitHub também dá — botão verde **Code** →
> **Download ZIP**. Mas confirma que estás no branch
> `claude/imoauto-robot-subagents-41gdvr`, senão descarregas a versão sem o robô.

---

## 1. Arrancar

Abre a pasta `ImoAuto` e faz duplo clique em:

- **Windows:** `ARRANCAR.bat`
- **Mac ou Linux:** `ARRANCAR.command`

Abre-se uma janela preta (é normal, ignora-a — não a feches) e a seguir abre-se
o painel no teu browser.

Se for a primeira vez, ele instala sozinho o que falta. Pode demorar um minuto.

**Se disser que falta o Python:** é o motor que faz correr o programa. A janela
dá-te o link — instalas em dois minutos, é gratuito. No Windows, atenção a uma
caixa no instalador que diz *"Add python.exe to PATH"* — marca-a antes de
carregar em Install, senão não funciona.

![O painel](docs/imagens/painel.png)

---

## 2. As três chaves que ele precisa

Vai a **Configuração** no menu de cima. Precisas de colar três coisas. São
gratuitas e demoram cinco minutos a obter.

### Chave da Anthropic
É o cérebro do robô — é o que o faz pensar.
1. Vai a **console.anthropic.com** e cria conta
2. Menu **API Keys** → **Create Key**
3. Copia e cola no painel

### Bot do Telegram
1. Abre o Telegram e procura **@BotFather**
2. Escreve `/newbot` e segue o que ele pede (um nome, e um nome de utilizador
   que termine em `bot`)
3. Ele responde com um código comprido — copia e cola no painel

### O teu ID de Telegram
1. No Telegram, procura **@userinfobot**
2. Escreve `/start`
3. Ele responde com um número — copia e cola no painel

Carrega **Guardar**. Fecha o programa e volta a abrir. Está pronto.

As outras chaves (Facebook, Instagram, WhatsApp, site) podes deixar em branco
para já. O robô trabalha sem elas — só não publica sozinho.

![A configuração](docs/imagens/configuracao.png)

---

## 3. O modo de simulação

Repara na barra amarela no topo do painel. Quer dizer que o robô faz tudo —
pensa, escreve, prepara os posts — **mas não envia nada para fora**.

Deixa assim uns dias. Cola anúncios, lê o que ele escreve, vê se gostas do tom.
Quando confiares, vais a Configuração e desligas a caixinha do modo de simulação.

Há uma segunda tranca por baixo: **Aprovar posts à mão**. Essa recomendo deixar
sempre ligada — nenhuma publicação sai sem tu carregares no botão.

---

## 4. O dia-a-dia

### O robô procura sozinho, todos os dias

Vai a **Vigia** no menu. Marca a que horas queres a ronda (por exemplo 9h e
19h) e carrega em Guardar. A partir daí, todos os dias a essas horas ele
percorre os anúncios, descarta o que já viu, e traz-te só o que vale a pena —
já com nota e com a mensagem escrita.

Podes também carregar em **Fazer a ronda agora** para não esperares.

Os sítios onde ele procura estão nessa mesma página, e podes acrescentar os
teus: faz uma pesquisa no OLX com os filtros que quiseres (zona, preço,
particulares), copia o endereço da barra do browser, e cola lá.

Para isto funcionar precisas da chave de pesquisa (FIRECRAWL_API_KEY), que se
põe na Configuração.

### Encontraste tu um anúncio no Facebook ou Instagram?
Copia o texto todo (descrição, preço, contacto) e cola no painel, na caixa
**Encontraste um anúncio?**. Carrega em **Analisar anúncio**.

Em poucos segundos o robô diz-te:
- os dados organizados (preço, zona, tipologia, telefone)
- uma nota de 0 a 100 — quanto vale a pena ir atrás
- **a mensagem já escrita** para enviares à pessoa

### Enviar a primeira mensagem
Na ficha do lead, carrega em **Abrir WhatsApp com a mensagem**. Abre o WhatsApp
com o texto já lá dentro. Lês, mudas o que quiseres, envias.

![A ficha de um lead](docs/imagens/lead.png)

**Esta parte tem de ser mesmo tu.** Não é preguiça do robô: é a regra que
impede a conta do ImoAuto de ser bloqueada. O robô nunca escreve primeiro a
um desconhecido.

### Passar o número ao robô
Depois de falares com a pessoa — pelo chat do OLX, por telefone, como for —
volta à ficha do lead e escreve o número de WhatsApp dela em **Passar ao
robô**. A partir daí é ele que trata de tudo.

Se ela disse que sim a falar por WhatsApp, marca a caixinha: o robô abre a
conversa ele próprio. Se não marcares, ele fica à espera que ela escreva.

### A partir daí, é com ele
Quando a conversa arranca, o robô assume sozinho: explica o ImoAuto, faz as
perguntas, pede as fotos, descarrega-as, cria a publicação no site, gera o
flyer e prepara os posts.

Tu vês tudo no painel. Se ele não souber responder alguma coisa, avisa-te.

### Aprovar os posts
Vai a **Posts**. Vês o flyer e o texto que ele escreveu para cada rede.
**Publicar** ou **Rejeitar**. Só isso.

![Os posts](docs/imagens/posts.png)

---

## 5. Também dá pelo telemóvel

Depois de configurares o Telegram, o robô fala contigo por lá. Recebes os leads
no telemóvel com os mesmos botões — Abrir WhatsApp, Já contactei, Descartar.

É o mesmo robô: o que fizeres no telemóvel aparece no painel e vice-versa.

---

## Perguntas que costumam surgir

**Tenho de deixar o computador ligado?**
Sim, enquanto quiseres que ele trabalhe. Se preferires que trabalhe sozinho
24 horas, isso põe-se num servidor — diz e trata-se disso.

**Ele pode publicar sem eu ver?**
Não, enquanto a caixa "Aprovar posts à mão" estiver ligada. E está por
predefinição.

**Onde ficam as minhas chaves?**
Num ficheiro chamado `.env`, no teu computador. Nunca saem daí.

**Ele apaga alguma coisa do meu site?**
Não. Só cria publicações novas.

**Enganei-me a configurar.**
Volta a Configuração, corrige e guarda outra vez. Não parte nada.

**Onde está a pasta outra vez?**
Onde a puseste no passo 0 — se seguiste o guia, no Ambiente de trabalho, com o
nome `ImoAuto`.

**A janela preta fechou-se e o painel deixou de funcionar.**
Normal — a janela preta é o programa. Abre outra vez pelo `ARRANCAR`.
