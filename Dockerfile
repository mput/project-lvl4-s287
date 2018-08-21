FROM node:10
RUN npm i -g npm
RUN apt-get install -yq libsqlite3-0
WORKDIR /code
