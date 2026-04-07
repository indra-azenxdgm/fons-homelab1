FROM node:22-bookworm

WORKDIR /app

COPY package.json ./
RUN npm install

COPY prisma ./prisma
RUN npm run prisma:generate

COPY tsconfig.json prisma.config.ts ./
COPY src ./src
COPY scripts ./scripts
RUN npm run build

EXPOSE 3001

RUN chmod +x ./scripts/docker-entrypoint.sh

CMD ["npm", "run", "start:docker"]
