"use client";

import React, { useState } from "react";
import DataTable from "./DataTable";
import BCPTracking from "./BCPTracking";
import BCPComparison from "./BCPComparison";
import { SheetDataRow } from "@/lib/fetch-sheets";
import { LayoutDashboard, Database, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type TabValue = "tracking" | "comparison" | "raw";

interface DashboardTabsProps {
  data: SheetDataRow[];
}

export default function DashboardTabs({ data }: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("tracking");

  const tabs = [
    { id: "tracking", label: "ติดตามสถานะ Baseline", icon: LayoutDashboard },
    { id: "comparison", label: "เปรียบเทียบข้อมูล", icon: BarChart3 },
    { id: "raw", label: "ข้อมูลดิบ", icon: Database },
  ] as const;

  return (
    <div className="flex-1 w-full flex flex-col min-h-0">
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabValue)}
              className={`relative px-5 py-2.5 rounded-xl font-medium text-sm transition-colors duration-200 flex items-center gap-2 z-10 ${
                isActive
                  ? "text-red-700 dark:text-red-300"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-tab-bg"
                  className="absolute inset-0 bg-red-50 dark:bg-red-500/15 rounded-xl -z-10 shadow-sm border border-red-200 dark:border-red-500/30"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-hidden relative">
        {activeTab === "tracking" && <BCPTracking data={data} />}
        {activeTab === "comparison" && <BCPComparison data={data} />}
        {activeTab === "raw" && <DataTable data={data} />}
      </div>
    </div>
  );
}
