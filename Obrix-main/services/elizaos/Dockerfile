FROM oven/bun:1.2
WORKDIR /app
COPY package.json ./
RUN bun install
COPY . .
ENV NODE_ENV=production
ENV PORT=3002
EXPOSE 3002
CMD ["bun", "run", "start"]
