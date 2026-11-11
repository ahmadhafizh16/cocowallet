# Verified foundation dependencies

Application versions are exact in `package.json` and resolved in the committed npm lockfile. Node 26.13.0 uses a digest-pinned Debian-based Docker image. TypeScript 5.9.3 is retained because the current TypeScript ESLint parser supports TypeScript below 6.1; the registry's latest TypeScript major is not adopted blindly.

The development image includes Python, Make, and G++ because a clean `npm ci` rebuilds `better-sqlite3`; successful incremental installation is not sufficient proof of reproducibility. The image points node-gyp at the headers already included with the pinned Node installation.

## Lint compatibility and advisory mitigation

The initial dependency check found that `eslint-config-next` pulls React/import/accessibility plugins declaring ESLint support only through v9, while v9 now reports end-of-support. The scaffold instead uses supported ESLint 10 with the compatible official Next.js plugin and TypeScript ESLint flat configuration. This is not the full `eslint-config-next` preset; browser/accessibility and React-specific checks must be reviewed as the interface is implemented.

The current ESLint and TypeScript parser dependency ranges resolve Minimatch 10, which npm reports under advisory `GHSA-g3hv-75wg-m249`. Scoped overrides select patched Minimatch 11.0.7 only for ESLint, its config-array utility, and the TypeScript parser. This is a deliberate major-version override: verify linting, clean install, dependency tree, and audit after dependency changes. Do not run `npm audit fix --force` or use legacy peer-dependency bypasses automatically.

Revisit these overrides when upstream ranges accept the fixed release. No application runtime dependency is overridden.

## Test-tool advisories

Installing the selected current Jest 30 runner adds transitive advisories in Glob/Minimatch and Deepmerge: the current full audit reports 19 low/moderate findings through the test toolchain. The earlier lint-only install was clean; that is not a claim that the complete development tree is advisory-free. Do not hide these findings or downgrade automatically to the obsolete Jest version suggested by `npm audit fix --force`.

Adding the stable Drizzle migration CLI increases the current complete development audit to 23 findings (3 low, 20 moderate), including its transitive Esbuild tooling. The production-only audit is clean. Review upstream-compatible fixes as part of dependency maintenance; test/migration tools operate only on the trusted local repository and isolated fixtures, not untrusted uploaded configuration or public development-server inputs. No arbitrary Glob or Deepmerge major override has been imposed on Jest merely to silence the audit count.
