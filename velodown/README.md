# VeloDown

**Descarregar:** https://github.com/YAxbairro/claude/releases/latest (Windows, macOS, Linux e a extensão do browser). Não precisa de Python.

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

## Instalação rápida (Windows)

1. Instala o [Python](https://www.python.org/downloads/) (3.10 ou mais recente). Marca a opção "Add Python to PATH".
2. Faz duplo clique em `VeloDown.bat`. A interface abre no browser, em http://127.0.0.1:8787.
3. Instala a extensão do browser (Chrome, Edge, Brave ou Opera):
   - abre `chrome://extensions` (no Edge, `edge://extensions`);
   - ativa o **Modo de programador**;
   - clica em **Carregar sem compactação** e escolhe a pasta `extension`.

No Mac ou Linux, corre `./velodown.sh`.

Para o VeloDown arrancar com o Windows: carrega em `Win+R`, escreve `shell:startup` e põe nessa pasta um atalho para `VeloDown.bat`.

## Extensão do browser

| O que faz | Como |
|---|---|
| Apanha downloads | Os ficheiros que clicas (zip, exe, iso, mp4, pdf…, com mais de 1 MB) vão para o VeloDown em vez do browser. Se a app estiver fechada, o browser descarrega normalmente. |
| Menu do botão direito | "Descarregar com VeloDown" em links, vídeos e imagens. "Descarregar todos os links" na página. |
| Botão por cima dos vídeos | Passa o rato por cima de um vídeo e clica em **Descarregar este vídeo** (dá play primeiro). |
| Vídeos detetados | O ícone da extensão mostra quantos vídeos ou áudios foram detetados na página. Clica nele para escolher qual queres. |
| Sites com login | Envia os cookies e o referer da página, para os downloads que exigem sessão iniciada funcionarem. |

Vídeos em streaming (HLS/.m3u8): o VeloDown escolhe a melhor qualidade e descarrega as partes em paralelo. Se o `ffmpeg` estiver instalado, junta tudo num `.mp4`; senão, guarda como `.ts` (abre no VLC). Streams com encriptação AES-128 precisam de `pip install cryptography`. Conteúdo protegido por DRM (Netflix, Disney+, etc.) não é suportado.

## Utilização

Interface gráfica, no browser:

```bash
cd velodown
python3 -m velodown serve --open   # abre http://127.0.0.1:8787
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

Os testes usam um servidor HTTP local e verificam o SHA-256 de cada ficheiro descarregado. Cobrem a segmentação dinâmica, pausar e retomar a partir do disco, o modo sem `Range`, o limite de velocidade, cookies, HLS (melhor qualidade, retoma, recusa de DRM), a fila e a persistência.

## Estrutura

- `velodown/engine.py`: motor de download (segmentos, retoma, limite de velocidade)
- `velodown/manager.py`: fila, categorias, agendador e persistência (`.velodown.json`)
- `velodown/server.py`: API JSON e interface web, só em `127.0.0.1`, com pedidos de outras origens bloqueados
- `velodown/static/index.html`: interface
- `velodown/cli.py`: linha de comandos

## Limitações

- Não suporta FTP nem streams DASH (.mpd).
- A extensão é para browsers Chromium. No Firefox não foi testada.
