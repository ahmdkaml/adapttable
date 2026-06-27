# @adapttable/shadcn

## 0.2.1

### Patch Changes

- 6ab1391: docs: every package README now leads with a click-to-play demo — a poster (with
  a play button) that links to an mp4 of the table in action — replacing the
  autoplaying GIF. Republishing so the new READMEs land on npm.
- Updated dependencies [6ab1391]
  - @adapttable/unstyled@0.3.1

## 0.2.0

### Minor Changes

- a90a2c2: Logical column pinning, so pinning stays correct under RTL.

  **Breaking.** Pinned-side values are now `"start"` / `"end"` (were `"left"` /
  `"right"`) — this is the public `pinned` layout value and the `colPin` URL token
  (e.g. `colPin=name:start`); pre-existing `left`/`right` URLs no longer parse. The
  label keys `pinLeft` / `pinRight` / `moveLeft` / `moveRight` are renamed to
  `pinStart` / `pinEnd` / `moveStart` / `moveEnd`, with logical display strings
  shipped for every locale. Pinning a data column is now a start-only toggle; the
  injected actions column keeps its one-click end-pin.

  To migrate: update any `defaultColumnLayout={{ pinned: { x: "left" } }}` to
  `"start"` (and `"right"` → `"end"`), any persisted `colPin` URLs, and any custom
  `labels` overriding the renamed keys.

- a90a2c2: Numbered page buttons in every adapter's pagination (with first/last and
  ellipsis truncation), replacing the prev/next-only control — driven by a shared
  `paginationItems` builder in `@adapttable/core`.

### Patch Changes

- Updated dependencies [a90a2c2]
- Updated dependencies [a90a2c2]
  - @adapttable/unstyled@0.3.0

## 0.1.0

### Minor Changes

- c90b4ae: Add **`@adapttable/shadcn`** — a shadcn/ui adapter that gives a fully-styled AdaptTable in a single import (`import { DataTable } from "@adapttable/shadcn"`). It wraps `@adapttable/unstyled` with the shadcn class preset applied by default; pass your own `classNames` to override any part, or import the raw `shadcnClassNames` map directly. Requires shadcn/ui (its CSS variables + Tailwind config) in your app.

### Patch Changes

- Updated dependencies [0fe5eca]
  - @adapttable/unstyled@0.2.2
