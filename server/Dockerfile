FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

RUN npx prisma generate

COPY . .

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

COPY package*.json ./
COPY prisma ./prisma/
COPY start.sh ./

RUN npm ci --only=production

RUN npx prisma generate

COPY --from=builder /app/dist ./dist

RUN chmod +x start.sh && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001

CMD ["./start.sh"]
