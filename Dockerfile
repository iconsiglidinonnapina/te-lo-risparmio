# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Production stage ----
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache dumb-init

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

# Run as non-root user for security
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup
USER appuser

EXPOSE 3000

# Use dumb-init to handle signals properly
CMD ["dumb-init", "node", "dist/server/index.js"]
