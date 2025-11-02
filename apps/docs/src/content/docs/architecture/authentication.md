---
title: Authentication
---

Authentication in AlbertPlus is handled by [Clerk](https://clerk.com/), a complete user management service. Clerk provides a seamless and secure authentication experience for both the web application and the browser extension, and it integrates smoothly with the Convex backend.

## Authentication in the Web App

In the Next.js web application, the `@clerk/nextjs` package is used to provide authentication components and server-side helpers.

- **Sign-in and Sign-up**: Clerk's pre-built components are used to create the sign-in and sign-up pages, offering various authentication methods, including social sign-on.
- **Session Management**: Clerk manages user sessions and provides hooks and helpers to access the authenticated user's information on both the client and server.
- **Protected Routes**: The Next.js middleware is used to protect routes that require authentication, redirecting unauthenticated users to the sign-in page.

## Authentication in the Browser Extension

The browser extension uses the `@clerk/chrome-extension` package, which is specifically designed for authentication in a browser extension environment.

- **Popup-based Authentication**: The extension uses a popup window to handle the sign-in process, ensuring a smooth user experience without navigating away from the current page.
- **Token Management**: Clerk securely stores and manages authentication tokens within the extension's storage.

## Backend Integration with Convex

The Convex backend is configured to use Clerk as its authentication provider. This enables a secure connection between the frontend applications and the backend database.

1. **JWT-based Authentication**: When a user authenticates with Clerk, they are issued a JSON Web Token (JWT).
2. **Token Forwarding**: The Convex client on the frontend automatically includes this JWT with every request to the backend.
3. **Backend Validation**: The Convex backend is configured with the Clerk issuer URL. It uses this to verify the signature of the incoming JWT, ensuring that the request is from an authenticated user.
4. **Authenticated Functions**: Within Convex, you can define authenticated queries and mutations. These functions can access the user's identity and will only execute if a valid JWT is provided.
