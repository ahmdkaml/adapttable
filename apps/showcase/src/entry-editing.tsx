import "@mantine/core/styles.css";
import "./styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { EditingDemo } from "./EditingDemo";
import { PageShell } from "./PageShell";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PageShell active="editing" root="..">
      {(dark) => <EditingDemo dark={dark} />}
    </PageShell>
  </StrictMode>
);
