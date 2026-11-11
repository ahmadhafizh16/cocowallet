FROM node:26.13.0-bookworm-slim@sha256:add5c17c14752c54d2f3d519ec46a3815684d41c33f198bcb09fb998f7dcbf68 AS development

ENV NEXT_TELEMETRY_DISABLED=1 \
    NPM_CONFIG_UPDATE_NOTIFIER=false

WORKDIR /app
RUN mkdir -p /app/node_modules /app/.next /app/data \
    && chown -R node:node /app

USER node
EXPOSE 3000
CMD ["npm", "run", "dev"]
