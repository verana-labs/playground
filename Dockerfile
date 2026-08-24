FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p public
# NEXT_PUBLIC_* is inlined at build time, so a runtime container env var cannot
# reach it. Without this the "Support it on FIDES" CTA never renders in prod.
ARG NEXT_PUBLIC_FIDES_USECASE_URL
ENV NEXT_PUBLIC_FIDES_USECASE_URL=$NEXT_PUBLIC_FIDES_USECASE_URL
ARG NEXT_PUBLIC_BASE_PATH
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH
ARG PLAYGROUND_WALLETS
ENV PLAYGROUND_WALLETS=$PLAYGROUND_WALLETS
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ARG PLAYGROUND_WALLETS
ENV PLAYGROUND_WALLETS=$PLAYGROUND_WALLETS
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public/
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
