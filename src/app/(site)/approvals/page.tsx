"use client";
import { useState, useEffect, useCallback } from "react";
import Shell from "@/components/layout/Shell";
import { Card } from "@/components/ui/Card";
import { RecentWork } from "@/components/widgets/RecentWork";
import { TimeManagement } from "@/components/widgets/TimeManagement";
import { UpcomingDeadlines } from "@/components/widgets/UpcomingDeadlines";
import { motion } from "framer-motion";
import { Search, Upload, Eye, Check, X, Download, MoreHorizontal, Calendar, Building2, FileText, User, Loader2 } from "lucide-react";
import { HydrationSafe } from "@/components/ui/HydrationSafe";

interface Ward {
  id: string;
  name: string;
  code: string;
}

interface FiscalYear {
  id: string;
  year: string;
  isActive: boolean;
}

interface Approval {
  id: string;
  programId: string;
  programName: string;
  programCode: string;
  ward: string;
  wardName: string;
  submittedBy: string;
  submittedDate: string;
  documentType: string;
  attachedFiles: string[];
  remarks: string;
  status: string;
  priority: string;
  step: string;
  approvedBy?: string;
  approvedAt?: string;
  fiscalYear: string;
  programType: string;
  budget?: number;
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedFiscalYear, setSelectedFiscalYear] = useState('');

  // Dropdown data
  const [wards, setWards] = useState<Ward[]>([]);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);

  // Bulk actions
  const [selectedApprovals, setSelectedApprovals] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: activeTab,
        ...(selectedWard && { ward: selectedWard }),
        ...(selectedModule && { module: selectedModule }),
        ...(selectedFiscalYear && { fiscalYear: selectedFiscalYear })
      });

      const response = await fetch(`/api/approvals?${params}`);
      if (response.ok) {
        const data = await response.json();
        setApprovals(data.approvals || []);
      } else {
        setError('Failed to fetch approvals');
      }
    } catch (error) {
      console.error('Error fetching approvals:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedWard, selectedModule, selectedFiscalYear]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  // Fetch dropdown data on component mount
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [wardsRes, fiscalYearsRes] = await Promise.all([
          fetch('/api/wards'),
          fetch('/api/fiscyears')
        ]);

        if (wardsRes.ok) {
          const wardsData = await wardsRes.json();
          setWards(wardsData.wards || []);
        }

        if (fiscalYearsRes.ok) {
          const fiscalYearsData = await fiscalYearsRes.json();
          setFiscalYears(fiscalYearsData.fiscalYears || []);
        }
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
      }
    };

    fetchDropdownData();
  }, []);

  const handleExport = async () => {
    try {
      const response = await fetch('/api/approvals/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: activeTab,
          ward: selectedWard,
          fiscalYear: selectedFiscalYear,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `approvals-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting approvals:', error);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedApprovals.length === 0) return;

    try {
      const response = await fetch('/api/approvals/bulk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approvalIds: selectedApprovals,
          action,
        }),
      });

      if (response.ok) {
        fetchApprovals();
        setSelectedApprovals([]);
        setShowBulkActions(false);
      }
    } catch (error) {
      console.error('Error processing bulk action:', error);
    }
  };

  const handleApprovalAction = async (approvalId: string, action: 'approve' | 'reject' | 'request_reupload', remarks?: string) => {
    try {
      const response = await fetch('/api/approvals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approvalId,
          action,
          remarks,
        }),
      });

      if (response.ok) {
        // Refresh the approvals list
        fetchApprovals();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to process approval');
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      setError('Network error occurred');
    }
  };

  // Filter approvals based on search query
  const filteredApprovals = approvals.filter(approval =>
    approval.programName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    approval.programCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    approval.ward.toLowerCase().includes(searchQuery.toLowerCase()) ||
    approval.submittedBy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Shell rightRail={<><RecentWork /><TimeManagement /><UpcomingDeadlines /></>}>
        <Card>
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading approvals...</span>
          </div>
        </Card>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell rightRail={<><RecentWork /><TimeManagement /><UpcomingDeadlines /></>}>
        <Card>
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="text-red-600 mb-2">Error loading approvals</div>
              <div className="text-sm text-gray-600">{error}</div>
              <button
                onClick={() => fetchApprovals()}
                className="mt-4 rounded-xl bg-gray-900 px-4 py-2 text-sm text-white"
              >
                Retry
              </button>
            </div>
          </div>
        </Card>
      </Shell>
    );
  }

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
            <div className="relative">
              <button
                className="rounded-xl border px-3 py-2 text-sm"
                onClick={() => setShowBulkActions(!showBulkActions)}
                disabled={selectedApprovals.length === 0}
              >
                Bulk Actions ({selectedApprovals.length})
              </button>
              {showBulkActions && selectedApprovals.length > 0 && (
                <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg z-10 min-w-[150px]">
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                    onClick={() => handleBulkAction('approve')}
                  >
                    Approve All
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                    onClick={() => handleBulkAction('reject')}
                  >
                    Reject All
                  </button>
                </div>
              )}
            </div>
            <button
              className="rounded-xl bg-gray-900 px-3 py-2 text-sm text-white"
              onClick={handleExport}
            >
              Export
            </button>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search programs, documents, users..."
              className="w-full rounded-xl border px-3 py-2 pl-10 text-sm"
            />
          </div>
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="rounded-xl border bg-white px-3 py-2 text-sm"
          >
            <option value="">All Modules</option>
            <option value="program">Program</option>
            <option value="committee">Committee</option>
            <option value="estimation">Estimation</option>
            <option value="verification">Verification</option>
            <option value="contract">Contract</option>
            <option value="payment">Payment</option>
            <option value="monitoring">Monitoring</option>
          </select>
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="rounded-xl border bg-white px-3 py-2 text-sm"
          >
            <option value="">All Wards</option>
            {wards.map((ward) => (
              <option key={ward.id} value={ward.id}>{ward.name}</option>
            ))}
          </select>
          <select
            value={selectedFiscalYear}
            onChange={(e) => setSelectedFiscalYear(e.target.value)}
            className="rounded-xl border bg-white px-3 py-2 text-sm"
          >
            <option value="">All Fiscal Years</option>
            {fiscalYears.map((fy) => (
              <option key={fy.id} value={fy.id}>{fy.year}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Tabs */}
      <Card>
        <div className="flex items-center border-b">
          {[
            { id: 'pending', label: 'Pending' },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Rejected' },
            { id: 're-upload-requested', label: 'Re-uploaded' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium ${
                tab.id === activeTab
                  ? 'border-b-2 border-gray-900 text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label} ({approvals.filter(a => a.status === tab.id).length})
            </button>
          ))}
        </div>
      </Card>

      {/* Approval Items */}
      <div className="space-y-4">
        {filteredApprovals.length > 0 ? filteredApprovals.map((item) => (
          <Card key={item.id}>
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-lg font-medium">{item.programName}</div>
                    <span className="text-sm text-gray-500">({item.programCode})</span>
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

              {item.status === 'pending' && (
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleApprovalAction(item.id, 'approve')}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm text-white"
                  >
                    <Check className="h-4 w-4" /> Approve
                  </motion.button>
                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleApprovalAction(item.id, 'reject')}
                    className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm text-white"
                  >
                    <X className="h-4 w-4" /> Reject
                  </motion.button>
                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleApprovalAction(item.id, 'request_reupload')}
                    className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm"
                  >
                    <Upload className="h-4 w-4" /> Request Re-upload
                  </motion.button>
                  <input
                    placeholder="Add remarks (optional)"
                    className="flex-1 rounded-xl border px-3 py-2 text-sm"
                  />
                </div>
              )}
              {item.status !== 'pending' && item.approvedBy && (
                <div className="text-sm text-gray-600">
                  {item.status === 'approved' ? 'Approved' : item.status === 'rejected' ? 'Rejected' : 'Re-upload requested'} by {item.approvedBy}
                  {item.approvedAt && ` on ${new Date(item.approvedAt).toLocaleDateString()}`}
                </div>
              )}
            </div>
          </Card>
        )) : (
          <Card>
            <div className="text-center py-12">
              <div className="text-gray-500 mb-2">No approvals found</div>
              <div className="text-sm text-gray-400">
                {searchQuery ? 'Try adjusting your search criteria' : 'No items require approval at this time'}
              </div>
            </div>
          </Card>
        )}
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
