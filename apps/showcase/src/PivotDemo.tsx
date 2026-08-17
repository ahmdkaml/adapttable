import { pivot, usePivotUrlState } from "@adapttable/core/pivot";
import { PivotPanel } from "@adapttable/mantine";
import { Suspense, useMemo } from "react";

import { budget, PEOPLE, type Person, personStatus, utilization } from "./data";
import { SectionHead } from "./sections";

/** The fields this dataset offers a pivot. */
const FIELDS = [
  { key: "team", label: "Team" },
  { key: "role", label: "Role" },
  { key: "status", label: "Status" },
  { key: "budget", label: "Budget" },
  { key: "utilization", label: "Utilization" },
];

/** Where the demo starts: something already pivoted, so the page shows a pivot. */
const START = {
  rows: ["team"],
  columns: ["status"],
  measures: [{ key: "budget", agg: "sum" as const }],
};

/** The rows, with the derived fields materialized so a pivot can read them. */
function usePivotRows(): Person[] {
  return useMemo(
    () =>
      PEOPLE.map((person) => ({
        ...person,
        status: person.status ?? personStatus(person),
        // The demo derives these from the id until an edit materializes
        // them, and a pivot has to read numbers, not undefined.
        budget: person.budget ?? budget(person),
        utilization: person.utilization ?? utilization(person),
      })),
    []
  );
}

const money = new Intl.NumberFormat("en", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/**
 * The pivot page: one dataset, the configuration panel, and the table it
 * produces. Nothing else — the point of the page is the shape of a pivot,
 * not the rest of the table's features.
 */
export function PivotDemo({ dark }: Readonly<{ dark: boolean }>) {
  const rows = usePivotRows();
  const { config, onConfigChange } = usePivotUrlState({
    urlKey: "p",
    defaultConfig: START,
  });
  const result = useMemo(
    () =>
      pivot(rows, config, {
        format: (value) =>
          typeof value === "number" ? money.format(value) : value,
      }),
    [rows, config]
  );

  return (
    <section className="sec shell" id="pivot">
      <SectionHead title="Rows down the side. Dimensions across the top.">
        Grouping answers &ldquo;what is the total per team&rdquo;. A pivot
        answers &ldquo;what is the total per team <em>per status</em>&rdquo; —
        and that second dimension becomes columns the data never had. Move
        fields between the three zones with the buttons; the whole configuration
        lives in the URL, so the pivot you build is the pivot you can send
        someone.
      </SectionHead>
      <div className="pad-surface">
        <div className="pivot-layout">
          <Suspense fallback={null}>
            <PivotPanel
              fields={FIELDS}
              config={config}
              onChange={onConfigChange}
            />
          </Suspense>
          <div className="pivot-table-wrap">
            <table
              className="pivot-table"
              data-dark={dark ? "" : undefined}
              data-testid="pivot-table"
            >
              <thead>
                {config.columns.length > 0 && (
                  <tr>
                    <th scope="col" colSpan={Math.max(result.rowDepth, 1)} />
                    {result.columnTree.map((node) => (
                      <th
                        key={node.path.join("/")}
                        scope="colgroup"
                        colSpan={node.span}
                      >
                        {node.label}
                      </th>
                    ))}
                  </tr>
                )}
                <tr>
                  <th scope="col" colSpan={Math.max(result.rowDepth, 1)}>
                    {config.rows.map((key) => labelFor(key)).join(" / ") ||
                      "Total"}
                  </th>
                  {result.columnLeaves.map((leaf) => (
                    <th key={leaf.key} scope="col">
                      {leaf.total ? "Total" : labelFor(leaf.measure.key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr key={row.key} data-kind={row.kind}>
                    <th
                      scope="row"
                      colSpan={Math.max(result.rowDepth, 1)}
                      style={{ paddingInlineStart: `${row.depth * 16 + 8}px` }}
                    >
                      {row.kind === "grandTotal" ? "Grand total" : row.label}
                    </th>
                    {row.cells.map((cell, index) => (
                      <td key={result.columnLeaves[index]?.key ?? index}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

/** A field's caption, for the headers. */
function labelFor(key: string): string {
  return FIELDS.find((field) => field.key === key)?.label ?? key;
}
