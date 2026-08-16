import "./styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { PageShell } from "./PageShell";
import { SelectionDemo } from "./SelectionDemo";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PageShell active="selection" root="..">
      {(dark) => <SelectionDemo dark={dark} />}
    </PageShell>
  </StrictMode>
);
