---
title: "Enviroment Variables"
---

This page provides a comprehensive reference for all the environment variables required to run the AlbertPlus project. These variables should be managed and stored in your Doppler project.

## Web Application (`apps/web`)

These variables are required for the Next.js web application.

| Variable                            | Description                                  |
| ----------------------------------- | -------------------------------------------- |
| `NEXT_PUBLIC_CONVEX_URL`            | The URL of your Convex deployment.           |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | The publishable key for your Clerk frontend. |
| `CLERK_SECRET_KEY`                  | The secret key for your Clerk backend.       |
| `CONVEX_DEPLOYMENT`                 | The name of your Convex deployment.          |

## Browser Extension (`apps/browser`)

These variables are needed for the Chrome browser extension.

| Variable                        | Description                                       |
| ------------------------------- | ------------------------------------------------- |
| `PLASMO_PUBLIC_CONVEX_URL`      | The URL of your Convex deployment.                |
| `PLASMO_PUBLIC_CLERK_SYNC_HOST` | The host for Clerk's cross-origin authentication. |
| `CLERK_FRONTEND_API`            | The URL of your Clerk Frontend API.               |

## Scraper (`apps/scraper`)

These variables are required for the Cloudflare Worker scraper.

| Variable            | Description                                                                     |
| ------------------- | ------------------------------------------------------------------------------- |
| `CONVEX_SITE_URL`   | The HTTP API URL for your Convex backend.                                       |
| `CONVEX_API_KEY`    | An API key for authenticating with the Convex backend.                          |
| `SCRAPING_BASE_URL` | The base URL for the NYU course bulletins (e.g., `https://bulletins.nyu.edu/`). |

## Convex Backend (`packages/server`)

These variables are configured in your Convex deployment environment.

| Variable                  | Description                                                         |
| ------------------------- | ------------------------------------------------------------------- |
| `CLERK_JWT_ISSUER_DOMAIN` | The JWT issuer domain from your Clerk account for token validation. |
| `CONVEX_API_KEY`          | An API key for authenticating with the Convex backend.              |

## Cloudflare Worker Bindings

These are not environment variables in the traditional sense, but rather bindings configured in the `wrangler.jsonc` file.

| Binding          | Type        | Description                              |
| ---------------- | ----------- | ---------------------------------------- |
| `SCRAPING_QUEUE` | Queue       | Binding for the Cloudflare Worker queue. |
| `DB`             | D1 Database | Binding for the Cloudflare D1 database.  |
