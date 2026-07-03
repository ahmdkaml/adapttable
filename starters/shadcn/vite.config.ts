import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// shadcn/ui is Tailwind utilities, so the Tailwind Vite plugin compiles them.
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
