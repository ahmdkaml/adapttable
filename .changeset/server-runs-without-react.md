---
"@adapttable/server": patch
---

Runs in a backend with no React. The codecs come from `@adapttable/core/query`,
so nothing in the installed graph imports React or carries a `"use client"`
boundary — `npm install @adapttable/server` in an Express or Fastify service
gets a 1.5 KB parser and no UI library.
