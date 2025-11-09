import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image"; 
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BookOpen, Zap, Users, BarChart3, Clock, Search } from "lucide-react";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-20 sm:py-32">
        <div className="text-center space-y-8">
          <Badge variant="outline" className="mx-auto">
            Albert Plus
          </Badge>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-white">
            Plan better. Track easier. <br />Graduate smarter.
          </h1>

          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            A smarter student dashboard & course helper for NYU students          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="gap-2 bg-[#9972C9] hover:bg-[#9972C9]/80">
              <Link href="/sign-in">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>

            <Button asChild variant="outline" size="lg">
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full">
        <div className="grid grid-cols-1 gap-0 scroll-snap-y scroll-snap-mandatory">
          {/* Feature Card 1 */}
          <div className="h-screen flex items-center justify-center scroll-snap-align-start border-none">
            <Card className="w-full max-w-6xl h-full flex flex-col border-none shadow-none">
              <CardHeader className="flex-1 flex flex-col justify-center items-center text-center">

                <CardTitle className="text-3xl">Plan your semesters. Stay organized. See the big picture. </CardTitle>
                <CardDescription className="text-lg mt-4">
                  A visual Degree Progress Report that shows completed and missing requirements at a glance.
                </CardDescription>
                <div className="mt-6 flex justify-center bg-none">
                  <Image
                    src="/feature.png"
                    alt="Course Catalog"
                      width={100}
                    height={100}
                  />
                </div>
              </CardHeader>
            </Card>
          </div>

          <div className="h-screen flex items-center justify-center scroll-snap-align-start border-none">
            <Card className="w-full max-w-6xl h-full flex flex-col border-none shadow-none">
              <CardHeader className="flex-1 flex flex-col justify-center items-center text-center">

                <CardTitle className="text-3xl">Track your progress. Understand your path. </CardTitle>
                <CardDescription className="text-lg mt-4">
                  A visual Degree Progress Report that shows completed and missing requirements at a glance.
                </CardDescription>
                <div className="mt-6 flex justify-center bg-none">
                  <Image
                    src="/feature.png"
                    alt="Course Catalog"
                    width={100}
                    height={100}
                  />
                </div>
              </CardHeader>
            </Card>
          </div>

          <div className="h-screen flex items-center justify-center scroll-snap-align-start border-none">
            <Card className="w-full max-w-6xl h-full flex flex-col border-none shadow-none">
              <CardHeader className="flex-1 flex flex-col justify-center items-center text-center">

                <CardTitle className="text-3xl">Find courses faster. Search smarter. </CardTitle>
                <CardDescription className="text-lg mt-4">
                  An improved Course Search experience — clearer results, easier navigation, and instant add options.
                </CardDescription>
                <div className="mt-6 flex justify-center bg-none">
                  <Image
                    src="/feature.png"
                    alt="Course Catalog"
                    width={100}
                    height={100}
                  />
                </div>
              </CardHeader>
            </Card>
          </div>

          <div className="h-screen flex items-center justify-center scroll-snap-align-start border-none">
            <Card className="w-full max-w-6xl h-full flex flex-col border-none shadow-none">
              <CardHeader className="flex-1 flex flex-col justify-center items-center text-center">

                <CardTitle className="text-3xl">Plan directly from Albert+</CardTitle>
                <CardDescription className="text-lg mt-4">
                  Use the Sidebar to add courses and build your next semester plan seamlessly.
                </CardDescription>
                <div className="mt-6 flex justify-center bg-none">
                  <Image
                    src="/feature.png"
                    alt="Course Catalog"
                    width={100}
                    height={100}
                  />
                </div>
              </CardHeader>
            </Card>
          </div>

          <div className="h-screen flex items-center justify-center scroll-snap-align-start border-none">
            <Card className="w-full max-w-6xl h-full flex flex-col border-none shadow-none">
              <CardHeader className="flex-1 flex flex-col justify-center items-center text-center">

                <CardTitle className="text-3xl">Plan your semesters. Stay organized. See the big picture. </CardTitle>
                <CardDescription className="text-lg mt-4">
                  A visual Degree Progress Report that shows completed and missing requirements at a glance.
                </CardDescription>
                <div className="mt-6 flex justify-center bg-none">
                  <Image
                    src="/feature.png"
                    alt="Course Catalog"
                    width={100}
                    height={100}
                  />
                </div>
              </CardHeader>
            </Card>
          </div>

        </div>
      </section>

      <section className="w-full">
        <h2 className="text-3xl font-bold mb-4 text-center">Explore More Features in Albert+</h2>
        <div className="grid grid-cols-1 gap-0 scroll-snap-y scroll-snap-mandatory">
          {/* Feature Card 1 */}
          <div className="flex items-center justify-center scroll-snap-align-start border-none">
            <Card className="w-full max-w-6xl h-full flex flex-col border-none shadow-none">
              <CardHeader className="flex-1 flex flex-row justify-center items-center text-left">
                <div className="flex flex-col text-left p-10">
                  <CardTitle className="text-3xl">Share your schedule </CardTitle>
                  <CardDescription className="text-lg mt-4">
                    Show friends or advisors your upcoming semester with one click.
                  </CardDescription>
                </div>
                <div className="mt-6 flex justify-center bg-none">
                  <Image
                    src="/features2.png"
                    alt="Course Catalog"
                    width={100}
                    height={100}
                  />
                </div>
              </CardHeader>
            </Card>
          </div>

          <div className=" flex items-center justify-center scroll-snap-align-start border-none">
            <Card className="w-full max-w-6xl h-full flex flex-col border-none shadow-none">
              <CardHeader className="flex-1 flex flex-row justify-center items-center text-left">
                <div className="flex flex-col text-left p-10">
                  <CardTitle className="text-3xl">Share your schedule </CardTitle>
                  <CardDescription className="text-lg mt-4">
                    Show friends or advisors your upcoming semester with one click.
                  </CardDescription>
                </div>
                <div className="mt-6 flex justify-center bg-none">
                  <Image
                    src="/features2.png"
                    alt="Course Catalog"
                    width={100}
                    height={100}
                  />
                </div>
              </CardHeader>
            </Card>
          </div>

          <div className="flex items-center justify-center scroll-snap-align-start border-none">
            <Card className="w-full max-w-6xl h-full flex flex-col border-none shadow-none">
              <CardHeader className="flex-1 flex flex-row justify-center items-center text-left">
                <div className="flex flex-col text-left p-10">
                  <CardTitle className="text-3xl">Share your schedule </CardTitle>
                  <CardDescription className="text-lg mt-4">
                    Show friends or advisors your upcoming semester with one click.
                  </CardDescription>
                </div>
                <div className="mt-6 flex justify-center bg-none">
                  <Image
                    src="/features2.png"
                    alt="Course Catalog"
                    width={100}
                    height={100}
                  />
                </div>
              </CardHeader>
            </Card>
          </div>

        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto px-16 py-20 text-center">
        <div className="bg-[#F8F8F8] rounded-lg p-12 flex flex-row items-center justify-center gap-16">
          <h2 className="text-3xl font-bold">
            Want to be an A+ NYU student? Try Albert+
          </h2>

          <div className="flex flex-row gap-4">
            <Button asChild size="lg" variant="secondary" className="gap-2 text-white bg-[#9972C9] hover:bg-[#734DA0]">
              <Link href="/sign-in">
                Try Albert+
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="gap-2 text-black bg-[#F8F8F8] hover:bg-[#DFDFDF]">
              <Link href="/sign-in">
                Get Extension
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 mt-20 pt-12">
        <div className="text-center text-slate-600 dark:text-slate-400">
          <h1 className="text-[20vw] text-[#9972C9] font-bold line-height-[0.3] mb-[-50px]">AlbertPlus</h1>
          <p>© 2025 Tech@NYU. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
