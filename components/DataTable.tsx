"use client";

import React, { useState } from "react";
import { SheetDataRow } from "@/lib/fetch-sheets";
import { Search, ChevronRight, ChevronLeft, TableProperties } from "lucide-react";
import { motion } from "framer-motion";

interface DataTableProps {
  data: SheetDataRow[];
}

export default function DataTable({ data }: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-zinc-500 bg-white shadow-xl dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 backdrop-blur-xl">
        <TableProperties className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-xl font-medium tracking-tight">No data available</p>
        <p className="text-sm opacity-70">The Google Sheet is empty or could not be loaded.</p>
      </div>
    );
  }

  // Get keys from the first row to act as headers
  const headers = Object.keys(data[0] || {});

  // Search logic
  const filteredData = data.filter((row) =>
    headers.some((header) =>
      row[header]?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const currentData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 bg-white/70 dark:bg-zinc-950/70 border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-6 border-b border-zinc-200/50 dark:border-zinc-800/50 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl ring-1 ring-indigo-600/10 dark:ring-indigo-400/20 shadow-inner">
            <TableProperties className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Sheet Data Overview
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Showing {filteredData.length} records from Google Sheets
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80 group">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400 group-focus-within:text-indigo-500 transition-colors">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all duration-200 text-zinc-900 dark:text-zinc-50 shadow-sm placeholder-zinc-400 dark:placeholder-zinc-500"
            placeholder="Search all columns..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-auto bg-zinc-50/30 dark:bg-[#0a0a0a]/50 relative scroll-smooth scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
        <table className="w-full text-left border-collapse whitespace-nowrap text-sm">
          <thead className="sticky top-0 z-10 bg-zinc-100/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-sm border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-300 tracking-wide text-xs uppercase"
                >
                  <div className="flex items-center gap-2 max-w-[200px]">
                    <span className="truncate" title={header}>{header}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800/50">
            {currentData.map((row, rowIndex) => (
              <motion.tr
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(rowIndex * 0.02, 0.5) }}
                key={rowIndex}
                className="group hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30 transition-colors duration-150"
              >
                {headers.map((header, colIndex) => {
                  const cellValue = row[header];
                  return (
                    <td
                      key={colIndex}
                      className="px-6 py-3.5 text-zinc-700 dark:text-zinc-300 max-w-[300px] truncate group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors"
                      title={cellValue}
                    >
                      {cellValue || <span className="text-zinc-300 dark:text-zinc-600 italic">-</span>}
                    </td>
                  );
                })}
              </motion.tr>
            ))}
            {currentData.length === 0 && (
              <tr>
                <td colSpan={headers.length} className="px-6 py-12 text-center text-zinc-500">
                  No records match your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md">
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          Showing <span className="font-medium text-zinc-900 dark:text-zinc-100">{(currentPage - 1) * rowsPerPage + 1}</span> to{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{Math.min(currentPage * rowsPerPage, filteredData.length)}</span> of{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{filteredData.length}</span> results
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-zinc-700 dark:text-zinc-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300 px-3">
            Page {currentPage} of {totalPages}
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-zinc-700 dark:text-zinc-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
