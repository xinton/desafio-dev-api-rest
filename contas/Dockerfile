# ---- Base Stage ----
FROM node:20-alpine AS base
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install

# ---- Build Stage ----
FROM base AS build
WORKDIR /usr/src/app
COPY --from=base /usr/src/app/node_modules ./node_modules
COPY . .
# Generate Prisma Client
RUN npm run prisma:generate
# Build the application
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine AS production
WORKDIR /usr/src/app
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/package*.json ./
# Copy Prisma schema and generated client for runtime
COPY --from=build /usr/src/app/prisma ./prisma
EXPOSE 3000
CMD ["npm", "run", "start:prod"]