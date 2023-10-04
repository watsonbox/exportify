FROM node:18.18-alpine

COPY . /

RUN yarn install

EXPOSE 3000

ENTRYPOINT ["yarn", "start"]
