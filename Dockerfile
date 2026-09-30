# One image definition for the Node services. Pick a target:
#   docker build --target app .      the site and app (Next.js server, port 4000)
#   docker build --target worker .   background worker
#   docker build --target migrate .  runs database migrations, then exits
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY . .
RUN pnpm install --frozen-lockfile

FROM deps AS build
# NEXT_PUBLIC_* values are inlined at build time.
ARG NEXT_PUBLIC_SITE_URL=http://localhost:4000
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
RUN pnpm turbo run build --filter=@ge/app

FROM build AS app
ENV NODE_ENV=production
EXPOSE 4000
CMD ["pnpm", "--filter", "@ge/app", "start"]

FROM deps AS worker
ENV NODE_ENV=production
CMD ["pnpm", "--filter", "@ge/worker", "start"]

FROM deps AS migrate
CMD ["pnpm", "--filter", "@ge/db", "db:migrate"]
