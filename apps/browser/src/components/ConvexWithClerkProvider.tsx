import { ClerkProvider, useAuth } from "@clerk/chrome-extension";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

const PUBLISHABLE_KEY = process.env
  .PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY as string;
const SYNC_HOST = process.env.PLASMO_PUBLIC_CLERK_SYNC_HOST as string;

const convex = new ConvexReactClient(
  process.env.PLASMO_PUBLIC_CONVEX_URL as string,
);

const ConvexWithClerkProvider = ({ children }) => {
  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      syncHost={SYNC_HOST}
      afterSignOutUrl={chrome.runtime.getURL("sidepanel.html")}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
};

export default ConvexWithClerkProvider;
