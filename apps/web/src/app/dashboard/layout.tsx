import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { AppSidebar } from "@/app/dashboard/components/sidebar/app-sidebar";
import { AppConfigProvider } from "@/components/AppConfigProvider";
import { SettingsDialog } from "@/components/SettingsDialog";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function Layout({
  children,
  header,
}: {
  children: React.ReactNode;
  header: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";
  const { isAuthenticated, redirectToSignIn } = await auth();

  if (!isAuthenticated) {
    redirectToSignIn();
  }

  const user = await currentUser();

  return (
    <AppConfigProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar
          user={{
            name: user?.fullName || user?.username || "Unknown User",
            email: user?.primaryEmailAddress?.emailAddress || "",
            avatar: user?.imageUrl || "",
            initial: `${user?.firstName?.[0]}${user?.lastName?.[0]}` || "UU",
            isAdmin: Boolean(user?.publicMetadata?.is_admin),
            userId:
              process.env.NODE_ENV === "development" ? user?.id : undefined,
          }}
        />
        <SidebarInset>
          <div className="sticky top-0 z-40">{header}</div>
          <main className="flex-1 p-6 space-y-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
      <SettingsDialog />
    </AppConfigProvider>
  );
}
