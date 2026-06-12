import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://orwa-mahmoud.github.io",
  base: "/adapttable",
  integrations: [
    starlight({
      title: "AdaptTable",
      description:
        "One headless React data-table engine, native adapters for Mantine, MUI, Chakra, Ant Design and Tailwind/shadcn.",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/orwa-mahmoud/adapttable",
        },
      ],
      sidebar: [
        {
          label: "Live demo",
          link: "/demo/",
          attrs: { target: "_blank" },
        },
        // Getting started serves AT the root (sync-docs gives it slug "").
        { label: "Getting started", link: "/" },
        { label: "Customization", slug: "customization" },
        { label: "URL state", slug: "url-state" },
        { label: "API reference", slug: "api" },
        { label: "Comparison", slug: "comparison" },
      ],
    }),
  ],
});
