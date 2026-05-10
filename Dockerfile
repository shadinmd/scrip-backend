FROM oven/bun:latest AS base
WORKDIR /usr/src/app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install

# Copy source code
COPY . .

# Exposure port
EXPOSE 8000

# Run the app
CMD ["bun", "run", "index.ts"]
