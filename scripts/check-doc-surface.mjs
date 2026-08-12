#!/usr/bin/env node
/**
 * Every public export must be documented — api.md claims "the complete
 * public surface", and for most of v1 that was false: 181 of ~305 core
 * exports appeared in no doc page. Whole shipped modules (headless cell
 * editing, row grouping, the CSV pipeline) were invisible to anyone who
 * didn't read source, while versioning.md declared some of those same
 * names committed-stable. Nothing caught it: exports compile, tests
 * cover them, the site builds — only a reader notices, and readers leave.
 *
 * So the gate checks it: this script enumerates every package's real
 * export surface (via the TypeScript checker, so `export *`, aliases and
 * type-only exports all count) and fails on any name that no hand-written
 * doc page mentions. Exporting something IS documenting it — if a name
 * shouldn't be documented, it shouldn't be exported.
 *
 * `--report` prints the full per-package diff instead of failing fast —
 * useful when auditing rather than gating.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DOCS_DIR = join(REPO_ROOT, "docs");
/**
 * The reference page. Its title claims every export, so appearing on some
 * feature page is not enough — a reader who goes looking for a name goes here.
 */
const REFERENCE_PAGE = "api.md";

/**
 * Every published package's export surface. Core has three entries — the
 * app-facing API, the `/adapter` builder tier, and the `/xlsx` spreadsheet
 * writer — and all of them are audited. An entry that ships unaudited is
 * exactly how an undocumented export gets published.
 */
const SURFACES = readdirSync(join(REPO_ROOT, "packages"), {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()
  .flatMap((pkg) =>
    pkg === "core"
      ? [
          { label: "core", entry: join("core", "src", "index.ts") },
          { label: "core/adapter", entry: join("core", "src", "adapter.ts") },
          { label: "core/xlsx", entry: join("core", "src", "xlsx.ts") },
        ]
      : [{ label: pkg, entry: join(pkg, "src", "index.ts") }]
  );

const corpus = readdirSync(DOCS_DIR)
  .filter((name) => name.endsWith(".md"))
  .map((name) => readFileSync(join(DOCS_DIR, name), "utf8"))
  .join("\n");

const reference = readFileSync(join(DOCS_DIR, REFERENCE_PAGE), "utf8");

/** Word-boundary presence: `SortLevel` must not match inside `SortLevels`. */
function mentions(text, name) {
  const escaped = name.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![\\w$])${escaped}(?![\\w$])`).test(text);
}

/** Somewhere under docs/ — a name shown working on its feature page. */
function isDocumented(name) {
  return mentions(corpus, name);
}

/**
 * In the reference specifically. Kept SEPARATE from the check above, because
 * the two failures want different fixes: a name in neither place needs
 * explaining, while a name documented on its feature page but absent here just
 * needs a line in the reference. Five exports shipped in exactly that state on
 * 2026-08-12 and a person caught them, which is this guard's job.
 */
function isInReference(name) {
  return mentions(reference, name);
}

function exportsOf(program, checker, entryPath) {
  const source = program.getSourceFile(entryPath);
  if (!source) throw new Error(`Missing entry ${entryPath}`);
  const moduleSymbol = checker.getSymbolAtLocation(source);
  if (!moduleSymbol) throw new Error(`No module symbol for ${entryPath}`);
  return checker
    .getExportsOfModule(moduleSymbol)
    .map((symbol) => symbol.name)
    .filter((name) => name !== "default")
    .sort((a, b) => a.localeCompare(b));
}

function auditPackages() {
  const entries = SURFACES.map((surface) =>
    join(REPO_ROOT, "packages", surface.entry)
  );
  const program = ts.createProgram(entries, {
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ESNext,
    skipLibCheck: true,
  });
  const checker = program.getTypeChecker();
  return SURFACES.map((surface, index) => {
    const names = exportsOf(program, checker, entries[index]);
    const undocumented = new Set(names.filter((name) => !isDocumented(name)));
    return { pkg: surface.label, names, undocumented };
  });
}

/** One name's audit result, as the report column shows it. */
function stateOf(name, undocumented, missingFromReference) {
  if (undocumented.has(name)) return "MISSING";
  if (missingFromReference.has(name)) return "no-ref ";
  return "ok     ";
}

function printReport(audits, missingFromReference) {
  for (const { pkg, names, undocumented } of audits) {
    console.log(`\n## ${pkg} — ${names.length} exports`);
    for (const name of names) {
      console.log(
        `${stateOf(name, undocumented, missingFromReference)} ${name}`
      );
    }
  }
}

/**
 * Names the reference page never mentions, deduplicated across packages.
 *
 * The reference documents names, not per-package copies: `CellEditor` is a core
 * type all eight adapters re-export, so requiring it once is the whole
 * requirement. Counting it per surface turned 89 real gaps into 123 lines and
 * made the list look like busywork.
 *
 * Only documented names can be listed here — a name in no page at all is the
 * other failure, and reporting it twice under two headings helps nobody.
 */
function referenceGaps(audits) {
  const gaps = new Set();
  for (const { names, undocumented } of audits) {
    for (const name of names) {
      if (!undocumented.has(name) && !isInReference(name)) gaps.add(name);
    }
  }
  return new Set([...gaps].sort((a, b) => a.localeCompare(b)));
}

function printFailures(audits, missingFromReference) {
  for (const { pkg, undocumented } of audits) {
    if (undocumented.size === 0) continue;
    console.error(
      `\n${pkg}: ${undocumented.size} exported name(s) appear in no docs/*.md page:`
    );
    for (const name of undocumented) console.error(`  - ${name}`);
  }
  if (missingFromReference.size > 0) {
    console.error(
      `\n${missingFromReference.size} exported name(s) are documented on a feature page but ` +
        `missing from docs/${REFERENCE_PAGE}:`
    );
    for (const name of missingFromReference) console.error(`  - ${name}`);
  }
}

function main() {
  const audits = auditPackages();
  const exportTotal = audits.reduce((sum, a) => sum + a.names.length, 0);
  const undocumentedTotal = audits.reduce(
    (sum, a) => sum + a.undocumented.size,
    0
  );
  const missingFromReference = referenceGaps(audits);
  const missingRefTotal = missingFromReference.size;

  if (process.argv.includes("--report")) {
    printReport(audits, missingFromReference);
    console.log(
      `\nTotal: ${exportTotal} exports, ${undocumentedTotal} undocumented, ` +
        `${missingRefTotal} missing from docs/${REFERENCE_PAGE}.`
    );
    return;
  }
  if (undocumentedTotal > 0 || missingRefTotal > 0) {
    printFailures(audits, missingFromReference);
    if (undocumentedTotal > 0) {
      console.error(
        `\n${undocumentedTotal} undocumented export(s). Document each name in docs/ or stop exporting it.`
      );
    }
    if (missingRefTotal > 0) {
      console.error(
        `${missingRefTotal} export(s) missing from docs/${REFERENCE_PAGE}. The reference page ` +
          `claims every export; add a line for each, or stop exporting it.`
      );
    }
    process.exit(1);
  }
  console.log(`doc-surface: all ${exportTotal} exports documented.`);
}

main();
