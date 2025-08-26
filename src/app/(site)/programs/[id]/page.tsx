"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Shell from "@/components/layout/Shell";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { RecentWork } from "@/components/widgets/RecentWork";
import { TimeManagement } from "@/components/widgets/TimeManagement";
import { TeamChat } from "@/components/widgets/TeamChat";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Clock, CheckCircle2, Edit3, Trash2, Download, Calendar, DollarSign, Building2, FileText, MessageSquare, Eye, ChevronRight } from "lucide-react";

const TABS = [
  { id: "estimation", label: "Estimation", icon: DollarSign },
  { id: "monitoring", label: "Monitoring", icon: Eye },
  { id: "payments", label: "Payments", icon: Building2 },
  { id: "approvals", label: "Approvals / Workflow", icon: CheckCircle2 },
  { id: "audit", label: "Audit Log", icon: FileText },
];

const DEMO_PROGRAM = {
  id: "PRG-2025-0001",
  name: "Road Maintenance and Upgradation Project",
  ward: 12,
  fiscalYear: "2025/26",
  status: "Ongoing",
  budget: 2500000,
  spent: 1750000,
  startDate: "2025-01-15",
  endDate: "2025-06-30",
  agency: "Municipality Engineering Department",
  contractor: "ABC Construction Co.",
  approvalStage: "Implementation",
  description: "Comprehensive road maintenance and upgrading project covering major arterial roads in Ward 12."
};

const ESTIMATION_DATA = {
  documents: [
    { name: "Cost Estimation Report.pdf", size: "2.4 MB", uploaded: "2025-01-10", uploadedBy: "Technical Officer" },
    { name: "Material Specifications.xlsx", size: "1.1 MB", uploaded: "2025-01-12", uploadedBy: "Planning Officer" },
    { name: "Labor Cost Breakdown.pdf", size: "3.2 MB", uploaded: "2025-01-15", uploadedBy: "Technical Officer" }
  ],
  breakdown: [
    { category: "Materials", estimated: 1200000, actual: 850000, percentage: 70 },
    { category: "Labor", estimated: 800000, actual: 600000, percentage: 75 },
    { category: "Equipment", estimated: 300000, actual: 200000, percentage: 67 },
    { category: "Miscellaneous", estimated: 200000, actual: 100000, percentage: 50 }
  ]
};

const MONITORING_DATA = [
  { date: "2025-01-20", type: "Site Inspection", inspector: "Planning Officer", status: "Completed", photos: 3, comments: "Foundation work progressing well" },
  { date: "2025-01-25", type: "Progress Review", inspector: "Technical Head", status: "Completed", photos: 5, comments: "Material quality verified, proceeding with next phase" },
  { date: "2025-01-30", type: "Quality Check", inspector: "CAO", status: "Scheduled", photos: 0, comments: "Pending inspection" }
];

const PAYMENTS_DATA = [
  { id: "PAY-001", amount: 500000, date: "2025-01-20", purpose: "Material Procurement", status: "Approved", approvedBy: "CAO", documents: 2 },
  { id: "PAY-002", amount: 300000, date: "2025-01-25", purpose: "Labor Payment", status: "Pending", approvedBy: "", documents: 1 },
  { id: "PAY-003", amount: 200000, date: "2025-02-01", purpose: "Equipment Rental", status: "Rejected", approvedBy: "Accounts", documents: 3 }
];

const APPROVAL_TIMELINE = [
  { step: "Ward Secretary", status: "Completed", date: "2025-01-10", user: "Ward Secretary", remarks: "Initial submission completed" },
  { step: "Planning Officer", status: "Completed", date: "2025-01-12", user: "Planning Officer", remarks: "Technical review passed" },
  { step: "CAO", status: "Completed", date: "2025-01-15", user: "CAO", remarks: "Budget approved" },
  { step: "Accounts", status: "Completed", date: "2025-01-18", user: "Accounts Officer", remarks: "Financial clearance given" },
  { step: "Implementation", status: "In Progress", date: "2025-01-20", user: "Project Manager", remarks: "Work started on site" }
];

