"""
Análise de vídeos imobiliários usando Claude API
"""

import anthropic
from config import ANTHROPIC_API_KEY
import base64
import requests
from pathlib import Path


class VideoAnalyzer:
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        self.model = "claude-opus-4-6"

    def analyze_reference_video(self, video_url: str) -> dict:
        """
        Analisa um vídeo de referência e extrai estilo, efeitos e instruções
        """
        print(f"🎬 Analisando vídeo de referência: {video_url}")

        # Prompts para análise detalhada
        analysis_prompt = f"""
Você é um expert em produção de vídeos imobiliários. Analise este vídeo de referência e forneça:

1. **ESTILO**: Identifique o estilo visual (luxury, modern, minimalist, cinematic, etc.)
2. **EFEITOS UTILIZADOS**:
   - Transições (fade, dissolve, zoom, corte rápido, etc.)
   - Efeitos visuais (neon, glow, blur, color grade, etc.)
   - Movimentos (pan, zoom, timelapse, slow-motion, etc.)
3. **ESTRUTURA**:
   - Duração de cada shot
   - Ordem das cenas
   - Ritmo e pacing
4. **CORES**: Paleta de cores dominante
5. **ÁUDIO**: Tipo de música/som (se detectável)
6. **INSTRUÇÕES PARA REPLICAR**: Passos específicos para criar um vídeo similar

Por favor, seja muito específico e detalhado nas instruções.
Formato de resposta: JSON estruturado.
"""

        message = self.client.messages.create(
            model=self.model,
            max_tokens=2000,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": analysis_prompt,
                        },
                        {
                            "type": "text",
                            "text": f"Vídeo URL: {video_url}",
                        },
                    ],
                }
            ],
        )

        analysis = message.content[0].text
        print("✅ Análise concluída")
        return {"analysis": analysis, "video_url": video_url}

    def generate_video_instructions(
        self, reference_analysis: dict, briefing: str
    ) -> dict:
        """
        Gera instruções detalhadas para criar novo vídeo baseado na análise
        """
        print("📝 Gerando instruções personalizadas...")

        prompt = f"""
Baseado na análise do vídeo de referência abaixo, crie instruções detalhadas
para gerar um novo vídeo imobiliário com o seguinte briefing:

BRIEFING: {briefing}

ANÁLISE DO VÍDEO DE REFERÊNCIA:
{reference_analysis["analysis"]}

Por favor forneça:
1. **DESCRIÇÃO VISUAL**: O que o novo vídeo deve mostrar
2. **SEQUÊNCIA DE SHOTS**: Lista detalhada de cada cena
3. **EFEITOS A APLICAR**: Efeitos específicos para cada shot
4. **TIMING**: Duração de cada segmento
5. **PALETA DE CORES**: Cores específicas (hex) a usar
6. **TRANSIÇÕES**: Tipo e duração de cada transição
7. **ANIMAÇÕES**: Movimentos de câmera (pan, zoom, etc.)
8. **PRIORIDADES**: O que é mais importante manter do estilo original

Formato: Estruturado e pronto para implementação técnica.
"""

        message = self.client.messages.create(
            model=self.model,
            max_tokens=2500,
            messages=[{"role": "user", "content": prompt}],
        )

        instructions = message.content[0].text
        print("✅ Instruções geradas")
        return {
            "instructions": instructions,
            "briefing": briefing,
            "reference_url": reference_analysis["video_url"],
        }

    def validate_video_url(self, url: str) -> bool:
        """Verifica se a URL do vídeo é acessível"""
        try:
            response = requests.head(url, timeout=5, allow_redirects=True)
            return response.status_code < 400
        except Exception as e:
            print(f"❌ URL inválida: {e}")
            return False
