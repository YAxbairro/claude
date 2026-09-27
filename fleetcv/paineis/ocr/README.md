# O leitor do quadrante — como foi escolhido

58 fotografias verdadeiras de conta-quilómetros (conjuntos públicos do
Hugging Face: `hendry64/odometer`, `ebalseca/odometer-recognition`), cada
uma com o número certo. Motores grátis, todos a correr no telemóvel:

| motor | sem saber nada do carro | sabendo onde ficou | erros ao propor |
|---|---:|---:|---:|
| Tesseract.js 7 (só algarismos) | 8 | 8 | 2 |
| PaddleOCR PP-OCRv5 (latino) | 38 | 39 | 1 |
| PaddleOCR PP-OCRv4 (Guten OCR, com OpenCV) | 40 | 42 | 1 |
| **PaddleOCR PP-OCRv4, o nosso (sem OpenCV)** | **38** | **40** | **1** |

Ficou o último: quase igual ao melhor e sem os 10 MB do OpenCV. O
telemóvel descarrega do jsDelivr, uma vez só, o ONNX Runtime (3 MB) e os
modelos (15,5 MB); ficam guardados um ano. Corre num Worker (o ecrã não
pára) e a fotografia nunca sai do telemóvel para ser lida.

"Sabendo onde ficou" é o caso de todos os turnos menos o primeiro: só se
aceita um número entre os km da última vez e mais 2.500 — é isso que o
torna tão certeiro. Quando não encontra nada que sirva, não propõe, e o
condutor escreve. O que o condutor escreve à mão manda sempre; o que se
leu fica no turno (`kmLidoInicio`, `kmLidoFim`), e o patrão é avisado se
não bater.

Repetir a corrida: `python3 buscar_fotos.py`, depois `corrida.mjs` (as
instruções estão no cimo do ficheiro). Os modelos: `npm i
onnxruntime-web@1.30.0 @gutenye/ocr-models@1.4.2`.
