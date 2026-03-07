"""
Processamento de vídeos com efeitos e transições.
Funciona 100% local - não precisa de API Key.
"""

import cv2
import numpy as np
from pathlib import Path
from moviepy.editor import VideoFileClip, concatenate_videoclips, vfx, ColorClip
import os
import urllib.request
from config import TEMP_DIR, OUTPUT_DIR, STYLES


class VideoProcessor:
    def __init__(self):
        self.temp_dir = Path(TEMP_DIR)
        self.output_dir = Path(OUTPUT_DIR)
        self.temp_dir.mkdir(exist_ok=True)
        self.output_dir.mkdir(exist_ok=True)

    def download_video(self, url: str, filename: str = "reference_video.mp4") -> str:
        """Baixa vídeo de uma URL pública"""
        output_path = str(self.temp_dir / filename)
        print(f"📥 Baixando vídeo...")
        try:
            urllib.request.urlretrieve(url, output_path)
            print(f"✅ Download concluído: {output_path}")
            return output_path
        except Exception as e:
            print(f"❌ Erro no download: {e}")
            return None

    def apply_neon_glow(self, clip: VideoFileClip, color: tuple = (0, 255, 255), intensity: float = 0.3) -> VideoFileClip:
        """Efeito neon/glow sobre o vídeo"""
        print("✨ Aplicando neon glow...")

        def neon_frame(get_frame, t):
            frame = get_frame(t).astype(np.float32)
            # Cria camada de bloom
            blur = cv2.GaussianBlur(frame, (21, 21), 0)
            # Mistura com cor neon
            neon = np.zeros_like(frame)
            neon[:, :, 0] = color[2]  # B
            neon[:, :, 1] = color[1]  # G
            neon[:, :, 2] = color[0]  # R
            # Combina
            result = cv2.addWeighted(frame, 1.0 - intensity, neon, intensity * 0.3, 0)
            result = cv2.addWeighted(result, 1.0, blur, intensity * 0.15, 0)
            return np.clip(result, 0, 255).astype(np.uint8)

        return clip.fl(neon_frame)

    def apply_color_grade(self, clip: VideoFileClip, grade: str = "warm_gold") -> VideoFileClip:
        """Aplica color grading cinematográfico"""
        print(f"🎨 Aplicando color grade: {grade}...")

        grades = {
            "warm_gold":     {"r": 1.15, "g": 1.0, "b": 0.75, "contrast": 1.1},
            "cool_blue":     {"r": 0.8,  "g": 0.95, "b": 1.2,  "contrast": 1.1},
            "bw_accent":     {"r": 0.9,  "g": 0.9,  "b": 0.9,  "contrast": 1.2},
            "orange_teal":   {"r": 1.1,  "g": 0.95, "b": 0.7,  "contrast": 1.15},
            "cinematic":     {"r": 1.05, "g": 1.0,  "b": 0.9,  "contrast": 1.1},
        }

        g = grades.get(grade, grades["warm_gold"])

        def grade_frame(get_frame, t):
            frame = get_frame(t).astype(np.float32) / 255.0
            # Aplica multiplicadores de cor
            frame[:, :, 0] *= g["b"]
            frame[:, :, 1] *= g["g"]
            frame[:, :, 2] *= g["r"]
            # Aumenta contraste
            frame = (frame - 0.5) * g["contrast"] + 0.5
            return (np.clip(frame, 0, 1) * 255).astype(np.uint8)

        return clip.fl(grade_frame)

    def apply_cinematic_bars(self, clip: VideoFileClip, bar_ratio: float = 0.1) -> VideoFileClip:
        """Adiciona barras cinemáticas (letterbox)"""
        print("🎬 Adicionando barras cinemáticas...")
        w, h = clip.size
        bar_h = int(h * bar_ratio)

        def add_bars(get_frame, t):
            frame = get_frame(t).copy()
            frame[:bar_h, :] = 0
            frame[h - bar_h:, :] = 0
            return frame

        return clip.fl(add_bars)

    def apply_zoom(self, clip: VideoFileClip, direction: str = "in", factor: float = 1.15) -> VideoFileClip:
        """Aplica zoom suave de entrada ou saída"""
        print(f"🔍 Aplicando zoom {direction}...")

        def zoom_frame(get_frame, t):
            frame = get_frame(t)
            h, w = frame.shape[:2]
            progress = t / clip.duration

            if direction == "in":
                scale = 1.0 + (factor - 1.0) * progress
            else:
                scale = factor - (factor - 1.0) * progress

            new_w = int(w * scale)
            new_h = int(h * scale)
            resized = cv2.resize(frame, (new_w, new_h))

            x1 = (new_w - w) // 2
            y1 = (new_h - h) // 2
            return resized[y1:y1 + h, x1:x1 + w]

        return clip.fl(zoom_frame)

    def apply_pan(self, clip: VideoFileClip, direction: str = "right", distance: float = 0.05) -> VideoFileClip:
        """Aplica movimento de pan"""
        print(f"↔️  Aplicando pan {direction}...")

        def pan_frame(get_frame, t):
            frame = get_frame(t)
            h, w = frame.shape[:2]
            progress = t / clip.duration
            offset = int(w * distance * progress)

            result = np.zeros_like(frame)
            if direction == "right":
                if offset < w:
                    result[:, offset:] = frame[:, :w - offset]
            else:
                if offset < w:
                    result[:, :w - offset] = frame[:, offset:]

            return result

        return clip.fl(pan_frame)

    def create_timelapse(self, clip: VideoFileClip, speed: float = 8.0) -> VideoFileClip:
        """Cria efeito timelapse"""
        print(f"⏩ Criando timelapse ({speed}x)...")
        return clip.speedx(speed)

    def apply_fade(self, clip: VideoFileClip, fade_in: bool = True, fade_out: bool = True, duration: float = 0.5) -> VideoFileClip:
        """Aplica fade in/out"""
        if fade_in:
            clip = clip.fadein(duration)
        if fade_out:
            clip = clip.fadeout(duration)
        return clip

    def apply_effects(self, clip: VideoFileClip, style: str = "modern", effects: list = None) -> VideoFileClip:
        """
        Aplica lista de efeitos baseada no estilo e instruções do Claude Code.
        """
        style_config = STYLES.get(style, STYLES["modern"])

        if effects is None:
            effects = style_config["default_effects"]

        print(f"\n🎨 Estilo: {style.upper()}")
        print(f"🎭 Efeitos: {', '.join(effects)}\n")

        processed = clip

        if "color_grade" in effects:
            processed = self.apply_color_grade(processed, style_config["color_grade"])

        if "neon_glow" in effects:
            processed = self.apply_neon_glow(
                processed,
                color=style_config["neon_color"],
                intensity=style_config["neon_intensity"],
            )

        if "cinematic_bars" in effects:
            processed = self.apply_cinematic_bars(processed)

        if "zoom_in" in effects:
            processed = self.apply_zoom(processed, "in")

        if "zoom_out" in effects:
            processed = self.apply_zoom(processed, "out")

        if "pan_right" in effects:
            processed = self.apply_pan(processed, "right")

        if "pan_left" in effects:
            processed = self.apply_pan(processed, "left")

        if "timelapse" in effects:
            processed = self.create_timelapse(processed)

        if "fade_in" in effects:
            processed = self.apply_fade(processed, fade_in=True, fade_out=False)

        if "fade_out" in effects:
            processed = self.apply_fade(processed, fade_in=False, fade_out=True)

        return processed

    def process_from_reference(
        self,
        reference_url: str,
        instructions: str = "",
        style: str = "modern",
        effects: list = None,
        output_name: str = "resultado",
    ) -> str:
        """
        Pipeline completo:
        1. Download do vídeo
        2. Aplicação de efeitos baseados no estilo
        3. Exportação do resultado
        """
        print("\n" + "=" * 50)
        print("🎬 PROCESSANDO VÍDEO IMOBILIÁRIO")
        print("=" * 50)

        # Download
        video_path = self.download_video(reference_url)
        if not video_path:
            return None

        # Carrega vídeo
        try:
            clip = VideoFileClip(video_path)
            print(f"✅ Vídeo carregado: {clip.duration:.1f}s | {clip.size[0]}x{clip.size[1]}")
        except Exception as e:
            print(f"❌ Erro ao abrir vídeo: {e}")
            return None

        # Aplica efeitos
        try:
            processed = self.apply_effects(clip, style=style, effects=effects)
        except Exception as e:
            print(f"❌ Erro nos efeitos: {e}")
            processed = clip

        # Exporta
        output_path = str(self.output_dir / f"{output_name}.mp4")
        try:
            print(f"\n📤 Exportando para {output_path}...")
            processed.write_videofile(
                output_path,
                fps=24,
                codec="libx264",
                audio_codec="aac",
                verbose=False,
                logger=None,
            )
            print(f"✅ Vídeo criado: {output_path}")
            return output_path
        except Exception as e:
            print(f"❌ Erro ao exportar: {e}")
            return None
