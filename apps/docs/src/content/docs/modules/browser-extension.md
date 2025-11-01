---
title: "Browser Extension"
---

The AlbertPlus browser extension, located in the `apps/browser` directory, is a companion tool that integrates directly with the NYU Albert website. It is designed to provide a seamless and enhanced user experience by overlaying AlbertPlus features on top of the existing Albert interface.

## Key Technologies

- **Framework**: [Plasmo](https://www.plasmo.com/), a powerful framework for building browser extensions.
- **Language**: [TypeScript](https://www.typescriptlang.org/).
- **UI Library**: [React](https://react.dev/) 19.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/).
- **Authentication**: [@clerk/chrome-extension](https://clerk.com/docs/references/chrome-extension/getting-started), for secure user authentication within the extension.
- **Backend**: [Convex](https://www.convex.dev/) for real-time data access.

## Features

- **Content Script Injection**: The extension injects a content script into the Albert website, allowing it to modify the page and add new functionality.
- **Popup Interface**: A popup window provides quick access to AlbertPlus settings.
- **Sidepanel Interface**: A sidepanel window provides a more in-depth view of AlbertPlus features.
- **Authenticated Access**: Users can sign in to their AlbertPlus account directly from the extension, enabling personalized features.

## Project Structure

The browser extension follows the structure defined by the Plasmo framework:

- `src/content.tsx`: The main content script that is injected into web pages.
- `src/popup.tsx`: The UI for the extension's popup window.
- `src/sidepanel.tsx`: The UI for the extension's sidepanel window.
- `src/components/`: Shared React components used within the extension.

## Loading the Extension in Your Browser

To load the extension for development:

1. Run the development server:

   ```bash
   bun run --filter browser dev
   ```

2. Open your Chromium-based browser (such as Google Chrome) and navigate to `chrome://extensions`.

3. Enable "Developer mode".

4. Click "Load unpacked" and select the `build/chrome-mv3-dev` directory inside `apps/browser`.

The extension will now be active in your browser.
