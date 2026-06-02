# Examples

Drop-in example components for each AdaptTable adapter. Each file is a
complete, copy-pasteable React component — wrap it in your kit's provider
(`MantineProvider`, `ThemeProvider`, `ChakraProvider`) and render it.

| File                                             | Adapter                | Shows                                 |
| ------------------------------------------------ | ---------------------- | ------------------------------------- |
| [mantine-basic.tsx](./mantine-basic.tsx)         | `@adapttable/mantine`  | Client data, sorting, row actions     |
| [mantine-filters.tsx](./mantine-filters.tsx)     | `@adapttable/mantine`  | Live filters + removable chips        |
| [mui-backend.tsx](./mui-backend.tsx)             | `@adapttable/mui`      | Server pagination with TanStack Query |
| [chakra-selection.tsx](./chakra-selection.tsx)   | `@adapttable/chakra`   | Selection + bulk actions              |
| [antd-basic.tsx](./antd-basic.tsx)               | `@adapttable/antd`     | AntD table, dark mode, row actions    |
| [unstyled-tailwind.tsx](./unstyled-tailwind.tsx) | `@adapttable/unstyled` | Tailwind classes + RTL/i18n           |
| [headless.tsx](./headless.tsx)                   | `@adapttable/core`     | Fully custom markup via prop-getters  |

Install the packages for the example you want (see each adapter's README),
then paste the file into your app.
