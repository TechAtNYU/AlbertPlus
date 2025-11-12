import { eq } from "drizzle-orm";
import type { Context, Next } from "hono";
import { Hono } from "hono";
import getDB from "./drizzle";
import { errorLogs, jobs } from "./drizzle/schema";
import { ConvexApi } from "./lib/convex";
import { JobError, type JobMessage } from "./lib/queue";
import {
  discoverCourseOfferings,
  scrapeCourseOfferings,
} from "./modules/courseOfferings";
import { discoverCourses, scrapeCourse } from "./modules/courses";
import { discoverPrograms, scrapeProgram } from "./modules/programs";

const app = new Hono<{ Bindings: CloudflareBindings }>();

const validateApiKey = async (
  c: Context<{ Bindings: CloudflareBindings }>,
  next: Next,
) => {
  const apiKey = c.req.header("X-API-KEY");

  if (!apiKey) {
    return c.json({ error: "Missing API key" }, 401);
  }

  if (apiKey !== c.env.CONVEX_API_KEY) {
    return c.json({ error: "Invalid API key" }, 403);
  }

  await next();
};

app.get("/", async (c) => {
  // const db = await getDB(c.env);
  // TODO: use hono to render a dashboard to monitor the scraping status
  return c.json({ status: "ok" });
});

// Endpoint to trigger major discovery scraping
app.post("/api/programs", validateApiKey, async (c) => {
  const db = getDB(c.env);

  const programsUrl = new URL("/programs", c.env.SCRAPING_BASE_URL).toString();

  const [createdJob] = await db
    .insert(jobs)
    .values({ url: programsUrl, jobType: "discover-programs" })
    .returning();

  await c.env.SCRAPING_QUEUE.send({ jobId: createdJob.id });

  console.log(`Created major discovery job [id: ${createdJob.id}]`);

  return c.json({
    success: true,
    jobId: createdJob.id,
    jobType: createdJob.jobType,
  });
});

// Endpoint to trigger course discovery scraping
app.post("/api/courses", validateApiKey, async (c) => {
  const db = getDB(c.env);

  const coursesUrl = new URL("/courses", c.env.SCRAPING_BASE_URL).toString();

  const [createdJob] = await db
    .insert(jobs)
    .values({ url: coursesUrl, jobType: "discover-courses" })
    .returning();

  await c.env.SCRAPING_QUEUE.send({ jobId: createdJob.id });

  console.log(`Created course discovery job [id: ${createdJob.id}]`);

  return c.json({
    success: true,
    jobId: createdJob.id,
    jobType: createdJob.jobType,
  });
});

