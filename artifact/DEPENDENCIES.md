# Verified foundation dependencies

Application versions are exact in `package.json` and resolved in the committed npm lockfile. Node 26.13.0 uses a digest-pinned Debian-based Docker image. TypeScript 5.9.3 is retained because the current TypeScript ESLint parser supports TypeScript below 6.1; the registry's latest TypeScript major is not adopted blindly.

## Lint compatibility and advisory mitigation

The initial dependency check found that `eslint-config-next` pulls React/import/accessibility plugins declaring ESLint support only through v9, while v9 now reports end-of-support. The scaffold instead uses supported ESLint 10 with the compatible official Next.js plugin and TypeScript ESLint flat configuration. This is not the full `eslint-config-next` preset; browser/accessibility and React-specific checks must be reviewed as the interface is implemented.

The current ESLint and TypeScript parser dependency ranges resolve Minimatch 10, which npm reports under advisory `GHSA-g3hv-75wg-m249`. Scoped overrides select patched Minimatch 11.0.7 only for ESLint, its config-array utility, and the TypeScript parser. This is a deliberate major-version override: verify linting, clean install, dependency tree, and audit after dependency changes. Do not run `npm audit fix --force` or use legacy peer-dependency bypasses automatically.

Revisit these overrides when upstream ranges accept the fixed release. No application runtime dependency is overridden.

## Test-tool advisories

Installing the selected current Jest 30 runner adds transitive advisories in Glob/Minimatch and Deepmerge: the current full audit reports 19 low/moderate findings through the test toolchain. The earlier lint-only install was clean; that is not a claim that the complete development tree is advisory-free. Do not hide these findings or downgrade automatically to the obsolete Jest version suggested by `npm audit fix --force`.

The production-only audit is checked separately. Review upstream-compatible fixes as part of dependency maintenance; the test runner operates only on this trusted local repository and isolated test fixtures, not untrusted uploaded test/configuration files. No arbitrary Glob or Deepmerge major override has been imposed on Jest merely to silence the audit count.
