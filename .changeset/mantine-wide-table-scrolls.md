---
"@adapttable/mantine": patch
---

Wide tables scroll sideways again. Columns with fixed pixel widths are supposed
to push the table past its container so it overflows rather than squashing them
to fit; the min-width that does it was going through Mantine's `miw` prop, which
rem-scales every value it receives into `calc(Xrem * var(--mantine-scale))` — and
that computes to `0` wherever the variable is out of scope. The table collapsed
to its container instead, so nothing scrolled and pinned columns had nothing to
stick against.
