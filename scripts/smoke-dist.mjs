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

/**
 * Packages whose built entries must carry the `"use client"` banner, and the
 * one that must not.
 *
 * Every hook-bearing entry needs the directive or a Next.js App Router build
 * fails on the first `useState` with an error that points at the application
 * rather than at us. `@adapttable/i18n` is the deliberate exception: it is
 * plain data and pure functions, so leaving the directive off is what keeps it
 * importable from a server component.
 */
function clientDirectiveExpectation(pkg) {
  return pkg === "i18n" ? "absent" : "present";
}

/** Does this built file open with the `"use client"` directive? */
function hasClientDirective(file) {
  return /^\s*["']use client["']/.test(
    readFileSync(file, "utf8").slice(0, 200)
  );
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

  // The client-boundary directive: present on everything that ships hooks,
  // deliberately absent on the one package meant to run on the server.
  const expectation = clientDirectiveExpectation(pkg);
  const runtimeEntries = targets
    .filter((target) => /\.(js|cjs|mjs)$/.test(target))
    .map((target) => join(pkgDir, target.replace(/^\.\//, "")))
    .filter((file) => existsSync(file));

  const wrong = runtimeEntries.filter(
    (file) => hasClientDirective(file) !== (expectation === "present")
  );
  if (wrong.length > 0) {
    failures += 1;
    console.error(
      `✗ @adapttable/${shortName}: "use client" should be ${expectation} on:\n  ` +
        wrong.map((file) => file.replace(pkgDir + "/", "")).join("\n  ")
    );
  }
}

if (failures > 0) {
  console.error(`\nsmoke-dist: ${failures} package(s) failed.`);
  process.exit(1);
}
console.log("\nsmoke-dist: all library package entrypoints built.");
