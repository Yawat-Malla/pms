"use client";
import Shell from "@/components/layout/Shell";
import { Card } from "@/components/ui/Card";
import { RecentWork } from "@/components/widgets/RecentWork";
import { TimeManagement } from "@/components/widgets/TimeManagement";
import { UpcomingDeadlines } from "@/components/widgets/UpcomingDeadlines";
import { motion } from "framer-motion";
import { Filter, Search, Clock, CheckCircle2, XCircle, Upload, Eye, Check, X, Download, MoreHorizontal, Calendar, Building2, FileText, User, ArrowRight } from "lucide-react";
import { HydrationSafe } from "@/components/ui/HydrationSafe";

export default function ApprovalsPage() {
  const DEMO_ITEMS = [
    {
      id: "PRG-001",
      programName: "Road Maintenance - Ward 12",
      ward: "Ward 12",
      submittedBy: "Ward Secretary",
      submittedDate: "2025-01-15",
      documentType: "Committee Minutes",
      attachedFiles: ["minutes_2025_01_15.pdf", "photos.zip"],
      remarks: "",
      status: "pending",
      priority: "high"
    },
    {
      id: "PRG-002",
      programName: "Water Supply Upgrade",
      ward: "Ward 5",
      submittedBy: "Technical Head",
      submittedDate: "2025-01-14",
      documentType: "Cost Estimation",
      attachedFiles: ["estimation_detailed.pdf", "technical_drawings.pdf"],
      remarks: "",
      status: "pending",
      priority: "medium"
    },
    {
      id: "PRG-003",
      programName: "School Renovation Project",
      ward: "Ward 8",
      submittedBy: "Planning Officer",
      submittedDate: "2025-01-13",
      documentType: "Contract Review",
      attachedFiles: ["contract_draft.pdf", "vendor_quotes.pdf"],
      remarks: "",
      status: "pending",
      priority: "high"
    },
    {
      id: "PRG-004",
      programName: "Health Post Expansion",
      ward: "Ward 2",
      submittedBy: "Ward Secretary",
      submittedDate: "2025-01-12",
      documentType: "Verification Report",
      attachedFiles: ["verification_report.pdf", "site_photos.pdf"],
      remarks: "",
      status: "pending",
      priority: "low"
    },
    {
      id: "PRG-005",
      programName: "Street Lighting Installation",
      ward: "Ward 9",
      submittedBy: "Technical Head",
      submittedDate: "2025-01-11",
      documentType: "Progress Review",
      attachedFiles: ["progress_report.pdf", "quality_check.pdf"],
      remarks: "",
      status: "pending",
      priority: "medium"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 're-uploaded': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-rose-600 bg-rose-50 border-rose-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Shell rightRail={<><RecentWork /><TimeManagement /><UpcomingDeadlines /></>}>
      {/* Header */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <div className="text-lg font-semibold">Pending Approvals</div>
            <div className="text-xs text-gray-500">Review and approve pending requests from various modules</div>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-xl border px-3 py-2 text-sm">Bulk Actions</button>
            <button className="rounded-xl bg-gray-900 px-3 py-2 text-sm text-white">Export</button>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search programs, documents, users..."
              className="w-full rounded-xl border px-3 py-2 pl-10 text-sm"
            />
          </div>
          <select className="rounded-xl border bg-white px-3 py-2 text-sm">
            <option>Module</option>
            <option>Program</option>
            <option>Committee</option>
            <option>Estimation</option>
            <option>Verification</option>
            <option>Contract</option>
            <option>Payment</option>
            <option>Monitoring</option>
          </select>
          <select className="rounded-xl border bg-white px-3 py-2 text-sm">
            <option>Status</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Rejected</option>
            <option>Re-uploaded</option>
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

      {/* Tabs */}
      <Card>
        <div className="flex items-center border-b">
          <button className="border-b-2 border-gray-900 px-4 py-3 text-sm font-medium">Pending (5)</button>
          <button className="px-4 py-3 text-sm text-gray-500 hover:text-gray-700">Approved (12)</button>
          <button className="px-4 py-3 text-sm text-gray-500 hover:text-gray-700">Rejected (3)</button>
          <button className="px-4 py-3 text-sm text-gray-500 hover:text-gray-700">Re-uploaded (2)</button>
        </div>
      </Card>

      {/* Approval Items */}
      <div className="space-y-4">
        {DEMO_ITEMS.map((item) => (
          <Card key={item.id}>
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-lg font-medium">{item.programName}</div>
                    <span className={`inline-flex items-center rounded-lg border px-2 py-1 text-xs ${getStatusColor(item.status)}`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                    <span className={`inline-flex items-center rounded-lg border px-2 py-1 text-xs ${getPriorityColor(item.priority)}`}>
                      {item.priority} priority
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-sm text-gray-600 md:grid-cols-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>{item.ward}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{item.submittedBy}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        <HydrationSafe>
                          {new Date(item.submittedDate).toLocaleDateString()}
                        </HydrationSafe>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Eye className="h-4 w-4 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Download className="h-4 w-4 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <MoreHorizontal className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>
              
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">{item.documentType}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {item.attachedFiles.map((file, index) => (
                    <span key={index} className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs bg-gray-50">
                      <FileText className="h-3 w-3" />
                      {file}
                    </span>
                  ))}
                </div>
              </div>

              {item.remarks && (
                <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="text-sm font-medium text-amber-800 mb-1">Previous Remarks:</div>
                  <div className="text-sm text-amber-700">{item.remarks}</div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <motion.button 
                  whileHover={{ y: -1 }} 
                  whileTap={{ scale: 0.98 }} 
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm text-white"
                >
                  <Check className="h-4 w-4" /> Approve
                </motion.button>
                <motion.button 
                  whileHover={{ y: -1 }} 
                  whileTap={{ scale: 0.98 }} 
                  className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm text-white"
                >
                  <X className="h-4 w-4" /> Reject
                </motion.button>
                <motion.button 
                  whileHover={{ y: -1 }} 
                  whileTap={{ scale: 0.98 }} 
                  className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm"
                >
                  <Upload className="h-4 w-4" /> Request Re-upload
                </motion.button>
                <input 
                  placeholder="Add remarks (optional)" 
                  className="flex-1 rounded-xl border px-3 py-2 text-sm"
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <Card>
        <div className="flex items-center justify-between p-4">
          <div className="text-sm text-gray-500">Showing 1–5 of 5 items</div>
          <div className="flex items-center gap-2">
            <button className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50" disabled>Previous</button>
            <span className="px-3 py-1 text-sm text-gray-500">Page 1 of 1</span>
            <button className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50" disabled>Next</button>
          </div>
        </div>
      </Card>
    </Shell>
  );
}
