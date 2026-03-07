"""
Agente Principal de Vídeos Imobiliários
Processa vídeos via links e cria novos vídeos com efeitos
"""

from video_analyzer import VideoAnalyzer
from video_processor import VideoProcessor
from config import ANTHROPIC_API_KEY
import json


class RealEstateVideoAgent:
    def __init__(self):
        if not ANTHROPIC_API_KEY:
            raise ValueError(
                "❌ ANTHROPIC_API_KEY não configurada. Cria um ficheiro .env com: ANTHROPIC_API_KEY=your_key"
            )

        self.analyzer = VideoAnalyzer()
        self.processor = VideoProcessor()

    def process_video(self, reference_url: str, briefing: str) -> dict:
        """
        Pipeline completo do agente:
        1. Analisa vídeo de referência
        2. Gera instruções personalizadas
        3. Processa e cria novo vídeo
        """

        print("\n" + "🎥" * 25)
        print("AGENTE DE VÍDEOS IMOBILIÁRIOS - INICIADO")
        print("🎥" * 25 + "\n")

        # Valida URL
        if not self.analyzer.validate_video_url(reference_url):
            return {"error": "URL do vídeo inválida ou inacessível"}

        try:
            # 1. ANÁLISE
            print("\n[1/3] 🎬 ANÁLISE DO VÍDEO DE REFERÊNCIA\n")
            reference_analysis = self.analyzer.analyze_reference_video(reference_url)

            # 2. GERAÇÃO DE INSTRUÇÕES
            print("\n[2/3] 📝 GERAÇÃO DE INSTRUÇÕES\n")
            video_instructions = self.analyzer.generate_video_instructions(
                reference_analysis, briefing
            )

            # 3. PROCESSAMENTO
            print("\n[3/3] 🎞️ PROCESSAMENTO E CRIAÇÃO DO VÍDEO\n")
            output_video = self.processor.process_from_reference(
                reference_url,
                video_instructions["instructions"],
                output_name="video_imobiliario",
            )

            if not output_video:
                return {"error": "Erro ao processar vídeo"}

            return {
                "status": "✅ SUCESSO",
                "reference_analysis": reference_analysis["analysis"],
                "instructions": video_instructions["instructions"],
                "output_video": output_video,
                "briefing": briefing,
            }

        except Exception as e:
            print(f"❌ Erro geral: {e}")
            return {"error": str(e)}

    def process_with_style(
        self, reference_url: str, briefing: str, style: str = "modern"
    ) -> dict:
        """
        Processa vídeo com um estilo específico
        Estilos disponíveis: luxury, modern, minimalist
        """
        print(f"\n📌 Estilo selecionado: {style.upper()}")

        # Adiciona informação de estilo ao briefing
        style_briefing = f"{briefing}\nEstilo desejado: {style}"

        return self.process_video(reference_url, style_briefing)


# Função para usar no chat
def criar_video_imobiliario(video_url: str, descricao: str, estilo: str = "modern"):
    """
    Interface principal para usar no chat

    Exemplo:
        criar_video_imobiliario(
            "https://example.com/video.mp4",
            "Apartamento de luxo com piscina e vista para o mar",
            estilo="luxury"
        )
    """
    agent = RealEstateVideoAgent()
    resultado = agent.process_with_style(video_url, descricao, estilo)
    return resultado
