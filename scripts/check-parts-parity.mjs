#!/usr/bin/env node
/**
 * `data-adapttable-part` parity across the adapters.
 *
 * A part name is public contract: an app styles or tests against it, so the
 * same name has to land in every kit that renders the thing. Nothing enforced
 * that, and it drifted three separate times — `selection-cell` and
 * `selection-header` were emitted by adapter-unstyled alone, then `bulk-bar`,
 * then five more parts of the same bar. Each was found by accident, while
 * someone was building something else.
 *
 * This finds it on purpose: any part emitted by SOME shell adapters and not
 * others fails, and the message names the kits that are missing it.
 *
 * Two things stop it crying wolf, which matters more than the check itself —
 * a parity check with false failures teaches people to add allowlist entries,
 * and the allowlist is where real gaps then hide:
 *
 * 1. **Both spellings count.** A kit that forwards loose props to an inner
 *    element passes the part through a prop object instead
 *    (`wrapperProps={{ "data-adapttable-part": … }}` in Mantine's checkbox),
 *    so matching only `data-adapttable-part="x"` reports a defect that is not
 *    there.
 * 2. **Only shared surfaces are compared.** adapter-unstyled renders the
 *    native fallbacks for every kit and so names far more parts than any
 *    themed adapter; shadcn wraps it and names almost none. Neither is a
 *    defect, so parity is judged across the six themed adapters that share
 *    the shell, and `EXPECTED_GAPS` records the ones a kit genuinely cannot
 *    render — each with the reason, so an entry is an argument rather than a
 *    silencer.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGES = join(REPO_ROOT, "packages");

/**
 * The adapters that render the shared shell's chrome with their own kit's
 * components. They should agree part-for-part.
 */
const SHELL_KITS = [
  "adapter-mantine",
  "adapter-mui",
  "adapter-chakra",
  "adapter-antd",
  "adapter-radix",
  "adapter-base-ui",
];

/**
 * Parts a kit genuinely cannot render, with the reason. An entry here is a
 * claim about that kit's own component model — not a way to quiet the check.
 */
const EXPECTED_GAPS = {
  "adapter-antd": {
    cell: "antd's Table owns every body cell; there is no per-cell hook.",
    "filter-header-cell":
      "antd renders its own header row, so the filter cell is not ours to tag.",
  },
};

/** Every `.ts`/`.tsx` file under a package's `src`, tests excluded. */
function sourceFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      out.push(...sourceFiles(path));
      continue;
    }
    if (!/\.tsx?$/.test(entry) || /\.test\.tsx?$/.test(entry)) continue;
    out.push(path);
  }
  return out;
}

/**
 * The part names one adapter emits.
 *
 * Both spellings are read: the JSX attribute, and the string key a kit uses
 * when it hands the part through a prop object to an inner element.
 */
function partsOf(pkg) {
  const dir = join(PACKAGES, pkg, "src");
  const found = new Set();
  for (const file of sourceFiles(dir)) {
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(
      /["']?data-adapttable-part["']?\s*[=:]\s*["']([a-z0-9-]+)["']/g
    )) {
      found.add(match[1]);
    }
  }
  return found;
}

function main() {
  const byKit = new Map(SHELL_KITS.map((pkg) => [pkg, partsOf(pkg)]));
  // adapter-unstyled renders the native fallback for every piece of shared
  // chrome, so a name it emits is shared by definition — the reference for
  // telling "this kit's own part" from "a part the others forgot".
  const shellParts = partsOf("adapter-unstyled");
  const everyPart = new Set([...byKit.values()].flatMap((set) => [...set]));

  const failures = [];
  for (const part of [...everyPart].sort()) {
    const missing = SHELL_KITS.filter(
      (pkg) =>
        !byKit.get(pkg).has(part) && EXPECTED_GAPS[pkg]?.[part] === undefined
    );
    if (missing.length === 0) continue;
    // A part only ONE themed kit renders is usually that kit's own — unless
    // adapter-unstyled renders it too, which makes it shared chrome the other
    // five simply never named. `cards` sat in exactly that state: antd and
    // unstyled emitted it, five kits rendered the list without naming it, and
    // treating "one kit" as "kit-specific" hid it.
    const shared = shellParts.has(part);
    if (!shared && missing.length === SHELL_KITS.length - 1) continue;
    failures.push({ part, missing });
  }

  if (failures.length > 0) {
    console.error(
      `\n${failures.length} part(s) are rendered by some adapters and not others:\n`
    );
    for (const { part, missing } of failures) {
      console.error(`  ${part} — missing from ${missing.join(", ")}`);
    }
    console.error(
      "\nA part name is public contract: the same name lands on the same " +
        "element in every kit that renders the thing. Add it where it is " +
        "missing, or — if a kit genuinely cannot render it — add an " +
        "EXPECTED_GAPS entry in scripts/check-parts-parity.mjs saying why."
    );
    process.exit(1);
  }

  console.log(
    `parts-parity: ${everyPart.size} part names agree across ${SHELL_KITS.length} adapters.`
  );
}

main();
