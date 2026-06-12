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
      head: [
        // Social-share image for every page. PNG, 1200x630: most link
        // unfurlers (Slack, X, LinkedIn, WhatsApp) ignore SVG og images.
        {
          tag: "meta",
          attrs: {
            property: "og:image",
            content: "https://orwa-mahmoud.github.io/adapttable/og.png",
          },
        },
        { tag: "meta", attrs: { property: "og:image:width", content: "1200" } },
        { tag: "meta", attrs: { property: "og:image:height", content: "630" } },
        {
          tag: "meta",
          attrs: {
            name: "twitter:image",
            content: "https://orwa-mahmoud.github.io/adapttable/og.png",
          },
        },
        {
          tag: "meta",
          attrs: {
            name: "robots",
            content: "index, follow, max-image-preview:large",
          },
        },
        // Entity data for search engines and answer engines.
        {
          tag: "script",
          attrs: { type: "application/ld+json" },
          content: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "AdaptTable",
            description:
              "Headless, UI-agnostic React data table with native adapters for Mantine, MUI, Chakra UI, Ant Design and Tailwind/shadcn — URL-synced state, declarative filters, column management, virtualization, i18n and RTL.",
            url: "https://orwa-mahmoud.github.io/adapttable/",
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Any",
            license: "https://opensource.org/license/mit",
            programmingLanguage: "TypeScript",
            codeRepository: "https://github.com/orwa-mahmoud/adapttable",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          }),
        },
      ],
      social: [
        {
          icon: "rocket",
          label: "Live demo",
          href: "https://orwa-mahmoud.github.io/adapttable/demo/",
        },
        {
          icon: "npm",
          label: "npm",
          href: "https://www.npmjs.com/org/adapttable",
        },
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/orwa-mahmoud/adapttable",
        },
      ],
      sidebar: [
        {
          label: "Start",
          items: [
            { label: "Getting started", slug: "getting-started" },
            { label: "Concepts", slug: "concepts" },
            { label: "Data tiers", slug: "data-tiers" },
          ],
        },
        {
          label: "Features",
          items: [
            { label: "Columns", slug: "columns" },
            { label: "Sorting", slug: "sorting" },
            { label: "Filtering", slug: "filtering" },
            { label: "Pagination", slug: "pagination" },
            { label: "Selection & bulk actions", slug: "selection" },
            { label: "Row expansion", slug: "row-expansion" },
            { label: "Column management", slug: "column-management" },
            { label: "Saved views", slug: "saved-views" },
            { label: "Virtualization", slug: "virtualization" },
          ],
        },
        {
          label: "Beyond the table",
          items: [
            { label: "URL state", slug: "url-state" },
            { label: "Customization", slug: "customization" },
            { label: "i18n & RTL", slug: "i18n-rtl" },
          ],
        },
        {
          label: "Reference",
          items: [
            { label: "API reference", slug: "api" },
            { label: "FAQ", slug: "faq" },
            { label: "Comparison", slug: "comparison" },
          ],
        },
      ],
    }),
  ],
});
