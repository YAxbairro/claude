# VeloDown

Um gestor de downloads original, inspirado nas funcionalidades que o Internet Download Manager anuncia publicamente. Não contém código nem recursos do IDM, e o binário do IDM não foi descompilado.

Usa apenas a biblioteca padrão do Python 3.10 ou mais recente, sem dependências.

## Funcionalidades

| Funcionalidade | Como funciona |
|---|---|
| Aceleração com várias ligações | O ficheiro é dividido em N intervalos de bytes (`Range`), cada um descarregado por uma ligação própria. |
| Segmentação dinâmica | Quando uma ligação termina, o maior intervalo que falta é dividido ao meio e a ligação livre fica com a segunda metade. Assim nenhuma ligação fica parada no fim. |
| Pausar e retomar | O progresso é guardado a cada segundo em `ficheiro.part.json`. Pausar, fechar a app ou perder a rede não perde o que já foi descarregado. |
| Repetição automática | Cada segmento tenta de novo até 5 vezes, com espera crescente entre tentativas. |
| Servidores sem `Range` | Usa uma única ligação automaticamente. |
| Fila | Define quantos downloads correm ao mesmo tempo; os outros ficam à espera. |
| Agendador | Inicia a fila a uma data e hora escolhidas. |
| Limite de velocidade | Um limite partilhado por todos os downloads (token bucket). |
| Categorias | Os ficheiros vão para Comprimidos, Documentos, Música, Programas, Vídeo ou Geral, conforme a extensão. |
| Interface web | Barra de ferramentas, categorias, lista, detalhe com mapa dos segmentos, colar link com Ctrl+V, Ctrl+N e Del. |

## Utilização

Interface gráfica, no browser:

```bash
cd velodown
python3 -m velodown serve          # abre http://127.0.0.1:8787
```

Linha de comandos:

```bash
python3 -m velodown get https://exemplo.com/ficheiro.iso -n 16 -o ~/Downloads --limit 2048
```

Ctrl+C pausa o download. Correr o mesmo comando outra vez retoma-o.

## Testes

```bash
python3 -m unittest -v tests.test_velodown
```

Os testes usam um servidor HTTP local e verificam o SHA-256 de cada ficheiro descarregado. Cobrem a segmentação dinâmica, pausar e retomar a partir do disco, o modo sem `Range`, o limite de velocidade, a fila e a persistência.

## Estrutura

- `velodown/engine.py`: motor de download (segmentos, retoma, limite de velocidade)
- `velodown/manager.py`: fila, categorias, agendador e persistência (`.velodown.json`)
- `velodown/server.py`: API JSON e interface web, só em `127.0.0.1`, com pedidos de outras origens bloqueados
- `velodown/static/index.html`: interface
- `velodown/cli.py`: linha de comandos

## Ainda não incluído

Integração com o browser (extensão), captura de vídeo de sites, FTP e autenticação HTTP.
