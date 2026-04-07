import { Suspense } from "react";
import CalendarInteractivePanel from "@/components/calendar-interactive-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { GetRandomPic } from "@/lib/get-random-pic";

function CalendarPanelFallback() {
  return (
    <div className="mx-auto w-full max-w-[860px]">
      <div className="overflow-hidden rounded-3xl bg-card shadow-xl ring-1 ring-foreground/[0.06]">
        <Skeleton className="aspect-[16/9] w-full sm:aspect-[2/1]" />
        <div className="p-6">
          <Skeleton className="mx-auto h-8 w-40 rounded-lg" />
          <Skeleton className="mt-4 h-64 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default async function CalendarBody() {
  const heroPicture = await GetRandomPic();

  return (
    <section
      aria-label="Wall calendar"
      className="calendar-reveal mx-auto w-full max-w-[860px]"
    >
      <Suspense fallback={<CalendarPanelFallback />}>
        <CalendarInteractivePanel
          initialArtworkSrc={heroPicture.src}
          initialMonthIndex={heroPicture.monthIndex}
          initialMonthName={heroPicture.monthName}
          initialYear={heroPicture.year}
        />
      </Suspense>
    </section>
  );
}
