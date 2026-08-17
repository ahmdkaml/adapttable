import "@mantine/core/styles.css";
import "./styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { ExportPdfDemo } from "./ExportPdfDemo";
import { PageShell } from "./PageShell";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PageShell active="export" root="..">
      {(dark) => <ExportPdfDemo dark={dark} />}
    </PageShell>
  </StrictMode>
);
