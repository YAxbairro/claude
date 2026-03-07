"""
Processamento de vídeos com efeitos e transições
"""

import cv2
import numpy as np
from pathlib import Path
from moviepy.editor import (
    VideoFileClip,
    CompositeVideoClip,
    vfx,
    ImageClip,
    concatenate_videoclips,
)
from moviepy.video.io.bindings import write_frame
import os
from config import TEMP_DIR, OUTPUT_DIR


class VideoProcessor:
    def __init__(self):
        self.temp_dir = Path(TEMP_DIR)
        self.output_dir = Path(OUTPUT_DIR)
        self.temp_dir.mkdir(exist_ok=True)
        self.output_dir.mkdir(exist_ok=True)

    def download_video(self, url: str) -> str:
        """
        Baixa vídeo de uma URL
        """
        try:
            import urllib.request

            filename = f"{self.temp_dir}/reference_video.mp4"
            print(f"📥 Baixando vídeo de {url}...")
            urllib.request.urlretrieve(url, filename)
            print(f"✅ Vídeo baixado: {filename}")
            return filename
        except Exception as e:
            print(f"❌ Erro ao baixar vídeo: {e}")
            return None

    def apply_neon_effect(self, clip, color: tuple = (0, 255, 255)) -> VideoFileClip:
        """
        Aplica efeito neon (glow) a um clip de vídeo
        """
        print("✨ Aplicando efeito neon...")

        def add_neon(get_frame, t):
            frame = get_frame(t)
            # Converte para HSV
            hsv = cv2.cvtColor(frame, cv2.COLOR_RGB2HSV)
            # Aumenta saturação e brilho para efeito neon
            hsv[:, :, 1] = cv2.multiply(hsv[:, :, 1], 1.5)
            hsv[:, :, 2] = cv2.multiply(hsv[:, :, 2], 1.3)
            # Converte de volta para RGB
            return cv2.cvtColor(hsv, cv2.COLOR_HSV2RGB)

        return clip.fl(add_neon)

    def apply_cinematic_transition(
        self, clip1: VideoFileClip, clip2: VideoFileClip, duration: float = 1.0
    ) -> VideoFileClip:
        """
        Aplica transição cinemática entre dois clips
        """
        print(f"🎬 Aplicando transição cinemática ({duration}s)...")

        # Fade transition
        clip1 = clip1.set_duration(clip1.duration - duration / 2)
        clip2_start = clip2.set_start(clip1.duration)

        return concatenate_videoclips([clip1, clip2_start])

    def apply_zoom_pan(
        self, clip: VideoFileClip, zoom_factor: float = 1.2, direction: str = "in"
    ) -> VideoFileClip:
        """
        Aplica zoom e pan (movement) a um clip
        """
        print(f"🔍 Aplicando zoom {direction}...")

        def zoom_effect(get_frame, t):
            frame = get_frame(t)
            h, w = frame.shape[:2]

            # Calcula o zoom baseado no tempo
            progress = min(t / clip.duration, 1.0)
            if direction == "in":
                z = 1.0 + (zoom_factor - 1.0) * progress
            else:
                z = zoom_factor - (zoom_factor - 1.0) * progress

            # Aplica zoom
            M = cv2.getRotationMatrix2D((w / 2, h / 2), 0, z)
            zoomed = cv2.warpAffine(frame, M, (w, h))

            return zoomed

        return clip.fl(zoom_effect)

    def create_timelapse(
        self,
        clip: VideoFileClip,
        speed_factor: int = 10,
        duration: float = 5,
    ) -> VideoFileClip:
        """
        Cria timelapse de um vídeo ou sequência
        """
        print(f"⏩ Criando timelapse (velocidade: {speed_factor}x)...")

        # Acelera o vídeo
        timelapse = clip.speedx(speed_factor)

        # Recorta para duração desejada
        if timelapse.duration > duration:
            timelapse = timelapse.subclip(0, duration)

        return timelapse

    def apply_color_grade(
        self, clip: VideoFileClip, grade: str = "warm"
    ) -> VideoFileClip:
        """
        Aplica correção de cores (color grading)
        """
        print(f"🎨 Aplicando color grade: {grade}...")

        color_luts = {
            "warm": {
                "r": 1.1,
                "g": 0.95,
                "b": 0.8,
            },
            "cool": {
                "r": 0.8,
                "g": 0.95,
                "b": 1.1,
            },
            "cinematic": {
                "r": 1.05,
                "g": 1.0,
                "b": 0.95,
            },
        }

        lut = color_luts.get(grade, color_luts["warm"])

        def apply_lut(get_frame, t):
            frame = get_frame(t).astype(np.float32) / 255.0
            frame[:, :, 0] *= lut["r"]  # Red
            frame[:, :, 1] *= lut["g"]  # Green
            frame[:, :, 2] *= lut["b"]  # Blue
            return np.clip(frame * 255, 0, 255).astype(np.uint8)

        return clip.fl(apply_lut)

    def composite_clips(
        self, clips: list, duration: float = 30, output_path: str = None
    ) -> str:
        """
        Compõe múltiplos clips em um vídeo final
        """
        print("🎞️ Compondo vídeo final...")

        if not output_path:
            output_path = str(self.output_dir / "output_video.mp4")

        # Concatena clips
        final_clip = concatenate_videoclips(clips)

        # Redimensiona para 1920x1080
        final_clip = final_clip.resize(height=1080)

        # Exporta
        final_clip.write_videofile(
            output_path, fps=24, codec="libx264", audio_codec="aac"
        )

        print(f"✅ Vídeo salvo em: {output_path}")
        return output_path

    def process_from_reference(
        self, reference_url: str, instructions: str, output_name: str = "resultado"
    ) -> str:
        """
        Pipeline completo: baixa vídeo, analisa e aplica efeitos
        """
        print(
            "\n" + "=" * 50
        )
        print("🎬 INICIANDO PROCESSAMENTO DE VÍDEO")
        print("=" * 50)

        # 1. Download
        video_path = self.download_video(reference_url)
        if not video_path:
            return None

        # 2. Carrega vídeo
        try:
            clip = VideoFileClip(video_path)
            print(f"✅ Vídeo carregado: {clip.duration}s")
        except Exception as e:
            print(f"❌ Erro ao carregar vídeo: {e}")
            return None

        # 3. Aplica efeitos básicos
        processed_clip = clip

        # Aplica color grade
        processed_clip = self.apply_color_grade(processed_clip, "cinematic")

        # Aplica neon
        processed_clip = self.apply_neon_effect(processed_clip)

        # Aplica zoom se vídeo é curto
        if clip.duration < 10:
            processed_clip = self.apply_zoom_pan(processed_clip, zoom_factor=1.1)

        # 4. Salva output
        output_path = str(self.output_dir / f"{output_name}.mp4")

        try:
            processed_clip.write_videofile(
                output_path,
                fps=24,
                codec="libx264",
                audio_codec="aac",
                verbose=False,
                logger=None,
            )
            print(f"✅ Vídeo processado salvo: {output_path}")
            return output_path
        except Exception as e:
            print(f"❌ Erro ao processar vídeo: {e}")
            return None
