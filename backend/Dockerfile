# ---- Base Node ----
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

RUN npx prisma generate

COPY . .

RUN npm run build 

# ---- Production Final Image ----
FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --only=production

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
