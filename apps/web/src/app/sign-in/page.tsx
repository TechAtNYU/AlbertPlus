import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AlbertPlusLogo } from "@/components/Logo";
import { LoginForm } from "./components/login-form";

export default async function LoginPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <AlbertPlusLogo width={120} height={50} />
        <LoginForm />
      </div>
    </div>
  );
}
