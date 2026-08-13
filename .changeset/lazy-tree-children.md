---
"@adapttable/core": minor
---

Tree children fetched when a branch is opened

`hasChildren(row)` draws a chevron on a node whose children the browser has not
fetched, and `onLoadChildren(row)` fills it when the reader opens it. The node
opens immediately and shows it is working — `data-loading` and `aria-busy` on its
chevron — so nobody is left clicking a control that appears to do nothing. One
request per node however many times it is clicked; a rejection clears the flag
and leaves the node closed and clickable, so the retry is the same gesture.

Headless: `useLazyChildren`; the table's tree bundle carries `loadingIds` and
`failedIds`.
