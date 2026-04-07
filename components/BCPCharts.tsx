"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface VehicleKPI {
  cat: { key: string; name: string };
  totalBefore: number;
  totalAfter: number;
  delta: number;
}

interface BranchDelta {
  name: string;
  postalCode: string;
  totalDelta: number;
}

interface BCPChartsProps {
  kpiTotals: VehicleKPI[];
  branchDeltas: BranchDelta[];
}

const BEFORE_COLOR = "#10b981"; // emerald-500
const AFTER_COLOR = "#6366f1";  // indigo-500

// Custom tooltip for the grouped bar chart
const GroupedTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const before = payload.find((p: any) => p.dataKey === "ก่อน BCP");
  const after = payload.find((p: any) => p.dataKey === "หลัง BCP");
  const delta = (after?.value ?? 0) - (before?.value ?? 0);
  const isPos = delta > 0;
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl p-4 text-sm min-w-[180px]">
      <div className="font-black text-zinc-800 dark:text-zinc-100 mb-2">{label}</div>
      {before && <div className="flex justify-between gap-4"><span className="text-emerald-600">ก่อน BCP</span><span className="font-bold tabular-nums">{before.value.toLocaleString()} กม.</span></div>}
      {after && <div className="flex justify-between gap-4"><span className="text-indigo-600">หลัง BCP</span><span className="font-bold tabular-nums">{after.value.toLocaleString()} กม.</span></div>}
      <div className={`flex justify-between gap-4 mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 font-black ${isPos ? "text-rose-600" : "text-emerald-700"}`}>
        <span>ส่วนต่าง (Δ)</span>
        <span className="tabular-nums">{isPos ? "+" : ""}{delta.toLocaleString()} กม.</span>
      </div>
    </div>
  );
};

// Custom tooltip for the horizontal bar chart
const HorizontalTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value ?? 0;
  const isPos = val > 0;
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl p-4 text-sm min-w-[200px]">
      <div className="font-black text-zinc-800 dark:text-zinc-100 mb-1">{label}</div>
      <div className={`font-black text-lg tabular-nums ${isPos ? "text-rose-600" : "text-emerald-700"}`}>
        {isPos ? "+" : ""}{val.toLocaleString()} กม.
      </div>
      <div className="text-xs text-zinc-400 mt-1">{isPos ? "ระยะทางรวมเพิ่มขึ้น" : "ระยะทางรวมลดลง"}</div>
    </div>
  );
};

export default function BCPCharts({ kpiTotals, branchDeltas }: BCPChartsProps) {
  // Data for grouped bar
  const groupedData = kpiTotals.map(k => ({
    name: k.cat.name,
    "ก่อน BCP": k.totalBefore,
    "หลัง BCP": k.totalAfter,
  }));

  // Top 10 branches sorted by absolute delta (show most impactful)
  const sorted = [...branchDeltas].sort((a, b) => Math.abs(b.totalDelta) - Math.abs(a.totalDelta)).slice(0, 10);
  // Reverse for horizontal bar (bottom = largest)
  const horizontalData = [...sorted].reverse().map(b => ({
    name: b.name.length > 16 ? b.name.slice(0, 16) + "…" : b.name,
    fullName: b.name,
    delta: b.totalDelta,
  }));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6 shrink-0">

      {/* Chart 1: Grouped Bar — Before vs After per vehicle type */}
      <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-lg rounded-3xl p-6">
        <div className="mb-4">
          <h3 className="text-base font-black text-zinc-800 dark:text-zinc-100">ระยะทางรวม ก่อน vs หลัง BCP</h3>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">แยกตามประเภทรถ (กิโลเมตร/สัปดาห์ รวมทุกที่ทำการไปรษณีย์)</p>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={groupedData} barGap={4} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#71717a", fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#a1a1aa" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              width={45}
            />
            <Tooltip content={<GroupedTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
            <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700, paddingTop: 8 }} />
            <Bar dataKey="ก่อน BCP" fill={BEFORE_COLOR} radius={[6, 6, 0, 0]} maxBarSize={36} />
            <Bar dataKey="หลัง BCP" fill={AFTER_COLOR} radius={[6, 6, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chart 2: Horizontal Bar — Top 10 branches by total delta */}
      <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-lg rounded-3xl p-6">
        <div className="mb-4">
          <h3 className="text-base font-black text-zinc-800 dark:text-zinc-100">10 ที่ทำการไปรษณีย์ที่มีการเปลี่ยนแปลงมากที่สุด</h3>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">ส่วนต่างระยะทางรวมทุกประเภทรถ (กม.) เรียงจากมากสุด</p>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={horizontalData} layout="vertical" margin={{ left: 0, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: "#a1a1aa" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => v >= 1000 || v <= -1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: "#52525b", fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              width={100}
            />
            <Tooltip content={<HorizontalTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
            <Bar dataKey="delta" radius={[0, 6, 6, 0]} maxBarSize={22}>
              {horizontalData.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={entry.delta > 0 ? "#f43f5e" : "#10b981"}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
