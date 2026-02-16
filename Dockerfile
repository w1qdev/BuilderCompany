# Minimal Dockerfile — Next.js is built on the host, only artifacts are copied
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=384"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    apk add --no-cache wget

# Copy pre-built standalone output (already includes @prisma/client, next, etc.)
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY public/robots.txt ./public/robots.txt
COPY prisma ./prisma
COPY server.js ./server.js

# .next/standalone doesn't include socket.io — copy it with its deps
COPY node_modules/socket.io ./node_modules/socket.io
COPY node_modules/socket.io-adapter ./node_modules/socket.io-adapter
COPY node_modules/socket.io-parser ./node_modules/socket.io-parser
COPY node_modules/engine.io ./node_modules/engine.io
COPY node_modules/engine.io-parser ./node_modules/engine.io-parser
COPY node_modules/ws ./node_modules/ws
COPY node_modules/cors ./node_modules/cors

# Create directories (public/images is mounted as volume)
RUN mkdir -p /app/uploads /app/data /app/public/images && \
    chown -R nextjs:nodejs /app/uploads /app/data /app/public

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
