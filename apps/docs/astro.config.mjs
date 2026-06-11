import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://orwa-mahmoud.github.io",
  base: "/adapttable",
  // The root IS the docs: land straight on Getting started instead of a
  // separate marketing page (the showcase at /demo plays that role).
  redirects: { "/": "/adapttable/getting-started/" },
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
        { label: "Getting started", slug: "getting-started" },
        { label: "Customization", slug: "customization" },
        { label: "URL state", slug: "url-state" },
        { label: "API reference", slug: "api" },
        { label: "Comparison", slug: "comparison" },
      ],
    }),
  ],
});
