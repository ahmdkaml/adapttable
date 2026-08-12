/**
 * The strip that says what the selection adds up to.
 *
 * It is the same bar every spreadsheet puts at the bottom of the window, and
 * it lives in core for the same reason the announcer does: eight adapters
 * would otherwise each decide their own wording, their own number formatting
 * and their own rules about when it appears.
 *
 * It says nothing about a single cell. One cell has no sum worth reading, and
 * a strip that flickers into existence on every arrow press is noise rather
 * than information.
 */
import type { ReactElement } from "react";

import type { TableLabels } from "../types";
import type { SelectionStats } from "./selectionStats";

/** Props for {@link SelectionStatsBar}. */
export interface SelectionStatsBarProps {
  /** The statistics, straight from `shell.selectionStats`. */
  stats: SelectionStats | null;
  /** Labels for each figure; falls back to the built-in English. */
  labels?: TableLabels;
  /** Locale tag for number formatting. The host's default when omitted. */
  locale?: string;
  /** A kit's own class for the strip. */
  className?: string;
}

/** One figure, or nothing when the selection has no numbers to describe. */
function figure(
  label: string,
  value: number | null,
  format: (value: number) => string
): string | null {
  return value === null ? null : `${label} ${format(value)}`;
}

/**
 * Renders the selection statistics, or nothing at all when there is no
 * multi-cell selection — so an adapter renders it unconditionally and the
 * opt-in promise still holds.
 *
 * The strip is a status region: a screen reader reads the new figures after
 * the range announcement rather than interrupting it, which is the order the
 * two belong in.
 */
export function SelectionStatsBar({
  stats,
  labels,
  locale,
  className,
}: Readonly<SelectionStatsBarProps>): ReactElement | null {
  if (!stats || stats.cells < 2) return null;
  const format = (value: number) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(value);
  const parts = [
    `${labels?.selectionCount ?? "Count"} ${format(stats.cells)}`,
    figure(labels?.selectionSum ?? "Sum", stats.sum, format),
    figure(labels?.selectionAverage ?? "Avg", stats.average, format),
    figure(labels?.selectionMin ?? "Min", stats.min, format),
    figure(labels?.selectionMax ?? "Max", stats.max, format),
  ].filter((part): part is string => part !== null);

  return (
    <div
      data-adapttable-part="selection-stats"
      role="status"
      className={className}
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.25rem 1rem",
        fontVariantNumeric: "tabular-nums",
        opacity: 0.8,
      }}
    >
      {parts.map((part) => (
        <span key={part} data-adapttable-part="selection-stat">
          {part}
        </span>
      ))}
    </div>
  );
}
