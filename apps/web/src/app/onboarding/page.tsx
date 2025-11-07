import { fetchProtectedQuery } from "@/lib/convex";
import { api } from "@albert-plus/server/convex/_generated/api";
import { OnboardingStepper } from "./component/onboarding-stepper";
import { redirect } from "next/navigation";

export default async function Page() {
  const student = await fetchProtectedQuery(api.students.getCurrentStudent);

  if (student?.isOnboarded) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-4xl px-8 py-8">
        <OnboardingStepper />
      </div>
    </div>
  );
}
