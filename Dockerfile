# Nos mots mémoriaux — une seule image : le site construit + le serveur du musée.
# Construire : docker compose build   (voir DEPLOIEMENT.md)

# 1. le site (mode « en ligne » : il parle au serveur à l'adresse /api)
FROM node:22-alpine AS site
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY index.html vite.config.ts tsconfig.json .env.en-ligne ./
COPY public public
COPY src src
ARG VITE_DEMO=
ENV VITE_DEMO=$VITE_DEMO
RUN npm run build:en-ligne

# 2. le serveur (il partage les limites du musée avec le site : src/data/types.ts)
FROM node:22-alpine AS serveur
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY server/tsconfig.json ./
COPY server/src src
COPY server/migrations migrations
COPY src/data/types.ts /app/src/data/types.ts
RUN npm run build && npm prune --omit=dev

# 3. l'image finale, légère
FROM node:22-alpine
ENV NODE_ENV=production \
    PORT=8787 \
    SITE_DOSSIER=/app/site \
    STOCKAGE_DOSSIER=/donnees/fichiers
WORKDIR /app
COPY --from=serveur /app/server/package.json ./
COPY --from=serveur /app/server/node_modules node_modules
COPY --from=serveur /app/server/dist dist
COPY --from=serveur /app/server/migrations migrations
COPY --from=site /app/dist site
RUN mkdir -p /donnees/fichiers && chown -R node:node /donnees
USER node
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD wget -qO- http://127.0.0.1:8787/api/sante || exit 1
CMD ["node", "dist/index.js"]
