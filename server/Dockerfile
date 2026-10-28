FROM node:24-alpine
WORKDIR /app
COPY package.json ./
COPY src ./src
COPY server ./server
USER node
ENV HOST=0.0.0.0 PORT=3491 LEADERBOARD_DB=/data/leaderboard.sqlite
CMD ["node", "server/index.mjs"]
