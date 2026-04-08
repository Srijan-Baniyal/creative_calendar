import { Suspense } from "react";
import { PremiumCalendar } from "@/components/premium-calendar";

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <PremiumCalendar />
    </Suspense>
  );
}
