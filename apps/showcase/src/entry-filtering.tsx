import "./styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { FilteringDemo } from "./FilteringDemo";
import { PageShell } from "./PageShell";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PageShell active="filtering" root="..">
      {(dark) => <FilteringDemo dark={dark} />}
    </PageShell>
  </StrictMode>
);
