# Contributing to AdaptTable

Thanks for your interest! AdaptTable aims to be a friendly, well-documented,
high-coverage codebase — a great place for a first open-source contribution.

## Getting started

```bash
git clone https://github.com/<owner>/adapttable.git
cd adapttable
pnpm install
pnpm check   # lint + typecheck + test (coverage) + build
```

## Repo layout

```
packages/
  core/             @adapttable/core       headless engine (zero UI imports)
  adapter-mantine/  @adapttable/mantine
  adapter-mui/      @adapttable/mui
  adapter-chakra/   @adapttable/chakra
  adapter-antd/     @adapttable/antd       Ant Design
  adapter-unstyled/ @adapttable/unstyled   Tailwind / shadcn
  i18n/             @adapttable/i18n
  cli/              @adapttable/cli
examples/           one runnable example per adapter
```

## Ground rules

- **`@adapttable/core` must stay headless** — no UI-kit, i18n-library, or
  router imports. All of that lives in adapters/presets.
- **TypeScript strict + full JSDoc** on every public symbol.
- **Tests are not optional.** We hold near-100% coverage. Add a primary
  `*.test.tsx` and, where branches remain, a `*.gaps.test.tsx`.
- **Zero code duplication** is the target (enforced via SonarQube).
- **Conventional commits** are appreciated; the title should read as an
  imperative ("Add X", "Fix Y").

## Definition of done (per package)

`builds + typechecks + lints + tests pass` with coverage thresholds met.

## Changesets

Every user-facing change needs a changeset:

```bash
pnpm changeset
```

Pick the affected packages and a semver bump; write a one-line summary that
will land in the changelog.

## Code of conduct

By participating you agree to uphold our [Code of Conduct](./CODE_OF_CONDUCT.md).
