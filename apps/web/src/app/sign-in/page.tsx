import { auth } from "@clerk/nextjs/server";
import { GalleryVerticalEnd } from "lucide-react";
import { redirect } from "next/navigation";
import { LoginForm } from "./components/login-form";

export default async function LoginPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          CourseHelper
        </a>
        <LoginForm />
      </div>
    </div>
  );
}
