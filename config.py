"""
Configurações do Agente de Vídeos Imobiliários
Não precisa de API Key - a inteligência é fornecida por Claude Code no chat.
"""

import os

# Output Settings
OUTPUT_DIR = "./output_videos"
TEMP_DIR = "./temp"

# Video Processing
VIDEO_FRAME_RATE = 24
VIDEO_RESOLUTION = (1920, 1080)

# Efeitos disponíveis
AVAILABLE_EFFECTS = [
    "neon_glow",         # Efeito neon/glow
    "zoom_in",           # Zoom de entrada
    "zoom_out",          # Zoom de saída
    "pan_left",          # Pan para esquerda
    "pan_right",         # Pan para direita
    "timelapse",         # Timelapse
    "color_grade",       # Correção de cores
    "cinematic_bars",    # Barras cinemáticas (letterbox)
    "blur_transition",   # Transição com blur
    "fade_in",           # Fade entrada
    "fade_out",          # Fade saída
    "light_burst",       # Explosão de luz
    "photo_montage",     # Fotomontagem
]

# Estilos de vídeo com efeitos pré-configurados
STYLES = {
    "luxury": {
        "color_grade": "warm_gold",
        "transition_speed": "slow",
        "neon_color": (255, 215, 0),     # Gold
        "neon_intensity": 0.4,
        "default_effects": ["color_grade", "neon_glow", "zoom_in", "cinematic_bars"],
    },
    "modern": {
        "color_grade": "cool_blue",
        "transition_speed": "normal",
        "neon_color": (0, 217, 255),     # Cyan
        "neon_intensity": 0.3,
        "default_effects": ["color_grade", "zoom_in", "fade_in"],
    },
    "minimalist": {
        "color_grade": "bw_accent",
        "transition_speed": "slow",
        "neon_color": (255, 255, 255),   # White
        "neon_intensity": 0.2,
        "default_effects": ["color_grade", "pan_right", "fade_in", "cinematic_bars"],
    },
    "cinematic": {
        "color_grade": "orange_teal",
        "transition_speed": "slow",
        "neon_color": (0, 128, 255),     # Blue
        "neon_intensity": 0.35,
        "default_effects": ["color_grade", "zoom_out", "cinematic_bars", "fade_in"],
    },
}

# Criação de diretórios
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)
