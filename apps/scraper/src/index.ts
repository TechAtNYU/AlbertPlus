import { eq } from "drizzle-orm";
import type { Context, Next } from "hono";
import { Hono } from "hono";
import getDB from "./drizzle";
import { errorLogs, jobs } from "./drizzle/schema";
import { ConvexApi } from "./lib/convex";
import { JobError, type JobMessage } from "./lib/queue";
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
app.post("/api/majors", validateApiKey, async (c) => {
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

  async scheduled(_event: ScheduledEvent, _env: CloudflareBindings) {
    // const db = getDB(env);
    // const convex = new ConvexApi({
    //   baseUrl: env.CONVEX_SITE_URL,
    //   apiKey: env.CONVEX_API_KEY,
    // });
    // TODO: add albert public search
    return;
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
                const newJobs = await db
                  .insert(jobs)
                  .values(
                    courseUrls.map((url) => ({
                      url,
                      jobType: "course" as const,
                    })),
                  )
                  .returning();

                await env.SCRAPING_QUEUE.sendBatch(
                  newJobs.map((j) => ({ body: { jobId: j.id } })),
                );
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
                const res = await scrapeCourse(job.url, db, env);

                const courseId = await convex.upsertCourseWithPrerequisites({
                  ...res.course,
                  prerequisites: res.prerequisites,
                });

                if (!courseId) {
                  throw new JobError(
                    "Failed to upsert course: no ID returned",
                    "validation",
                  );
                }
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
