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
 *
 * Two whole classes of part were invisible to it, which is how
 * `saved-view-readonly` and `saved-view-default` survived: emitted by
 * adapter-unstyled alone, they never entered the comparison at all, because a
 * name no themed kit spells cannot be missing from a themed kit. So there are
 * now three sources, not two:
 *
 * - **The themed kits**, compared part-for-part as before.
 * - **adapter-unstyled**, whose exclusive names are now checked rather than
 *   used only as an oracle. Each one has to be accounted for in
 *   `FALLBACK_ONLY` (unstyled builds this structure itself, because native IS
 *   its kit, and the themed kits reach the same affordance through their own
 *   kit's component) or in `UNNAMED_IN_KITS` (the themed kits do render this
 *   element and have never named it — a real gap, listed rather than
 *   discovered by accident, and printed on every run). A name in neither list
 *   fails: that is the drift this check now catches at the moment it appears.
 * - **Core's chrome**, which names parts the kits never spell — some rendered
 *   by core itself, some handed to a kit's slot as a `part` prop, some kept in
 *   a `*_PARTS` table the kits render through, some set on a ref. Those land
 *   in every kit by construction, so they are exempt from the unstyled
 *   comparison and counted in the summary instead of being unaccounted for.
 *
 * Both lists are checked for rot in the other direction too: an entry that no
 * longer applies — the part is named by every themed kit now, or unstyled
 * stopped emitting it — fails as well. A list of gaps that cannot shrink is a
 * list nobody trusts.
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

/**
 * Parts adapter-unstyled names because adapter-unstyled builds the thing.
 *
 * Native controls and native structure are that adapter's kit, so it assembles
 * a popover, a menu, a pager and a skeleton out of elements it owns. The themed
 * kits reach the same affordance through their kit's Popover, Menu, Pagination
 * and Skeleton, whose internals are the kit's — there is no element of theirs
 * that the same name would belong on. Grouped by the widget, with the reason
 * per group.
 */
const FALLBACK_ONLY = {
  // Its own anchored card and drawer, built from divs and a backdrop.
  filters: [
    "filters-anchor",
    "filters-backdrop",
    "filters-body",
    "filters-button",
    "filters-clear",
    "filters-close",
    "filters-count",
    "filters-done",
    "filters-footer",
    "filters-header",
    "filters-icon",
    "filters-panel",
    "filters-popover",
    "filters-title",
    "filter-checkbox-group",
    "filter-options-loading",
  ],
  // Its own column menu: a panel of native buttons and separators.
  "column menu": [
    "column-menu",
    "column-menu-auto-size",
    "column-menu-grip",
    "column-menu-header",
    "column-menu-label",
    "column-menu-panel",
    "column-menu-pin",
    "column-menu-reset",
    "column-menu-separator",
    "column-menu-title",
    "column-menu-visibility",
  ],
  // Its own saved-views menu, down to the save row and the divider.
  "views menu": [
    "views-button",
    "views-delete",
    "views-divider",
    "views-input",
    "views-item",
    "views-menu",
    "views-panel",
    "views-row",
    "views-save",
    "views-save-row",
  ],
  // Its own pager: numbered buttons, an ellipsis, a rows-per-page select.
  pager: [
    "page-ellipsis",
    "page-next",
    "page-number",
    "page-prev",
    "pager",
    "rows-per-page",
    "load-more",
    "load-more-button",
  ],
  // Its own loading skeleton, drawn as lines and blocks.
  skeleton: [
    "loading",
    "loading-card",
    "loading-cards",
    "loading-cell",
    "loading-header-cell",
    "loading-header-row",
    "loading-line",
    "loading-row",
    "loading-table",
    "refresh-indicator",
  ],
  // Native controls: a select for sorting where a kit has a Select, a bare
  // checkbox where a kit has a Checkbox, a button where a kit has a Button.
  "native controls": [
    "action-button",
    "checkbox",
    "empty-clear",
    "expand-button",
    "export-csv-button",
    "export-spinner",
    "retry-button",
    "sort-button",
    "sort-index",
    "sort-select",
  ],
  // Structure only the native shell has: the spacer that gives a virtualized
  // column window its width.
  virtualization: ["virtual-spacer"],
};

/**
 * Parts the themed kits DO render an element for and have never named.
 *
 * Not a design decision — a gap, and the reason it is written down instead of
 * fixed in passing is that each one is six edits and a rendered assertion per
 * kit. Listed so the check has no blind spot: this file is where the debt is,
 * the summary prints its size on every run, and an entry that gets fixed has
 * to be removed or the check fails on the stale claim.
 */
