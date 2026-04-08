FROM node:22-bookworm

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm install

RUN npm run prisma:generate

COPY tsconfig.json prisma.config.ts ./
COPY src ./src
COPY scripts ./scripts
RUN npm run build

EXPOSE 3001

RUN chmod +x ./scripts/docker-entrypoint.sh

CMD ["npm", "run", "start:docker"]
