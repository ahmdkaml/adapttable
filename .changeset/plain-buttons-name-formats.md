---
"@adapttable/core": minor
"@adapttable/antd": patch
"@adapttable/base-ui": patch
"@adapttable/chakra": patch
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/radix": patch
"@adapttable/shadcn": patch
"@adapttable/unstyled": patch
"@adapttable/i18n": minor
---

The export button names the format it produces. With the spreadsheet writer it
reads "Export XLSX", and a custom writer calling itself `tsv` gets "Export TSV" —
from a new `labels.exportFile(format)`, translated in all seventeen locales.

CSV is untouched: it still reads `labels.exportCsv`, so its existing
translations, and any wording a host overrode, stand exactly as they were.
