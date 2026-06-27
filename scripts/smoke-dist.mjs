#!/usr/bin/env node
/**
 * Pre-release smoke check for the built package artifacts.
 *
 * `publint` validates the `exports`/`types` map statically; this is a fast,
 * dependency-free post-build gate that asserts every entrypoint the
 * `exports` / `main` / `module` / `types` fields advertise actually exists
 * on disk under each library package's `dist/`. Catches the common
 * pre-release issue of an `exports` target pointing at a file the build
 * didn't emit (wrong path, missing dist, stale config) before packing.
 *
 * Run after `pnpm build`:
 *   node scripts/smoke-dist.mjs
 *
 * For the full install-into-a-fresh-app test (dual-package hazard, real
 * consumer resolution), pack with `pnpm pack` and install into a throwaway
 * Vite app manually — that step needs network + a temp project.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const PACKAGES_DIR = join(process.cwd(), "packages");

/** Library packages that ship a runtime `dist` (excludes the cli scaffolder). */
const LIB_PACKAGES = readdirSync(PACKAGES_DIR).filter((pkg) => pkg !== "cli");

function readPackageJson(pkg) {
  return JSON.parse(
    readFileSync(join(PACKAGES_DIR, pkg, "package.json"), "utf8")
  );
}

/** Flatten one `exports` condition entry into its string targets. */
function conditionTargets(entry, into) {
  if (typeof entry === "string") {
    into.add(entry);
    return;
  }
  if (!entry || typeof entry !== "object") return;
  for (const value of Object.values(entry)) {
    conditionTargets(value, into);
  }
}

/** Resolve every subpath target the `exports` map + legacy fields advertise. */
function exportTargets(pkgJson) {
  const targets = new Set();
  for (const entry of Object.values(pkgJson.exports ?? {})) {
    conditionTargets(entry, targets);
  }
  if (pkgJson.main) targets.add(pkgJson.main);
  if (pkgJson.module) targets.add(pkgJson.module);
  if (pkgJson.types) targets.add(pkgJson.types);
  return [...targets];
}

let failures = 0;

for (const pkg of LIB_PACKAGES) {
  const pkgDir = join(PACKAGES_DIR, pkg);
  const pkgJson = readPackageJson(pkg);
  if (!pkgJson.exports && !pkgJson.main) continue;

  const targets = exportTargets(pkgJson);
  const missing = targets.filter((target) => {
    const distPath = target.replace(/^\.\//, "");
    return !existsSync(join(pkgDir, distPath));
  });

  const shortName = pkg.replace(/^adapter-/, "");
  if (missing.length > 0) {
    failures += 1;
    console.error(
      `✗ @adapttable/${shortName}: build did not emit advertised targets:\n  ` +
        missing.join("\n  ")
    );
  } else {
    console.log(
      `✓ @adapttable/${shortName}: ${targets.length} export target(s) present`
    );
  }
}

if (failures > 0) {
  console.error(`\nsmoke-dist: ${failures} package(s) failed.`);
  process.exit(1);
}
console.log("\nsmoke-dist: all library package entrypoints built.");
