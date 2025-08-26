"use client";
import Shell from "@/components/layout/Shell";
import { Card } from "@/components/ui/Card";
import { RecentWork } from "@/components/widgets/RecentWork";
import { TimeManagement } from "@/components/widgets/TimeManagement";
import { TeamChat } from "@/components/widgets/TeamChat";
import { motion } from "framer-motion";
import { Filter, FileDown, FileSpreadsheet, Printer } from "lucide-react";

export default function ReportsPage() {
  return (
    <Shell rightRail={<><RecentWork /><TimeManagement /><TeamChat /></>}>
      <Card>
        <div className="flex items-center justify-between border-b p-4">
          <div className="text-lg font-semibold">Reports & Export</div>
        </div>
        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-4">
          <div>
            <div className="text-xs text-gray-500">Ward</div>
            <select className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm">
              <option>All</option>
              <option>Ward 1</option>
              <option>Ward 2</option>
              <option>Ward 3</option>
            </select>
          </div>
          <div>
            <div className="text-xs text-gray-500">Status</div>
            <select className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm">
              <option>All</option>
              <option>Active</option>
              <option>Completed</option>
              <option>Pending Approval</option>
            </select>
          </div>
          <div>
            <div className="text-xs text-gray-500">Type</div>
            <select className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm">
              <option>All</option>
              <option>Development</option>
              <option>Maintenance</option>
              <option>Procurement</option>
            </select>
          </div>
          <div className="flex items-end">
            <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-3 py-2 text-sm text-white">
              <Filter className="h-4 w-4" /> Generate
            </motion.button>
          </div>
        </div>
        <div className="flex items-center gap-2 border-t p-4">
          <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
            <Printer className="h-4 w-4" /> Print
          </motion.button>
          <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
            <FileDown className="h-4 w-4" /> Export PDF
          </motion.button>
          <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
            <FileSpreadsheet className="h-4 w-4" /> Export Excel
          </motion.button>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {["By Ward", "By Status", "By Type", "Summary"].map((title) => (
          <Card key={title}>
            <div className="p-4">
              <div className="mb-1 text-sm font-medium">{title}</div>
              <div className="rounded-xl border bg-gray-50 p-10 text-center text-xs text-gray-500">Chart/Report Preview</div>
            </div>
          </Card>
        ))}
      </div>
    </Shell>
  );
}

