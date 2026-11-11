FROM node:26.13.0-bookworm-slim@sha256:add5c17c14752c54d2f3d519ec46a3815684d41c33f198bcb09fb998f7dcbf68 AS development

ENV NEXT_TELEMETRY_DISABLED=1 \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    npm_package_config_node_gyp_nodedir=/usr/local

# npm ci rebuilds native addons; do not rely on a previous incremental install.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN mkdir -p /app/node_modules /app/.next /app/data \
    && chown -R node:node /app

USER node
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM development AS browser-tests
USER root
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/playwright
RUN npm exec --yes --package=@playwright/test@1.65.0 -- playwright install --with-deps chromium
USER node
CMD ["npm", "run", "test:e2e"]
