#Base Image
FROM nginx

#Copy build dapp into html root
COPY build /usr/share/nginx/html
