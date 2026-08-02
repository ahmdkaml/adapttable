---
"@adapttable/core": patch
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/antd": patch
"@adapttable/unstyled": patch
---

`urlSync={false}` now really stops URL writes, and a lone table no longer warns
about itself.

`useResolvedAdapter` resolved an explicitly passed adapter before it checked
whether the hook was syncing, so `enabled: false` was ignored whenever a caller
supplied an adapter. Two things followed:

- A hook told not to sync still wrote through the caller's adapter — with a
  router adapter that meant `urlSync={false}` state landing in the real address
  bar.
- A table mounts both data tiers on one adapter and disables the inactive one.
  Both tiers therefore claimed the same URL namespace, and every single table
  logged the duplicate-namespace warning about itself. No prop could silence
  it: `urlKey` renamed both sides equally, and the warning that exists to report
  a real two-table collision could not be told apart from the false positive.

`enabled` is now checked first and beats an explicit adapter, so a disabled hook
always resolves to its own memory store. The genuine collision — two syncing
tables sharing a namespace — still warns.

The table shells that pre-resolve a URL backend no longer forward `urlSync` to
the tier hooks as well: the choice is already expressed by which adapter they
resolved, and applying it twice would route the active tier to a private store
that the saved-views menu could not read.
