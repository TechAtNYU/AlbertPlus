import { auth } from "@clerk/nextjs/server";
import { ArrowRight, ChevronRight, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import HeroBadge from "@/components/ui/hero-badge";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-28 w-full bg-background">
        <div className="text-center space-y-8">
          <HeroBadge
            href="https://github.com/TechAtNYU/AlbertPlus"
            text="Open source on GitHub"
            icon={<Sparkles className="h-4 w-4" />}
            endIcon={<ChevronRight className="h-4 w-4" />}
          />

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground mt-6">
            Plan better. Track easier. <br />
            Graduate smarter.
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A smarter student dashboard & course helper for NYU students
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="gap-2 bg-[#9043FF] hover:bg-[#6d44a7] dark:bg-[#9043FF] dark:hover:bg-[#af77ff] dark:text-white"
            >
              <Link href="/sign-in">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full bg-background rounded-none">
        <div className="grid grid-cols-1 gap-0 scroll-snap-y scroll-snap-mandatory">
          {/* Feature Card 1 */}
          <div className="h-screen flex items-center justify-center scroll-snap-align-start border-none">
            <Card className="w-full max-w-6xl h-full flex flex-col border-none shadow-none bg-transparent dark:bg-transparent">
              <CardHeader className="flex-1 flex flex-col justify-center items-center text-center">
                <CardTitle className="text-3xl dark:text-white">
                  Plan your semesters. Stay organized. See the big picture.{" "}
                </CardTitle>
                <CardDescription className="text-lg mt-4 dark:text-gray-400">
                  A visual Degree Progress Report that shows completed and
                  missing requirements at a glance.
                </CardDescription>
                <div className="mt-6 flex justify-center bg-none relative w-full aspect-video">
                  <Image
                    src="/feature1.png"
                    alt="Course Catalog"
                    fill
                    style={{ objectFit: "contain" }}
                    sizes="100vw"
                  />
                </div>
              </CardHeader>
            </Card>
          </div>

          <div className="h-screen flex items-center justify-center scroll-snap-align-start border-none">
            <Card className="w-full max-w-6xl h-full flex flex-col border-none shadow-none bg-transparent dark:bg-transparent">
              <CardHeader className="flex-1 flex flex-col justify-center items-center text-center">
                <CardTitle className="text-3xl">
                  Track your progress. Understand your path.{" "}
                </CardTitle>
                <CardDescription className="text-lg mt-4">
                  A visual Degree Progress Report that shows completed and
                  missing requirements at a glance.
                </CardDescription>
                <div className="mt-6 flex justify-center bg-none relative w-full aspect-video">
                  <Image
                    src="/feature2.png"
                    alt="Course Catalog"
                    fill
                    style={{ objectFit: "contain" }}
                    sizes="100vw"
                  />
                </div>
              </CardHeader>
            </Card>
          </div>

          <div className="h-screen flex items-center justify-center scroll-snap-align-start border-none">
            <Card className="w-full max-w-6xl h-full flex flex-col border-none shadow-none bg-transparent dark:bg-transparent">
              <CardHeader className="flex-1 flex flex-col justify-center items-center text-center">
                <CardTitle className="text-3xl">
                  Find courses faster. Search smarter.{" "}
                </CardTitle>
                <CardDescription className="text-lg mt-4">
                  An improved Course Search experience — clearer results, easier
                  navigation, and instant add options.
                </CardDescription>
                <div className="mt-6 flex justify-center bg-none relative w-full aspect-video">
                  <Image
                    src="/feature3.png"
                    alt="Course Catalog"
                    fill
                    style={{ objectFit: "contain" }}
                    sizes="100vw"
                  />
                </div>
              </CardHeader>
            </Card>
          </div>

          <div className="h-screen flex items-center justify-center scroll-snap-align-start border-none">
            <Card className="w-full max-w-6xl h-full flex flex-col border-none shadow-none bg-transparent dark:bg-transparent">
              <CardHeader className="flex-1 flex flex-col justify-center items-center text-center">
                <CardTitle className="text-3xl">
                  Plan directly from Albert+
                </CardTitle>
                <CardDescription className="text-lg mt-4">
                  Use the Sidebar to add courses and build your next semester
                  plan seamlessly.
                </CardDescription>
                <div className="mt-6 flex justify-center bg-none relative w-full aspect-video">
                  <Image
                    src="/feature.png"
                    alt="Course Catalog"
                    fill
                    style={{ objectFit: "contain" }}
                    sizes="100vw"
                  />
                </div>
              </CardHeader>
            </Card>
          </div>

          <div className="h-screen flex items-center justify-center scroll-snap-align-start border-none">
            <Card className="w-full max-w-6xl h-full flex flex-col border-none shadow-none bg-transparent dark:bg-transparent">
              <CardHeader className="flex-1 flex flex-col justify-center items-center text-center">
                <CardTitle className="text-3xl dark:text-white">
                  Plan your semesters. Stay organized. See the big picture.{" "}
                </CardTitle>
                <CardDescription className="text-lg mt-4 dark:text-gray-400">
                  A visual Degree Progress Report that shows completed and
                  missing requirements at a glance.
                </CardDescription>
                <div className="mt-6 flex justify-center bg-none relative w-full aspect-video">
                  <Image
                    src="/commingsoon.png"
                    alt="Course Catalog"
                    fill
                    style={{ objectFit: "contain" }}
                    sizes="100vw"
                  />
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="w-full bg-background">
        <h2 className="text-3xl font-bold mb-4 text-center text-foreground mt-20">
          Explore More Features in Albert+
        </h2>
        <div className="grid grid-cols-1 gap-0 scroll-snap-y scroll-snap-mandatory">
          {/* Feature Card 1 */}
          <div className="flex items-center justify-center scroll-snap-align-start border-none">
            <Card className="w-full max-w-6xl h-full flex flex-col border-none shadow-none bg-transparent dark:bg-transparent">
              <CardHeader className="flex-1 flex flex-row justify-center items-center text-left">
                <div className="flex flex-col text-left p-10">
                  <CardTitle className="text-3xl dark:text-white">
                    Share your schedule{" "}
                  </CardTitle>
                  <CardDescription className="text-lg mt-4 dark:text-gray-400">
                    Show friends or advisors your upcoming semester with one
                    click.
                  </CardDescription>
                </div>
                <div className="mt-6 flex justify-center bg-none relative w-full aspect-video">
                  <Image
                    src="/commingsoon2.png"
                    alt="Course Catalog"
                    fill
                    style={{ objectFit: "contain" }}
                    sizes="100vw"
                  />
                </div>
              </CardHeader>
            </Card>
          </div>

          <div className=" flex items-center justify-center scroll-snap-align-start border-none">
            <Card className="w-full max-w-6xl h-full flex flex-col border-none shadow-none bg-transparent dark:bg-transparent">
              <CardHeader className="flex-1 flex flex-row justify-center items-center text-left">
                <div className="flex flex-col text-left p-10">
                  <CardTitle className="text-3xl dark:text-white">
                    Share your schedule{" "}
                  </CardTitle>
                  <CardDescription className="text-lg mt-4 dark:text-gray-400">
                    Show friends or advisors your upcoming semester with one
                    click.
                  </CardDescription>
                </div>
                <div className="mt-6 flex justify-center bg-none relative w-full aspect-video">
                  <Image
                    src="/commingsoon2.png"
                    alt="Course Catalog"
                    fill
                    style={{ objectFit: "contain" }}
                    sizes="100vw"
                  />
                </div>
              </CardHeader>
            </Card>
          </div>

          <div className="flex items-center justify-center scroll-snap-align-start border-none">
            <Card className="w-full max-w-6xl h-full flex flex-col border-none shadow-none bg-transparent dark:bg-transparent">
              <CardHeader className="flex-1 flex flex-row justify-center items-center text-left">
                <div className="flex flex-col text-left p-10">
                  <CardTitle className="text-3xl dark:text-white">
                    Share your schedule{" "}
                  </CardTitle>
                  <CardDescription className="text-lg mt-4 dark:text-gray-400">
                    Show friends or advisors your upcoming semester with one
                    click.
                  </CardDescription>
                </div>
                <div className="mt-6 flex justify-center bg-none relative w-full aspect-video">
                  <Image
                    src="/commingsoon2.png"
                    alt="Course Catalog"
                    fill
                    style={{ objectFit: "contain" }}
                    sizes="100vw"
                  />
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto px-16 py-20 text-center">
        <div className="bg-[#F8F8F8] dark:bg-[#414141] rounded-lg p-12 flex flex-row items-center justify-center gap-16">
          <h2 className="text-3xl font-bold text-left text-gray-900 dark:text-white">
            Want to be an A+ NYU student? Try Albert+
          </h2>

          <div className="flex flex-row gap-4">
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="gap-2 text-white bg-[#9043FF] hover:bg-[#6d44a7] dark:bg-[#9043FF] dark:hover:bg-[#af77ff]"
            >
              <Link href="/sign-in">
                Try Albert+
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              // className="gap-2 text-black dark:text-white bg-[#F8F8F8] dark:bg-gray-700 hover:bg-[#DFDFDF] dark:hover:bg-gray-600"
            >
              <Link href="/sign-in">
                Get Extension
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-20 pt-12 bg-background">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <h1 className="text-[20vw] text-[#9043FF] dark:text-[#9043FF] font-bold line-height-[0.3] mb-[-50px]">
            AlbertPlus
          </h1>
          <p className="dark:text-gray-400">
            © 2025 Tech@NYU. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
