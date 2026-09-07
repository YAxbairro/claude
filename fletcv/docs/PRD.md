# FletCV — PRD (Product Requirements Document)

> Documento de referência do produto. Fonte da verdade para o âmbito do MVP e da
> arquitetura em camadas (núcleo fixo + módulos opcionais).

## 1. Visão Geral

FletCV é uma aplicação mobile de gestão de frota de veículos, 100% baseada no
telemóvel (sem hardware GPS dedicado), que permite controlar rotas, turnos,
combustível e quilometragem em tempo real.

Desenhada para escalar de um pequeno negócio (ex: 5 táxis) até instituições
públicas de grande escala (ex: um ministério), através de uma arquitetura em
camadas: **núcleo fixo + módulos opcionais**.

## 2. Problema

Hoje, o controlo de frotas em Cabo Verde (privadas e públicas) é feito
manualmente ou não é feito de todo:

- Donos de pequenas frotas não sabem exatamente quanto cada carro gasta em
  combustível por km.
- Instituições públicas não têm forma prática de justificar/auditar o uso de
  viaturas do Estado.
- Uso indevido de combustível e viaturas públicas é difícil de detetar sem
  sistema.

## 3. Objetivo

Controlar, de forma simples e acessível via telemóvel: **Rota, Turno,
Combustível, Quilometragem (km)**.

E, consoante o cliente, adicionar controlo, aprovação e auditoria sobre o uso
da frota.

## 4. Público-Alvo

| Segmento | Exemplo | Modo de operação |
|---|---|---|
| Pequeno negócio / individual | Frota de 5 táxis | Modo Livre |
| Empresa de aluguer/transporte | Rent-a-car, logística | Modo Livre + módulos parciais |
| **Foco principal: Instituições públicas** | Ministérios, câmaras, autarquias | Modo Controlado + todos os módulos |

## 5. Arquitetura do Produto

### 5.1 Núcleo Fixo (igual para todos os clientes)

- Cadastro de veículos e condutores
- Início/fim de turno
- Registo de km (foto do quadrante ou manual)
- Rastreamento de rota via GPS do telemóvel (background, durante o turno)
- Registo de abastecimento (foto do recibo/bomba ou manual): litros, custo, km
- Cálculo automático: km percorridos, consumo (km/litro), custo por km
- Mapa em tempo real com todos os carros ativos (localização, em rota, parado,
  turno terminado)
- Deteção de tempo parado (velocidade 0 por X minutos)

### 5.2 Modos de Operação (configurável por conta)

- **Modo Livre** — motorista inicia turno diretamente, sem aprovação prévia
  (ex: táxi, uso pessoal).
- **Modo Controlado** — motorista faz requisição (motivo, destino, hora) →
  responsável aprova/rejeita → só depois pode iniciar turno (ex: instituições).

### 5.3 Módulos Opcionais (liga/desliga por cliente)

- Requisição e aprovação de viatura
- Alertas de uso indevido (fora de horário, fins de semana, desvio de rota)
- Centro de custo / departamento (associar veículo e viagem a uma unidade orgânica)
- Relatórios de auditoria exportáveis (PDF/Excel) para prestação de contas
- Gestão de documentos e prazos (seguro, inspeção, revisão) com alertas
- Dashboard público/transparência (gasto de combustível/km publicado por período)
- Múltiplos condutores por veículo (histórico por viagem, não só por carro)

## 6. Fluxo do MVP (Núcleo + Modo Livre)

1. Gestor cria conta → adiciona veículos → adiciona condutores.
2. Condutor abre a app → foto do quadrante ou km manual → inicia turno →
   autoriza GPS.
3. Durante o turno — GPS regista rota em background.
4. Abastecimento (opcional, a qualquer momento do turno) — foto do recibo/bomba
   ou manual: litros + custo + km.
5. Condutor termina o turno → insere km final.
6. Sistema calcula automaticamente: km percorridos, consumo, custo por km.
7. Gestor vê no painel: mapa com carros ativos, rota, tempo parado, gasto por
   condutor/veículo, relatórios por dia/semana/mês.

## 7. Tratamento de Falhas

| Cenário | Solução |
|---|---|
| Sem internet | App grava localmente (offline-first) e sincroniza quando a ligação voltar. |
| Sem bateria a meio do turno | Último ponto GPS é guardado antes de desligar; ao reiniciar, app deteta "turno aberto" e pede confirmação/correção manual de hora e km; gestor vê alerta de turno não fechado corretamente. |
| Erro ao inserir dados | Validações automáticas (ex: km final não pode ser menor que km inicial; limites plausíveis de litros/custo); gestor pode corrigir qualquer registo no painel, com histórico de alteração (quem, quando, valor antigo vs novo); condutor pode reportar erro em turno já fechado, que fica pendente até confirmação do gestor. |

## 8. Valor Diferenciado para Instituições Públicas (foco principal)

- **Requisição e aprovação prévia** — justificação formal de cada deslocação.
- **Deteção de uso indevido** — alertas para viagens fora de horário, fins de
  semana, desvios de rota (maior argumento de venda: poupança real e proteção
  do gestor).
- **Centro de custo por departamento** — relatórios de gasto por unidade orgânica.
- **Relatórios de auditoria** — exportação pronta para prestação de contas /
  Tribunal de Contas.
- **Múltiplos motoristas por carro** — histórico por viagem.
- **Documentos e prazos** — seguro, inspeção, revisão com alertas.
- **Dashboard de transparência pública** — publicação de gasto de combustível/km
  como prova de boa gestão.

## 9. Modelo de Negócio (proposto)

Preço por módulos/plano — não um produto único:

- **Plano Básico** — núcleo + Modo Livre (ex: táxis, pequenos negócios).
- **Plano Intermédio** — núcleo + módulos parciais (ex: rent-a-car, empresas médias).
- **Plano Institucional** — núcleo + Modo Controlado + todos os módulos
  (ex: ministérios, câmaras).

Isto permite escalar de 1 carro a uma frota do Estado inteira, sem reescrever o
produto — apenas ativar/desativar módulos.

## 10. Piloto de Validação

Caso de uso real disponível imediatamente: frota de 5 táxis do tio de Yax —
teste em Modo Livre com o núcleo completo, antes de avançar para o
desenvolvimento do Modo Controlado e módulos institucionais.

## 11. Próximos Passos / Em Aberto

- Definir se OCR será usado para leitura automática de quadrante/recibo, ou se
  fica manual + foto como comprovativo (MVP: manual + foto).
- Validar adesão real dos condutores no piloto (maior risco do produto: uso
  diário consistente).
- Identificar primeiro contacto institucional (ministério/câmara) para
  apresentação após validação do piloto.
