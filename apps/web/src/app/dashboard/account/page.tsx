"use client";

import { api } from "@albert-plus/server/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {EditProfilePopup} from "./components/editProfile";

export default function ProfilePage() {
  const { isAuthenticated } = useConvexAuth();
  const { user } = useUser();

  const student = useQuery(
    api.students.getCurrentStudent,
    isAuthenticated ? {} : "skip",
  );

  const upsert = useMutation(api.students.upsertCurrentStudent);
  

  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">Profile</h1>

      <p>
        <strong>Name:</strong> {user?.fullName || "Unknown User"}
      </p>
      <p>
        <strong>Email:</strong> {user?.primaryEmailAddress?.emailAddress || ""}
      </p>

      {student && (
        <>
          <p>
            <strong>School:</strong>{" "}
              {student.school
                ? `${student.school.name} (${
                    student.school.level
                      ? student.school.level.charAt(0).toUpperCase() + student.school.level.slice(1).toLowerCase()
                      : ""
                  })`
                : "N/A"}
            </p>
            <p>
              <strong>Programs:</strong>{" "}
              {student.programs?.length > 0
                ? student.programs.map((p) => p.name).join(", ")
                : "None"}
            </p>
        </>
      )}
      <EditProfilePopup/>
    </div>
  );
}
