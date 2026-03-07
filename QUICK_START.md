# ⚡ INÍCIO RÁPIDO

## 1️⃣ Configuração (1 minuto)

```bash
# Ativa o ambiente virtual
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

# Configura tua API Key
nano .env                 # Linux/Mac
# ou
notepad .env              # Windows

# Substitui isto:
ANTHROPIC_API_KEY=sk-ant-YOUR_API_KEY_HERE
# Por tua verdadeira chave de https://console.anthropic.com/
```

## 2️⃣ Usar o Agente

### Forma Simples (Recomendado)

```python
from agent import criar_video_imobiliario

resultado = criar_video_imobiliario(
    video_url="https://seu-video.mp4",
    descricao="Apartamento de luxo com piscina e vista para o mar",
    estilo="luxury"
)

print(f"Vídeo criado: {resultado['output_video']}")
```

### Ou via Linha de Comando

```bash
python test_agent.py
```

## 3️⃣ Exemplos Práticos

### Exemplo 1: Luxury Penthouse
```python
from agent import criar_video_imobiliario

resultado = criar_video_imobiliario(
    video_url="https://example.com/penthouse.mp4",
    descricao="Apartamento de luxo no topo da colina com piscina privada, 4 quartos, vista 360°",
    estilo="luxury"
)
```

### Exemplo 2: Modern Apartment
```python
resultado = criar_video_imobiliario(
    video_url="https://example.com/modern.mp4",
    descricao="Apartamento moderno no centro da cidade, 2 quartos, cozinha open, garagem",
    estilo="modern"
)
```

### Exemplo 3: Minimalist Design
```python
resultado = criar_video_imobiliario(
    video_url="https://example.com/minimal.mp4",
    descricao="Casa minimalista com 3 quartos, design escandinavo, jardim zen",
    estilo="minimalist"
)
```

## 📊 O que Acontece?

```
1. 🎬 Analisa o vídeo de referência
   ↓
2. 📝 Claude gera instruções personalizadas
   ↓
3. ✨ Aplica efeitos (neon, zoom, color grade, etc)
   ↓
4. 📹 Cria novo vídeo em output_videos/
```

## 🎯 Dicas Importantes

✅ **URLs recomendadas**:
- YouTube (vídeos públicos)
- Vimeo
- Google Drive (links públicos)
- S3 ou hospedagem própria

✅ **Descrições eficazes**:
- Seja específico (tipo, localização, características)
- Inclua números (quartos, metros quadrados, etc)
- Mencione diferenciais (vista, piscina, garagem)

✅ **Escolha o estilo certo**:
- **luxury**: propriedades premium, ouro, elegância
- **modern**: contemporâneo, tecnológico, minimalista
- **minimalist**: limpo, zen, design escandinavo

## 📁 Arquivos Criados

```
✅ agent.py              - Agente principal
✅ video_analyzer.py     - Análise com Claude
✅ video_processor.py    - Processamento de efeitos
✅ config.py            - Configurações
✅ requirements.txt     - Dependências (instaladas)
✅ .env                 - Variáveis de ambiente
✅ test_agent.py        - Script de teste
✅ README.md            - Documentação completa
```

## 🚀 Pronto?

Tudo está configurado! Só precisa de:
1. Adicionar tua API Key em `.env`
2. Enviar uma URL de vídeo
3. Descrever o imóvel
4. Deixar o agente trabalhar!

## ❓ Problemas?

- **"API Key inválida"**: Verifica o ficheiro `.env`
- **"URL não encontrada"**: Certifica-te que o link é público
- **"Memória insuficiente"**: Usa vídeos mais curtos

---

🎉 **Agora podes criar vídeos imobiliários incríveis!**
