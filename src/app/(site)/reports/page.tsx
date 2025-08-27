"use client";
import Shell from "@/components/layout/Shell";
import { Card } from "@/components/ui/Card";
import { RecentWork } from "@/components/widgets/RecentWork";
import { TimeManagement } from "@/components/widgets/TimeManagement";
import { UpcomingDeadlines } from "@/components/widgets/UpcomingDeadlines";
import { motion } from "framer-motion";
import { Filter, Search, Download, FileText, BarChart3, PieChart, TrendingUp, Calendar, Building2, Eye, Printer, FileSpreadsheet } from "lucide-react";
import { HydrationSafe } from "@/components/ui/HydrationSafe";
import Link from "next/link";

export default function ReportsPage() {
  const reportTypes = [
    { id: "ward", name: "By Ward", icon: Building2, description: "Programs and budget breakdown by ward" },
    { id: "status", name: "By Status", icon: BarChart3, description: "Program status distribution and trends" },
    { id: "type", name: "By Program Type", icon: PieChart, description: "Analysis by program categories" },
    { id: "timeline", name: "Timeline Reports", icon: TrendingUp, description: "Progress and milestone tracking" },
    { id: "budget", name: "Budget Analysis", icon: FileText, description: "Budget utilization and variance reports" },
    { id: "custom", name: "Custom Reports", icon: Filter, description: "Build your own report criteria" }
  ];

  const recentReports = [
    { name: "Ward 12 Monthly Report", type: "Ward Report", generated: "2025-01-15", size: "2.3 MB" },
    { name: "Q4 Budget Analysis", type: "Budget Report", generated: "2025-01-10", size: "1.8 MB" },
    { name: "Program Status Summary", type: "Status Report", generated: "2025-01-08", size: "3.1 MB" },
    { name: "Annual Performance Review", type: "Performance Report", generated: "2025-01-05", size: "4.2 MB" }
  ];

  return (
    <Shell rightRail={<><RecentWork /><TimeManagement /><UpcomingDeadlines /></>}>
      {/* Header */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <div className="text-lg font-semibold">Reports & Export</div>
            <div className="text-xs text-gray-500">Generate comprehensive reports and export data in various formats</div>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-xl border px-3 py-2 text-sm">Report History</button>
            <button className="rounded-xl bg-gray-900 px-3 py-2 text-sm text-white">+ New Report</button>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search reports, programs, wards..."
              className="w-full rounded-xl border px-3 py-2 pl-10 text-sm"
            />
          </div>
          <select className="rounded-xl border bg-white px-3 py-2 text-sm">
            <option>Report Type</option>
            <option>Ward Report</option>
            <option>Status Report</option>
            <option>Budget Report</option>
            <option>Performance Report</option>
          </select>
          <select className="rounded-xl border bg-white px-3 py-2 text-sm">
            <option>Ward</option>
            {Array.from({length: 20}).map((_,i) => (
              <option key={i+1}>Ward {i+1}</option>
            ))}
          </select>
          <select className="rounded-xl border bg-white px-3 py-2 text-sm">
            <option>Fiscal Year</option>
            <option>2024/25</option>
            <option>2025/26</option>
          </select>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <input type="date" className="rounded-xl border px-3 py-2 text-sm" />
            <span className="text-sm text-gray-500">to</span>
            <input type="date" className="rounded-xl border px-3 py-2 text-sm" />
          </div>
        </div>
      </Card>

      {/* Report Types Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((report) => (
          <Card key={report.id} className="cursor-pointer hover:shadow-lg transition-shadow">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-gray-100">
                  <report.icon className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <div className="font-medium">{report.name}</div>
                  <div className="text-xs text-gray-500">{report.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <motion.button 
                  whileHover={{ y: -1 }} 
                  whileTap={{ scale: 0.98 }} 
                  className="flex-1 rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Generate
                </motion.button>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Eye className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <div className="flex flex-wrap items-center gap-3 p-4">
          <div className="text-sm font-medium">Quick Actions:</div>
          <motion.button 
            whileHover={{ y: -1 }} 
            whileTap={{ scale: 0.98 }} 
            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
          >
            <FileSpreadsheet className="h-4 w-4" /> Export All Programs
          </motion.button>
          <motion.button 
            whileHover={{ y: -1 }} 
            whileTap={{ scale: 0.98 }} 
            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
          >
            <Printer className="h-4 w-4" /> Print Summary
          </motion.button>
          <motion.button 
            whileHover={{ y: -1 }} 
            whileTap={{ scale: 0.98 }} 
            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
          >
            <Download className="h-4 w-4" /> Download Templates
          </motion.button>
        </div>
      </Card>

      {/* Recent Reports */}
      <Card>
        <div className="flex items-center justify-between border-b p-4">
          <div className="text-lg font-semibold">Recent Reports</div>
          <Link href="#" className="text-sm text-blue-600 hover:underline">View All</Link>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {recentReports.map((report, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-gray-100">
                    <FileText className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{report.name}</div>
                    <div className="text-xs text-gray-500">{report.type} • {report.size}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    <HydrationSafe>
                      {new Date(report.generated).toLocaleDateString()}
                    </HydrationSafe>
                  </span>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <Eye className="h-4 w-4 text-gray-600" />
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <Download className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Export Options */}
      <Card>
        <div className="flex items-center justify-between border-b p-4">
          <div className="text-lg font-semibold">Export Options</div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="mb-2 text-sm font-medium">File Format</div>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="radio" name="format" value="pdf" defaultChecked />
                  <span className="text-sm">PDF (Portable Document Format)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="format" value="excel" />
                  <span className="text-sm">Excel (XLSX)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="format" value="csv" />
                  <span className="text-sm">CSV (Comma Separated Values)</span>
                </label>
              </div>
            </div>
            <div>
              <div className="mb-2 text-sm font-medium">Export Settings</div>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked />
                  <span className="text-sm">Include charts and graphs</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked />
                  <span className="text-sm">Include data tables</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" />
                  <span className="text-sm">Include raw data</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked />
                  <span className="text-sm">Include metadata</span>
                </label>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <motion.button 
              whileHover={{ y: -1 }} 
              whileTap={{ scale: 0.98 }} 
              className="rounded-xl bg-gray-900 px-4 py-2 text-sm text-white"
            >
              Generate Report
            </motion.button>
            <button className="rounded-xl border px-4 py-2 text-sm">Preview</button>
            <button className="rounded-xl border px-4 py-2 text-sm">Save Template</button>
          </div>
        </div>
      </Card>
    </Shell>
  );
}

