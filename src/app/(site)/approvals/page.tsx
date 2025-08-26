"use client";
import { useState } from "react";
import Shell from "@/components/layout/Shell";
import { Card } from "@/components/ui/Card";
import { RecentWork } from "@/components/widgets/RecentWork";
import { TimeManagement } from "@/components/widgets/TimeManagement";
import { TeamChat } from "@/components/widgets/TeamChat";
import { motion } from "framer-motion";
import { Check, X, Upload, MessageSquare, Filter, Download, Eye, History, Calendar, FileText, ChevronDown } from "lucide-react";
import Link from "next/link";

const DEMO_ITEMS = Array.from({ length: 15 }).map((_, i) => ({
  id: `PRG-${1000 + i}`,
  name: ["Road Maintenance", "Water Supply Upgrade", "School Renovation", "Health Post Expansion", "Street Lighting"][i % 5] + ` ${i+1}`,
  ward: 1 + (i % 12),
  submittedBy: ["Ward Secretary", "Planning Officer", "Technical Head"][i % 3],
  submittedAt: "2025-01-12",
  documentType: ["Committee Minutes", "Cost Estimation", "Verification Report", "Contract Document", "Payment Request"][i % 5],
  status: ["Pending", "Approved", "Rejected", "Re-uploaded"][i % 4] as "Pending" | "Approved" | "Rejected" | "Re-uploaded",
  remarks: i % 3 === 0 ? "Please provide additional details" : "",
  hasFiles: i % 2 === 0,
}));

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    module: "",
    status: "",
    ward: "",
    fiscalYear: "",
    dateFrom: "",
    dateTo: "",
  });

  const filteredItems = DEMO_ITEMS.filter(item => {
    if (activeTab === "pending" && item.status !== "Pending") return false;
    if (activeTab === "approved" && item.status !== "Approved") return false;
    if (activeTab === "rejected" && !["Rejected", "Re-uploaded"].includes(item.status)) return false;
    
    if (filters.module && !item.documentType.toLowerCase().includes(filters.module.toLowerCase())) return false;
    if (filters.ward && item.ward !== Number(filters.ward)) return false;
    if (filters.status && item.status !== filters.status) return false;
    
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Re-uploaded': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedItems.length === 0) return;
    console.log(`${action} items:`, selectedItems);
    setSelectedItems([]);
  };

  return (
    <Shell rightRail={<><RecentWork /><TimeManagement /><TeamChat /></>}>
      <Card>
        <div className="flex items-center justify-between border-b p-4">
          <div className="text-lg font-semibold">Pending Approvals</div>
          <div className="text-xs text-gray-500">{filteredItems.length} items</div>
        </div>
        
        {/* Filters */}
        <div className="grid grid-cols-1 gap-4 border-b p-4 md:grid-cols-2 lg:grid-cols-6">
          <div>
            <div className="text-xs text-gray-500">Module</div>
            <select 
              value={filters.module} 
              onChange={(e) => setFilters(prev => ({ ...prev, module: e.target.value }))}
              className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"
            >
              <option value="">All Modules</option>
              <option>Program</option>
              <option>Committee</option>
              <option>Estimation</option>
              <option>Verification</option>
              <option>Contract</option>
              <option>Payment</option>
              <option>Monitoring</option>
            </select>
          </div>
          <div>
            <div className="text-xs text-gray-500">Status</div>
            <select 
              value={filters.status} 
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"
            >
              <option value="">All Status</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Rejected</option>
              <option>Re-uploaded</option>
            </select>
          </div>
          <div>
            <div className="text-xs text-gray-500">Ward</div>
            <select 
              value={filters.ward} 
              onChange={(e) => setFilters(prev => ({ ...prev, ward: e.target.value }))}
              className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"
            >
              <option value="">All Wards</option>
              {Array.from({length: 20}).map((_,i) => (
                <option key={i+1} value={i+1}>Ward {i+1}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-xs text-gray-500">Fiscal Year</div>
            <select 
              value={filters.fiscalYear} 
              onChange={(e) => setFilters(prev => ({ ...prev, fiscalYear: e.target.value }))}
              className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"
            >
              <option value="">All Years</option>
              <option>2024/25</option>
              <option>2025/26</option>
            </select>
          </div>
          <div>
            <div className="text-xs text-gray-500">Date From</div>
            <input 
              type="date" 
              value={filters.dateFrom} 
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" 
            />
          </div>
          <div>
            <div className="text-xs text-gray-500">Date To</div>
            <input 
              type="date" 
              value={filters.dateTo} 
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" 
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b px-4 py-2 text-sm">
          {[
            { id: "pending", label: "Pending", count: DEMO_ITEMS.filter(i => i.status === "Pending").length },
            { id: "approved", label: "Approved", count: DEMO_ITEMS.filter(i => i.status === "Approved").length },
            { id: "rejected", label: "Rejected/Re-uploaded", count: DEMO_ITEMS.filter(i => ["Rejected", "Re-uploaded"].includes(i.status)).length },
          ].map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 rounded-xl px-3 py-1.5 ${activeTab === tab.id ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}
            >
              {tab.label} <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <div className="flex items-center gap-2 border-b p-4">
            <div className="text-sm text-gray-600">{selectedItems.length} items selected</div>
            <div className="ml-auto flex items-center gap-2">
              <motion.button 
                whileHover={{ y: -1 }} 
                whileTap={{ scale: 0.98 }} 
                onClick={() => handleBulkAction("approve")}
                className="rounded-xl bg-emerald-600 px-3 py-2 text-sm text-white"
              >
                <Check className="mr-1 inline h-4 w-4" /> Approve All
              </motion.button>
              <motion.button 
                whileHover={{ y: -1 }} 
                whileTap={{ scale: 0.98 }} 
                onClick={() => handleBulkAction("reject")}
                className="rounded-xl bg-rose-600 px-3 py-2 text-sm text-white"
              >
                <X className="mr-1 inline h-4 w-4" /> Reject All
              </motion.button>
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="divide-y">
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="flex flex-wrap items-start gap-3 p-4"
            >
              {/* Checkbox for bulk selection */}
              <input 
                type="checkbox" 
                checked={selectedItems.includes(item.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedItems(prev => [...prev, item.id]);
                  } else {
                    setSelectedItems(prev => prev.filter(id => id !== item.id));
                  }
                }}
                className="mt-1 h-4 w-4"
              />

              {/* Item Details */}
              <div className="flex-1 min-w-64">
                <div className="flex items-start justify-between">
                  <div>
                    <Link href={`/programs/${encodeURIComponent(item.id)}`} className="text-sm font-medium hover:underline">
                      {item.name}
                    </Link>
                    <div className="text-xs text-gray-500">{item.id} · Ward {item.ward}</div>
                  </div>
                  <span className={`inline-flex items-center rounded-lg border px-2 py-1 text-xs ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-gray-600 md:grid-cols-3">
                  <div>Submitted by: {item.submittedBy}</div>
                  <div>Document: {item.documentType}</div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {item.submittedAt}
                  </div>
                </div>
                {item.remarks && (
                  <div className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
                    <strong>Remarks:</strong> {item.remarks}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} className="rounded-xl border px-3 py-1.5 text-sm">
                  <History className="mr-1 inline h-4 w-4" /> History
                </motion.button>
                {item.hasFiles && (
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} className="rounded-xl border px-3 py-1.5 text-sm">
                    <Download className="mr-1 inline h-4 w-4" /> Files
                  </motion.button>
                )}
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} className="rounded-xl border px-3 py-1.5 text-sm">
                  <Eye className="mr-1 inline h-4 w-4" /> View
                </motion.button>
                
                {item.status === "Pending" && (
                  <>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} className="rounded-xl border px-3 py-1.5 text-sm">
                      <MessageSquare className="mr-1 inline h-4 w-4" /> Remarks
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} className="rounded-xl border px-3 py-1.5 text-sm">
                      <Upload className="mr-1 inline h-4 w-4" /> Re-upload
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} className="rounded-xl bg-emerald-600 px-3 py-1.5 text-sm text-white">
                      <Check className="mr-1 inline h-4 w-4" /> Approve
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} className="rounded-xl bg-rose-600 px-3 py-1.5 text-sm text-white">
                      <X className="mr-1 inline h-4 w-4" /> Reject
                    </motion.button>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </Shell>
  );
}
