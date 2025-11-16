import { api } from "@albert-plus/server/convex/_generated/api";
import { redirect } from "next/navigation";
import { fetchProtectedQuery } from "@/lib/convex";
import { OnboardingForm } from "./component/onboarding-form";

export default async function Page() {
  const student = await fetchProtectedQuery(api.students.getCurrentStudent);

  if (student != null) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-5xl px-8 py-10">
        <OnboardingForm />
      </div>
    </div>
  );
}
