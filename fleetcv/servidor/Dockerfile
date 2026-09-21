# Uma imagem para pôr o FleetCV a trabalhar onde houver Docker.
# Constrói-se a partir da RAIZ do repositório, porque a aplicação
# vive na pasta ao lado:
#
#   docker build -f fleetcv/servidor/Dockerfile -t fleetcv .
#   docker run -p 8080:8080 -v fleetcv-dados:/dados fleetcv
#
# Não há nada a instalar: o servidor só usa o que já vem no Node.
FROM node:22-alpine

WORKDIR /app
COPY fleetcv/servidor/servidor.mjs ./
COPY fleetcv/paineis/fleetcv.html ./

# Os dados ficam aqui. É este sítio que TEM de ser guardado: se se
# perder, perdem-se os turnos, os percursos e as fotografias todas.
RUN mkdir -p /dados
ENV FLEETCV_DADOS=/dados/dados.db
VOLUME /dados

ENV PORT=8080
EXPOSE 8080
ENV NODE_NO_WARNINGS=1

CMD ["node", "servidor.mjs"]
