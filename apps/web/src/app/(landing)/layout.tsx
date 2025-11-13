import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <header className="flex justify-between w-full items-center p-10 px-12 gap-4 h-16">
        <div>
          <Image
            src="/logo.png"
            alt="AlbertPlus"
            width={120}
            height={32}
            className="h-8 w-auto block dark:hidden"
          />
          <Image
            src="/logo-dark.png"
            alt="AlbertPlus"
            width={120}
            height={32}
            className="h-8 w-auto hidden dark:block"
          />
        </div>

        <SignedOut>
          <Button
            asChild
            variant="outline"
            className="bg-[#9043FF] hover:bg-[#6d44a7] dark:bg-[#9043FF] dark:hover:bg-[#af77ff] text-white"
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
