/**
 * Database Seeding Script for AlbertPlus
 *
 * This script reads all JSON seed files and calls the Convex internal mutation
 * via the Convex CLI to seed the database with proper relationship handling.
 *
 * Usage:
 *   bun seed/seed.ts
 *
 * Configuration:
 *   Set TEST_USER_ID environment variable to seed data for a specific user
 *   export TEST_USER_ID="user_2abc123xyz"
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

const TEST_USER_ID = process.env.TEST_USER_ID || "user_test_123";

async function readJSON(filename: string) {
  const file = Bun.file(new URL(filename, import.meta.url));
  return await file.json();
}

async function seedDatabase() {
  console.log("🌱 Loading seed data files...\n");

  try {
    const appConfigs = await readJSON("appConfigs.json");
    const schools = await readJSON("schools.json");
    const programs = await readJSON("programs.json");
    const courses = await readJSON("courses.json");
    const courseOfferings = await readJSON("courseOfferings.json");
    const prerequisites = await readJSON("prerequisites.json");
    const requirements = await readJSON("requirements.json");
    const studentsData = await readJSON("students.json");
    const userCoursesData = await readJSON("userCourses.json");
    const userCourseOfferingsData = await readJSON("userCourseOfferings.json");

    // biome-ignore lint/suspicious/noExplicitAny: JSON data doesn't have types
    const students = studentsData.map((student: any) => ({
      ...student,
      userId: TEST_USER_ID,
    }));

    // biome-ignore lint/suspicious/noExplicitAny: JSON data doesn't have types
    const userCourses = userCoursesData.map((course: any) => ({
      ...course,
      userId: TEST_USER_ID,
    }));

    const userCourseOfferings = userCourseOfferingsData.map(
      // biome-ignore lint/suspicious/noExplicitAny: JSON data doesn't have types
      (offering: any) => ({
        ...offering,
        userId: TEST_USER_ID,
      }),
    );

    console.log("📊 Loaded seed data:");
    console.log(`  - ${appConfigs.length} app configs`);
    console.log(`  - ${schools.length} schools`);
    console.log(`  - ${programs.length} programs`);
    console.log(`  - ${courses.length} courses`);
    console.log(`  - ${courseOfferings.length} course offerings`);
    console.log(`  - ${prerequisites.length} prerequisites`);
    console.log(`  - ${requirements.length} requirements`);
    console.log(`  - ${students.length} students`);
    console.log(`  - ${userCourses.length} user courses`);
    console.log(`  - ${userCourseOfferings.length} user course offerings`);
    console.log(`\n🔑 Using TEST_USER_ID: ${TEST_USER_ID}\n`);

    const data = JSON.stringify({
      appConfigs,
      schools,
      programs,
      courses,
      courseOfferings,
      prerequisites,
      requirements,
      students,
      userCourses,
      userCourseOfferings,
    });

    console.log("🚀 Calling Convex internal mutation via CLI...\n");

    const command = `npx convex run seed:seedAll --no-push '${data.replace(/'/g, "'\\''")}'`;

    const { stdout, stderr } = await execAsync(command, {
      cwd: new URL("..", import.meta.url).pathname,
      maxBuffer: 10 * 1024 * 1024,
    });

    if (stderr) {
      console.error("stderr:", stderr);
    }

    console.log(stdout);
    console.log("\n✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("\n❌ Database seeding failed:");
    console.error(error);
    process.exit(1);
  }
}

seedDatabase();
