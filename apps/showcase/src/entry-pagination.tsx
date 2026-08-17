import "./kitStyles";
import "./styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { PageShell } from "./PageShell";
import { PaginationDemo } from "./PaginationDemo";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PageShell active="pagination" root="..">
      {(dark) => <PaginationDemo dark={dark} />}
    </PageShell>
  </StrictMode>
);
