---
name: brava-imagens
description: Gerar ou editar imagens da marca BRAVA com fal.ai (renders em contexto de Praia, lifestyle, conceitos de campanha, imagem personalizada para um cliente) com validação obrigatória. Usar quando for pedida qualquer imagem nova do edifício BRAVA.
---
# Imagens BRAVA

Ferramenta: `python3 projeto-predio/ferramentas/fal_imagem.py` (modelo nano-banana-pro; o proxy injeta a chave).

## Editar um render (mantém a arquitetura)
```bash
cd projeto-predio
python3 ferramentas/fal_imagem.py --img assets/renders-originais/<render>.jpg --ratio 4:5 \
  --prompt "Keep the building architecture, proportions, camera angle and every façade element EXACTLY identical to the reference image; only change light and surroundings. <cena>. Praia, Cabo Verde context: acacia and palm trees, colourful flat-roofed houses, dry volcanic hills. ABSOLUTELY NO SEA. No license plates, no car logos. Photorealistic architectural photography." \
  --out assets/gerado/<nome>.jpg
```

## Imagem personalizada para um cliente quente (posse mental)
Partir de `assets/gerado/conceito-chave.jpg` ou de um interior da personalidade escolhida e pedir uma placa ou um porta-chaves com "Casa <Apelido> · <piso>.º <letra>". Enviar ao cliente apenas depois de validar a ortografia do nome.

## Validação (obrigatória)
1. Fazer uma montagem lado a lado (original vs gerado) com PIL e ver a imagem.
2. Rejeitar se a arquitetura mudou, se há mar, torres, matrículas, texto estranho ou caras deformadas.
3. Gerar de novo com a restrição em falta escrita em maiúsculas no prompt.
4. Registar em `assets/gerado/` só o que foi aprovado.

Formatos: post 4:5 · story/TikTok 9:16 · página 16:9 · `--res 4K` para impressão (tapume, roll-up).
