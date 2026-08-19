---
"@adapttable/core": minor
---

`routerUrlAdapter` turns the documented router recipes into a supported export.

Every recipe — React Router, TanStack Router, Next.js App Router — was the same
twelve lines with two names changed, copied into each app where nobody could fix
it centrally. They are the same because the question is: given a way to read the
current query string and a way to navigate, what is a correct adapter? Each
router is now two lines.

It depends on no router, which is what lets it ship: a package importing
`next/navigation` would work for one framework and break the build of every
other.
