# Stage 1: build
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and compile
COPY tsconfig.json ./
COPY src/ src/
RUN npm run build

# Stage 2: production
FROM node:18-alpine AS runner
WORKDIR /app

# Copy only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled files
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/index.js"] 