FROM node:18-alpine

WORKDIR /action

ADD dist .
ADD schema ./schema

ENTRYPOINT ["node", "/action/index.js"]