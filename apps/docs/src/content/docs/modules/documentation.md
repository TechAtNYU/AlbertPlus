---
title: Documentation
---

The documentation site you are currently viewing is a key part of the AlbertPlus project. It is located in the `apps/docs` directory and is built using modern documentation tools to provide a comprehensive and easy-to-navigate resource for developers and contributors.

## Key Technologies

- **Framework**: [Astro](https://astro.build/), a web framework for building fast, content-focused websites.
- **Documentation Theme**: [Starlight](https://starlight.astro.build/), an official Astro theme designed for building beautiful and functional documentation sites.
- **Language**: [Markdown](https://www.markdownguide.org/) and [MDX](https://mdxjs.com/), for writing content.

## Purpose

The primary purpose of this site is to serve as the central source of truth for the AlbertPlus project. It provides detailed information on:

- Getting started with the project.
- The project's architecture and data flow.
- The individual applications and their features.
- The backend and database schema.
- Development workflows and coding standards.
- Deployment processes.
- How to contribute to the project.

## Project Structure

The documentation site follows the structure recommended by Starlight:

- `src/content/docs/`: Contains all the Markdown and MDX files that make up the documentation pages.
- `astro.config.mjs`: The main configuration file for the Astro site, including the Starlight integration and sidebar navigation setup.
- `src/assets/`: Static assets such as images and icons.
- `public/`: Public assets that are copied directly to the build output.
