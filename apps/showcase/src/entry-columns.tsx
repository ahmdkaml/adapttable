import "@mantine/core/styles.css";
import "./tailwind.css";
import "./styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { ColumnsDemo, PageShell } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PageShell active="columns" root="..">
      {(dark) => <ColumnsDemo dark={dark} />}
    </PageShell>
  </StrictMode>
);
