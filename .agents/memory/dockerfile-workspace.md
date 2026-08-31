---
name: Dockerfile workspace packages
description: Every lib package.json must be listed explicitly in the Dockerfile deps and runner stages.
---

The Dockerfile has two stages that copy package.json files individually (deps and runner):

```dockerfile
COPY lib/db/package.json               lib/db/package.json
COPY lib/api-zod/package.json          lib/api-zod/package.json
...
```

**Rule:** Any new `lib/*` package added to the workspace MUST be listed in BOTH the `deps` stage (Stage 1) and the `runner` stage (Stage 4) of the Dockerfile. If a package.json is missing, pnpm fails with `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND` during `pnpm install`.

**Why:** pnpm resolves the full workspace graph even in production installs. A missing package.json means pnpm can't satisfy a `workspace:*` dependency, crashing the container on startup.

**Currently listed libs (both stages):**
- lib/db
- lib/api-spec
- lib/api-zod
- lib/api-client-react
- lib/replit-auth-web
