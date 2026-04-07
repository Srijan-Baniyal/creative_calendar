import { Suspense } from "react";
import HeroComponent from "@/components/hero-component";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-background">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-16 lg:py-20">
        <header className="mb-8 sm:mb-12">
          <p className="font-medium text-[0.7rem] text-muted-foreground/60 uppercase tracking-[0.25em]">
            Wall Calendar
          </p>
          <h1 className="mt-1 font-display text-2xl text-foreground tracking-tight sm:text-3xl">
            Creative Edition
          </h1>
        </header>

        <Suspense
          fallback={
            <div className="mx-auto w-full max-w-[860px]">
              <Skeleton className="h-[400px] w-full rounded-3xl" />
              <Skeleton className="mt-4 h-48 w-full rounded-2xl" />
            </div>
          }
        >
          <HeroComponent />
        </Suspense>
      </div>
    </main>
  );
}
