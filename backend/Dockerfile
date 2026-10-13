FROM node:22-bookworm-slim

RUN apt-get update \
	&& apt-get install -y --no-install-recommends qpdf \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.js ./server.js
COPY lib ./lib

ENV NODE_ENV=production \
	HOST=0.0.0.0 \
	PORT=8787 \
	HOME=/tmp \
	TEMP_DIR=/tmp

USER node
EXPOSE 8787
CMD ["node", "server.js"]
