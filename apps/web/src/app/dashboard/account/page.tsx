"use client";

import { api } from "@albert-plus/server/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {EditProfilePopup} from "./components/editProfile";
import { Shield, Key, Trash2, Mail, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";

export default function ProfilePage() {
  const { isAuthenticated } = useConvexAuth();
  const { user } = useUser();

  const student = useQuery(
    api.students.getCurrentStudent,
    isAuthenticated ? {} : "skip",
  );

  const upsert = useMutation(api.students.upsertCurrentStudent);
  

  return (
    <div>
      <Tabs defaultValue="personal" className="space-y-6">
      {/* <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="personal">Personal</TabsTrigger>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList> */}
      <Card>
      <CardContent>
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src="https://bundui-images.netlify.app/avatars/08.png" alt="Profile" />
              <AvatarFallback className="text-2xl">JD</AvatarFallback>
            </Avatar>
            
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <h1 className="text-2xl font-bold">John Doe</h1>
              
            </div>
            <p className="text-muted-foreground">Senior Product Designer</p>
            <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Mail className="size-4" />
                john.doe@example.com
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="size-4" />
                New York University
              </div>
              {/* <div className="flex items-center gap-1">
                <Calendar className="size-4" />
                Joined March 2023
              </div> */}
            </div>
          </div>
          {/* <Button variant="default">Edit Profile</Button> */}
        </div>
      </CardContent>
    </Card>
      
      {student && (<TabsContent value="personal" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Academic Information</CardTitle>
            <CardDescription>View and update your academic information here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">School</Label>
                <p className="text-gray-700 text-sm">{student.school
                ? `${student.school.name} (${
                    student.school.level
                      ? student.school.level.charAt(0).toUpperCase() + student.school.level.slice(1).toLowerCase()
                      : ""
                  })`
                : "N/A"}</p>
                {/* <Input id="firstName" defaultValue="John" /> */}
              </div>
              <div className="space-y-2">
                <Label>Programs</Label>
                <p className="text-gray-700 text-sm">{student.programs?.length > 0
                ? student.programs.map((p) => p.name).join(", ")
                : "None"}</p>
                {/* <Input id="lastName" defaultValue="Doe" /> */}
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <p className="text-gray-700 text-sm">{student.startingDate
                ? `${student.startingDate.term.charAt(0).toUpperCase()}${student.startingDate.term.slice(1)} ${student.startingDate.year}`
                : "N/A"}</p>
                {/* <Input id="email" type="email" defaultValue="john.doe@example.com" /> */}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Expected Graduation Date</Label>
                <p className="text-gray-700 text-sm">{student.expectedGraduationDate
                ? `${student.expectedGraduationDate.term.charAt(0).toUpperCase()}${student.expectedGraduationDate.term.slice(1)} ${student.expectedGraduationDate.year}`
                : "N/A"}</p>
                {/* <Input id="phone" defaultValue="+1 (555) 123-4567" /> */}
              </div>
              <EditProfilePopup/>
            </div>
          </CardContent>
        </Card>
      </TabsContent>)};

    </Tabs>
    

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

            <p>
              <strong>Start Date:</strong>{" "}
              {student.startingDate
                ? `${student.startingDate.term.charAt(0).toUpperCase()}${student.startingDate.term.slice(1)} ${student.startingDate.year}`
                : "N/A"}
            </p>

            <p>
              <strong>Expected Graduation:</strong>{" "}
              {student.expectedGraduationDate
                ? `${student.expectedGraduationDate.term.charAt(0).toUpperCase()}${student.expectedGraduationDate.term.slice(1)} ${student.expectedGraduationDate.year}`
                : "N/A"}
            </p>
        </>
      )}
      
    </div>
    </div>
  );
}
