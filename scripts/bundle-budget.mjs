/**
 * The bundle budget — what a table actually costs, measured and enforced.
 *
 * AdaptTable's promise is that features are opt-in: a plain table pays for the
 * plain table and nothing else. A promise like that is worth exactly what it is
 * measured at, so this bundles real consumer fixtures against the built
 * packages — what npm ships, not the source — and holds each one to a written
 * ceiling.
 *
 *   pnpm build && node scripts/bundle-budget.mjs      # measure and check
 *   node scripts/bundle-budget.mjs --update           # print current sizes
 *
 * Sizes are minified + gzipped bytes of AdaptTable's own share of the graph.
 * React and the UI kits are external because an application already ships
 * them; counting them would drown the number the budget is about.
 *
 * The bundler is rolldown, re-exported by tsdown, which builds this repo
 * already — the measurement adds no dependency of its own.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

import { Rolldown } from "tsdown";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const UPDATE = process.argv.includes("--update");

/** Anything an application already has. AdaptTable's share is what remains. */
const EXTERNAL = [
  /^react($|\/)/,
  /^react-dom($|\/)/,
  /^react-compiler-runtime($|\/)/,
  /^@mantine\//,
  /^@mui\//,
  /^@emotion\//,
  /^@chakra-ui\//,
  /^antd$/,
  /^@ant-design\//,
  /^@radix-ui\//,
  /^@base-ui($|\/)/,
  /^class-variance-authority$/,
  /^clsx$/,
  /^tailwind-merge$/,
  /^lucide-react$/,
];

/**
 * Each fixture is the smallest honest expression of one use case.
 *
 * `budgetKB` is a ceiling with headroom, not a target: it stays quiet through
 * ordinary work and fails the build when the base path puts on real weight.
 * Raising one is a decision that belongs in a pull request with a reason —
 * which is the entire point of writing them down.
 */
const FIXTURES = [
  {
    name: "core · simple table",
    pkg: "core",
    budgetKB: 12,
    code: `export { useFrontendData, useDataTable } from "PKG";`,
    // The size ceiling says the base import is small. These say WHY: the heavy
    // capabilities are genuinely shaken out, not merely compressing well. A
    // feature that starts leaking into the base path trips this before the
    // budget notices the bytes.
    absent: ["toCsv", "Blob", "download", "virtual"],
  },
  {
    // The whole surface at once, which no application imports. It is a canary
    // for the library's total weight rather than a promise about a user's
    // bundle — the promise is the fixture above, and it holds independently.
    // This number therefore moves when the library genuinely gains a feature,
    // and it moves in a commit that says which one.
    name: "core · every export",
    pkg: "core",
    budgetKB: 61,
    code: `export * from "PKG";`,
  },
  // Every adapter, because the adapters are meant to be interchangeable and
  // that includes their weight. One drifting away from the pack is a finding.
  //
  // These moved together on 2026-08-12 (+~1 KB each) when cell selection became
  // visible, columns became selectable and Ctrl/Cmd+C learned to copy the
  // rectangle — all of it on the grid path, which every adapter bundles. The
  // fixture that carries the actual promise is `core · simple table` above: a
  // plain table pays 10.6 KB of a 12 KB ceiling and did not move.
  //
  // Five capabilities joined that path on 2026-08-12, each of them chrome the
  // batteries-included table always carries: Ctrl/Cmd+V (~0.4 KB), the fill
  // handle (~1.3 KB), the selection statistics strip (~0.5 KB), the edit
  // history (~0.6 KB) and find in table (~0.8 KB, bar included). The fixture
  // that carries the actual promise is `core · simple table` above — a plain
  // table pays 10.7 KB of a 12 KB ceiling and did not move through any of it.
  //
  // Grouping grew on the same day: nesting, footers, ordering and the server's
  // own group rows all render through the entries every adapter already walks.
  // Row detail then learned to be measured together with its row, which is
  // what let it be used with virtualization at all, and the columns learned to
  // window too (~1 KB): the spacer cells and the horizontal window ride the
  // same render model every adapter already maps over. Auto-sizing added the
  // measurement and one menu action on top, and column sizing — bounds, flex
  // shares and the container-fitting mode — closed phase 3. Tree data adds a
  // second hierarchy model (~1 KB): the flattening walk, its own expansion
  // state, and the chevron every body and every card renders — plus the
  // per-node fetch state a lazily loaded branch needs, and the nested-table
  // region that turns master/detail into a real table under a row. Editing
  // validation adds the per-cell message state, the async check that supersedes
  // a stale answer, and the ARIA every editor now carries (~1 KB). The editor
  // set — boolean, date, datetime, time, multi-select — adds the platform
  // controls two of them render and the draft shapes they hold. Async saves add
  // the per-cell in-flight state, the rollback it offers, and a bring-your-own
  // editor's contract; dirty marks add the per-cell change set every row reads.
  // Row editing adds the second commit unit — the whole-row draft state, the
  // cell that renders a field instead of a value, and the three controls that
  // end the edit — and batch editing the third, holding many rows at once
  // behind one write. Lifecycle events (~0.5 KB) observe those three units:
  // start, cancel, commit, validation-fail and save-error, latched so a host
  // inline arrow never repaints rows. Edit conflicts (~0.5 KB) compare the
  // open editor to a live row and surface Keep mine / Take theirs on the
  // validation channel. The simple-table fixture did not move.
  //
  // Row reordering (~2 KB) is chrome every adapter already walks: the reserved
  // grip column, Space-lift keyboard, live-region announcer, HTML5 drop
  // targets, and the mobile up/down pair. The host still opts in with
  // `onRowReorder` — omit it and nothing renders — but the builders sit on
  // the same path as row actions. `core · simple table` stayed at 11.4 KB
  // of a 12 KB ceiling.
  //
  // Row pinning (~0.5 KB) adds the sticky top/bottom sections, the pin
  // actions, and the URL pair. The host still opts in with `pinnedRowIds`
  // or `onPinnedRowIdsChange`. `core · simple table` stayed at 11.4 KB of
  // a 12 KB ceiling.
  //
  // Row and column spanning (~1.5 KB) replaces every kit's columns.map
  // with a per-row cell list: origins carry colSpan/rowSpan, covered
  // cells are omitted, pins and the column window clip the rectangle,
  // and arrows / CSV skip a covered address. The host still opts in
  // with `getCellSpan` or `column.colSpan` / `column.rowSpan`.
  // `core · simple table` stayed at 11.4 KB of a 12 KB ceiling.
  { name: "mantine · table", pkg: "adapter-mantine", budgetKB: 89 },
  { name: "mui · table", pkg: "adapter-mui", budgetKB: 88 },
  { name: "chakra · table", pkg: "adapter-chakra", budgetKB: 89 },
  { name: "antd · table", pkg: "adapter-antd", budgetKB: 85 },
  { name: "radix · table", pkg: "adapter-radix", budgetKB: 89 },
  { name: "base-ui · table", pkg: "adapter-base-ui", budgetKB: 95 },
  { name: "shadcn · table", pkg: "adapter-shadcn", budgetKB: 92 },
  { name: "unstyled · table", pkg: "adapter-unstyled", budgetKB: 89 },
].map((f) => ({ code: `export { DataTable } from "PKG";`, ...f }));

