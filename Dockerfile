# Use official Bun image
FROM oven/bun:1.3.2 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Build stage (if needed in future)
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy dependencies and source code
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Expose the port the app runs on
EXPOSE 8080

# Run the application
CMD ["bun", "run", "src/index.ts"]
