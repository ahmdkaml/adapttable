# Comparison

How AdaptTable compares to popular React table libraries.

| Feature                                 |  ag-grid   |    TanStack Table    | mantine-datatable | MUI X DataGrid |      **AdaptTable**      |
| --------------------------------------- | :--------: | :------------------: | :---------------: | :------------: | :----------------------: |
| Headless core                           |     ✗      |          ✓           |         ✗         |       ✗        |          **✓**           |
| Works across UI kits                    |     ✗      | ✓ (you build the UI) |   Mantine only    |    MUI only    | **✓ via ready adapters** |
| Client **and** server data, same API    |  partial   |   wire it yourself   |         ✗         |    partial     |  **✓ (`TableSource`)**   |
| URL-synced state (shareable links)      |     ✗      |          ✗           |         ✗         |       ✗        |          **✓**           |
| Filter drawer + removable chips         |     ✗      |          ✗           |         ✗         |    partial     |      **✓ built-in**      |
| Virtualization + infinite **and** paged |     ✓      |      ✓ (manual)      |         ✗         |    ✓ (paid)    |   **✓ auto by device**   |
| i18n + **RTL / Arabic** first-class     |  partial   |          ✗           |         ✗         |    partial     |          **✓**           |
| Dark mode                               |     ✓      |         n/a          |         ✓         |       ✓        |      **✓ seamless**      |
| MIT / free                              | paid tiers |          ✓           |         ✓         |   paid tiers   |          **✓**           |

## When to choose AdaptTable

- You use **Mantine, MUI, Chakra, or Tailwind/shadcn** and want a table that
  matches your kit without building it yourself.
- You need **the same table for both in-memory and server-paginated data**.
- You want **shareable, deep-linkable table state** for free.
- You need **RTL / Arabic** done properly.
- You want a **headless escape hatch** when the defaults aren't enough — the
  same core powers both the batteries-included components and your own
  custom markup.

## When another library may fit better

- You need a heavyweight enterprise grid with pivoting, range selection, and
  Excel-style editing today → **ag-grid** / **MUI X DataGrid (paid)**.
- You're on a framework other than React → **TanStack Table** (multi-
  framework). AdaptTable is React-only for v1.
