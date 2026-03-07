import os
from dotenv import load_dotenv

load_dotenv()

# APIs
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

# Video Processing
VIDEO_MAX_DURATION = 300  # 5 minutes
VIDEO_FRAME_RATE = 24
VIDEO_QUALITY = "high"  # high, medium, low

# Output Settings
OUTPUT_DIR = "./output_videos"
TEMP_DIR = "./temp"

# Efeitos disponíveis
AVAILABLE_EFFECTS = [
    "neon_glow",
    "cinematic_transition",
    "timelapse",
    "photo_montage",
    "zoom_pan",
    "blur_focus",
    "color_grade",
    "light_burst",
]

# Estilos de vídeo
STYLES = {
    "luxury": {
        "color_grade": "warm_gold",
        "transitions": "slow_fade",
        "neon_color": "#FFD700",
    },
    "modern": {
        "color_grade": "cool_blue",
        "transitions": "sharp_cut",
        "neon_color": "#00D9FF",
    },
    "minimalist": {
        "color_grade": "bw_with_accent",
        "transitions": "smooth_dissolve",
        "neon_color": "#FFFFFF",
    },
}

# Criação de diretórios
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)
