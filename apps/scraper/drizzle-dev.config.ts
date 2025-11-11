import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: "./.db.env" });

export default defineConfig({
  schema: "./src/drizzle/schema.ts",
  out: "./src/drizzle/migrations",
  dialect: "sqlite",
});