/**
 * Bundle one fixture: its gzipped size, plus any names that were supposed to
 * be shaken out and were not.
 *
 * The size comes from minified output because that is what ships. The absence
 * check reads the unminified build of the same bundle, where identifiers still
 * carry their real names.
 */
async function measure(fixture, dir) {
  const entry = join(dir, "entry.js");
  const target = join(ROOT, "packages", fixture.pkg, "dist", "index.js");
  writeFileSync(entry, fixture.code.replaceAll("PKG", target));

  const bundle = await Rolldown.rolldown({
    input: entry,
    external: (id) => EXTERNAL.some((re) => re.test(id)),
    logLevel: "silent",
  });
  const [min, readable] = await Promise.all([
    bundle.generate({ format: "esm", minify: true }),
    bundle.generate({ format: "esm" }),
  ]);
  await bundle.close();

  const code = readable.output[0].code;
  return {
    sizeKB: gzipSync(min.output[0].code).length / 1024,
    leaked: (fixture.absent ?? []).filter((name) =>
      new RegExp(`\\b${name}`).test(code)
    ),
  };
}

const dir = mkdtempSync(join(tmpdir(), "adapttable-budget-"));
const rows = [];
let over = 0;

try {
  for (const fixture of FIXTURES) {
    const { sizeKB, leaked } = await measure(fixture, dir);
    const ok = sizeKB <= fixture.budgetKB && leaked.length === 0;
    if (!ok) over++;
    rows.push({ ...fixture, sizeKB, ok });
    const headroom = fixture.budgetKB - sizeKB;
    console.log(
      `${ok ? "✓" : "✗"} ${fixture.name.padEnd(26)}` +
        `${sizeKB.toFixed(1).padStart(6)} KB gzipped` +
        `   budget ${String(fixture.budgetKB).padStart(3)} KB` +
        (headroom >= 0
          ? `   (${headroom.toFixed(1)} KB to spare)`
          : `   OVER by ${(-headroom).toFixed(1)} KB`)
    );
    if (leaked.length) {
      console.log(
        `  └ reached the base import but should not have: ${leaked.join(", ")}`
      );
    }
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}

if (UPDATE) {
  console.log("\nCurrent sizes with ~15% headroom — for the FIXTURES table:");
  for (const r of rows) {
    console.log(
      `  ${r.name.padEnd(26)} budgetKB: ${Math.ceil(r.sizeKB * 1.15)}`
    );
  }
  process.exit(0);
}

if (over) {
  console.error(
    `\n${over} fixture(s) over budget.\n` +
      `Either the weight belongs behind an optional entry point, or the budget ` +
      `needs raising — in the pull request, with a reason, never silently.`
  );
  process.exit(1);
}
console.log(`\nAll ${rows.length} fixtures within budget.`);
