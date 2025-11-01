<div align="center">
    <!-- TODO: currently we don't have logo set up -->
  <!-- <a href="https://albertplus.com"> -->
  <!--   <img src="https://raw.githubusercontent.com/TechAtNYU/AlbertPlus/main/apps/web/public/logo.svg" alt="Logo" width="80" height="80"> -->
  <!-- </a> -->

  <h3 align="center">AlbertPlus</h3>

  <p align="center">
    A modern, open-source platform to enhance the NYU course planning and registration experience.
    <br />
    <br />
    <a href="https://albertplus.com">Website</a>
    ·
    <a href="https://docs.albertplus.com">Documentation</a>
    ·
    <a href="https://github.com/TechAtNYU/AlbertPlus/issues">Bug Report/Feature Request</a>
  </p>
</div>

<div align="center">

[![CI](https://github.com/TechAtNYU/AlbertPlus/actions/workflows/ci.yaml/badge.svg)](https://github.com/TechAtNYU/AlbertPlus/actions/workflows/ci.yaml)
[![Web Deploy](https://github.com/TechAtNYU/AlbertPlus/actions/workflows/web.yaml/badge.svg)](https://github.com/TechAtNYU/AlbertPlus/actions/workflows/web.yaml)
[![Docs Deploy](https://github.com/TechAtNYU/AlbertPlus/actions/workflows/docs.yaml/badge.svg)](https://github.com/TechAtNYU/AlbertPlus/actions/workflows/docs.yaml)
[![Scraper Deploy](https://github.com/TechAtNYU/AlbertPlus/actions/workflows/scraper.yaml/badge.svg)](https://github.com/TechAtNYU/AlbertPlus/actions/workflows/scraper.yaml)
[![Browser Extension Deploy](https://github.com/TechAtNYU/AlbertPlus/actions/workflows/browser.yml/badge.svg)](https://github.com/TechAtNYU/AlbertPlus/actions/workflows/browser.yml)
[![Convex Deploy](https://github.com/TechAtNYU/AlbertPlus/actions/workflows/convex.yaml/badge.svg)](https://github.com/TechAtNYU/AlbertPlus/actions/workflows/convex.yaml)

</div>

---

## Table of Contents

- [About The Project](#about-the-project)
  - [Built With](#built-with)
- [Deployed Sites](#deployed-sites)
- [Getting Started](#getting-started)
- [Contributing](#contributing)
- [License](#license)

## About The Project

AlbertPlus is a comprehensive, open-source platform designed to enhance the course registration experience for New York University (NYU) students. It provides a modern, intuitive interface and a suite of tools to help students plan their academic journey, build schedules, and navigate the complexities of course selection. The project is a monorepo that consists of a web application, a browser extension, a web scraper, and a documentation site, all powered by a Convex backend.

### Built With

This project is built with a modern and robust tech stack, including:

- **Core:** TypeScript, React 19, Next.js 15, Convex, Bun, Turborepo
- **Specialized:** Plasmo, Cloudflare Workers, Hono, Drizzle ORM, Astro, Starlight, Clerk

For a full list of technologies, please refer to the [Tech Stack](https://docs.albertplus.com/getting-started/tech-stack/) documentation.

## Deployed Sites

You can explore the deployed instances of AlbertPlus:

- **Production App:** [albertplus.com](https://albertplus.com) - The main web application for course planning and schedule building.
- **Development App:** [dev.albertplus.com](https://dev.albertplus.com) - The development instance of the web application.
- **Documentation:** [docs.albertplus.com](https://docs.albertplus.com) - This documentation site.
- **Scraper:** [scraper.albertplus.com](https://scraper.albertplus.com) - The Cloudflare Worker that scrapes course data from NYU public sites.

## Getting Started

To get a local copy up and running, please follow the instructions in our [Quick Start](https://docs.albertplus.com/getting-started/quick-start/) guide.

## Contributing

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also contribute by opening an issue for bug report or feature request.

For more information, please see our [Contributing Guidelines](https://docs.albertplus.com/getting-started/contributing/).

## License

Distributed under the MIT License. See `LICENSE` for more information.
