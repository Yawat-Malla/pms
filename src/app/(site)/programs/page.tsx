"use client";
import { useState, useMemo, useEffect } from "react";
import Shell from "@/components/layout/Shell";
import { Card } from "@/components/ui/Card";
import { RecentWork } from "@/components/widgets/RecentWork";
import { TimeManagement } from "@/components/widgets/TimeManagement";
import { UpcomingDeadlines } from "@/components/widgets/UpcomingDeadlines";
import { Search, Grid3X3, List, ArrowUpDown, Pencil, Printer, Loader2, Eye } from "lucide-react";
import Link from "next/link";
import { HydrationSafe } from "@/components/ui/HydrationSafe";

interface Program {
  id: string;
  code: string;
  name: string;
  ward: {
    id: string;
    code: string;
    name: string;
  };
  fiscalYear: {
    id: string;
    year: string;
    isActive: boolean;
  };
  fiscalYearId: string;
  programType: {
    id: string;
    name: string;
    code: string;
  };
  programTypeId: string;
  fundingSource: {
    id: string;
    name: string;
    code: string;
  };
  fundingSourceId: string;
  budget: number | null;
  status: string;
  createdBy: {
    id: string;
    name: string;
  } | null;
  updatedAt: string;
}

export default function ProgramsPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const perPageOptions = [10, 20, 50, 100];
  const [perPage, setPerPage] = useState(20);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });

  // Filter states
  const [selectedWard, setSelectedWard] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedFiscalYear, setSelectedFiscalYear] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Fetch programs from API
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          search: query,
          wardId: selectedWard,
          status: selectedStatus,
          fiscalYearId: selectedFiscalYear,
          sortBy: sortBy,
          sortOrder: sortOrder,
          page: page.toString(),
          limit: perPage.toString()
        });

        // Remove empty params
        Array.from(params.entries()).forEach(([key, value]) => {
          if (!value) params.delete(key);
        });

        const response = await fetch(`/api/programs?${params}`);
        if (response.ok) {
          const data = await response.json();
          setPrograms(data.programs);
          setPagination(data.pagination);
        } else {
          setError('Failed to fetch programs');
        }
      } catch (error) {
        console.error('Error fetching programs:', error);
        setError('Network error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, [query, selectedWard, selectedStatus, selectedFiscalYear, sortBy, sortOrder, page, perPage]);

  const filtered = useMemo(() =>
    programs.filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase()) || 
      p.code.toLowerCase().includes(query.toLowerCase()) ||
      p.ward.code.toLowerCase().includes(query.toLowerCase())
    ), [programs, query]
  );

  const total = filtered.length;
  const start = (page - 1) * perPage;
  const end = Math.min(start + perPage, total);
  const pageItems = filtered.slice(start, end);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CLOSED': return 'bg-emerald-400';
      case 'DRAFT': return 'bg-amber-400';
      case 'SUBMITTED': return 'bg-blue-400';
      case 'APPROVED': return 'bg-indigo-400';
      case 'VERIFIED': return 'bg-purple-400';
      case 'RECOMMENDED': return 'bg-pink-400';
      case 'CONTRACTED': return 'bg-cyan-400';
      case 'MONITORING': return 'bg-orange-400';
      case 'PAYMENT_RUNNING': return 'bg-yellow-400';
      case 'PAYMENT_FINAL': return 'bg-green-400';
      case 'ARCHIVED': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'CLOSED': return 'bg-emerald-50 text-emerald-700';
      case 'DRAFT': return 'bg-amber-50 text-amber-700';
      case 'SUBMITTED': return 'bg-blue-50 text-blue-700';
      case 'APPROVED': return 'bg-indigo-50 text-indigo-700';
      case 'VERIFIED': return 'bg-purple-50 text-purple-700';
      case 'RECOMMENDED': return 'bg-pink-50 text-pink-700';
      case 'CONTRACTED': return 'bg-cyan-50 text-cyan-700';
      case 'MONITORING': return 'bg-orange-50 text-orange-700';
      case 'PAYMENT_RUNNING': return 'bg-yellow-50 text-yellow-700';
      case 'PAYMENT_FINAL': return 'bg-green-50 text-green-700';
      case 'ARCHIVED': return 'bg-gray-50 text-gray-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <Shell rightRail={<><RecentWork /><TimeManagement /><UpcomingDeadlines /></>}>
        <Card>
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading programs...</span>
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
              <div className="text-red-600 mb-2">Error loading programs</div>
              <div className="text-sm text-gray-600">{error}</div>
              <button 
                onClick={() => window.location.reload()} 
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

  return (
    <Shell rightRail={<><RecentWork /><TimeManagement /><UpcomingDeadlines /></>}>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="text-lg font-semibold">Programs</div>
          <Link href="/programs/new" className="rounded-xl bg-gray-900 px-3 py-2 text-sm font-medium text-white">+ Add New Program</Link>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t p-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search programs, ID, ward..."
              className="w-full rounded-xl border px-3 py-2 pl-10 text-sm"
            />
          </div>
          <select className="rounded-xl border bg-white px-3 py-2 text-sm">
            <option>Fiscal Year</option>
            <option>2024/25</option>
            <option>2025/26</option>
          </select>
          <select className="rounded-xl border bg-white px-3 py-2 text-sm">
            <option>Ward</option>
            {Array.from({length: 20}).map((_,i) => (
              <option key={i+1}>Ward {i+1}</option>
            ))}
          </select>
          <select className="rounded-xl border bg-white px-3 py-2 text-sm">
            <option>Status</option>
            <option>Draft</option>
            <option>Submitted</option>
            <option>Approved</option>
            <option>Completed</option>
          </select>
          <select className="rounded-xl border bg-white px-3 py-2 text-sm">
            <option>Program Type</option>
            <option>New</option>
            <option>Carried-over</option>
          </select>
          <div className="ml-auto flex items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
              <ArrowUpDown className="h-4 w-4" /> Sort
            </div>
            <HydrationSafe>
              <button
                onClick={() => setView("grid")}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${view === 'grid' ? 'bg-gray-900 text-white' : ''}`}
              >
                <Grid3X3 className="h-4 w-4" /> Grid
              </button>
            </HydrationSafe>
            <HydrationSafe>
              <button
                onClick={() => setView("list")}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${view === 'list' ? 'bg-gray-900 text-white' : ''}`}
              >
                <List className="h-4 w-4" /> List
              </button>
            </HydrationSafe>
          </div>
        </div>
      </Card>

      {view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pageItems.map((program) => (
            <Card key={program.id} className="group cursor-pointer hover:shadow-lg transition-shadow">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(program.status)}`}></div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Eye className="h-3 w-3 text-gray-600" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Pencil className="h-3 w-3 text-gray-600" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Printer className="h-3 w-3 text-gray-600" />
                    </button>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="font-medium text-sm mb-1 line-clamp-2">{program.name}</div>
                  <div className="text-xs text-gray-500">{program.code}</div>
                </div>
                <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex items-center justify-between">
                      <span>Ward:</span>
                      <span className="font-medium">{program.ward.code}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>FY:</span>
                      <span className="font-medium">{program.fiscalYear?.year}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Type:</span>
                      <span className="font-medium">{program.programType?.name}</span>
                    </div>
                    {program.budget && (
                      <div className="flex items-center justify-between">
                        <span>Budget:</span>
                        <span className="font-medium">Rs. {program.budget.toLocaleString()}</span>
                      </div>
                    )}
                  <div className="flex items-center justify-between">
                    <span>Updated:</span>
                    <span className="font-medium">
                      <HydrationSafe>
                        {new Date(program.updatedAt).toLocaleDateString()}
                      </HydrationSafe>
                    </span>
                  </div>
                </div>
                <div className="mt-3">
                  <span className={`inline-flex items-center rounded-lg border px-2 py-1 text-xs ${getStatusBadgeColor(program.status)}`}>
                    {formatStatus(program.status)}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="p-4 text-left text-xs font-medium text-gray-500">Program ID</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500">Name</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500">Ward</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500">Fiscal Year</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500">Program Type</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500">Budget</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500">Status</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500">Last Updated</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((program) => (
                  <tr key={program.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 text-sm font-medium">{program.code}</td>
                    <td className="p-4 text-sm">{program.name}</td>
                    <td className="p-4 text-sm">Ward {program.ward.code}</td>
                    <td className="p-4">{program.fiscalYear?.year}</td>
                    <td className="p-4 text-sm">{program.programType?.name}</td>
                    <td className="p-4 text-sm">
                      {program.budget ? `Rs. ${program.budget.toLocaleString()}` : '-'}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center rounded-lg border px-2 py-1 text-xs ${getStatusBadgeColor(program.status)}`}>
                        {formatStatus(program.status)}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      <HydrationSafe>
                        {new Date(program.updatedAt).toLocaleDateString()}
                      </HydrationSafe>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Eye className="h-4 w-4 text-gray-600" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Pencil className="h-4 w-4 text-gray-600" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Printer className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {total > 0 && (
        <Card>
          <div className="flex items-center justify-between p-4">
            <div className="text-sm text-gray-500">
              Showing {start + 1}–{end} of {total} programs
            </div>
            <div className="flex items-center gap-2">
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-lg border bg-white px-3 py-1 text-sm"
              >
                {perPageOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <span className="text-sm text-gray-500">per page</span>
              <div className="flex items-center gap-1">
                <HydrationSafe>
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                </HydrationSafe>
                <span className="px-3 py-1 text-sm text-gray-500">
                  Page {page} of {Math.ceil(total / perPage)}
                </span>
                <HydrationSafe>
                  <button
                    onClick={() => setPage(Math.min(Math.ceil(total / perPage), page + 1))}
                    disabled={page >= Math.ceil(total / perPage)}
                    className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </HydrationSafe>
              </div>
            </div>
          </div>
        </Card>
      )}
    </Shell>
  );
}



