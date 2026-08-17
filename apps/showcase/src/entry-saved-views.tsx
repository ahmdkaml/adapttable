import "./kitStyles";
import "./styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { PageShell } from "./PageShell";
import { SavedViewsDemo } from "./SavedViewsDemo";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PageShell active="saved-views" root="..">
      {(dark) => <SavedViewsDemo dark={dark} />}
    </PageShell>
  </StrictMode>
);
