"""
Análise de vídeos imobiliários.
A análise inteligente é feita pelo Claude Code no chat.
Este módulo trata apenas da parte técnica (extração de frames, metadata).
"""

import cv2
import json
import requests
from pathlib import Path
from config import TEMP_DIR


class VideoAnalyzer:
    def __init__(self):
        self.temp_dir = Path(TEMP_DIR)
        self.temp_dir.mkdir(exist_ok=True)

    def get_video_metadata(self, video_path: str) -> dict:
        """
        Extrai metadata técnica do vídeo (duração, resolução, FPS, etc.)
        Não precisa de API Key - usa OpenCV localmente.
        """
        cap = cv2.VideoCapture(video_path)

        if not cap.isOpened():
            return {"error": "Não foi possível abrir o vídeo"}

        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        duration = frame_count / fps if fps > 0 else 0

        cap.release()

        return {
            "fps": round(fps, 2),
            "frame_count": frame_count,
            "width": width,
            "height": height,
            "duration_seconds": round(duration, 2),
            "resolution": f"{width}x{height}",
            "aspect_ratio": round(width / height, 2) if height > 0 else 0,
        }

    def extract_key_frames(self, video_path: str, num_frames: int = 5) -> list:
        """
        Extrai frames-chave do vídeo para análise visual no chat.
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return []

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        frame_indices = [
            int(total_frames * i / num_frames) for i in range(num_frames)
        ]

        frames_saved = []
        for idx in frame_indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
            ret, frame = cap.read()
            if ret:
                frame_path = str(self.temp_dir / f"frame_{idx}.jpg")
                cv2.imwrite(frame_path, frame)
                frames_saved.append(frame_path)

        cap.release()
        return frames_saved

    def validate_video_url(self, url: str) -> bool:
        """Verifica se a URL do vídeo é acessível"""
        try:
            response = requests.head(url, timeout=10, allow_redirects=True)
            return response.status_code < 400
        except Exception as e:
            print(f"❌ URL inválida ou inacessível: {e}")
            return False

    def analyze_for_chat(self, video_path: str) -> str:
        """
        Prepara um relatório técnico do vídeo para ser apresentado no chat,
        onde o Claude Code fará a análise inteligente.
        """
        metadata = self.get_video_metadata(video_path)
        frames = self.extract_key_frames(video_path, num_frames=3)

        report = f"""
📊 RELATÓRIO TÉCNICO DO VÍDEO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📐 Resolução: {metadata.get('resolution', 'N/A')}
⏱️  Duração: {metadata.get('duration_seconds', 0)}s
🎞️  FPS: {metadata.get('fps', 0)}
🖼️  Total de frames: {metadata.get('frame_count', 0)}
📏 Aspect ratio: {metadata.get('aspect_ratio', 0)}

🖼️  Frames extraídos: {len(frames)} frames
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
        return report
