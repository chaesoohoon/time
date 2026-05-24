import AppHeader from "@/components/AppHeader";
import DashboardTabs from "@/components/DashboardTabs";
import ErrorState from "@/components/ErrorState";
import { loadAllSheetData } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

async function getSheetDataResult() {
  try {
    const data = await loadAllSheetData();
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

export default async function Home() {
  const result = await getSheetDataResult();

  if (result.error || !result.data) {
    return <ErrorState message={result.error || undefined} />;
  }

  return (
    <main className="min-h-screen bg-toss-bg px-4 py-6 text-toss-gray-primary md:px-8 md:py-8 lg:px-12">
      <div className="mx-auto max-w-[1600px] space-y-6 animate-fade-in">
        <AppHeader lastUpdated={new Date().toISOString()} />
        <DashboardTabs data={result.data} />
      </div>
    </main>
  );
}
