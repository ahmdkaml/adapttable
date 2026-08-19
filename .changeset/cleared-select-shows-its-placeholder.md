---
"@adapttable/radix": patch
"@adapttable/base-ui": patch
---

A cleared select shows its placeholder. Both kits forbid an empty item value,
so the wrapper maps the empty value onto a token — and a list that offers no
empty choice has no item under that token, which left the Radix trigger blank
and printed the token itself in Base UI. The pivot panel's "Add field" says
what it does again.
