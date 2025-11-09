// @ts-check

import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://docs.albertplus.com",
  integrations: [
    starlight({
      title: "AlbertPlus Docs",
      logo: {
        light: "./src/assets/logo.svg",
        dark: "./src/assets/logo_dark.svg",
        replacesTitle: true,
        alt: "AlbertPlus logo",
      },
      customCss: ["./src/styles/theme.css"],
      favicon: "/favicon.ico",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/TechAtNYU/AlbertPlus",
        },
        {
          icon: "discord",
          label: "Discord",
          href: "https://discord.gg/z8p4Qtjatw",
        },
      ],
      editLink: {
        baseUrl: "https://github.com/TechAtNYU/AlbertPlus/edit/main/apps/docs",
      },
      sidebar: [
        { label: "Overview", slug: "overview" },
        {
          label: "Getting Started",
          items: [
            { label: "Quick Start", slug: "getting-started/quick-start" },
            {
              label: "Environment Variables",
              slug: "getting-started/environment-variables",
            },
            { label: "Tech Stack", slug: "getting-started/tech-stack" },
          ],
        },
        {
          label: "Architecture",
          items: [
            { label: "Overview", slug: "architecture/overview" },
            { label: "Monorepo Structure", slug: "architecture/monorepo" },
            { label: "Data Flow", slug: "architecture/data-flow" },
            { label: "Authentication", slug: "architecture/authentication" },
          ],
        },
        {
          label: "Modules",
          items: [
            { label: "Web App", slug: "modules/web-app" },
            {
              label: "Browser Extension",
              slug: "modules/browser-extension",
            },
            { label: "Scraper", slug: "modules/scraper" },
            { label: "Convex", slug: "modules/convex" },
            { label: "Documentation", slug: "modules/documentation" },
          ],
        },
        {
          label: "Contributing",
          slug: "contributing",
        },
      ],
    }),
  ],
});
