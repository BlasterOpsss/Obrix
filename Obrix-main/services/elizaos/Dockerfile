FROM oven/bun:1.2
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends procps nodejs npm && rm -rf /var/lib/apt/lists/*
COPY Obrix-main/services/elizaos/package.json ./package.json
RUN bun install
COPY Obrix-main/services/elizaos/ ./
ENV NODE_ENV=production
ENV PORT=3002
EXPOSE 3002
CMD ["bun", "run", "start"]
