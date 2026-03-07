"""
Script de teste do Agente de Vídeos Imobiliários
Execute este script para testar o agente
"""

from agent import criar_video_imobiliario, RealEstateVideoAgent
import json


def test_agent():
    """Testa o agente com um exemplo"""

    print("\n" + "=" * 60)
    print("🧪 TESTE DO AGENTE DE VÍDEOS IMOBILIÁRIOS")
    print("=" * 60 + "\n")

    # Exemplo de uso
    print("📌 INSTRUÇÕES:")
    print("-" * 60)
    print("1. Fornece uma URL de um vídeo (Youtube, Vimeo, ou hospedagem própria)")
    print("2. Descreve a propriedade imobiliária")
    print("3. Escolha um estilo (luxury, modern, minimalist)")
    print("-" * 60 + "\n")

    # Input do utilizador
    video_url = input("🎥 URL do vídeo de referência: ").strip()

    if not video_url:
        print("❌ URL não pode estar vazia")
        return

    descricao = input("📝 Descrição do imóvel: ").strip()

    if not descricao:
        print("❌ Descrição não pode estar vazia")
        return

    print("\n📌 Estilos disponíveis:")
    print("  1. luxury")
    print("  2. modern")
    print("  3. minimalist")
    estilo_choice = input("Escolhe um estilo (1-3) [padrão: 2]: ").strip()

    style_map = {"1": "luxury", "2": "modern", "3": "minimalist"}
    estilo = style_map.get(estilo_choice, "modern")

    print(f"\n✅ Configuração selecionada:")
    print(f"   - URL: {video_url}")
    print(f"   - Descrição: {descricao}")
    print(f"   - Estilo: {estilo}")
    print("\n⏳ Processando... Isto pode levar alguns minutos...\n")

    try:
        # Processa o vídeo
        resultado = criar_video_imobiliario(
            video_url=video_url, descricao=descricao, estilo=estilo
        )

        # Mostra resultados
        print("\n" + "=" * 60)
        print("📊 RESULTADOS")
        print("=" * 60)

        if "error" in resultado:
            print(f"\n❌ Erro: {resultado['error']}")
            return

        print(f"\n✅ {resultado.get('status', 'Processado')}\n")

        print("📋 ANÁLISE DO VÍDEO DE REFERÊNCIA:")
        print("-" * 60)
        print(resultado["reference_analysis"][:500] + "...\n")

        print("📝 INSTRUÇÕES GERADAS:")
        print("-" * 60)
        print(resultado["instructions"][:500] + "...\n")

        print("🎬 VÍDEO CRIADO:")
        print("-" * 60)
        print(f"Localização: {resultado['output_video']}\n")

        print("=" * 60)
        print("✨ Processamento concluído com sucesso!")
        print("=" * 60 + "\n")

    except Exception as e:
        print(f"❌ Erro durante processamento: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    test_agent()
