"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@albert-plus/server/convex/_generated/api";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const student = useQuery(api.students.getCurrentStudent);
  const upsert = useMutation(api.students.upsertCurrentStudent);

  if (!isLoaded) return <div>Loading...</div>;

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
              ? student.programs.join(", ")
              : "None"}
          </p>
        </>
      )}

      {!student && (
        <>
          <p>
            HIIII
          </p>
          
        </>
      )}
    </div>
  );
}
