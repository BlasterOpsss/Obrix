FROM oven/bun:1.2
WORKDIR /app
COPY Obrix-main/services/elizaos/package.json ./package.json
RUN bun install
COPY Obrix-main/services/elizaos/ ./
ENV NODE_ENV=production
ENV PORT=3002
EXPOSE 3002
CMD ["bun", "run", "start"]
