import "./styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { PageShell } from "./PageShell";
import { TreeDemo } from "./TreeDemo";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PageShell active="tree" root="..">
      {(dark) => <TreeDemo dark={dark} />}
    </PageShell>
  </StrictMode>
);
