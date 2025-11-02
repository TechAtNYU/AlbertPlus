---
title: "Quick Start"
---

## Prerequisites

Before you begin, ensure you have the following software installed on your system. This project offers two primary setup methods: a standard setup using Node.js and Bun, and a more reproducible environment using Nix.

### Standard Setup

For the standard setup, you will need:

- **Node.js**: Version 20 or higher.
- **Bun**: A fast JavaScript all-in-one toolkit. Bun is used as the package manager for this project. You can find installation instructions on the [official Bun website](https://bun.sh/).

### Nix-based Setup

For a more declarative and reproducible development environment, you can use Nix. The project includes a `flake.nix` file that defines all the necessary dependencies.

- **Nix**: The purely functional package manager. Follow the instructions on the [NixOS website](https://nixos.org/download.html) to install Nix on your system.
- **Direnv** (optional but recommended): To automatically load the Nix shell when you enter the project directory.

By using the Nix flake, the correct versions of Node.js, Bun, Doppler, and other development tools will be automatically provisioned for you.

## Environment Variables

We use Doppler for managing environmental variables. Follow the instruction on [Doppler docs](https://docs.doppler.com/docs/start). See the [Environment Variables](/getting-started/environment-variables) page for a complete list of all required variables for each application in the monorepo.

## Running the Development Server

To start all the applications in development mode, run the following command from the root of the project:

```bash
bun run dev
```

This command uses `turbo` to start the development servers for the web app, browser extension, and Convex backend concurrently. You will see output from each of the services in your terminal.

If you are setting up the environment for the first time, follow the instruction to set up Convex Backend and while the server is running, run:

```bash
./setup.sh
```

This script to place the env files to the right place and inject env variables to your convex deployment.

## Accessing the Convex Dashboard

To open the Convex dashboard and inspect your database, view logs, and manage your backend environment, run:

```bash
bun run dashboard
```

This command is a convenient shortcut to the `convex dashboard` command.

## Linting and Type Checking

To ensure code quality and consistency, the project uses Biome for linting and formatting, and TypeScript for type checking.

- **Check for linting errors**:

  ```bash
  bun run check
  ```

- **Automatically fix linting errors**:

  ```bash
  bun run check:fix
  ```

- **Check for TypeScript errors**:

  ```bash
  bun run check:types
  ```
