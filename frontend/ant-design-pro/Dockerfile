# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS builder

ENV HUSKY=0
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=10 \
    CMD wget -q -O /dev/null http://127.0.0.1/nginx-health || exit 1
