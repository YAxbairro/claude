# AYAM Viagens & Turismo — site

Site estático, sem passo de build e sem dependências externas em tempo de execução
(as bibliotecas de animação estão em `vendor/`). Abre em qualquer alojamento que sirva
ficheiros: Vercel, Netlify, Cloudflare Pages, GitHub Pages ou um servidor próprio.

## Estrutura

```
index.html        página final, gerada (é esta que se publica)
_content.html     fonte editável: <title>, <style> e todo o markup
build.py          gera index.html a partir de _content.html
assets/           fotografia tratada + logótipo + favicon
vendor/           GSAP 3.12.5, ScrollTrigger, Lenis 1.1.13
```

**Editar sempre `_content.html`** e depois correr:

```bash
python3 build.py
```

O `build.py` só acrescenta o `<head>` (charset, viewport, Open Graph, favicon).
Editar o `index.html` directamente faz com que as alterações se percam na geração seguinte.

## Publicar

```bash
# Vercel
npx vercel deploy --prod

# Netlify
npx netlify deploy --prod --dir=.

# ou simplesmente enviar a pasta por FTP
```

Não é preciso configurar nada: não há servidor, base de dados nem variáveis de ambiente.

## Testar localmente

```bash
python3 -m http.server 8777
# abrir http://localhost:8777
```

Convém usar um servidor em vez de abrir o ficheiro directamente — com `file://`
alguns browsers bloqueiam o carregamento dos scripts em `vendor/`.

## Conteúdo que convém substituir

| O quê | Onde | Porquê |
|---|---|---|
| Logótipo | `assets/ayam-logo.png` | Foi extraído da apresentação em PDF, a 416×160 px. Um SVG ou PNG original fica nítido em qualquer tamanho. |
| Fotografia | `assets/*.jpg` | São imagens Creative Commons de recurso. Fotografias próprias — clientes, equipa, escritório, viagens realizadas — valem muito mais e retiram a necessidade dos créditos no rodapé. |
| Créditos | rodapé de `_content.html` | As licenças CC BY / CC BY-SA **obrigam** a manter a atribuição enquanto estas imagens forem usadas. Ao trocar por fotografia própria, apagar o bloco `.credits`. |
| Tempos de voo | cartões de destino | Estão marcados como indicativos. Vale a pena confirmar com os horários reais praticados. |

## Notas técnicas

- **Sem JavaScript**, a página continua completamente legível: as animações partem
  sempre de um estado visível, nunca de `opacity: 0` em CSS.
- **`prefers-reduced-motion`** desliga scroll suave, fixações e cursor personalizado.
- **Telemóvel**: o carrossel de destinos passa a deslize nativo com `scroll-snap`;
  a fixação horizontal só corre a partir de 860 px.
- **Relógios**: a hora local de cada destino é calculada no browser com `Intl.DateTimeFormat`
  a partir do fuso horário — não é texto fixo.
- Fontes carregadas do Google Fonts (Fraunces, Archivo, IBM Plex Mono). Para funcionamento
  totalmente offline, descarregar os ficheiros e servi-los a partir de `assets/fonts/`.