export default {
  fetch: app.fetch,

  async scheduled(_event: ScheduledEvent, env: CloudflareBindings) {
    const db = getDB(env);
    const convex = new ConvexApi({
      baseUrl: env.CONVEX_SITE_URL,
      apiKey: env.CONVEX_API_KEY,
    });

    // Get scraping flags from Convex app config
    const isScrapeCurrentData = await convex.getAppConfig({
      key: "is_scrape_current",
    });
    const isScrapeNextData = await convex.getAppConfig({
      key: "is_scrape_next",
    });

    const isScrapeCurrent = isScrapeCurrentData === "true";
    const isScrapeNext = isScrapeNextData === "true";

    console.log(
      `Cronjob: Scraping flags - current: ${isScrapeCurrent}, next: ${isScrapeNext}`,
    );

    // Collect unique terms to scrape using a Map to deduplicate
    const termsMap = new Map<
      string,
      { term: "spring" | "summer" | "fall" | "j-term"; year: number }
    >();

    if (isScrapeCurrent) {
      const currentTerm = (await convex.getAppConfig({
        key: "current_term",
      })) as "spring" | "summer" | "fall" | "j-term";
      const currentYearStr = await convex.getAppConfig({ key: "current_year" });
      if (currentYearStr) {
        const currentYear = Number.parseInt(currentYearStr, 10);
        const key = `${currentTerm}-${currentYear}`;
        termsMap.set(key, { term: currentTerm, year: currentYear });
      }
    }

    if (isScrapeNext) {
      const nextTerm = (await convex.getAppConfig({ key: "next_term" })) as
        | "spring"
        | "summer"
        | "fall"
        | "j-term";
      const nextYearStr = await convex.getAppConfig({ key: "next_year" });
      if (nextYearStr) {
        const nextYear = Number.parseInt(nextYearStr, 10);
        const key = `${nextTerm}-${nextYear}`;
        termsMap.set(key, { term: nextTerm, year: nextYear });
      }
    }

    const termsToScrape = Array.from(termsMap.values());

    // Trigger course offerings discovery for each enabled term
    const courseOfferingsUrl = new URL(env.SCRAPING_BASE_URL).toString();

    for (const { term, year } of termsToScrape) {
      const [createdJob] = await db
        .insert(jobs)
        .values({
          url: courseOfferingsUrl,
          jobType: "discover-course-offerings",
          metadata: { term, year },
        })
        .returning();

      await env.SCRAPING_QUEUE.send({ jobId: createdJob.id });

      console.log(
        `Cronjob: Created course offerings discovery job [id: ${createdJob.id}, term: ${term}, year: ${year}]`,
      );
    }
  },

  async queue(
    batch: MessageBatch<JobMessage>,
    env: CloudflareBindings,
    ctx: ExecutionContext,
  ) {
    const db = getDB(env);
    const convex = new ConvexApi({
      baseUrl: env.CONVEX_SITE_URL,
      apiKey: env.CONVEX_API_KEY,
    });

    for (const message of batch.messages) {
      const { jobId } = message.body;

      const job = await db.select().from(jobs).where(eq(jobs.id, jobId)).get();

      if (!job) {
        message.ack();
        continue;
      }

      ctx.waitUntil(
        (async () => {
          try {
            await db
              .update(jobs)
              .set({ status: "processing", startedAt: new Date() })
              .where(eq(jobs.id, jobId));

            switch (job.jobType) {
              case "discover-programs": {
                const programUrls = await discoverPrograms(job.url);
                const newJobs = await db
                  .insert(jobs)
                  .values(
                    programUrls.map((url) => ({
                      url,
                      jobType: "program" as const,
                    })),
                  )
                  .returning();

                await env.SCRAPING_QUEUE.sendBatch(
                  newJobs.map((j) => ({ body: { jobId: j.id } })),
                );
                break;
              }
              case "discover-courses": {
                const courseUrls = await discoverCourses(job.url);
                // NOTE: Cloudflare Queues has a limit of 100 messages per sendBatch()
                console.log(`Discovered ${courseUrls.length} course URLs`);

                const BATCH_SIZE = 10;
                for (let i = 0; i < courseUrls.length; i += BATCH_SIZE) {
                  const batch = courseUrls.slice(i, i + BATCH_SIZE);

                  const newJobs = await db
                    .insert(jobs)
                    .values(
                      batch.map((url) => ({
                        url,
                        jobType: "course" as const,
                      })),
                    )
                    .returning();

                  await env.SCRAPING_QUEUE.sendBatch(
                    newJobs.map((j) => ({ body: { jobId: j.id } })),
                  );

                  console.log(
                    `Queued batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(courseUrls.length / BATCH_SIZE)} (${newJobs.length} jobs)`,
                  );
                }
                break;
              }
              case "program": {
                const res = await scrapeProgram(job.url, db, env);

                const programId = await convex.upsertProgramWithRequirements({
                  ...res.program,
                  requirements: res.requirements,
                });

                if (!programId) {
                  throw new JobError(
                    "Failed to upsert program: no ID returned",
                    "validation",
                  );
                }
                break;
              }
              case "course": {
                // A single URL may contain multiple courses
                const courses = await scrapeCourse(job.url, db, env);

                console.log(
                  `Scraped ${courses.length} courses from ${job.url}`,
                );

                for (const courseData of courses) {
                  const courseId = await convex.upsertCourseWithPrerequisites({
                    ...courseData.course,
                    prerequisites: courseData.prerequisites,
                  });

                  if (!courseId) {
                    throw new JobError(
                      `Failed to upsert course ${courseData.course.code}: no ID returned`,
                      "validation",
                    );
                  }
                }
                break;
              }
              case "discover-course-offerings": {
                const metadata = job.metadata as {
                  term: "spring" | "summer" | "fall" | "j-term";
                  year: number;
                } | null;

                if (!metadata?.term || !metadata?.year) {
                  throw new JobError(
                    "Missing term or year in job metadata",
                    "validation",
                  );
                }

                const courseOfferingUrls = await discoverCourseOfferings(
                  job.url,
                  metadata.term,
                  metadata.year,
                );
                const newJobs = await db
                  .insert(jobs)
                  .values(
                    courseOfferingUrls.map((url) => ({
                      url,
                      jobType: "course-offering" as const,
                      metadata: { term: metadata.term, year: metadata.year },
                    })),
                  )
                  .returning();

                await env.SCRAPING_QUEUE.sendBatch(
                  newJobs.map((j) => ({ body: { jobId: j.id } })),
                );
                break;
              }
              case "course-offering": {
                const courseOfferings = await scrapeCourseOfferings(
                  job.url,
                  db,
                  env,
                );

                await convex.upsertCourseOfferings(courseOfferings);
                break;
              }
            }

            await db
              .update(jobs)
              .set({ status: "completed", completedAt: new Date() })
              .where(eq(jobs.id, jobId));

            message.ack();
          } catch (error) {
            const jobError =
              error instanceof JobError
                ? error
                : new JobError(
                    error instanceof Error ? error.message : "Unknown error",
                  );

            await db.insert(errorLogs).values({
              jobId: jobId,
              errorType: jobError.type,
              errorMessage: jobError.message,
              stackTrace: jobError.stack || null,
              timestamp: new Date(),
            });

            await db
              .update(jobs)
              .set({ status: "failed" })
              .where(eq(jobs.id, jobId));

            message.retry();
          }
        })(),
      );
    }
  },
};
