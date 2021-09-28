FROM node:14
# ENV NODE_ENV=production

WORKDIR /usr/src/app

RUN yarn global add typescript prisma

COPY ["package.json", "yarn.lock", "./"]

# Install package
RUN yarn install

COPY ["prisma/schema.prisma", "./"]

RUN prisma generate

COPY . .

RUN tsc

EXPOSE 8080

# CMD ["node", "build/app.js"]

# ENTRYPOINT [ "docker-entrypoint.sh" ]

CMD ["./docker-entrypoint.sh"]