const AUDIT_LOG = [
  { action: "Program created", user: "Ward Secretary", timestamp: "2025-01-10 09:30 AM", details: "Initial program setup completed" },
  { action: "Cost estimation uploaded", user: "Technical Officer", timestamp: "2025-01-10 02:15 PM", details: "Detailed cost breakdown submitted" },
  { action: "Planning Officer approved", user: "Planning Officer", timestamp: "2025-01-12 11:45 AM", details: "Technical specifications verified" },
  { action: "CAO approved budget", user: "CAO", timestamp: "2025-01-15 03:20 PM", details: "Budget allocation approved" },
  { action: "Payment request submitted", user: "Project Manager", timestamp: "2025-01-20 10:30 AM", details: "First payment request for materials" }
];

export default function ProgramDetailsPage() {
  const [activeTab, setActiveTab] = useState<string>(TABS[0].id);
  const params = useParams();
  const id = (params?.id as string) ?? DEMO_PROGRAM.id;

  const progressPercentage = Math.round((DEMO_PROGRAM.spent / DEMO_PROGRAM.budget) * 100);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Ongoing': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <Shell rightRail={<><RecentWork /><TimeManagement /><TeamChat /></>}>
      {/* 1. Header Section */}
      <Card>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{DEMO_PROGRAM.name}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <span>Ward {DEMO_PROGRAM.ward}</span>
                <span>•</span>
                <span>FY {DEMO_PROGRAM.fiscalYear}</span>
                <span>•</span>
                <span>ID: {DEMO_PROGRAM.id}</span>
              </div>
              <p className="text-gray-600">{DEMO_PROGRAM.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50">
                <Edit3 className="mr-2 inline h-4 w-4" /> Edit
              </motion.button>
              <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50">
                <Download className="mr-2 inline h-4 w-4" /> Download PDF
              </motion.button>
              <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} className="rounded-xl border border-rose-200 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50">
                <Trash2 className="mr-2 inline h-4 w-4" /> Delete
              </motion.button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center rounded-lg border px-3 py-1 text-sm ${getStatusColor(DEMO_PROGRAM.status)}`}>
              {DEMO_PROGRAM.status}
            </span>
            <span className="text-sm text-gray-600">Approval Stage: {DEMO_PROGRAM.approvalStage}</span>
          </div>
        </div>
      </Card>

      {/* 2. Summary Panel */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Budget vs Spent</div>
                <div className="text-lg font-semibold">Rs. {DEMO_PROGRAM.spent.toLocaleString()}</div>
                <div className="text-xs text-gray-500">of Rs. {DEMO_PROGRAM.budget.toLocaleString()}</div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">{progressPercentage}% utilized</div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-green-100">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Timeline</div>
                <div className="text-sm font-medium">{DEMO_PROGRAM.startDate}</div>
                <div className="text-xs text-gray-500">to {DEMO_PROGRAM.endDate}</div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-100">
                <Building2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Implementing Agency</div>
                <div className="text-sm font-medium">{DEMO_PROGRAM.agency}</div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-orange-100">
                <CheckCircle2 className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Contractor</div>
                <div className="text-sm font-medium">{DEMO_PROGRAM.contractor}</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Tabbed Sections */}
      <Card>
        <div className="border-b">
          <div className="flex items-center gap-1 p-4">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id 
                    ? "bg-gray-900 text-white" 
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="p-6"
          >
            {/* Estimation Tab */}
            {activeTab === "estimation" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Cost Estimation Documents</h3>
                  <div className="space-y-3">
                    {ESTIMATION_DATA.documents.map((doc, i) => (
                      <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="font-medium">{doc.name}</div>
                            <div className="text-sm text-gray-500">{doc.size} • Uploaded by {doc.uploadedBy} on {doc.uploaded}</div>
                          </div>
                        </div>
                        <button className="text-blue-600 hover:underline text-sm">Download</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Cost Breakdown</h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {ESTIMATION_DATA.breakdown.map((item, i) => (
                      <div key={i} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{item.category}</span>
                          <span className="text-sm text-gray-500">{item.percentage}%</span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          Estimated: Rs. {item.estimated.toLocaleString()} | Actual: Rs. {item.actual.toLocaleString()}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${item.percentage}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Monitoring Tab */}
            {activeTab === "monitoring" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Monitoring Reports</h3>
                <div className="space-y-3">
                  {MONITORING_DATA.map((report, i) => (
                    <div key={i} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-medium">{report.type}</div>
                          <div className="text-sm text-gray-500">{report.date} • Inspector: {report.inspector}</div>
                        </div>
                        <span className={`inline-flex items-center rounded-lg border px-2 py-1 text-xs ${getStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">{report.comments}</div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>📷 {report.photos} photos</span>
                        <button className="text-blue-600 hover:underline">View Report</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === "payments" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Payment Requests</h3>
                <div className="space-y-3">
                  {PAYMENTS_DATA.map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-medium">{payment.purpose}</div>
                          <div className="text-sm text-gray-500">{payment.id} • {payment.date}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">Rs. {payment.amount.toLocaleString()}</div>
                          <span className={`inline-flex items-center rounded-lg border px-2 py-1 text-xs ${getPaymentStatusColor(payment.status)}`}>
                            {payment.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {payment.status === "Approved" ? `Approved by ${payment.approvedBy}` : 
                           payment.status === "Rejected" ? `Rejected by ${payment.approvedBy}` : 
                           "Pending approval"}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">📎 {payment.documents} docs</span>
                          <button className="text-blue-600 hover:underline">View Details</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Approvals Tab */}
            {activeTab === "approvals" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Approval Workflow</h3>
                <div className="space-y-3">
                  {APPROVAL_TIMELINE.map((step, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                          step.status === "Completed" ? "bg-emerald-500 border-emerald-500 text-white" :
                          step.status === "In Progress" ? "bg-blue-500 border-blue-500 text-white" :
                          "bg-gray-200 border-gray-300 text-gray-500"
                        }`}>
                          {step.status === "Completed" ? "✓" : i + 1}
                        </div>
                        {i < APPROVAL_TIMELINE.length - 1 && (
                          <div className="w-0.5 h-8 bg-gray-300 mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{step.step}</div>
                          <span className={`inline-flex items-center rounded-lg border px-2 py-1 text-xs ${getStatusColor(step.status)}`}>
                            {step.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mb-1">{step.date} • {step.user}</div>
                        <div className="text-sm text-gray-600">{step.remarks}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit Log Tab */}
            {activeTab === "audit" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Activity History</h3>
                <div className="space-y-3">
                  {AUDIT_LOG.map((log, i) => (
                    <div key={i} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-medium">{log.action}</div>
                        <span className="text-sm text-gray-500">{log.timestamp}</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">{log.details}</div>
                      <div className="text-xs text-gray-500">By: {log.user}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </Card>

      {/* 4. Attachments Section */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Attachments & Documents</h3>
          <div className="rounded-xl border border-dashed p-8 text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-xl bg-gray-50">
              <Upload className="h-8 w-8 text-gray-600" />
            </div>
            <div className="text-lg font-medium mb-2">Drag and drop files here</div>
            <div className="text-sm text-gray-500 mb-4">Contracts, BoQ, Technical Drawings, etc.</div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-medium text-white">
              Browse Files
            </motion.button>
          </div>
        </div>
      </Card>

      {/* 5. Comments/Notes Section */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Internal Notes & Comments</h3>
            <button className="text-blue-600 hover:underline text-sm">Add Note</button>
          </div>
          <div className="space-y-3">
            <div className="border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">PO</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">Planning Officer</span>
                    <span className="text-xs text-gray-500">2 hours ago</span>
                  </div>
                  <div className="text-sm text-gray-700">Waiting for accounts clearance on the latest payment request. Will update once approved.</div>
                </div>
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-green-600">TM</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">Technical Manager</span>
                    <span className="text-xs text-gray-500">1 day ago</span>
                  </div>
                  <div className="text-sm text-gray-700">Site inspection completed. Quality standards maintained. Proceeding with next phase.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 6. Related Programs Section */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Related Programs</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { id: "PRG-2025-0002", name: "Water Supply Upgrade", ward: 12, status: "Pending" },
              { id: "PRG-2025-0003", name: "Street Lighting Project", ward: 12, status: "Approved" },
              { id: "PRG-2025-0004", name: "Drainage System", ward: 12, status: "Completed" }
            ].map((program) => (
              <div key={program.id} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                <div className="font-medium text-sm mb-1">{program.name}</div>
                <div className="text-xs text-gray-500 mb-2">{program.id} • Ward {program.ward}</div>
                <span className={`inline-flex items-center rounded-lg border px-2 py-1 text-xs ${getStatusColor(program.status)}`}>
                  {program.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </Shell>
  );
}
