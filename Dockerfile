# Minimal Dockerfile — Next.js is built on the host, only artifacts are copied
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=384"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    apk add --no-cache wget

# Copy pre-built artifacts
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY public/robots.txt ./public/robots.txt
COPY prisma ./prisma
COPY server.js ./server.js

# Copy full node_modules (built on host — no npm install inside Docker)
COPY node_modules ./node_modules

# Create directories (public/images is mounted as volume)
RUN mkdir -p /app/uploads /app/data /app/public/images && \
    chown -R nextjs:nodejs /app/uploads /app/data /app/public

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
