FROM nginx:1.27-alpine
LABEL authors="namuk"

COPY default.conf /etc/nginx/conf.d/default.conf

COPY html      /usr/share/nginx/html/html
COPY css       /usr/share/nginx/html/css
COPY js        /usr/share/nginx/html/js
COPY api       /usr/share/nginx/html/api
COPY component /usr/share/nginx/html/component
COPY utils     /usr/share/nginx/html/utils
COPY public    /usr/share/nginx/html/public

COPY docker-entrypoint.sh /docker-entrypoint.d/99-config.sh
RUN chmod +x /docker-entrypoint.d/99-config.sh
EXPOSE 80