FROM node:22-alpine AS builder

WORKDIR /app

ARG NPM_TOKEN
ARG VITE_API_URL

COPY package.json package-lock.json ./
RUN echo "@bopacorp:registry=https://npm.pkg.github.com" > .npmrc && \
    echo "//npm.pkg.github.com/:_authToken=${NPM_TOKEN}" >> .npmrc && \
    npm ci && \
    rm -f .npmrc

COPY . .

RUN npm run build

FROM node:22-alpine

WORKDIR /app

RUN npm install -g serve@latest

COPY --from=builder /app/dist dist/

EXPOSE 80

CMD ["serve", "-s", "dist", "-l", "80"]
