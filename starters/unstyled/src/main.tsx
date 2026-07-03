import "./styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";

// The unstyled adapter renders semantic HTML with data-* hooks; styles.css
// targets those parts. Swap it for your own CSS or Tailwind.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
