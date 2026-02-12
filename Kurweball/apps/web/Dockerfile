# ─── Stage 1: Dependencies ───
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
RUN npm ci --workspace=apps/web --include-workspace-root

# ─── Stage 2: Build ───
FROM node:20-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY apps/web/ ./apps/web/
COPY package.json package-lock.json tsconfig.json ./

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

WORKDIR /app/apps/web
RUN npm run build

# ─── Stage 3: Production ───
FROM node:20-alpine AS production
WORKDIR /app

RUN apk add --no-cache dumb-init

COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/web/server.js"]
