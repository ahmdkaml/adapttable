/**
 * Row patches — changing the data you already have, without refetching it.
 *
 * A save returns the updated record, a socket pushes a new one, a delete
 * succeeds. Refetching the page to reflect that costs a round trip and, worse,
 * throws away everything the user had going: the scroll position, which rows
 * were open, sometimes the selection.
 *
 * ```ts
 * const [rows, setRows] = useState(initial);
 * const onSaved = (row: Person) =>
 *   setRows((current) => applyRowPatches(current, [updateRow(row.id, row)], byId));
 * ```
 *
 * Two properties make that safe, and both are tested:
 *
 * - **Untouched rows keep their object identity.** React reconciles them as
 *   unchanged, and anything memoized per row — a `computed` column's cache,
 *   a `memo`'d cell — stays valid instead of recomputing for the whole page.
 * - **A patch that changes nothing returns the very same array.** Applying an
 *   update whose values already match, or removing an id that is not there,
 *   hands back the original reference, so a `setState` with it does not
 *   re-render.
 *
 * Selection and expansion survive because both are keyed by row id, and a
 * patch never changes the id of a row it did not touch.
 *
 * This is a pure function over an array. The table never owns your data and
 * this does not make it start: you hold the rows, you apply the patch.
 */

/** Insert a row. Without `at`, it goes on the end. */
export interface InsertPatch<TRow> {
  type: "insert";
  row: TRow;
  /** Zero-based position. Clamped into range; negative counts from the end. */
  at?: number;
}

/** Merge changes into the row with this id. Absent id: nothing happens. */
export interface UpdatePatch<TRow> {
  type: "update";
  id: string;
  changes: Partial<TRow>;
}

/** Replace the row with this id, or append it when it is not there yet. */
export interface UpsertPatch<TRow> {
  type: "upsert";
  row: TRow;
}

/** Drop the row with this id. Absent id: nothing happens. */
export interface RemovePatch {
  type: "remove";
  id: string;
}

/** One change to a row set. */
export type RowPatch<TRow> =
  | InsertPatch<TRow>
  | UpdatePatch<TRow>
  | UpsertPatch<TRow>
  | RemovePatch;

/** Insert a row, optionally at a position. */
export function insertRow<TRow>(row: TRow, at?: number): InsertPatch<TRow> {
  return { type: "insert", row, at };
}

/** Merge changes into one row. */
export function updateRow<TRow>(
  id: string,
  changes: Partial<TRow>
): UpdatePatch<TRow> {
  return { type: "update", id, changes };
}

/** Replace a row, or add it if it is new. */
export function upsertRow<TRow>(row: TRow): UpsertPatch<TRow> {
  return { type: "upsert", row };
}

/** Remove a row by id. */
export function removeRow(id: string): RemovePatch {
  return { type: "remove", id };
}

/** Is every own key of `changes` already equal on `row`? */
function alreadyApplied<TRow>(row: TRow, changes: Partial<TRow>): boolean {
  return (Object.keys(changes) as (keyof TRow)[]).every((key) =>
    Object.is(row[key], changes[key])
  );
}

/** Clamp an insert position, letting a negative index count from the end. */
function insertIndex(at: number | undefined, length: number): number {
  if (at === undefined) return length;
  const resolved = at < 0 ? length + at : at;
  return Math.min(Math.max(resolved, 0), length);
}

/** Where a row with this id sits, or -1. */
function indexOfId<TRow>(
  list: readonly TRow[],
  id: string,
  getRowId: (row: TRow) => string
): number {
  return list.findIndex((row) => getRowId(row) === id);
}

/** Apply one patch to a working copy. Returns whether anything changed. */
function applyOne<TRow>(
  list: TRow[],
  patch: RowPatch<TRow>,
  getRowId: (row: TRow) => string
): boolean {
  if (patch.type === "insert") {
    list.splice(insertIndex(patch.at, list.length), 0, patch.row);
    return true;
  }

  if (patch.type === "remove") {
    const index = indexOfId(list, patch.id, getRowId);
    if (index === -1) return false;
    list.splice(index, 1);
    return true;
  }

  if (patch.type === "upsert") {
    const index = indexOfId(list, getRowId(patch.row), getRowId);
    if (index === -1) {
      list.push(patch.row);
      return true;
    }
    // Re-upserting the row already in place is not a change, and replacing it
    // with itself would invalidate every per-row memo for nothing.
    if (list[index] === patch.row) return false;
    list[index] = patch.row;
    return true;
  }

  const index = indexOfId(list, patch.id, getRowId);
  const existing = list[index];
  if (!existing) return false;
  // An update that changes nothing must not replace the row object, or every
  // per-row memo downstream would be invalidated for no reason.
  if (alreadyApplied(existing, patch.changes)) return false;
  list[index] = { ...existing, ...patch.changes };
  return true;
}

/**
 * Apply patches to a row set, in order, and return the result.
 *
 * Returns the original array — the same reference — when no patch changed
 * anything. Rows that no patch touched keep their object identity.
 *
 * @typeParam TRow - The row type.
 * @param rows - The current rows.
 * @param patches - The changes to apply, in order.
 * @param getRowId - How a row's id is derived; the table's own `rowKey`.
 */
export function applyRowPatches<TRow>(
  rows: readonly TRow[],
  patches: readonly RowPatch<TRow>[],
  getRowId: (row: TRow) => string
): readonly TRow[] {
  const working = [...rows];
  let changed = false;
  for (const patch of patches) {
    // Every patch runs, so a later one acts on what an earlier one did.
    if (applyOne(working, patch, getRowId)) changed = true;
  }
  return changed ? working : rows;
}
