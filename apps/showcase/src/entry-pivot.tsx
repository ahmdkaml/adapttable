import "./kitStyles";
import "./styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { PageShell } from "./PageShell";
import { PivotDemo } from "./PivotDemo";

// No provider here: the page mounts each kit's own, so switching the kit
// switches the panel and the table together.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PageShell active="pivot" root="..">
      {(dark) => <PivotDemo dark={dark} />}
    </PageShell>
  </StrictMode>
);
