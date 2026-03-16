# Minimal Dockerfile for Max bot
FROM node:20-alpine
WORKDIR /app

# Copy bot compiled output and dependencies
COPY bot/package.json ./
RUN npm install --omit=dev --no-audit --no-fund && rm -rf /root/.npm

COPY bot/dist ./dist
COPY prisma ./prisma
RUN npm install --no-save prisma && npx prisma generate --schema=./prisma/schema.prisma && rm -rf /root/.npm

USER node

CMD ["node", "dist/index.js"]
