---
"@adapttable/cli": minor
---

`init` now detects Radix Themes and shadcn/ui. A project depending on
`@radix-ui/themes` scaffolds the `@adapttable/radix` adapter, and a Tailwind
project with a `components.json` scaffolds `@adapttable/shadcn`. The Chakra
version hint is also corrected: it now warns when Chakra **v2** is detected (the
adapter targets v3) instead of telling v3 users — the supported setup — to
downgrade.
