---
"@adapttable/core": minor
"@adapttable/mantine": minor
"@adapttable/mui": minor
"@adapttable/chakra": minor
"@adapttable/antd": minor
"@adapttable/unstyled": minor
---

Support React 19 and the latest major of every UI kit.

- **core / unstyled**: hook and chrome ref types follow React 19's
  `useRef<T>(null) → RefObject<T | null>` change, and the deprecated
  `MutableRefObject` is replaced with `RefObject`. The prop-getters
  (`getTableProps`, `getHeaderCellProps`, `getSortButtonProps`,
  `getCellProps`, `getSearchInputProps`) now return precise element-prop
  interfaces instead of a bare `Record<string, unknown>`, so adapters spread
  them without unsafe casts. React peer stays `^18 || ^19`.
- **mantine**: adds `@mantine/core` / `@mantine/hooks` `^9` to the peer range
  (now `^7 || ^8 || ^9`); Mantine 9 requires React 19.
- **mui**: adds `@mui/material` `^8 || ^9` to the peer range. System props
  that v7 removed from `Stack` / `Box` / `Typography` (`alignItems`, `py`,
  `fontWeight`, …) moved into `sx`, which is backward-compatible to v5.
- **chakra**: rebuilt for Chakra UI **v3** — compound components
  (`Table.Root`, `Menu.Root`, `Popover.Root`, `Drawer.Root`, …),
  `ChakraProvider value={defaultSystem}`, and the v3 prop renames
  (`colorScheme → colorPalette`, `isOpen → open`, …). Peer is now
  `@chakra-ui/react@^3`; Chakra v2 is no longer supported.
- **antd**: rebuilt for Ant Design **v6** — `Alert` `message → title`,
  `Drawer` `width → size`, `Popover` `styles.body → styles.content`, `Space`
  `direction → orientation`, `Tag` `bordered={false} → variant="filled"`, and
  the logical fixed-column class names. Peer is now `antd@^6`; Ant Design v5 is
  no longer supported.
