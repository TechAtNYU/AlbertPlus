---
title: "Overview"
---

AlbertPlus is designed as a modern, scalable, and maintainable platform. It leverages a monorepo architecture, a serverless backend, and a suite of specialized applications to deliver a comprehensive user experience. This section provides a high-level overview of the key architectural components.

## Core Modules

The AlbertPlus ecosystem is composed of several distinct yet interconnected applications and services:

- **Web Application**: A feature-rich Next.js application that serves as the primary user interface for course planning and schedule building.
- **Browser Extension**: A Chrome extension built with Plasmo that integrates with the native Albert website, providing a seamless user experience.
- **Web Scraper**: A Cloudflare Worker that periodically scrapes course data from NYU's public-facing systems to ensure the information in AlbertPlus is always up-to-date.
- **Serverless Backend**: A Convex-powered backend that provides a real-time database, serverless functions, and authentication services.
- **Documentation Site**: An Astro and Starlight-based website that you are currently viewing, which serves as the central hub for all project documentation.

## Architectural Principles

- **Modularity**: The monorepo structure allows for clear separation of concerns, with each application and package having a distinct responsibility.
- **Scalability**: The use of serverless technologies like Convex and Cloudflare Workers ensures that the platform can handle a growing number of users and data without the need for manual infrastructure management.
- **Developer Experience**: The project prioritizes a smooth developer experience through the use of modern tools like Turborepo, Bun, Nix, and Doppler.
