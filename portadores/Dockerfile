# ---- Base Stage ----
FROM node:20-alpine AS base
WORKDIR /usr/src/app
# Create a non-root user to run the application
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# ---- Dependencies Stage ----
FROM base AS dependencies
# Copy only package files
COPY package.json package-lock.json* ./
# Install all dependencies including devDependencies for the build step
RUN npm install

# ---- Build Stage ----
FROM dependencies AS builder
# Copy source code
COPY . .
# Generate Prisma Client
RUN npx prisma generate --schema=./prisma/schema.prisma
# Build the application
RUN npm run build

# ---- Production Stage ----
FROM base AS production
# Copy package files again for production dependencies
COPY package.json package-lock.json* ./
# Install only production dependencies
RUN npm ci --only=production

# Copy generated Prisma client from the builder stage
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
# Copy built artifacts from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Switch to the non-root user
USER appuser

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/main"]