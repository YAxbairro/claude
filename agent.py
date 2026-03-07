"""
Agente de Vídeos Imobiliários
Processa vídeos via links e cria novos vídeos com efeitos.
NÃO precisa de API Key - a inteligência é fornecida por Claude Code.
"""

from video_processor import VideoProcessor


class RealEstateVideoAgent:
    def __init__(self):
        self.processor = VideoProcessor()

    def process_video(
        self,
        reference_url: str,
        instructions: str,
        style: str = "modern",
        effects: list = None,
    ) -> dict:
        """
        Processa vídeo de referência e aplica efeitos.

        Parâmetros:
            reference_url: URL pública do vídeo de referência
            instructions: Instruções geradas pelo Claude Code no chat
            style: Estilo do vídeo (luxury, modern, minimalist)
            effects: Lista de efeitos a aplicar (neon, zoom, timelapse, etc.)
        """

        print("\n" + "🎥" * 25)
        print("AGENTE DE VÍDEOS IMOBILIÁRIOS - INICIADO")
        print("🎥" * 25 + "\n")

        if effects is None:
            effects = ["color_grade", "neon", "zoom"]

        try:
            output_video = self.processor.process_from_reference(
                reference_url=reference_url,
                instructions=instructions,
                style=style,
                effects=effects,
                output_name="video_imobiliario",
            )

            if not output_video:
                return {"error": "Erro ao processar vídeo"}

            return {
                "status": "✅ SUCESSO",
                "output_video": output_video,
                "style": style,
                "effects_applied": effects,
            }

        except Exception as e:
            print(f"❌ Erro: {e}")
            return {"error": str(e)}


def processar_video(
    url: str,
    style: str = "modern",
    effects: list = None,
    instructions: str = "",
) -> dict:
    """
    Função principal - usada depois de Claude Code analisar o vídeo no chat.

    Exemplo de uso:
        processar_video(
            url="https://meu-video.mp4",
            style="luxury",
            effects=["neon", "zoom", "timelapse"],
            instructions="Transição lenta, neon dourado, zoom de saída"
        )
    """
    agent = RealEstateVideoAgent()
    return agent.process_video(
        reference_url=url,
        instructions=instructions,
        style=style,
        effects=effects or ["color_grade", "neon", "zoom"],
    )
