#!/usr/bin/env node
/**
 * Rewrite each package's lcov `SF:` paths from package-relative
 * (`src/DataTable.tsx`) to repo-relative (`packages/<pkg>/src/DataTable.tsx`).
 *
 * Vitest emits package-relative paths. In a monorepo where several
 * packages share file names (every adapter has `src/DataTable.tsx`),
 * SonarQube cannot disambiguate them and silently drops their coverage.
 * Repo-relative paths are unique, so Sonar maps every file correctly.
 *
 * Run after `pnpm test:coverage` and before `sonar-scanner`.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const packagesDir = join(process.cwd(), "packages");
let patched = 0;

for (const pkg of readdirSync(packagesDir)) {
  const lcovPath = join(packagesDir, pkg, "coverage", "lcov.info");
  if (!existsSync(lcovPath)) continue;

  const prefix = `packages/${pkg}/`;
  const original = readFileSync(lcovPath, "utf8");
  const rewritten = original.replace(/^SF:(?!packages\/)(.*)$/gm, (_, p) => `SF:${prefix}${p}`);

  if (rewritten !== original) {
    writeFileSync(lcovPath, rewritten, "utf8");
    patched += 1;
  }
}

console.log(`fix-lcov-paths: rewrote SF paths in ${patched} lcov file(s).`);
