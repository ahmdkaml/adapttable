---
"@adapttable/core": minor
---

The saved-views management panel is a titled card. Applying a view is clicking
its name — the widest target on the row — and rename, move up, move down,
set-default and delete are an icon cluster at the end of the line, each with
its own localized accessible name. `SavedViewsPanelChromeProps` takes a
`footer` that renders inside the card, under the list.

Adapters build the cluster by mapping over `controls` (`SavedViewRowControl`,
keyed by `SavedViewControlKey`) instead of writing five buttons each, and the
card names two more parts: `saved-views-title` and `saved-views-footer`.
