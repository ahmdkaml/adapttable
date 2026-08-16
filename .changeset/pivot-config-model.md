---
"@adapttable/core": minor
---

The pivot configuration model joins `@adapttable/core/pivot`: `assignField`,
`removeField`, `moveField`, `setMeasureAgg` and `availableFields`.

Every operation returns a new configuration and none of them can produce an
invalid one. Placing a dimension on one axis takes it off the other rather than
pivoting the same field twice; an index past the end appends; a step past either
end is a no-op rather than a wrap. Measures are the exception — summing and
counting the same column in one pivot is ordinary, so a measure is added rather
than moved.
