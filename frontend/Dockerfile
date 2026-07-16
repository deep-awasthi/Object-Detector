FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --quiet

COPY . .
ARG VITE_API_URL=http://localhost:8080/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Runtime: serve with nginx ──
FROM nginx:alpine AS runtime

COPY --from=builder /app/dist /usr/share/nginx/html

# SPA routing — all routes go to index.html
RUN echo 'server { \
  listen 80; \
  location / { \
    root /usr/share/nginx/html; \
    try_files $uri $uri/ /index.html; \
  } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
