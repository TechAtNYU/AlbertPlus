import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <header className="flex justify-end items-center p-4 gap-4 h-16">
        <SignedOut>
          <Button
            asChild
            variant="outline"
            className="bg-white hover:bg-gray-50"
          >
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </header>
      {children}
    </>
  );
}
