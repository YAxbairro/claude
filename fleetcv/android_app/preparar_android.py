#!/usr/bin/env python3
"""Acrescenta ao AndroidManifest as permissões que a app precisa.

O esqueleto Android é gerado por `flutter create` na compilação, e não fica no
repositório: é código de plataforma que ninguém edita à mão. Este script é o
único sítio onde as permissões são decididas, para ficarem à vista.
"""
import pathlib
import sys

PERMISSOES = [
    # o percurso, que é a razão de existir desta app
    "android.permission.ACCESS_FINE_LOCATION",
    "android.permission.ACCESS_COARSE_LOCATION",
    # gravar com o ecrã apagado — o que o navegador não faz
    "android.permission.ACCESS_BACKGROUND_LOCATION",
    "android.permission.FOREGROUND_SERVICE",
    "android.permission.FOREGROUND_SERVICE_LOCATION",
    "android.permission.WAKE_LOCK",
    # fotos do quadrante e dos talões
    "android.permission.CAMERA",
    # sincronização, quando houver rede
    "android.permission.INTERNET",
    "android.permission.ACCESS_NETWORK_STATE",
]

caminho = pathlib.Path("android/app/src/main/AndroidManifest.xml")
if not caminho.exists():
    sys.exit(f"não encontrei {caminho} — o esqueleto Android não foi gerado")

texto = caminho.read_text(encoding="utf-8")
novas = [p for p in PERMISSOES if f'android:name="{p}"' not in texto]
if novas:
    bloco = "\n".join(f'    <uses-permission android:name="{p}"/>' for p in novas)
    texto = texto.replace("<application", bloco + "\n    <application", 1)
    caminho.write_text(texto, encoding="utf-8")

print(f"permissões acrescentadas: {len(novas)}")
for p in novas:
    print("  ·", p.rsplit(".", 1)[-1])
