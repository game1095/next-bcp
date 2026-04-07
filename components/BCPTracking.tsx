"use client";

import React, { useMemo, useState } from "react";
import { SheetDataRow } from "@/lib/fetch-sheets";
import { TARGET_BRANCHES } from "@/lib/branch-data";
import { CheckCircle2, XCircle, AlertTriangle, Activity, Search, Filter, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BCPTrackingProps {
  data: SheetDataRow[];
}

const TARGET_TEXT =
  "ข้อมูลเดิมก่อนการดำเนินงานตามแผน BCP (กรอกข้อมูลครั้งแรกครั้งเดียว) : โดยใช้ค่าเฉลี่ยต่อสัปดาห์ในการดำเนินงานที่ผ่านมาก่อนวันที่ 30 มี.ค. 2569";
const COL_B_INDEX = 1;
const COL_EF_INDEX = 135;
const TIMESTAMP_COL = "ประทับเวลา";

type StatusType = "missing" | "completed" | "duplicate";
type FilterType = "all" | StatusType;

export default function BCPTracking({ data }: BCPTrackingProps) {
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const responsesByBranch = useMemo(() => {
    const map: Record<string, SheetDataRow[]> = {};
    data.forEach((row) => {
      const rowValues = Object.values(row).map((v) => (typeof v === "string" ? v.trim() : ""));
      const typeText = rowValues[COL_B_INDEX] || "";
      const postalCode = rowValues[COL_EF_INDEX] || "";

      if (typeText === TARGET_TEXT.trim() && postalCode !== "") {
        TARGET_BRANCHES.forEach((branch) => {
          if (branch.postalCode === postalCode) {
            if (!map[branch.postalCode]) map[branch.postalCode] = [];
            map[branch.postalCode].push(row);
          }
        });
      }
    });
    return map;
  }, [data]);

  const stats = useMemo(() => {
    let completed = 0;
    let missing = 0;
    let duplicate = 0;

    TARGET_BRANCHES.forEach((b) => {
      const resp = responsesByBranch[b.postalCode] || [];
      if (resp.length === 0) missing++;
      if (resp.length === 1) completed++;
      if (resp.length > 1) {
        completed++;
        duplicate++;
      }
    });
    return { completed, missing, duplicate, total: TARGET_BRANCHES.length };
  }, [responsesByBranch]);

  const completionPercentage = Math.round((stats.completed / stats.total) * 100) || 0;

  // Derive filtered list
  const filteredBranches = useMemo(() => {
    return TARGET_BRANCHES.filter(branch => {
      const responses = responsesByBranch[branch.postalCode] || [];
      const status: StatusType = responses.length === 0 ? "missing" : responses.length === 1 ? "completed" : "duplicate";
      
      const textMatch = branch.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        branch.postalCode.includes(searchQuery);
                        
      if (!textMatch) return false;
      if (activeFilter !== "all" && status !== activeFilter) return false;
      
      return true;
    });
  }, [responsesByBranch, activeFilter, searchQuery]);

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 text-zinc-900 dark:text-zinc-50 relative">
      
      {/* Overview Dashboard Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8 shrink-0">
        
        {/* Main Progress Card */}
        <div className="lg:col-span-1 relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-lg shadow-indigo-500/30 flex items-center justify-between group">
          <div className="absolute top-0 right-0 p-4 opacity-20 transform group-hover:scale-110 transition-transform duration-500 mix-blend-overlay">
             <Activity className="w-32 h-32" />
          </div>
          <div className="z-10 flex flex-col justify-between h-full w-full">
            <h3 className="text-indigo-100 font-medium tracking-wide text-sm mb-4">OVERALL RESPONSE RATE</h3>
            <div className="flex items-end gap-3 mb-2">
              <span className="text-5xl font-black tabular-nums">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden backdrop-blur-sm mt-4">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-white rounded-full" 
              />
            </div>
          </div>
        </div>

        {/* Dynamic Metric Cards */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <MetricCard 
            title="ยังไม่ตอบ (Missing)"
            value={stats.missing}
            max={stats.total}
            icon={XCircle}
            colorClass="from-rose-500/10 to-red-600/10 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-900/50"
            iconColor="text-rose-500"
            onClick={() => setActiveFilter("missing")}
            active={activeFilter === "missing"}
          />
          <MetricCard 
            title="ตอบแล้ว (Completed)"
            value={stats.completed}
            max={stats.total}
            icon={CheckCircle2}
            colorClass="from-emerald-500/10 to-teal-600/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/50"
            iconColor="text-emerald-500"
            onClick={() => setActiveFilter("completed")}
            active={activeFilter === "completed"}
          />
          <MetricCard 
            title="ตอบซ้ำ (Duplicates)"
            value={stats.duplicate}
            max={stats.total}
            icon={AlertTriangle}
            colorClass="from-amber-500/10 to-orange-600/10 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/50"
            iconColor="text-amber-500"
            onClick={() => setActiveFilter("duplicate")}
            active={activeFilter === "duplicate"}
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 shrink-0">
        <div className="flex items-center gap-2 p-1 bg-zinc-100/80 dark:bg-zinc-800/80 backdrop-blur-md rounded-[1.25rem] ring-1 ring-zinc-200/50 dark:ring-zinc-700/50 text-sm font-medium w-full sm:w-auto">
           {(["all", "missing", "completed", "duplicate"] as FilterType[]).map(f => (
             <button
               key={f}
               onClick={() => setActiveFilter(f)}
               className={`relative px-5 py-2.5 rounded-xl transition-all duration-200 w-full sm:w-auto capitalize ${
                 activeFilter === f ? "text-indigo-700 dark:text-indigo-300" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
               }`}
             >
               {activeFilter === f && (
                 <motion.div layoutId="filter-bg" className="absolute inset-0 bg-white dark:bg-zinc-900 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] rounded-xl -z-10" />
               )}
               {f}
             </button>
           ))}
        </div>

        <div className="relative w-full sm:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาที่ทำการไปรษณีย์หรือรหัส..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200/70 dark:border-zinc-800/70 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-zinc-400"
          />
        </div>
      </div>

      {/* Branches Table */}
      <div className="flex-1 overflow-auto bg-white/60 dark:bg-zinc-900/40 backdrop-blur-3xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-xl shadow-black/5 rounded-[2rem] relative scroll-smooth scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead className="sticky top-0 z-20 bg-zinc-100/90 dark:bg-zinc-900/90 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 shadow-sm text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            <tr>
              <th className="px-8 py-5 rounded-tl-[2rem]">รหัสไปรษณีย์</th>
              <th className="px-8 py-5">ชื่อที่ทำการ</th>
              <th className="px-8 py-5">สถานะ</th>
              <th className="px-8 py-5 rounded-tr-[2rem] text-right">การตอบกลับ</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800/50">
            <AnimatePresence>
              {filteredBranches.map((branch, idx) => {
                const responses = responsesByBranch[branch.postalCode] || [];
                const status: StatusType = responses.length === 0 ? "missing" : responses.length === 1 ? "completed" : "duplicate";
                
                const isSelected = selectedBranch === branch.postalCode;

                return (
                  <React.Fragment key={branch.postalCode}>
                    <motion.tr
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, delay: Math.min(idx * 0.01, 0.2) }}
                      className={`group transition-colors duration-200 ${
                        isSelected ? "bg-amber-50/50 dark:bg-amber-900/10" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                      }`}
                    >
                      <td className="px-8 py-4 font-mono font-semibold text-zinc-600 dark:text-zinc-400">
                        {branch.postalCode}
                      </td>
                      <td className="px-8 py-4 font-semibold text-zinc-900 dark:text-zinc-100">
                        {branch.name}
                      </td>
                      <td className="px-8 py-4">
                        {status === "missing" && (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs font-bold tracking-wide">
                            <XCircle className="w-4 h-4" /> ปรับปรุงด่วน
                          </div>
                        )}
                        {status === "completed" && (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold tracking-wide">
                            <CheckCircle2 className="w-4 h-4" /> เสร็จสมบูรณ์
                          </div>
                        )}
                        {status === "duplicate" && (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold tracking-wide">
                            <AlertTriangle className="w-4 h-4" /> เตือน: ซ้ำซ้อน
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-4 text-right">
                        {status === "duplicate" ? (
                          <button 
                            onClick={() => setSelectedBranch(isSelected ? null : branch.postalCode)}
                            className="inline-flex items-center justify-end gap-2 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-semibold text-sm transition-colors"
                          >
                            <span>{responses.length} ครั้ง</span>
                            <span className="text-xs opacity-70 underline underline-offset-4">{isSelected ? "ซ่อน" : "ดูรายละเอียด"}</span>
                          </button>
                        ) : (
                          <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 px-3 py-1 rounded-lg shadow-sm">
                             {responses.length} ครั้ง
                          </span>
                        )}
                      </td>
                    </motion.tr>
                    
                    {isSelected && status === "duplicate" && (
                      <tr className="bg-gradient-to-b from-amber-50/50 to-transparent dark:from-amber-900/10 shadow-inner">
                        <td colSpan={4} className="p-0 border-0">
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="px-8 py-6 border-b border-zinc-200 dark:border-zinc-800"
                          >
                            <div className="w-full bg-white dark:bg-zinc-900/80 p-6 rounded-3xl shadow-xl ring-1 ring-black/5 dark:ring-white/10">
                               <div className="text-sm font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-6 border-b border-amber-100 dark:border-amber-900/40 pb-2">
                                  ข้อมูลที่ถูกส่งซ้ำ ({responses.length} รายการ)
                               </div>
                               
                               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                  {responses.map((resp, idx) => {
                                    // Extract meaningful submitted data to compare
                                    const fields = Object.entries(resp).filter(([k, v]) => 
                                      v !== null && 
                                      v.trim() !== "" && 
                                      k !== TIMESTAMP_COL && 
                                      k !== "ประเภทของข้อมูล (ข้อมูลเดิมกรอกครั้งแรกครั้งเดียว)" &&
                                      !k.includes("รหัสไปรษณีย์")
                                    );

                                    return (
                                      <div key={idx} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-5 ring-1 ring-zinc-200/60 dark:ring-zinc-700/60 flex flex-col hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3 mb-4 border-b border-zinc-200 dark:border-zinc-700 pb-3">
                                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                                            #{idx + 1}
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider">วันเวลาที่ส่ง</span>
                                            <span className="text-zinc-900 dark:text-zinc-100 font-mono text-sm tracking-tight">
                                              {resp[TIMESTAMP_COL] || "N/A"}
                                            </span>
                                          </div>
                                        </div>
                                        
                                        <div className="flex-1 overflow-y-auto max-h-[300px] pr-2 space-y-2 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-600">
                                          {fields.map(([k, v], fIdx) => (
                                            <div key={fIdx} className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-3 py-2 border-b border-zinc-100 dark:border-zinc-800/80 last:border-0 hover:bg-zinc-100/50 dark:hover:bg-zinc-700/20 px-2 rounded-lg transition-colors">
                                               <div className="col-span-1 sm:col-span-2 text-zinc-500 dark:text-zinc-400 text-xs font-medium truncate" title={k}>
                                                 {k.replace(/ลักษณะข้อมูลการรายงาน|ข้อมูล ณ เวลา 08.00 น. |\(ให้ทำเครื่องหมาย.*/g, '').trim()}
                                               </div>
                                               <div className="col-span-1 text-zinc-900 dark:text-zinc-200 text-sm font-semibold sm:text-right truncate whitespace-normal break-words" title={v as string}>
                                                 {v as string}
                                               </div>
                                            </div>
                                          ))}
                                          {fields.length === 0 && (
                                            <div className="text-xs text-zinc-400 italic py-4 text-center">ไม่มีข้อมูลตอบกลับถูกกรอกในรอบนี้ (เป็นค่าว่าง)</div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                               </div>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {filteredBranches.length === 0 && (
                <motion.tr layout>
                  <td colSpan={4} className="px-6 py-24 text-center text-zinc-400">
                    <Filter className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium text-zinc-500">ไม่พบที่ทำการไปรษณีย์ที่ค้นหา</p>
                    <button onClick={() => { setActiveFilter("all"); setSearchQuery(""); }} className="mt-4 px-4 py-2 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium shadow-sm transition-all border border-zinc-200 dark:border-zinc-700">ล้างตัวกรองทั้งหมด</button>
                  </td>
                </motion.tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetricCard({ title, value, max, icon: Icon, colorClass, iconColor, onClick, active }: any) {
  return (
    <button 
      onClick={onClick}
      className={`relative overflow-hidden p-6 rounded-3xl text-left transition-all duration-300 border backdrop-blur-xl group
        ${active ? `ring-2 ring-indigo-500 dark:ring-indigo-400 shadow-xl shadow-indigo-500/20 ${colorClass.split(' ')[0]} ${colorClass.split(' ')[1]} bg-gradient-to-br` : `bg-white/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:shadow-lg`}
      `}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -mr-10 -mt-10 transition-opacity duration-500 ${active ? 'opacity-40 bg-current' : 'bg-zinc-400 group-hover:opacity-30'}`} />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-3 rounded-2xl backdrop-blur-md ${active ? 'bg-white/30 dark:bg-black/30' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
          <Icon className={`w-6 h-6 ${active ? '' : iconColor}`} />
        </div>
      </div>
      <div className="relative z-10 border-l-2 pl-3 border-current/20">
        <h4 className="text-sm font-bold opacity-70 uppercase tracking-widest mb-1">{title}</h4>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black">{value}</span>
          <span className="text-sm font-semibold opacity-50">/ {max}</span>
        </div>
      </div>
    </button>
  );
}
