"use client";

import { api } from "@albert-plus/server/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";

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
            <strong>School:</strong> {student.school}
          </p>
          <p>
            <strong>Programs:</strong>{" "}
            {student.programs?.length > 0
              ? student.programs.map(p => p.name).join(", ")
              : "None"}
          </p>
        </>
      )}

      {!student && <p>HIIII</p>}
    </div>
  );
}
