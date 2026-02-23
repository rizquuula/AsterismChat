FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ENV VITE_API_URL=""

RUN npm run build

FROM nginx:alpine AS runner

RUN addgroup --system --gid 1002 nginx || true
RUN adduser --system --uid 1002 nginx || true

COPY --from=builder /app/dist /usr/share/nginx/html

RUN chown -R nginx:nginx /usr/share/nginx/html || true

COPY nginx/web.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
