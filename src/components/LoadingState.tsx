export default function LoadingState() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-busy="true" aria-label="강의실 운영 현황을 불러오는 중">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="h-44 animate-pulse rounded-[24px] border border-toss-border bg-white p-5 shadow-sm">
          <div className="h-4 w-24 rounded bg-toss-bg" />
          <div className="mt-6 h-8 w-32 rounded bg-toss-bg" />
          <div className="mt-8 space-y-3">
            <div className="h-3 rounded bg-toss-bg" />
            <div className="h-3 w-2/3 rounded bg-toss-bg" />
          </div>
        </div>
      ))}
    </div>
  );
}
