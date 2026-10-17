FROM node:18.18-alpine

COPY . /

# The corepack bundled with Node 18.18 can't verify current pnpm signatures; 0.33 is the last release supporting Node 18
RUN npm install --global corepack@0.33 && corepack enable && pnpm install --frozen-lockfile

EXPOSE 3000

ENTRYPOINT ["pnpm", "start"]
