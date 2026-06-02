# Frequently asked questions

Short, direct answers to the things people ask when choosing a React table.
(Looking for a quick comparison table instead? See
[comparison.md](./comparison.md).)

## What is AdaptTable?

AdaptTable is a **headless, UI-agnostic React data table**. A single headless
engine (`@adapttable/core`) powers ready, batteries-included adapters for
**Mantine, MUI, Chakra, Ant Design, and Tailwind/shadcn** (unstyled). You get
TanStack-Table-style headless freedom *and* a styled table for the UI kit you
already use — from the same core.

## What is the best headless React table that works with my design system?

If you use **Mantine, MUI, Chakra, Ant Design, or Tailwind/shadcn**, AdaptTable
gives you a fully-featured table (sorting, filtering, selection, pagination,
infinite scroll, URL state, i18n/RTL, dark mode) that matches your kit without
building the UI yourself. If you're on a different kit, the unstyled adapter
exposes semantic HTML with `data-*` and `className` hooks, and the headless
`useDataTable` core works with any markup.

## Is there a free alternative to MUI X DataGrid or ag-Grid?

Yes — AdaptTable is **MIT-licensed and free**, including server-side
pagination, infinite scroll, filtering, and selection, which are paid tiers in
MUI X DataGrid and ag-Grid. The MUI adapter gives a DataGrid-style experience
at no cost.

## How do I use the same table for client-side and server-side data?

Use one `TableSource` contract for both:

```tsx
// in-memory
const source = useFrontendData({ data: rows, columns });
// server-paginated (wraps your useInfiniteQuery hook) — the table is identical
const source = useBackendData({ usePaginatedQuery });
```

`<DataTable source={source} … />` doesn't change between them.

## Does AdaptTable support RTL and Arabic?

Yes, RTL is first-class. Column alignment uses **logical CSS** (`start`/`end`),
so it flips automatically under `dir="rtl"`. The optional `@adapttable/i18n`
package ships **10 locales** — English, Arabic, German, Spanish, French,
Hebrew, Italian, Japanese, Portuguese, and Chinese — plus `getDirection` /
`isRtlLocale` helpers. Arabic and Hebrew are right-to-left.

## Does it have dark mode?

Dark mode is **seamless** — it's inherited from your UI kit's theme, with
AA-contrast text throughout and no hardcoded colors that break in the dark.

## Can I animate rows? Do I need GSAP?

Animation is **opt-in and dependency-free** — the built-in entrance stagger
uses the Web Animations API and honours `prefers-reduced-motion`. Prefer GSAP
or Framer Motion? Every row/card is tagged with `data-stagger`, so you can
drive the animation yourself (see
[customization.md](./customization.md#animations)). Or run with no animation at
all — your call.

## How do I add URL-synced (shareable, deep-linkable) table state?

It's built in. Search, sort, filters, and page sync to the URL through an
injectable adapter (browser History by default; pass a router adapter for
Next.js / react-router). Reloads, shared links, and back/forward restore the
exact view. See [url-state.md](./url-state.md).

## Which React versions and bundlers are supported?

React **18+**. Every package ships dual ESM/CJS builds with `.d.ts` types
(verified with `publint --strict` and `are-the-types-wrong`), so it works with
Vite, Next.js, Remix, webpack, and friends. It's written in strict TypeScript.

## Is it accessible?

Yes — semantic table markup, `aria-sort` on sortable headers, labelled
selection checkboxes and icon buttons, and a keyboard-friendly UX. Every
adapter is audited with `axe` in CI, on both desktop and mobile layouts.

## How big is it / is it tree-shakeable?

Every package sets `sideEffects: false` and ships ESM, so unused code is
tree-shaken. You only install the one adapter you use; the headless core has
zero UI-kit dependencies.

## How do I get started quickly?

```bash
npx adapttable init   # detects your UI kit and scaffolds a table
```

Or install an adapter directly, e.g. `pnpm add @adapttable/mantine`. See
[getting-started.md](./getting-started.md).

## When might another library fit better?

- You need a heavyweight enterprise grid with pivoting, range selection, and
  Excel-style editing *today* → ag-Grid or MUI X DataGrid (paid).
- You're not on React → TanStack Table (multi-framework).
- You must virtualize tens of thousands of rows *today* → AdaptTable does
  paging and infinite scroll; row virtualization is on the roadmap.
