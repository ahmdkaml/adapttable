import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Tailwind utilities style the unstyled adapter via the `classNames` prop.
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
