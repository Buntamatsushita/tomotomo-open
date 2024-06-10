FROM node:20.12.2-alpine as build
WORKDIR /app
COPY ./app .
RUN npm install
RUN npm run build

FROM nginx:stable-alpine3.19
COPY --from=build /app/dist /usr/share/nginx/html
ADD nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
