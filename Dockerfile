FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node backend/ai ./backend/ai
COPY --chown=node:node backend/config ./backend/config
COPY --chown=node:node backend/controllers ./backend/controllers
COPY --chown=node:node backend/middleware ./backend/middleware
COPY --chown=node:node backend/models ./backend/models
COPY --chown=node:node backend/routes ./backend/routes
COPY --chown=node:node backend/utils ./backend/utils
COPY --chown=node:node backend/server.js ./backend/server.js
COPY --chown=node:node frontend ./frontend

RUN mkdir -p /app/backend/uploads && chown -R node:node /app/backend/uploads

USER node

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 5000) + '/api/health').then(response => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["npm", "start"]