const UNNAMED_IN_KITS = {
  "table structure": [
    "table",
    "thead",
    "header-row",
    "footer",
    "toolbar",
    "summary",
    "summary-row",
    "summary-cell",
    "header-group-cell",
    "header-group-row",
    "resize-handle",
  ],
  "row extras": [
    "actions-cell",
    "actions-header",
    "detail-cell",
    "detail-row",
    "expand-cell",
    "expand-header",
  ],
  "mobile cards": [
    "card",
    "card-actions",
    "card-label",
    "card-row",
    "card-value",
  ],
  "toolbar controls": ["search", "search-field", "search-icon"],
  "filter chips": ["chip", "chip-remove", "chips"],
  "empty and error states": ["empty", "error"],
};

/** Every part named in one of the two accounted-for lists. */
function accountedFor(groups) {
  return new Set(Object.values(groups).flat());
}

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

/**
 * The part names core's chrome owns.
 *
 * Core names a part in four ways, and only the first looks like the others:
 * the attribute it renders itself, the `part` prop it hands a kit's slot to put
 * on the kit's own element, a `*_PARTS` table the kits render through, and a
 * `setAttribute` on a ref where the element belongs to the kit but the naming
 * does not. All four land in every kit by construction, which is exactly why
 * none of them shows up in an adapter's source.
 */
function corePartNames() {
  const found = new Set();
  for (const file of sourceFiles(join(PACKAGES, "core", "src"))) {
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(
      /["']?data-adapttable-part["']?\s*[=:]\s*["']([a-z0-9-]+)["']/g
    )) {
      found.add(match[1]);
    }
    for (const match of text.matchAll(/\bpart[=:]\s*["']([a-z0-9-]+)["']/g)) {
      found.add(match[1]);
    }
    for (const match of text.matchAll(
      /setAttribute\(\s*["']data-adapttable-part["']\s*,\s*["']([a-z0-9-]+)["']/g
    )) {
      found.add(match[1]);
    }
    for (const match of text.matchAll(
      /\b[A-Z][A-Z0-9_]*PARTS\b\s*=\s*(\{[\s\S]*?\n\})/g
    )) {
      for (const name of match[1].matchAll(/["']([a-z0-9-]+)["']/g)) {
        found.add(name[1]);
      }
    }
  }
  return found;
}

/**
 * The unstyled-only side of the check: every name adapter-unstyled emits that
 * no themed kit does and core does not own has to be accounted for, and every
 * account has to still be true.
 */
function unstyledOnlyFailures(unstyled, themed, core) {
  const fallback = accountedFor(FALLBACK_ONLY);
  const unnamed = accountedFor(UNNAMED_IN_KITS);
  const gap = [...unstyled].filter(
    (part) => !themed.has(part) && !core.has(part)
  );
  const unaccounted = gap.filter(
    (part) => !fallback.has(part) && !unnamed.has(part)
  );
  const stale = [...fallback, ...unnamed]
    .filter((part) => !gap.includes(part))
    .sort();
  return { unaccounted: unaccounted.sort(), stale, unnamed: unnamed.size };
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

  const coreParts = corePartNames();
  const { unaccounted, stale, unnamed } = unstyledOnlyFailures(
    shellParts,
    everyPart,
    coreParts
  );

  if (unaccounted.length > 0) {
    console.error(
      `\n${unaccounted.length} part(s) are emitted by adapter-unstyled alone:\n`
    );
    for (const part of unaccounted) console.error(`  ${part}`);
    console.error(
      "\nA part the native fallback names and no themed kit does is either a " +
        "widget only that adapter builds — add it to FALLBACK_ONLY in " +
        "scripts/check-parts-parity.mjs with the reason — or the same element " +
        "in six kits with a name in one, which is the defect this catches: " +
        "add the name to every kit that renders it."
    );
    process.exit(1);
  }

  if (stale.length > 0) {
    console.error(
      `\n${stale.length} accounted-for part(s) no longer match reality:\n`
    );
    for (const part of stale) console.error(`  ${part}`);
    console.error(
      "\nEach of these is listed in FALLBACK_ONLY or UNNAMED_IN_KITS in " +
        "scripts/check-parts-parity.mjs, but the themed kits now name it (or " +
        "adapter-unstyled no longer does). Remove the entry — a list of gaps " +
        "that cannot shrink is a list nobody trusts."
    );
    process.exit(1);
  }

  console.log(
    `parts-parity: ${everyPart.size} part names agree across ${SHELL_KITS.length} adapters; ` +
      `${coreParts.size} more come from core's chrome; ` +
      `${unnamed} structural parts are still unnamed outside adapter-unstyled.`
  );
}

main();
