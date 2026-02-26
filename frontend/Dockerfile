# Multi-stage build for React frontend (Vite)
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install

# Build-time API URL can be overridden: docker build --build-arg VITE_API_URL=http://localhost:4000 .
ARG VITE_API_URL=http://localhost:4000
ENV VITE_API_URL=$VITE_API_URL

COPY tsconfig.json ./tsconfig.json
COPY index.html ./index.html
COPY public ./public
COPY src ./src

RUN npm run build

# Serve with nginx
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
# Basic SPA fallback
RUN printf 'server {\\n  listen 80;\\n  root /usr/share/nginx/html;\\n  include /etc/nginx/mime.types;\\n  location / { try_files $uri /index.html; }\\n  location /assets { access_log off; expires 1y; add_header Cache-Control \"public\"; }\\n}\\n' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
