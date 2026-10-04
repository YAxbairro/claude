# Pôr a FleetCV na Google Play

Tudo o que a Play pede, pronto a copiar. O que está marcado **[Yanick]**
precisa da conta dele ou de pagamento.

## O que já está feito

| | |
|---|---|
| Pacote para a Play | `site/teste/FleetCV-1.1.0.aab` (https://fleetcv.vercel.app/teste/FleetCV-1.1.0.aab), versão 1.1.0 (código 3), Android 16 (API 36), assinado com a chave de sempre |
| O mesmo, para instalar à mão e testar | `site/teste/FleetCV-1.1.0.apk` |
| Ícone 512×512 | `icone-512.png` |
| Gráfico de destaque 1024×500 | `grafico-1024x500.png` |
| Capturas do telemóvel (1080×1920) | `captura-1.png` … `captura-4.png` (refazem-se com `imagens.mjs`) |
| Política de privacidade | https://fleetcv.vercel.app/privacidade |
| Apagar a conta (link que a Play pede) | https://fleetcv.vercel.app/ajuda#apagar |

Porquê a 1.1.0: desde 31 de Agosto de 2026 a Play só aceita aplicações
novas feitas para o Android 16 (API 36). A 1.0.1 (a do piloto) é para o
Android 15. A 1.1.0 também ajusta o ecrã às barras do sistema (o Android 15
e 16 desenham a aplicação por baixo da barra de cima e da de baixo; agora a
página fica entre elas).

## 1. Antes de enviar: testar a 1.1.0 num telemóvel  **[Yanick]**

Ainda não correu num telemóvel verdadeiro. Num Android (de preferência o
Samsung do teste), instalar por cima da que lá está:
https://fleetcv.vercel.app/teste/FleetCV-1.1.0.apk

- [ ] A barra de cima da FleetCV não fica por baixo da hora e da bateria.
- [ ] Os botões de baixo ("Abastecer", "Terminar") não ficam por baixo dos botões do Android.
- [ ] Entrar, escolher o carro, tirar a fotografia do conta-quilómetros.
- [ ] Começar o turno: aparece a notificação "FleetCV · GPS ligado".
- [ ] Ecrã apagado 30 minutos a andar: o percurso fica todo no mapa do patrão.
- [ ] Fechar o turno: a notificação desaparece.

Se alguma coisa falhar, mandar-me uma captura: corrijo antes de enviar.

## 2. A conta de programador  **[Yanick]**

https://play.google.com/console/signup — 25 USD, uma vez. Pede documento de
identidade e um telefone.

Há dois tipos, e a escolha conta:

- **Pessoal** (em nome do Yanick): mais rápida de abrir, mas as contas
  pessoais novas têm de fazer um **teste fechado com pelo menos 12 pessoas
  durante 14 dias seguidos** antes de poderem publicar para toda a gente. Se
  o número cair abaixo de 12 a meio, os 14 dias recomeçam. Os condutores do
  piloto, os patrões e amigos com Android servem — cada um tem de aceitar o
  convite e instalar pela Play.
- **Organização** (em nome da empresa): não tem o teste das 12 pessoas, mas
  precisa da empresa registada e de um número D-U-N-S (grátis, pedido na Dun &
  Bradstreet, demora dias ou semanas).

Também é preciso um **e-mail de contacto público** para a ficha (sugestão:
criar um só para a FleetCV, por exemplo `suporte.fleetcv@…`).

## 3. A assinatura (importante para quem já tem o APK)

Os condutores do piloto instalaram o APK assinado com a nossa chave. Para
eles poderem passar a receber as actualizações pela Play **sem desinstalar**,
a Play tem de assinar com a mesma chave:

- Em *Configuração → Integridade da aplicação → Assinatura da aplicação*,
  escolher **"Usar a chave de um repositório Java"** e enviar a nossa chave
  (está no Supabase, tabela `_cofre`, ver `../LEIA-ME.md`). A Play dá uma
  ferramenta (PEPK) que a cifra antes de sair do computador. Faço isto
  contigo quando a conta existir.
- Se se deixar a Play gerar uma chave nova, funciona na mesma, mas quem tem
  o APK terá de o desinstalar uma vez e instalar o da Play.

## 4. A ficha da loja (copiar e colar)

**Nome:** FleetCV · Condutor

**Descrição breve** (78 de 80):
> O turno do táxi no telemóvel: percurso, quilómetros e combustível, sem papéis.

**Descrição completa:**
> A FleetCV é a aplicação do condutor de táxi para frotas em Cabo Verde. O
> patrão vê no mapa por onde anda cada carro, quantos quilómetros fez e
> quanto gastou em combustível — e o condutor deixa de andar com papéis.
>
> COMO FUNCIONA
> • Entre com o e-mail e o código que o patrão lhe mandou.
> • Escolha o carro e tire uma fotografia do conta-quilómetros. A aplicação
>   lê o número sozinha.
> • Comece o turno. O GPS grava o percurso, mesmo com o ecrã apagado e com
>   outras aplicações abertas.
> • Ao abastecer, fotografe o talão e escreva o valor.
> • No fim, nova fotografia do conta-quilómetros e o turno fecha.
>
> FEITA PARA O DIA A DIA
> • Gasta poucos dados: perto de 4,5 MB por hora.
> • Sem rede, guarda tudo e envia quando a rede voltar.
> • Mapa de Cabo Verde com os nomes das ruas, claro de dia e escuro de noite.
>
> PRIVACIDADE
> A localização só é registada com o turno aberto. Enquanto está a registar
> aparece sempre uma notificação fixa da FleetCV. Fora do turno, nada. Só o
> proprietário da frota vê os turnos; os colegas não.
>
> Para o proprietário: crie a conta da frota em fleetcv.vercel.app — os
> primeiros 30 dias são grátis.
>
> Ajuda: WhatsApp +238 955 78 82

**Categoria:** Empresas · **Etiquetas:** frota, táxi, GPS
**Site:** https://fleetcv.vercel.app · **Telefone:** +238 955 78 82
**Política de privacidade:** https://fleetcv.vercel.app/privacidade

## 5. Os formulários da Play

### Acesso à aplicação
A aplicação pede para entrar. Criar uma frota de teste só para os revisores
da Google (um patrão e um condutor), e escrever o e-mail e o código do
condutor no formulário **na Play Console — nunca no GitHub**. Explicar:
"Entre com estes dados, escolha um carro e carregue em Começar o turno.
O botão 'Experimentar sem conduzir' simula uma viagem pela Praia."

### Classificação de conteúdo
Questionário IARC: categoria "Utilitário, produtividade, comunicação ou
outra". Sem violência, sexo, linguagem, drogas, jogo. À pergunta sobre
**partilhar a localização com outros utilizadores: Sim** (o proprietário
da frota vê a posição do carro durante o turno). Resultado esperado: 3+ /
PEGI 3, com o aviso de partilha de localização.

### Público-alvo
18 anos ou mais. Não é dirigida a crianças.

### Segurança dos dados
- A aplicação recolhe ou partilha dados? **Sim.**
- Cifrados em trânsito? **Sim.**
- Os utilizadores podem pedir para apagar? **Sim** — https://fleetcv.vercel.app/ajuda#apagar
- Partilha com terceiros? **Não** (o Supabase e a Vercel são prestadores de
  serviço; não contam como partilha).

| Dados | Recolhidos | Para quê | Obrigatório |
|---|---|---|---|
| Localização exacta | Sim | Funcionalidade da aplicação; prevenção de fraude | Sim |
| Nome | Sim | Funcionalidade; gestão da conta | Sim |
| Endereço de e-mail | Sim | Gestão da conta | Sim |
| Número de telefone | Sim (escrito pelo patrão) | Funcionalidade (mandar o acesso pelo WhatsApp) | Não |
| Fotografias | Sim (conta-quilómetros e talões) | Funcionalidade; prevenção de fraude | Sim |
| Registos de falhas e diagnóstico | Sim | Análise (perceber porque o GPS parou) | Sim |
| Outras informações da aplicação (versão, modelo do telemóvel) | Sim | Análise | Sim |

Nada para publicidade, nada vendido. Os dados são tratados de forma
efémera? Não (ficam guardados para o proprietário).

### Licenças sensíveis
- **Serviço em primeiro plano de localização** (`FOREGROUND_SERVICE_LOCATION`):
  declarar o tipo "Localização". Justificação:
  > O condutor de táxi carrega em "Começar o turno" e a aplicação grava o
  > percurso do carro até ele carregar em "Terminar". Tem de continuar com
  > o ecrã apagado e com outras aplicações abertas (chamadas, WhatsApp),
  > senão o turno fica com buracos e as contas de quilómetros e combustível
  > da frota ficam erradas. Enquanto grava, há uma notificação fixa. O
  > serviço pára quando o turno fecha.
  
  Pede um **vídeo** (YouTube, não listado). Guião, 60–90 s, filmado com
  outro telemóvel ou gravação do ecrã:
  1. Abrir a FleetCV, entrar, escolher o carro, fotografar o conta-quilómetros.
  2. Carregar em "Começar o turno"; mostrar a notificação "FleetCV · GPS ligado".
  3. Apagar o ecrã e andar uns minutos (ou abrir o WhatsApp).
  4. Voltar à aplicação: o percurso continuou a ser gravado.
  5. Carregar em "Terminar": a notificação desaparece.
- **Localização em segundo plano:** não se pede (`ACCESS_BACKGROUND_LOCATION`
  não está na aplicação), por isso não há declaração a fazer.
- **Isenção da poupança de bateria** (`REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`):
  a Play só a aceita quando a função principal sem ela deixa de funcionar.
  É o nosso caso (Samsung e Xiaomi matam o GPS do turno); se a revisão
  perguntar, usar o mesmo texto da justificação de cima.

## 6. Enviar

1. Criar a aplicação na Play Console (nome, português, aplicação, grátis).
2. Preencher a ficha (ponto 4) e os formulários (ponto 5).
3. *Teste interno*: enviar o `FleetCV-1.1.0.aab`, juntar o próprio e-mail, instalar pela Play.
4. *Teste fechado* (contas pessoais): convidar as 12+ pessoas, esperar os 14 dias.
5. *Produção*: pedir acesso, enviar para revisão (alguns dias).
6. Quando estiver publicada: trocar o botão do `site/android.html` pelo link da Play.

Cada actualização nativa daqui para a frente: subir `versionCode` em
`android/app/build.gradle`, `./gradlew bundleRelease` (ver `../LEIA-ME.md`) e
enviar o `.aab` novo. As mudanças do site continuam a chegar sem passar pela
Play.
