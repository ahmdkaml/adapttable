---
"@adapttable/antd": patch
---

A virtualized table renders its body as the element antd draws there. antd's
own virtualizer builds the body from divs, so the body part now names a div in
that mode and a `<tbody>` everywhere else — the markup is valid in both.
