---
title: "Convex"
---

The backend for AlbertPlus is powered by [Convex](https://www.convex.dev/), a modern, serverless backend platform that provides a real-time database, serverless functions, and built-in authentication. The Convex-related code is located in the `packages/server` directory.

## Key Features of Convex

- **Real-time Database**: Convex's database is reactive by default. When data changes in the backend, the frontend automatically updates without needing any special code for data fetching or state management.
- **Serverless Functions**: You can write serverless functions in TypeScript, which can be either queries (for reading data) or mutations (for writing data). These functions are executed on the Convex backend and can be called directly from your frontend code.
- **Authentication**: Convex integrates seamlessly with authentication providers like Clerk, allowing you to build secure applications with protected data.
- **Full-stack Type Safety**: Convex provides end-to-end type safety. The types for your database schema and serverless functions are automatically generated and can be used in your frontend code, eliminating a common source of bugs.

## Development Workflow

When you run `bun dev`, the Convex development server starts up, providing you with a local backend environment. You can use the Convex dashboard to view your data, inspect logs, and manage your backend.

To open the Convex dashboard, run:

```bash
bun run dashboard
```

## Database Schemas

| Table                 | Description                                                                     |
| --------------------- | ------------------------------------------------------------------------------- |
| `appConfigs`          | Stores key-value pairs for application configuration.                           |
| `programs`            | Contains information about academic programs (majors, minors, etc.).            |
| `requirements`        | Defines the course requirements for each academic program.                      |
| `courses`             | A catalog of all available courses.                                             |
| `prerequisites`       | Stores the prerequisite relationships between courses.                          |
| `courseOfferings`     | Represents specific sections of a course offered in a particular term.          |
| `userCourses`         | Stores the courses that a user has completed, typically from a degree audit.    |
| `userCourseOfferings` | Links users to the specific course offerings they have added to their schedule. |
| `students`            | Stores student-specific information, linked to a Clerk user ID.                 |
| `schools`             | A list of the different schools within NYU.                                     |
