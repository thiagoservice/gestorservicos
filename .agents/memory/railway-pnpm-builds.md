---
name: Railway pnpm dependency builds
description: Production Docker builds require pnpm 11-compatible script approvals.
---

Use `allowBuilds` rather than the removed `onlyBuiltDependencies` setting when the production image installs dependencies with pnpm 11. Keep the Docker pnpm version pinned instead of using `latest`.

**Why:** pnpm 11 removes the older setting and fails strict production installs with `ERR_PNPM_IGNORED_BUILDS`, including trusted packages such as esbuild.

**How to apply:** When changing package-manager versions or production dependencies with install scripts, update the explicit `allowBuilds` map and reproduce the full Docker build locally before pushing.