"""
Arranca o robô ImoAuto.

Duplo clique neste ficheiro (ou `python arrancar.py`) e abre-se o painel no
browser. Se as chaves já estiverem preenchidas, o bot do Telegram arranca
sozinho por trás.

Não é preciso saber nada de programação para usar isto.
"""

import subprocess
import sys
import threading
import time
import webbrowser

PORTA = 5000


def verificar_dependencias():
    """Vê o que falta e instala sozinho — sem obrigar ninguém a decorar comandos."""
    em_falta = []
    for modulo, pacote in (("flask", "flask"), ("requests", "requests"),
                           ("dotenv", "python-dotenv"), ("anthropic", "anthropic")):
        try:
            __import__(modulo)
        except ImportError:
            em_falta.append(pacote)
    if not em_falta:
        return

    print(f"\n  Faltam algumas peças ({', '.join(em_falta)}). A instalar...\n")
    resultado = subprocess.run(
        [sys.executable, "-m", "pip", "install", "--quiet", *em_falta]
    )
    if resultado.returncode == 0:
        print("  Instalado. A continuar.\n")
        return

    print("\n  Não consegui instalar automaticamente.")
    print("  Abre a linha de comandos e cola isto:\n")
    print(f"     {sys.executable} -m pip install {' '.join(em_falta)}\n")
    try:
        input("  Carrega Enter para fechar.")
    except EOFError:
        pass
    sys.exit(1)


def arrancar_bot():
    """O bot do Telegram, em segundo plano. Se falhar, o painel continua."""
    from imoauto import config, store
    essenciais, _ = config.em_falta()
    if essenciais:
        print(f"  Bot do Telegram em pausa — falta: {', '.join(essenciais)}")
        print("  Preenche na página Configuração e reabre este programa.\n")
        return
    from imoauto import bot
    try:
        bot.correr()
    except Exception as erro:
        store.registar("arranque", "bot_parou", str(erro))
        print(f"  [bot do Telegram parou: {erro}]")


def main():
    verificar_dependencias()

    from imoauto import config, painel, store
    store.iniciar()

    print("\n" + "=" * 58)
    print(f"  {config.MARCA} — robô de operações")
    print("=" * 58)
    modo = "SIMULAÇÃO (nada sai para o mundo)" if config.DRY_RUN else "AO VIVO"
    print(f"  Modo: {modo}")
    print(f"  Painel: http://localhost:{PORTA}")
    print("  Para parar: fecha esta janela.")
    print("=" * 58 + "\n")

    threading.Thread(target=arrancar_bot, daemon=True).start()
    threading.Timer(1.5, lambda: webbrowser.open(f"http://localhost:{PORTA}")).start()

    try:
        painel.correr(PORTA)
    except KeyboardInterrupt:
        print("\n  Fechado.\n")


if __name__ == "__main__":
    main()
