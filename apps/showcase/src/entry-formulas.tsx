import "./kitStyles";
import "./styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { FormulasDemo } from "./FormulasDemo";
import { PageShell } from "./PageShell";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PageShell active="formulas" root="..">
      {(dark) => <FormulasDemo dark={dark} />}
    </PageShell>
  </StrictMode>
);
