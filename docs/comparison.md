# Comparison

How AdaptTable compares to popular React table libraries — scoped to what
each ships **built-in**. Every one of these projects is excellent at what it
targets; the table below is about scope fit, not quality. A "✗" means "not a
built-in feature" — most gaps can be closed with custom code or third-party
libraries.

| Feature                                        |  AG Grid  |    TanStack Table    | mantine-datatable | MUI X DataGrid |      **AdaptTable**       |
| ---------------------------------------------- | :-------: | :------------------: | :---------------: | :------------: | :-----------------------: |
| Headless core                                  |     ✗     |          ✓           |         ✗         |       ✗        |           **✓**           |
| Works across UI kits                           |     ✗     | ✓ (you build the UI) |   Mantine only    |    MUI only    | **✓ via ready adapters**  |
| Client **and** server data, same API           |  partial  |   wire it yourself   |         ✗         |    partial     |   **✓ (`TableSource`)**   |
| URL-synced state (shareable links)             |     ✗     |          ✗           |         ✗         |       ✗        |           **✓**           |
| Filter drawer + removable chips                |     ✗     |          ✗           |         ✗         |    partial     |      **✓ built-in**       |
| Infinite scroll **and** paged (auto by device) |     ✓     |      ✓ (manual)      |      partial      |    ✓ (paid)    |   **✓ auto by device**    |
| Responsive mobile card layout                  |  partial  |  build it yourself   |      partial      |    partial     | **✓ automatic + tunable** |
| Optional row/card virtualization               |     ✓     |      ✓ (manual)      |         ✗         |    ✓ (paid)    |   **✓ built-in opt-in**   |
| i18n + **RTL / Arabic** first-class            |  partial  |          ✗           |         ✗         |    partial     |           **✓**           |
| Dark mode                                      |     ✓     |         n/a          |         ✓         |       ✓        |      **✓ seamless**       |
| MIT / free                                     | open-core |          ✓           |         ✓         |   open-core    |           **✓**           |

<sub>Comparison as of June 2026, based on each project's public documentation; capabilities evolve, so verify against the latest docs. "Open-core" means a free, MIT/community edition plus paid Enterprise/Pro tiers (AG Grid Enterprise; MUI X DataGrid Pro/Premium); the advanced server-side data and infinite-loading features sit in those paid tiers. Spotted something outdated or wrong? Please open an issue — we will correct it promptly.</sub>

## When to choose AdaptTable

- You use **Mantine, MUI, Chakra, Ant Design, Radix, or shadcn/ui** and want a table
  that matches your kit without building it yourself.
- You need **the same table for both in-memory and server-paginated data**.
- You want **shareable, deep-linkable table state** for free.
- You want tables that stay usable on phones without horizontal-scroll hacks.
- You need **RTL / Arabic** done properly.
- You want a **headless escape hatch** when the defaults aren't enough — the
  same core powers both the batteries-included components and your own
  custom markup.

## When another library may fit better

- You need a heavyweight enterprise grid with pivoting, range selection, and
  Excel-style editing today → **AG Grid** / **MUI X DataGrid (paid)**.
- You're on a framework other than React → **TanStack Table** (multi-
  framework). AdaptTable is React-only for v1.
- You need a spreadsheet-like editing surface today, not a responsive data
  table for application lists.
