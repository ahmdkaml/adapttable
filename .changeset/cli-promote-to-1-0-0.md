---
"@adapttable/cli": major
---

cli: promote to 1.0.0 — the version story now matches the stable library.

`npx @adapttable/cli init` is AdaptTable's first-touch experience, so the CLI
sitting on 0.x while every library package shipped at 1.0.0 undercut the
"stable 1.0" message even though the scaffolder itself has been stable in
practice. A `major` bump on a 0.x package moves it 0.2.0 → 1.0.0. The CLI stays
outside the library fixed group and keeps its own release cadence, exactly as
documented in the versioning policy.
