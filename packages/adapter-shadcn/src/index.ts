/**
 * `@adapttable/shadcn` — AdaptTable pre-styled with shadcn/ui.
 *
 * Re-exports the full `@adapttable/unstyled` surface (the headless engine,
 * source builders, hooks, and types) so this is a complete one-stop import; the
 * local `DataTable` below shadows the unstyled one with the shadcn preset baked
 * in.
 */
export { shadcnClassNames } from "./classNames";
export { DataTable } from "./DataTable";
export * from "@adapttable/unstyled";
