# 🎥 Agente de Vídeos Imobiliários com IA

Sistema inteligente que analisa vídeos de referência e cria novos vídeos imobiliários com efeitos profissionais usando Claude API.

## ✨ Funcionalidades

- **Análise de Vídeos**: Analisa vídeos de referência via link
- **Geração de Instruções**: Claude gera instruções personalizadas para replicar o estilo
- **Efeitos Profissionais**:
  - ✨ Neon glow effects
  - 🎬 Transições cinemáticas
  - 🔍 Zoom e pan
  - ⏩ Timelapse
  - 🎨 Color grading
  - 📸 Fotomontagem
  - 💫 Animações personalizadas

- **Estilos Disponíveis**: Luxury, Modern, Minimalist

## 🚀 Setup Rápido

### 1. Configuração Inicial
```bash
# Cria ambiente virtual
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Instala dependências
pip install -r requirements.txt

# Copia variáveis de ambiente
cp .env.example .env
```

### 2. Configurar API Key
```bash
# Edita o ficheiro .env
nano .env
# ou no Windows: notepad .env

# Adiciona tua API Key da Anthropic:
# ANTHROPIC_API_KEY=sk-ant-xxxxx
```

Obtém tua chave em: https://console.anthropic.com/

### 3. Instalar FFmpeg (se necessário)

**Linux:**
```bash
sudo apt-get install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
Descarrega de: https://ffmpeg.org/download.html

## 💡 Como Usar

### Forma Simples (Via Chat)

```python
from agent import criar_video_imobiliario

# Cria um vídeo imobiliário
resultado = criar_video_imobiliario(
    video_url="https://exemplo.com/video.mp4",
    descricao="Apartamento de luxo com piscina, 3 quartos, vista para o mar",
    estilo="luxury"
)

print(resultado)
```

### Forma Avançada

```python
from agent import RealEstateVideoAgent

# Inicializa agente
agent = RealEstateVideoAgent()

# Processa vídeo
resultado = agent.process_video(
    reference_url="https://exemplo.com/video.mp4",
    briefing="Propriedade de luxo no topo da colina"
)

# Acessa resultados
print("Status:", resultado['status'])
print("Vídeo criado:", resultado['output_video'])
print("Análise:", resultado['reference_analysis'])
print("Instruções:", resultado['instructions'])
```

## 📝 Exemplo de Uso Completo

```python
from agent import criar_video_imobiliario

# Dados do imóvel
video_referencia = "https://my-storage.com/reference_video.mp4"
descricao_imovel = """
Apartamento penthouses na Avenida Paulista
- 4 quartos suítes
- Piscina privada na cobertura
- Home theater
- Garagem para 4 carros
- Vista 360° da cidade
"""

# Cria o vídeo
resultado = criar_video_imobiliario(
    video_url=video_referencia,
    descricao=descricao_imovel,
    estilo="luxury"
)

# O vídeo processado estará em: output_videos/video_imobiliario.mp4
```

## 📁 Estrutura do Projeto

```
agente-videos-imobiliarios/
├── agent.py              # Agente principal
├── video_analyzer.py     # Análise com Claude
├── video_processor.py    # Processamento de vídeos
├── config.py            # Configurações
├── requirements.txt     # Dependências
├── .env                 # Variáveis de ambiente (não commit)
├── .env.example         # Template do .env
├── .gitignore          # Git ignore
└── README.md           # Este ficheiro
```

## 🎨 Estilos Disponíveis

### Luxury
- Paleta: Dourado, quente
- Transições: Lentas e suaves
- Neon: Gold (#FFD700)
- Ideal para: Propriedades de alta gama

### Modern
- Paleta: Azul frio, limpo
- Transições: Rápidas e precisas
- Neon: Cyan (#00D9FF)
- Ideal para: Propriedades contemporâneas

### Minimalist
- Paleta: Preto e branco com acentos
- Transições: Suaves dissolves
- Neon: Branco (#FFFFFF)
- Ideal para: Propriedades modernas/minimalistas

## 🔧 Troubleshooting

### "ANTHROPIC_API_KEY não configurada"
- Certifica-te que o ficheiro `.env` existe
- Verifica se tem `ANTHROPIC_API_KEY=sk-ant-xxxxx`

### Erro ao baixar vídeo
- Verifica se a URL é pública e acessível
- Alguns links podem exigir permissões

### FFmpeg não encontrado
- Instala FFmpeg para teu sistema operativo (ver instruções acima)
- Verifica PATH do sistema

### Memória insuficiente
- Reduz a qualidade de vídeo em config.py
- Processa vídeos mais curtos

## 📊 Fluxo de Funcionamento

1. **INPUT**: Envia URL do vídeo + descrição do imóvel
2. **ANÁLISE**: Claude analisa o vídeo de referência
3. **INSTRUÇÕES**: Gera instruções personalizadas
4. **PROCESSAMENTO**: Aplica efeitos e cria novo vídeo
5. **OUTPUT**: Vídeo processado salvo em `output_videos/`

## 📞 Suporte

Para problemas com:
- **Claude API**: https://console.anthropic.com/
- **FFmpeg**: https://ffmpeg.org/
- **MoviePy**: https://zulko.github.io/moviepy/

## 📄 Licença

MIT License - sinta-se livre para usar e modificar

---

**Versão**: 1.0.0
**Última atualização**: 2026-03-07
