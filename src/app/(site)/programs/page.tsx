"use client";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { Avatar } from "@/components/ui/Avatar";
import { Tag } from "@/components/ui/Tag";
import Shell from "@/components/layout/Shell";
import KanbanColumn from "@/components/kanban/KanbanColumn";
import { RecentWork } from "@/components/widgets/RecentWork";
import { TimeManagement } from "@/components/widgets/TimeManagement";
import { TeamChat } from "@/components/widgets/TeamChat";
import { Filter, MoreHorizontal, Settings, Search, Grid3X3, List, ArrowUpDown, ExternalLink, Pencil, Printer } from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";

const DEMO_PROGRAMS = Array.from({ length: 12 }).map((_, i) => ({
  id: `PRG-2025-${String(1 + i).padStart(4, "0")}`,
  name: ["Road Maintenance", "Water Supply Upgrade", "School Renovation", "Health Post Expansion"][i % 4] + ` ${i+1}`,
  ward: 1 + (i % 12),
  fiscalYear: 2025,
  budget: 1000000 + i * 25000,
  status: ["Pending", "Active", "Completed"][i % 3] as "Pending" | "Active" | "Completed",
  updatedBy: ["Alex Parker", "Sam Kim", "Riya Mehta"][i % 3],
  updatedAt: "2025-01-12",
}));

export default function ProgramsPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const perPageOptions = [10, 20, 50, 100];
  const [perPage, setPerPage] = useState(20);

  const filtered = useMemo(() => 
    DEMO_PROGRAMS.filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase()) || p.id.toLowerCase().includes(query.toLowerCase())
    ), [query]
  );
  
  const total = filtered.length;
  const start = (page - 1) * perPage;
  const end = Math.min(start + perPage, total);
  const pageItems = filtered.slice(start, end);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-400';
      case 'Pending': return 'bg-amber-400';
      case 'Active': return 'bg-indigo-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-50 text-emerald-700';
      case 'Pending': return 'bg-amber-50 text-amber-700';
      case 'Active': return 'bg-indigo-50 text-indigo-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <Shell rightRail={<><RecentWork /><TimeManagement /><TeamChat /></>}>
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
              placeholder="Search programs, ID..." 
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
            <option>Pending</option>
            <option>Active</option>
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
            <button 
              onClick={() => setView("grid")} 
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${view === 'grid' ? 'bg-gray-900 text-white' : ''}`}
            >
              <Grid3X3 className="h-4 w-4" /> Grid
            </button>
            <button 
              onClick={() => setView("list")} 
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${view === 'list' ? 'bg-gray-900 text-white' : ''}`}
            >
              <List className="h-4 w-4" /> List
            </button>
          </div>
        </div>
      </Card>

      {view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pageItems.map((p) => (
            <Card key={p.id}>
              <div className={`h-1 w-full rounded-t-2xl ${getStatusColor(p.status)}`} />
              <div className="p-4">
                <div className="mb-1 text-sm text-gray-500">{p.id}</div>
                <Link href={`/programs/${encodeURIComponent(p.id)}`} className="text-base font-semibold hover:underline">
                  {p.name}
                </Link>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>Ward {p.ward}</div>
                  <div>FY {p.fiscalYear}</div>
                  <div>Budget Rs. {p.budget.toLocaleString()}</div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-lg px-2 py-0.5 ${getStatusBadgeColor(p.status)}`}>
                      {p.status}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <div>Last updated {p.updatedAt} · {p.updatedBy}</div>
                  <div className="flex items-center gap-2">
                    <Link href={`/programs/${encodeURIComponent(p.id)}`} className="hover:underline inline-flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" /> View
                    </Link>
                    <button className="hover:underline inline-flex items-center gap-1">
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                    <button className="hover:underline inline-flex items-center gap-1">
                      <Printer className="h-3 w-3" /> Export
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs text-gray-500">
                  <th className="p-3">Program ID</th>
                  <th className="p-3">Program Name</th>
                  <th className="p-3">Ward</th>
                  <th className="p-3">Fiscal Year</th>
                  <th className="p-3">Budget</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Last Updated</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((p) => (
                  <tr key={p.id} className="border-b">
                    <td className="p-3 text-gray-600">{p.id}</td>
                    <td className="p-3 font-medium">
                      <Link href={`/programs/${encodeURIComponent(p.id)}`} className="hover:underline">
                        {p.name}
                      </Link>
                    </td>
                    <td className="p-3 text-gray-600">{p.ward}</td>
                    <td className="p-3 text-gray-600">{p.fiscalYear}</td>
                    <td className="p-3 text-gray-600">Rs. {p.budget.toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs ${getStatusBadgeColor(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600">{p.updatedAt} · {p.updatedBy}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-3 text-xs">
                        <Link href={`/programs/${encodeURIComponent(p.id)}`} className="hover:underline inline-flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" /> View
                        </Link>
                        <button className="hover:underline inline-flex items-center gap-1">
                          <Pencil className="h-3 w-3" /> Edit
                        </button>
                        <button className="hover:underline inline-flex items-center gap-1">
                          <Printer className="h-3 w-3" /> Export
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
      <Card>
        <div className="flex flex-wrap items-center gap-3 p-4 text-sm">
          <div>Showing {start + 1}–{end} of {total} programs</div>
          <div className="ml-auto flex items-center gap-2">
            <button 
              disabled={page === 1} 
              onClick={() => setPage((p) => Math.max(1, p - 1))} 
              className="rounded-xl border px-3 py-1 disabled:opacity-50"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              Page <input 
                value={page} 
                onChange={(e) => setPage(Math.max(1, Number(e.target.value) || 1))} 
                className="w-16 rounded-lg border px-2 py-1 text-center" 
              />
            </div>
            <button 
              disabled={end >= total} 
              onClick={() => setPage((p) => p + 1)} 
              className="rounded-xl border px-3 py-1 disabled:opacity-50"
            >
              Next
            </button>
            <select 
              value={perPage} 
              onChange={(e) => {setPerPage(Number(e.target.value)); setPage(1);}} 
              className="rounded-xl border bg-white px-3 py-2 text-sm"
            >
              {perPageOptions.map(n => (
                <option key={n} value={n}>{n} / page</option>
              ))}
            </select>
          </div>
        </div>
      </Card>
    </Shell>
  );
}



