"use client";

import React, { useMemo, useState } from "react";
import { SheetDataRow } from "@/lib/fetch-sheets";
import { TARGET_BRANCHES } from "@/lib/branch-data";
import {
  Search, MapPin, TrendingUp, TrendingDown, Minus, Route,
  ChevronDown, ChevronUp, Truck
} from "lucide-react";
import { motion } from "framer-motion";
import BCPCharts from "./BCPCharts";

interface BCPComparisonProps {
  data: SheetDataRow[];
}

/**
 * Robustly parse a value from a potentially messy string.
 * - "3439 กม." → 3439
 * - "30 - 50 กม." → 50  (max of range)
 * - "200" → 200
 * - "" / undefined → null
 */
function parseNumeric(raw: string | undefined | null): number | null {
  if (!raw || raw.trim() === "") return null;
  const nums = raw.replace(/,/g, "").match(/\d+(\.\d+)?/g);
  if (!nums || nums.length === 0) return null;
  return Math.max(...nums.map(Number));
}

const BEFORE_TEXT =
  "ข้อมูลเดิมก่อนการดำเนินงานตามแผน BCP (กรอกข้อมูลครั้งแรกครั้งเดียว) : โดยใช้ค่าเฉลี่ยต่อสัปดาห์ในการดำเนินงานที่ผ่านมาก่อนวันที่ 30 มี.ค. 2569";
const COL_B_INDEX = 1;
const COL_C_INDEX = 2;
const COL_EF_INDEX = 135;

const VEHICLE_CATEGORIES = [
  { key: "acceptance", name: "รถรับฝาก", colV: 15, colD: 16 },
  { key: "transfer", name: "รถส่งต่อ", colV: 17, colD: 18 },
  { key: "delivery_car", name: "รถยนต์นำจ่าย", colV: 19, colD: 20 },
  { key: "delivery_moto", name: "มอเตอร์ไซค์นำจ่าย", colV: 21, colD: 22 },
  { key: "general", name: "รถใช้งานทั่วไป", colV: 23, colD: 24 },
];

type VehiclePayload = { vehicles: number | null; distance: number | null };

