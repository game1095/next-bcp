import { fetchSheetsData } from "@/lib/fetch-sheets";
import DashboardTabs from "@/components/DashboardTabs";
import { Mail } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
  const sheetData = await fetchSheetsData();

  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-[#0d0a0a] font-sans flex flex-col">
      
      {/* Background gradients — Thai Post Red + Gold */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[55%] h-[55%] rounded-full bg-red-600/8 blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[55%] h-[55%] rounded-full bg-amber-500/8 blur-[140px]" />
        <div className="absolute top-[40%] right-[20%] w-[25%] h-[30%] rounded-full bg-red-700/5 blur-[80px]" />
      </div>

      {/* Top Nav Bar — Thai Post signature red bar */}
      <div className="relative z-10 bg-gradient-to-r from-red-700 to-red-600 text-white shadow-lg shadow-red-900/20 shrink-0">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          
          {/* Logo area */}
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-black text-lg tracking-tight leading-tight">ไปรษณีย์ไทย</div>
              <div className="text-[11px] font-medium text-red-200 tracking-wider uppercase">Thailand Post</div>
            </div>
          </div>

          {/* Right badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm ring-1 ring-white/20 text-sm font-semibold">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Live Data Sync
          </div>
        </div>
      </div>

      {/* Gold accent stripe */}
      <div className="h-1.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 shrink-0 shadow-sm shadow-amber-500/30" />

      <main className="relative flex-1 flex flex-col max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-0">
        
        {/* Page Header */}
        <header className="mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shrink-0">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold w-fit ring-1 ring-red-200 shadow-sm bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
              ระบบติดตามแผนความต่อเนื่องทางธุรกิจ (BCP)
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 drop-shadow-sm">
              BCP{" "}
              <span className="bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
                Operational
              </span>{" "}
              Dashboard
            </h1>
            <p className="text-base text-zinc-500 dark:text-zinc-400 max-w-2xl">
              ระบบติดตามสถานะการตอบแบบฟอร์ม BCP ของที่ทำการไปรษณีย์ในสังกัด อัปเดตจาก Google Sheet แบบ Real-time
            </p>
          </div>

          {/* Entry count */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">รายการทั้งหมด</span>
              <span className="text-3xl font-black text-red-600 dark:text-red-400 tabular-nums">{sheetData.length.toLocaleString()}</span>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-600/30">
              <Mail className="w-6 h-6 text-white" />
            </div>
          </div>
        </header>

        <section className="flex-1 w-full flex flex-col min-h-0 rounded-[2rem]">
          <DashboardTabs data={sheetData} />
        </section>
      </main>

      {/* Footer */}
      <footer className="py-5 text-center text-zinc-400 dark:text-zinc-500 text-sm border-t border-zinc-200 dark:border-zinc-900 mt-auto shrink-0 bg-white/60 dark:bg-black/40 backdrop-blur-md">
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-red-600 dark:text-red-500">
            <Mail className="w-3.5 h-3.5" />
            ไปรษณีย์ไทย · Thailand Post
          </div>
          <span className="text-zinc-300 dark:text-zinc-700">|</span>
          <span>ระบบติดตาม BCP ปี 2569</span>
        </div>
      </footer>
    </div>
  );
}
