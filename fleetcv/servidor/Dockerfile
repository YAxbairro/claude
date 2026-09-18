# Uma imagem para pôr o FleetCV a trabalhar em qualquer sítio que
# aceite Docker. Não há nada a instalar: o servidor só usa o que já
# vem dentro do Node.
FROM node:22-alpine

WORKDIR /app
COPY servidor.mjs fleetcv.html ./

# Os dados ficam aqui. Este é o sítio que TEM de ser guardado — se se
# perder, perdem-se os turnos todos.
RUN mkdir -p /dados
ENV FLEETCV_DADOS=/dados/dados.db
VOLUME /dados

ENV PORT=8080
EXPOSE 8080

# Sem isto o Node desliga a aviso da SQLite em cada arranque
ENV NODE_NO_WARNINGS=1

CMD ["node", "servidor.mjs"]
