#stage 1
FROM node:latest as node
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build --prod

#stage 2
FROM nginx:stable-alpine
EXPOSE 8085
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=node /app/dist/kograf/browser /www
