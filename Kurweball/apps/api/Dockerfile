# ─── Stage 1: Dependencies ───
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
RUN npm ci --workspace=apps/api --include-workspace-root

# ─── Stage 2: Build ───
FROM node:20-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY apps/api/ ./apps/api/
COPY package.json package-lock.json tsconfig.json ./

WORKDIR /app/apps/api
RUN npx prisma generate
RUN npx nest build

# ─── Stage 3: Production ───
FROM node:20-alpine AS production
WORKDIR /app

RUN apk add --no-cache dumb-init

COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/prisma ./prisma
COPY --from=build /app/apps/api/node_modules ./node_modules
COPY --from=build /app/apps/api/package.json ./
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY apps/api/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

ENV NODE_ENV=production
EXPOSE 3001

ENTRYPOINT ["dumb-init", "--"]
CMD ["./docker-entrypoint.sh"]
