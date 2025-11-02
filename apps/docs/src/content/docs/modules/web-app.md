---
title: "Web Application"
---

The web application, located in the `apps/web` directory, is the heart of the AlbertPlus platform. It is a modern, feature-rich application built with Next.js and React, providing students with a powerful and intuitive interface for course planning and registration.

## Key Technologies

- **Framework**: [Next.js](https://nextjs.org/) 15 with the App Router, enabling a flexible and scalable application structure.
- **Language**: [TypeScript](https://www.typescriptlang.org/), for type safety and improved developer experience.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) v4, for a utility-first approach to styling.
- **Authentication**: [Clerk](https://clerk.com/) for user management and authentication.
- **Backend**: [Convex](https://www.convex.dev/) for the serverless backend and real-time database.

## Project Structure

The web application follows the standard Next.js App Router structure:

- `src/app/`: Contains the main application routes and layouts.
- `src/components/`: Shared UI components used throughout the application.
- `src/hooks/`: Custom React hooks.
- `src/lib/`: Utility functions and library configurations.
- `src/modules/`: Feature-specific modules.
