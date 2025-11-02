---
title: "Scraper"
---

The scraper, located in the `apps/scraper` directory, is a critical component of the AlbertPlus platform. It is a Cloudflare Worker responsible for automatically collecting and updating course and program data from NYU's public-facing systems. This ensures that the information presented to students in the web app is accurate and up-to-date.

## Key Technologies

- **Runtime**: [Cloudflare Workers](https://workers.cloudflare.com/), a serverless execution environment that is fast, scalable, and cost-effective.
- **Framework**: [Hono](https://hono.dev/), a lightweight and fast web framework for the edge.
- **Database**: [Cloudflare D1](https://developers.cloudflare.com/d1/), a serverless SQLite database, used for managing the scraping job queue.
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/), a TypeScript ORM that provides a type-safe way to interact with the D1 database.
- **Job Queue**: The scraper uses a custom job queue implementation built on top of D1 and Cloudflare Queue to manage the scraping tasks.

## Scraping Process

The scraping process is designed to be robust and resilient:

1. **Scheduled Trigger**: A cron job defined in `wrangler.toml` triggers the scraper to run on a regular schedule.
2. **Job Discovery**: The initial job discovers all the available programs and courses and creates individual jobs for each one.
3. **Queueing**: These individual jobs are added to a queue in the D1 database.
4. **Job Processing**: The Cloudflare Worker processes jobs from the queue, scraping the data for each course or program.
5. **Data Upsert**: The scraped data is then sent to the Convex backend via an HTTP request to be stored in the main database.
6. **Error Handling**: The system includes error logging and a retry mechanism for failed jobs.

## Project Structure

The scraper's code is organized as follows:

- `src/index.ts`: The main entry point for the Cloudflare Worker, including the scheduled and queue handlers.
- `src/drizzle/`: The Drizzle ORM schema and database connection setup.
- `src/lib/`: Core libraries for interacting with Convex and managing the job queue.
- `src/modules/`: The logic for discovering and scraping courses and programs.
