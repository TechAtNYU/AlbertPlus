"use client";

import { api } from "@albert-plus/server/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProfilePage() {
  const { isAuthenticated } = useConvexAuth();
  const { user } = useUser();

  const student = useQuery(
    api.students.getCurrentStudent,
    isAuthenticated ? {} : "skip",
  );

  const upsert = useMutation(api.students.upsertCurrentStudent);

  if (student) {
    console.log("STUDENTTT");
    console.log(student.programs);
  } else{
     console.log("STUDENT NULL");
  }
  
  

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

      <Dialog>
      <form>
        <DialogTrigger asChild>
          <Button variant="outline">Edit Profile</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you&apos;re
              done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="name-1">Name</Label>
              <Input id="name-1" name="name" defaultValue="Pedro Duarte" />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="username-1">Username</Label>
              <Input id="username-1" name="username" defaultValue="@peduarte" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
    </div>
  );
}