export default function BCPComparison({ data }: BCPComparisonProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const availablePeriods = useMemo(() => {
    const periods = new Set<string>();
    data.forEach(row => {
      const vals = Object.values(row).map(v => (typeof v === "string" ? v.trim() : ""));
      const p = vals[COL_C_INDEX] || "";
      if (p !== "" && !p.includes("ข้อมูลเดิมก่อนการดำเนินงาน")) periods.add(p);
    });
    return Array.from(periods).sort((a, b) => b.localeCompare(a));
  }, [data]);

  const [selectedPeriod, setSelectedPeriod] = useState<string>(availablePeriods[0] || "");

  const { beforeMap, afterMap } = useMemo(() => {
    const before: Record<string, Record<string, VehiclePayload>> = {};
    const after: Record<string, Record<string, VehiclePayload>> = {};

    data.forEach(row => {
      const vals = Object.values(row).map(v => (typeof v === "string" ? v.trim() : ""));
      const postalCode = vals[COL_EF_INDEX] || "";
      if (!postalCode) return;

      const typeText = vals[COL_B_INDEX] || "";
      const periodText = vals[COL_C_INDEX] || "";

      const payload: Record<string, VehiclePayload> = {};
      VEHICLE_CATEGORIES.forEach(cat => {
        payload[cat.key] = {
          vehicles: parseNumeric(vals[cat.colV]),
          distance: parseNumeric(vals[cat.colD]),
        };
      });

      if (typeText === BEFORE_TEXT) before[postalCode] = payload;
      if (periodText === selectedPeriod) after[postalCode] = payload;
    });

    return { beforeMap: before, afterMap: after };
  }, [data, selectedPeriod]);

  const filteredBranches = useMemo(() => {
    if (!searchQuery) return TARGET_BRANCHES;
    return TARGET_BRANCHES.filter(b =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.postalCode.includes(searchQuery)
    );
  }, [searchQuery]);

  // KPI: aggregate total before/after distance per vehicle category across ALL branches
  const kpiTotals = useMemo(() => {
    return VEHICLE_CATEGORIES.map(cat => {
      let totalBefore = 0;
      let totalAfter = 0;
      let count = 0;
      TARGET_BRANCHES.forEach(b => {
        const bd = beforeMap[b.postalCode];
        const ad = afterMap[b.postalCode];
        const dBefore = bd ? (bd[cat.key].distance ?? 0) : 0;
        const dAfter = ad ? (ad[cat.key].distance ?? 0) : 0;
        if (bd || ad) {
          totalBefore += dBefore;
          totalAfter += dAfter;
          count++;
        }
      });
      const delta = totalAfter - totalBefore;
      return { cat, totalBefore, totalAfter, delta, count };
    });
  }, [beforeMap, afterMap]);

  // Branch-level total delta (sum of all 5 vehicle distance deltas)
  const branchDeltas = useMemo(() => {
    return TARGET_BRANCHES.map(b => {
      let totalDelta = 0;
      VEHICLE_CATEGORIES.forEach(cat => {
        const bd = beforeMap[b.postalCode];
        const ad = afterMap[b.postalCode];
        const dBefore = bd ? (bd[cat.key].distance ?? 0) : 0;
        const dAfter = ad ? (ad[cat.key].distance ?? 0) : 0;
        totalDelta += dAfter - dBefore;
      });
      return { name: b.name, postalCode: b.postalCode, totalDelta };
    }).filter(b => b.totalDelta !== 0);
  }, [beforeMap, afterMap]);

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 text-zinc-900 dark:text-zinc-50 relative">

      {/* Header Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-6 shrink-0 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 p-6 rounded-3xl shadow-sm">
        <div className="flex-1">
          <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
            <Route className="w-6 h-6 text-indigo-500" />
            เปรียบเทียบระยะทาง ก่อน-หลัง BCP
          </h2>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1">
            กดที่แถวรถแต่ละประเภทเพื่อดูรายละเอียดจำนวนรถและระยะทางแบบเต็ม
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
          <div className="relative w-full sm:w-64">
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              className="w-full appearance-none pr-10 pl-4 py-3 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm outline-none text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-zinc-800 dark:text-zinc-200"
            >
              <option value="" disabled>-- เลือกรอบ (หลัง BCP) --</option>
              {availablePeriods.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ค้นหาที่ทำการไปรษณีย์..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm outline-none text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-zinc-400"
            />
          </div>
        </div>
      </div>

      {/* Charts */}
      <BCPCharts kpiTotals={kpiTotals} branchDeltas={branchDeltas} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4 mb-6 shrink-0">
        {kpiTotals.map(({ cat, totalBefore, totalAfter, delta }) => {
          const isPos = delta > 0;
          const isNeg = delta < 0;
          const bgColor = isPos
            ? "bg-rose-50 dark:bg-rose-900/10 ring-rose-200 dark:ring-rose-800/40"
            : isNeg
            ? "bg-emerald-50 dark:bg-emerald-900/10 ring-emerald-200 dark:ring-emerald-800/40"
            : "bg-zinc-50 dark:bg-zinc-800/40 ring-zinc-200 dark:ring-zinc-700/40";
          const deltaColor = isPos
            ? "text-rose-600 dark:text-rose-400"
            : isNeg
            ? "text-emerald-700 dark:text-emerald-400"
            : "text-zinc-400";
          return (
            <div key={cat.key} className={`rounded-2xl p-4 ring-1 shadow-sm ${bgColor} flex flex-col gap-2`}>
              <div className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 truncate">
                {cat.name}
              </div>
              <div className={`text-2xl font-black tabular-nums ${deltaColor}`}>
                {delta >= 0 ? "+" : ""}{delta.toLocaleString()}
              </div>
              <div className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 leading-relaxed">
                <span className="block">ก่อน: <span className="font-bold text-zinc-600 dark:text-zinc-300">{totalBefore.toLocaleString()}</span> กม.</span>
                <span className="block">หลัง: <span className="font-bold text-zinc-700 dark:text-zinc-200">{totalAfter.toLocaleString()}</span> กม.</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* FLAT TABLE — 1 row per vehicle per branch */}
      <div className="flex-1 overflow-auto bg-white/60 dark:bg-zinc-900/40 backdrop-blur-3xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-xl shadow-black/5 rounded-[2rem] scroll-smooth scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              <th className="sticky top-0 z-20 bg-zinc-100/95 dark:bg-zinc-900/95 backdrop-blur-xl border-b-2 border-zinc-200 dark:border-zinc-800 shadow-sm px-8 py-5 rounded-tl-[2rem] w-[28%] text-left">ที่ทำการไปรษณีย์</th>
              <th className="sticky top-0 z-20 bg-zinc-100/95 dark:bg-zinc-900/95 backdrop-blur-xl border-b-2 border-zinc-200 dark:border-zinc-800 shadow-sm px-6 py-5 text-left">ประเภทรถ</th>
              <th className="sticky top-0 z-20 bg-zinc-100/95 dark:bg-zinc-900/95 backdrop-blur-xl border-b-2 border-zinc-200 dark:border-zinc-800 shadow-sm px-6 py-5 text-right text-emerald-700 dark:text-emerald-500">ก่อน BCP (km)</th>
              <th className="sticky top-0 z-20 bg-zinc-100/95 dark:bg-zinc-900/95 backdrop-blur-xl border-b-2 border-zinc-200 dark:border-zinc-800 shadow-sm px-6 py-5 text-right text-indigo-700 dark:text-indigo-500">หลัง BCP (km)</th>
              <th className="sticky top-0 z-20 bg-zinc-100/95 dark:bg-zinc-900/95 backdrop-blur-xl border-b-2 border-zinc-200 dark:border-zinc-800 shadow-sm px-6 py-5 text-right">ส่วนต่าง</th>
              <th className="sticky top-0 z-20 bg-zinc-100/95 dark:bg-zinc-900/95 backdrop-blur-xl border-b-2 border-zinc-200 dark:border-zinc-800 shadow-sm px-4 py-5 rounded-tr-[2rem] text-center w-[80px]">รายละเอียด</th>
            </tr>
          </thead>
          <tbody>
            {filteredBranches.map((branch, bIdx) => {
              const beforeData = beforeMap[branch.postalCode];
              const afterData = afterMap[branch.postalCode];
              const isOddGroup = bIdx % 2 === 1;

              return VEHICLE_CATEGORIES.map((cat, cIdx) => {
                const before = beforeData ? beforeData[cat.key] : null;
                const after = afterData ? afterData[cat.key] : null;

                const dBefore = before?.distance ?? null;
                const dAfter = after?.distance ?? null;
                const dDelta = dBefore !== null && dAfter !== null ? dAfter - dBefore : null;

                const isFirst = cIdx === 0;
                const isLast = cIdx === VEHICLE_CATEGORIES.length - 1;
                const rowKey = `${branch.postalCode}-${cat.key}`;
                const isExpanded = expandedKey === rowKey;

                return (
                  <React.Fragment key={rowKey}>
                    <tr
                      className={`transition-colors cursor-pointer ${
                        isExpanded ? "bg-indigo-50/60 dark:bg-indigo-900/10" : `hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 ${isOddGroup ? "bg-zinc-50/40 dark:bg-zinc-800/10" : ""}`
                      } ${isLast && !isExpanded ? "border-b-2 border-zinc-200/70 dark:border-zinc-700/70" : "border-b border-zinc-100/80 dark:border-zinc-800/50"}`}
                      onClick={() => setExpandedKey(isExpanded ? null : rowKey)}
                    >
                      {/* Branch cell — only shown on first row with a visible label, rest are empty */}
                      <td className={`px-8 py-3 align-middle ${isFirst ? "pt-4" : ""} ${isLast ? "pb-4" : ""} border-r border-zinc-100 dark:border-zinc-800/50`}>
                        {isFirst && (
                          <div className="flex flex-col">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mb-1">{branch.name}</span>
                            <span className="inline-flex items-center gap-1 text-xs font-mono text-zinc-400 dark:text-zinc-500">
                              <MapPin className="w-3 h-3" />{branch.postalCode}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                        <span className="flex items-center gap-2">
                          <Truck className="w-3.5 h-3.5 text-zinc-400" />
                          {cat.name}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                        {dBefore !== null ? dBefore.toLocaleString() : <Minus className="w-4 h-4 ml-auto opacity-25" />}
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums text-sm font-bold text-indigo-700 dark:text-indigo-300">
                        {dAfter !== null ? dAfter.toLocaleString() : <Minus className="w-4 h-4 ml-auto opacity-25" />}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <DeltaBadge value={dDelta} />
                      </td>
                      <td className="px-4 py-3 text-center text-zinc-400 hover:text-indigo-500 transition-colors">
                        {isExpanded ? <ChevronUp className="w-4 h-4 mx-auto" /> : <ChevronDown className="w-4 h-4 mx-auto" />}
                      </td>
                    </tr>

                    {/* Expandable Detail Row */}
                    {isExpanded && (
                      <tr className={`${isLast ? "border-b-2 border-zinc-200/70 dark:border-zinc-700/70" : "border-b border-zinc-100/80 dark:border-zinc-800/50"}`}>
                        <td colSpan={5} className="p-0 border-0">
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="m-3 p-5 bg-indigo-50/70 dark:bg-indigo-900/10 rounded-2xl ring-1 ring-indigo-200/50 dark:ring-indigo-800/40">
                              <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-4">
                                รายละเอียด: {cat.name} — {branch.name}
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* Before */}
                                <div className="bg-white dark:bg-zinc-900/80 rounded-xl p-4 ring-1 ring-emerald-200 dark:ring-emerald-800/40 space-y-2">
                                  <div className="text-xs font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-3">ก่อน BCP</div>
                                  <DetailRow label="จำนวนรถ" value={before?.vehicles} unit="คัน" />
                                  <DetailRow label="ระยะทาง" value={before?.distance} unit="กม." />
                                </div>
                                {/* After */}
                                <div className="bg-white dark:bg-zinc-900/80 rounded-xl p-4 ring-1 ring-indigo-200 dark:ring-indigo-800/40 space-y-2">
                                  <div className="text-xs font-black text-indigo-600 dark:text-indigo-500 uppercase tracking-widest mb-3">หลัง BCP</div>
                                  <DetailRow label="จำนวนรถ" value={after?.vehicles} unit="คัน" />
                                  <DetailRow label="ระยะทาง" value={after?.distance} unit="กม." />
                                </div>
                                {/* Delta */}
                                <div className="bg-white dark:bg-zinc-900/80 rounded-xl p-4 ring-1 ring-orange-200 dark:ring-orange-800/40 space-y-2">
                                  <div className="text-xs font-black text-orange-600 dark:text-orange-500 uppercase tracking-widest mb-3">ส่วนต่าง (Δ)</div>
                                  <DetailRow
                                    label="จำนวนรถ"
                                    value={before?.vehicles != null && after?.vehicles != null ? after.vehicles - before.vehicles : null}
                                    unit="คัน"
                                    isDelta
                                  />
                                  <DetailRow
                                    label="ระยะทาง"
                                    value={before?.distance != null && after?.distance != null ? after.distance - before.distance : null}
                                    unit="กม."
                                    isDelta
                                  />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              });
            })}

            {filteredBranches.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-24 text-center text-zinc-400">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium text-zinc-500">ไม่พบที่ทำการไปรษณีย์</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DetailRow({
  label, value, unit, isDelta = false
}: {
  label: string; value: number | null | undefined; unit: string; isDelta?: boolean;
}) {
  const isNull = value === null || value === undefined || isNaN(value as number);
  const isPositive = !isNull && (value as number) > 0;
  const isNegative = !isNull && (value as number) < 0;

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-zinc-500 dark:text-zinc-400 font-medium">{label}</span>
      {isNull ? (
        <Minus className="w-4 h-4 opacity-30 text-zinc-400" />
      ) : (
        <span className={`font-bold tabular-nums ${isDelta && isPositive ? "text-rose-600 dark:text-rose-400" : isDelta && isNegative ? "text-emerald-700 dark:text-emerald-400" : "text-zinc-800 dark:text-zinc-100"}`}>
          {isDelta && isPositive ? "+" : ""}
          {(value as number).toLocaleString()} {unit}
        </span>
      )}
    </div>
  );
}

function DeltaBadge({ value }: { value: number | null }) {
  if (value === null || isNaN(value)) return <Minus className="w-4 h-4 ml-auto opacity-20 text-zinc-400" />;
  if (value === 0) return <span className="text-zinc-400 dark:text-zinc-500 font-semibold text-sm ml-auto">—</span>;

  const isPositive = value > 0;
  const color = isPositive
    ? "text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/10 ring-1 ring-rose-200 dark:ring-rose-500/30"
    : "text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 ring-1 ring-emerald-200 dark:ring-emerald-500/30";
  const icon = isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${color} font-bold text-sm float-right`}>
      {icon}
      <span>{isPositive ? "+" : ""}{value.toLocaleString()}</span>
    </div>
  );
}
