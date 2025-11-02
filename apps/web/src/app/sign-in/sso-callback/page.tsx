import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function Page() {
  // Handle the redirect flow by calling the Clerk.handleRedirectCallback() method
  // or rendering the prebuilt <AuthenticateWithRedirectCallback/> component.
  return (
    <>
      <AuthenticateWithRedirectCallback />

      {/* Required for sign-up flows
      Clerk's bot sign-up protection is enabled by default */}
      <div id="clerk-captcha" />
    </>
  );
}
