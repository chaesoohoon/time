"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, RefreshCw } from "lucide-react";
import { formatKoreanDate, formatTime, getKstNow } from "@/lib/dateUtils";

type AppHeaderProps = {
  lastUpdated: string;
};

export default function AppHeader({ lastUpdated }: AppHeaderProps) {
  const router = useRouter();
  const [now, setNow] = useState(getKstNow);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const timer = window.setInterval(() => setNow(getKstNow()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const updatedAt = new Date(lastUpdated);

  return (
    <header className="rounded-[24px] bg-white p-6 shadow-toss md:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-toss-blue-light text-toss-blue">
              <CalendarClock className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-toss-gray-primary md:text-3xl">강의실 운영 현황</h1>
              <p className="mt-1 text-sm font-semibold text-toss-gray-tertiary">국제 첨단점 강의실 실시간 상황판</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="rounded-[18px] bg-toss-bg px-5 py-3.5 text-sm">
            <p className="font-bold text-toss-gray-primary" suppressHydrationWarning>{formatKoreanDate(now)}</p>
            <p className="mt-1 font-medium text-toss-gray-secondary" suppressHydrationWarning>현재 {formatTime(now)} · 업데이트 {formatTime(updatedAt)}</p>
          </div>
          <button
            type="button"
            onClick={() => startTransition(() => router.refresh())}
            className="inline-flex items-center justify-center gap-2 rounded-[18px] bg-toss-blue px-5 py-3.5 text-sm font-bold text-white transition-all hover:bg-toss-blue-hover active:scale-[0.98] disabled:cursor-wait disabled:opacity-50"
            disabled={isPending}
          >
            <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
            데이터 새로고침
          </button>
        </div>
      </div>
    </header>
  );
}
