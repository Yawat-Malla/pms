"use client";

import Shell from "@/components/layout/Shell";
import { Card } from "@/components/ui/Card";
import { RecentWork } from "@/components/widgets/RecentWork";
import { TimeManagement } from "@/components/widgets/TimeManagement";
import { UpcomingDeadlines } from "@/components/widgets/UpcomingDeadlines";
import { motion } from "framer-motion";
import {
  UserPlus,
  Users,
  ShieldCheck,
  GitCompare,
  FileCog,
  Wrench,
  Globe,
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  Building2,
  Tag,
  DollarSign,
  Check,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Switch } from "@/components/ui/Switch";

// ---------------- Types ----------------
type FiscalYear = {
  id: string;
  year: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type Ward = {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
};

type ProgramType = {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
};

type FundingSource = {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
};

// -------------- Helper (no-BS fetch) --------------
async function getJSON<T extends Record<string, unknown>>(
  url: string,
  key: keyof T
): Promise<T[keyof T]> {
  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();
  if (!res.ok) {
    console.error(`[GET ${url}] ${res.status}`, text);
    throw new Error(`GET ${url} failed`);
  }
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(text);
  } catch {
    console.error(`[GET ${url}] non-JSON:`, text);
    throw new Error("Non-JSON response");
  }
  if (!(String(key) in json)) {
    console.error(`[GET ${url}] missing key "${String(key)}"`, json);
    throw new Error(`Missing key ${String(key)}`);
  }
  return json[String(key)] as T[keyof T];
}

// =================== PAGE ===================
export default function SettingsPage() {
  // Data
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [programTypes, setProgramTypes] = useState<ProgramType[]>([]);
  const [fundingSources, setFundingSources] = useState<FundingSource[]>([]);

  // Inline add forms
  const [showAddFiscalYearForm, setShowAddFiscalYearForm] = useState(false);
  const [newFiscalYear, setNewFiscalYear] = useState({ year: "", isActive: false });

  const [showAddWardForm, setShowAddWardForm] = useState(false);
  const [newWard, setNewWard] = useState({ name: "", code: "" });

  const [showAddProgramTypeForm, setShowAddProgramTypeForm] = useState(false);
  const [newProgramType, setNewProgramType] = useState({ name: "", code: "" });

  const [showAddFundingSourceForm, setShowAddFundingSourceForm] = useState(false);
  const [newFundingSource, setNewFundingSource] = useState({ name: "", code: "" });

  // Inline editing
  const [editingFiscalYear, setEditingFiscalYear] = useState<FiscalYear | null>(null);
  const [editingWard, setEditingWard] = useState<Ward | null>(null);
  const [editingProgramType, setEditingProgramType] = useState<ProgramType | null>(null);
  const [editingFundingSource, setEditingFundingSource] = useState<FundingSource | null>(null);

  // Inline delete confirmation toggles
  const [deletingFiscalYear, setDeletingFiscalYear] = useState<string | null>(null);
  const [deletingWard, setDeletingWard] = useState<string | null>(null);
  const [deletingProgramType, setDeletingProgramType] = useState<string | null>(null);
  const [deletingFundingSource, setDeletingFundingSource] = useState<string | null>(null);

  // Fetch on mount
  useEffect(() => {
    fetchFiscalYears();
    fetchWards();
    fetchProgramTypes();
    fetchFundingSources();
  }, []);

  // --------- Fetchers ----------
  const fetchFiscalYears = async () => {
    try {
      const data = await getJSON<{ fiscalYears: FiscalYear[] }>("/api/fiscyears", "fiscalYears");
      setFiscalYears(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load fiscal years");
      setFiscalYears([]);
    }
  };

  const fetchWards = async () => {
    try {
      const data = await getJSON<{ wards: Ward[] }>("/api/wards", "wards");
      setWards(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load wards");
      setWards([]);
    }
  };

  const fetchProgramTypes = async () => {
    try {
      const data = await getJSON<{ programTypes: ProgramType[] }>(
        "/api/programtypes",
        "programTypes"
      );
      setProgramTypes(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load program types");
      setProgramTypes([]);
    }
  };

  const fetchFundingSources = async () => {
    try {
      const data = await getJSON<{ fundingSources: FundingSource[] }>(
        "/api/fundsources",
        "fundingSources"
      );
      setFundingSources(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load funding sources");
      setFundingSources([]);
    }
  };

  // --------- CRUD: Fiscal Years ----------
  const handleAddFiscalYear = async (data: { year: string; isActive: boolean }) => {
    try {
      if (!data.year.trim()) return toast.error("Fiscal year is required");
      const res = await fetch("/api/fiscyears", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Fiscal year added");
      setShowAddFiscalYearForm(false);
      setNewFiscalYear({ year: "", isActive: false });
      fetchFiscalYears();
    } catch {
      toast.error("Failed to add fiscal year");
    }
  };

  const handleUpdateFiscalYear = async (data: Record<string, unknown>) => {
    try {
      if (!data?.id) return toast.error("Missing ID");
      if (!String(data.year ?? "").trim()) return toast.error("Fiscal year is required");
      const res = await fetch("/api/fiscyears", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Fiscal year updated");
      setEditingFiscalYear(null);
      fetchFiscalYears();
    } catch {
      toast.error("Failed to update fiscal year");
    }
  };

  const handleDeleteFiscalYear = async (id: string) => {
    try {
      const res = await fetch(`/api/fiscyears?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Fiscal year deleted");
      fetchFiscalYears();
    } catch {
      toast.error("Failed to delete fiscal year");
    }
  };

  // --------- CRUD: Wards ----------
  const handleAddWard = async (data: { name: string; code: string }) => {
    try {
      if (!data.name.trim() || !data.code.trim())
        return toast.error("Ward name and code are required");
      const res = await fetch("/api/wards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Ward added");
      setShowAddWardForm(false);
      setNewWard({ name: "", code: "" });
      fetchWards();
    } catch {
      toast.error("Failed to add ward");
    }
  };

  const handleUpdateWard = async (data: Record<string, unknown>) => {
    try {
      if (!data?.id) return toast.error("Missing ID");
      if (!String(data.name || "").trim() || !String(data.code || "").trim())
        return toast.error("Ward name and code are required");
      const res = await fetch("/api/wards", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Ward updated");
      setEditingWard(null);
      fetchWards();
    } catch {
      toast.error("Failed to update ward");
    }
  };

  const handleDeleteWard = async (id: string) => {
    try {
      const res = await fetch(`/api/wards?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Ward deleted");
      fetchWards();
    } catch {
      toast.error("Failed to delete ward");
    }
  };

  // --------- CRUD: Program Types ----------
  const handleAddProgramType = async (data: { name: string; code: string }) => {
    try {
      if (!data.name.trim() || !data.code.trim())
        return toast.error("Program type name and code are required");
      const res = await fetch("/api/programtypes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Program type added");
      setShowAddProgramTypeForm(false);
      setNewProgramType({ name: "", code: "" });
      fetchProgramTypes();
    } catch {
      toast.error("Failed to add program type");
    }
  };

  const handleUpdateProgramType = async (data: Record<string, unknown>) => {
    try {
      if (!data?.id) return toast.error("Missing ID");
      if (!String(data.name || "").trim() || !String(data.code || "").trim())
        return toast.error("Program type name and code are required");
      const res = await fetch("/api/programtypes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Program type updated");
      setEditingProgramType(null);
      fetchProgramTypes();
    } catch {
      toast.error("Failed to update program type");
    }
  };

  const handleDeleteProgramType = async (id: string) => {
    try {
      const res = await fetch(`/api/programtypes?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Program type deleted");
      fetchProgramTypes();
    } catch {
      toast.error("Failed to delete program type");
    }
  };

  // --------- CRUD: Funding Sources ----------
  const handleAddFundingSource = async (data: { name: string; code: string }) => {
    try {
      if (!data.name.trim() || !data.code.trim())
        return toast.error("Funding source name and code are required");
      const res = await fetch("/api/fundsources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Funding source added");
      setShowAddFundingSourceForm(false);
      setNewFundingSource({ name: "", code: "" });
      fetchFundingSources();
    } catch {
      toast.error("Failed to add funding source");
    }
  };

  const handleUpdateFundingSource = async (data: Record<string, unknown>) => {
    try {
      if (!data?.id) return toast.error("Missing ID");
      if (!String(data.name || "").trim() || !String(data.code || "").trim())
        return toast.error("Funding source name and code are required");
      const res = await fetch("/api/fundsources", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Funding source updated");
      setEditingFundingSource(null);
      fetchFundingSources();
    } catch {
      toast.error("Failed to update funding source");
    }
  };

  const handleDeleteFundingSource = async (id: string) => {
    try {
      const res = await fetch(`/api/fundsources?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Funding source deleted");
      fetchFundingSources();
    } catch {
      toast.error("Failed to delete funding source");
    }
  };

  const cancelDelete = () => {
    setDeletingFiscalYear(null);
    setDeletingWard(null);
    setDeletingProgramType(null);
    setDeletingFundingSource(null);
  };

  // =================== RENDER ===================
  return (
    <Shell rightRail={<><RecentWork /><TimeManagement /><UpcomingDeadlines /></>}>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* 1. User & Role Management */}
        <Card>
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4" /> User & Role Management
            </div>
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-3 py-2 text-xs text-white"
            >
              <UserPlus className="h-3 w-3" /> Add User
            </motion.button>
          </div>
          <div className="p-4">
            <div className="mb-3 rounded-xl border">
              {[
                { name: "Alex Parker", role: "Admin" },
                { name: "Sam Kim", role: "Ward Secretary" },
                { name: "Riya Mehta", role: "Planning Officer" },
                { name: "CAO Office", role: "CAO" },
              ].map((u) => (
                <div key={u.name} className="flex items-center justify-between border-b p-3 last:border-b-0">
                  <div>
                    <div className="text-sm font-medium">{u.name}</div>
                    <div className="text-xs text-gray-500">Role: {u.role}</div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button className="rounded-lg border px-2 py-1">
                      <Edit3 className="mr-1 inline h-3 w-3" /> Edit
                    </button>
                    <button className="rounded-lg border px-2 py-1 text-rose-600">
                      <Trash2 className="mr-1 inline h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <div className="mb-1 text-xs font-semibold text-gray-500">Assign Role</div>
                <div className="rounded-xl border p-3 text-xs">
                  <ul className="space-y-2">
                    <li><strong>CAO</strong>: status change, approvals, edit powers</li>
                    <li><strong>Admin/IT Officer</strong>: manage programs, user access</li>
                    <li><strong>Ward Secretary</strong>: committee docs, monitoring, payments</li>
                    <li><strong>Planning Officer</strong>: approvals, contracts, monitoring</li>
                    <li><strong>Technical Head</strong>: estimations, verify docs</li>
                  </ul>
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold text-gray-500">Ward-level Access Control</div>
                <div className="rounded-xl border p-3 text-xs">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" /> Restrict users to their ward&apos;s programs
                  </label>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 2. Workflow Configurations */}
        <Card>
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <GitCompare className="h-4 w-4" /> Workflow Configurations
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 p-4">
            <div>
              <div className="mb-1 text-xs text-gray-500">Approval Flow</div>
              <div className="rounded-xl border p-3 text-sm">
                Ward Secretary → Planning Officer → CAO
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {["Program", "Payments", "Contracts"].map((module) => (
                <div key={module} className="rounded-xl border p-3 text-xs">
                  <div className="mb-2 font-medium">{module} Approvers</div>
                  <div className="flex items-center gap-2">
                    <select className="w-full rounded-xl border bg-white px-3 py-2">
                      <option>Ward Secretary</option>
                      <option>Planning Officer</option>
                      <option>CAO</option>
                    </select>
                    <select className="w-full rounded-xl border bg-white px-3 py-2">
                      <option>Planning Officer</option>
                      <option>CAO</option>
                    </select>
                  </div>
                  <label className="mt-2 inline-flex items-center gap-2">
                    <input type="checkbox" /> Re-upload allowed on rejection
                  </label>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* 3. Status Management */}
        <Card>
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="h-4 w-4" /> Status Management (CAO-only)
            </div>
          </div>
          <div className="p-4 text-sm">
            <div className="rounded-xl border p-3">
              <div className="mb-2 text-xs text-gray-500">Change Program Status</div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <select className="rounded-xl border bg-white px-3 py-2 text-sm">
                  <option>Active</option>
                  <option>Completed</option>
                  <option>Archived</option>
                </select>
                <input placeholder="Reason (required)" className="rounded-xl border px-3 py-2 text-sm" />
                <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} className="rounded-xl bg-indigo-600 px-3 py-2 text-sm text-white">
                  Update Status
                </motion.button>
              </div>
              <label className="mt-3 inline-flex items-center gap-2 text-xs">
                <input type="checkbox" /> Lock completed files (read-only)
              </label>
            </div>
          </div>
        </Card>

        {/* 4. Document & Upload Settings */}
        <Card>
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileCog className="h-4 w-4" /> Document & Upload Settings
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 text-sm">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <div>
                <div className="text-xs text-gray-500">Allowed file types</div>
                <input defaultValue="PDF, JPG, PNG, MP4" className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" />
              </div>
              <div>
                <div className="text-xs text-gray-500">File size limit (MB)</div>
                <input defaultValue="200" className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" />
              </div>
            </div>
            <label className="inline-flex items-center gap-2 text-xs">
              <input type="checkbox" defaultChecked /> Allow multiple uploads per field
            </label>
            <div>
              <div className="text-xs text-gray-500">Mandatory uploads per step</div>
              <div className="mt-1 grid grid-cols-1 gap-2 md:grid-cols-2">
                {["Program", "Verification", "Payments", "Contracts"].map((s) => (
                  <label key={s} className="inline-flex items-center justify-between rounded-xl border px-3 py-2 text-xs">
                    <span>{s}</span>
                    <select className="rounded-lg border bg-white px-2 py-1 text-xs">
                      <option>Optional</option>
                      <option>Required</option>
                    </select>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* 5. System Config / Admin Tools */}
        <Card>
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Wrench className="h-4 w-4" /> System Config / Admin Tools
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 p-4 text-sm">
            <div className="rounded-xl border p-3">
              <div className="mb-1 text-xs font-semibold text-gray-500">Audit Log Access</div>
              <button className="rounded-lg border px-3 py-2 text-xs">Open Logs</button>
            </div>
            <div className="rounded-xl border p-3">
              <div className="mb-1 text-xs font-semibold text-gray-500">Backup & Restore</div>
              <div className="flex items-center gap-2 text-xs">
                <button className="rounded-lg border px-3 py-2">Download Backup</button>
                <button className="rounded-lg border px-3 py-2">Restore</button>
              </div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="mb-1 text-xs font-semibold text-gray-500">Print/Export Settings</div>
              <div className="flex items-center gap-2 text-xs">
                <button className="rounded-lg border px-3 py-2">PDF</button>
                <button className="rounded-lg border px-3 py-2">Excel</button>
              </div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="mb-1 text-xs font-semibold text-gray-500">Fiscal Year & Budget Cycle</div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <input placeholder="Current Fiscal Year" className="rounded-xl border px-3 py-2 text-sm" />
                <select className="rounded-xl border bg-white px-3 py-2 text-sm">
                  <option>Annual</option>
                  <option>Quarterly</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* 6. Dynamic Configuration */}
        <Card>
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Tag className="h-4 w-4" /> Dynamic Configuration
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 text-sm">

            {/* Fiscal Years */}
            <div className="rounded-xl border p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <span className="font-medium">Fiscal Years</span>
                </div>
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs"
                  onClick={() => setShowAddFiscalYearForm(true)}
                >
                  <Plus className="h-3 w-3" /> Add
                </motion.button>
              </div>

              <div className="space-y-2">
                {showAddFiscalYearForm && (
                  <div className="flex items-center justify-between rounded-lg border bg-gray-50 px-3 py-2">
                    <div className="flex w-full items-center gap-2">
                      <div className="flex-1">
                        <Input
                          type="text"
                          placeholder="Enter fiscal year (e.g. 2023/24)"
                          className="h-8 text-sm"
                          value={newFiscalYear.year}
                          onChange={(e) => setNewFiscalYear({ ...newFiscalYear, year: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Switch
                            id="fiscal-year-active"
                            checked={newFiscalYear.isActive}
                            onCheckedChange={(checked) => setNewFiscalYear({ ...newFiscalYear, isActive: checked })}
                          />
                          <Label htmlFor="fiscal-year-active" className="text-xs">Active</Label>
                        </div>
                        <button
                          className="rounded p-1 text-green-600 hover:bg-green-100"
                          onClick={() => handleAddFiscalYear(newFiscalYear)}
                          aria-label="Save fiscal year"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button
                          className="rounded p-1 text-gray-600 hover:bg-gray-100"
                          onClick={() => {
                            setShowAddFiscalYearForm(false);
                            setNewFiscalYear({ year: "", isActive: false });
                          }}
                          aria-label="Cancel"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {(fiscalYears ?? []).length === 0 && !showAddFiscalYearForm ? (
                  <div className="py-3 text-center text-sm text-gray-500">No fiscal years found</div>
                ) : (
                  (fiscalYears ?? []).map((fy) => (
                    <div key={fy.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                      {deletingFiscalYear === fy.id ? (
                        <div className="flex w-full items-center justify-between">
                          <div className="text-sm text-rose-600">Delete this fiscal year?</div>
                          <div className="flex items-center gap-1">
                            <button
                              className="rounded p-1 text-rose-600 hover:bg-rose-100"
                              onClick={() => {
                                handleDeleteFiscalYear(fy.id);
                                setDeletingFiscalYear(null);
                              }}
                              aria-label="Confirm delete"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button
                              className="rounded p-1 text-gray-600 hover:bg-gray-100"
                              onClick={cancelDelete}
                              aria-label="Cancel delete"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ) : editingFiscalYear && editingFiscalYear.id === fy.id ? (
                        <div className="flex w-full items-center gap-2">
                          <div className="grid flex-1 grid-cols-2 gap-2">
                            <Input
                              type="text"
                              placeholder="Fiscal year"
                              className="h-8 text-sm"
                              value={editingFiscalYear.year}
                              onChange={(e) => setEditingFiscalYear({ ...editingFiscalYear, year: e.target.value })}
                            />
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`active-${fy.id}`} className="text-xs">Active</Label>
                              <Switch
                                id={`active-${fy.id}`}
                                checked={editingFiscalYear.isActive}
                                onCheckedChange={(checked) =>
                                  setEditingFiscalYear({ ...editingFiscalYear, isActive: checked })
                                }
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              className="rounded p-1 text-green-600 hover:bg-green-100"
                              onClick={() => handleUpdateFiscalYear(editingFiscalYear)}
                              aria-label="Save"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button
                              className="rounded p-1 text-gray-600 hover:bg-gray-100"
                              onClick={() => setEditingFiscalYear(null)}
                              aria-label="Cancel edit"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex w-full items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{fy.year}</span>
                            {fy.isActive && (
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                                <Check className="mr-1 h-3 w-3" /> Active
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button className="rounded p-1 hover:bg-gray-100" onClick={() => setEditingFiscalYear(fy)} aria-label="Edit fiscal year">
                              <Edit3 className="h-3 w-3" />
                            </button>
                            <button className="rounded p-1 text-rose-600 hover:bg-gray-100" onClick={() => setDeletingFiscalYear(fy.id)} aria-label="Delete fiscal year">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Wards */}
            <div className="rounded-xl border p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-600" />
                  <span className="font-medium">Wards</span>
                </div>
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs"
                  onClick={() => setShowAddWardForm(true)}
                >
                  <Plus className="h-3 w-3" /> Add
                </motion.button>
              </div>

              <div className="space-y-2">
                {showAddWardForm && (
                  <div className="flex items-center justify-between rounded-lg border bg-gray-50 px-3 py-2">
                    <div className="flex w-full items-center gap-2">
                      <div className="grid flex-1 grid-cols-2 gap-2">
                        <Input
                          type="text"
                          placeholder="Ward code (e.g. W1)"
                          className="h-8 text-sm"
                          value={newWard.code}
                          onChange={(e) => setNewWard({ ...newWard, code: e.target.value })}
                        />
                        <Input
                          type="text"
                          placeholder="Ward name"
                          className="h-8 text-sm"
                          value={newWard.name}
                          onChange={(e) => setNewWard({ ...newWard, name: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <button className="rounded p-1 text-green-600 hover:bg-green-100" onClick={() => handleAddWard(newWard)} aria-label="Save ward">
                          <Check className="h-3 w-3" />
                        </button>
                        <button
                          className="rounded p-1 text-gray-600 hover:bg-gray-100"
                          onClick={() => {
                            setShowAddWardForm(false);
                            setNewWard({ name: "", code: "" });
                          }}
                          aria-label="Cancel"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {(wards ?? []).length === 0 && !showAddWardForm ? (
                  <div className="py-3 text-center text-sm text-gray-500">No wards found</div>
                ) : (
                  (wards ?? []).map((ward) => (
                    <div key={ward.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                      {deletingWard === ward.id ? (
                        <div className="flex w-full items-center justify-between">
                          <div className="text-sm text-rose-600">Delete this ward?</div>
                          <div className="flex items-center gap-1">
                            <button
                              className="rounded p-1 text-rose-600 hover:bg-rose-100"
                              onClick={() => {
                                handleDeleteWard(ward.id);
                                setDeletingWard(null);
                              }}
                              aria-label="Confirm delete"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button className="rounded p-1 text-gray-600 hover:bg-gray-100" onClick={cancelDelete} aria-label="Cancel delete">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ) : editingWard && editingWard.id === ward.id ? (
                        <div className="flex w-full items-center gap-2">
                          <div className="grid flex-1 grid-cols-2 gap-2">
                            <Input
                              type="text"
                              placeholder="Ward code"
                              className="h-8 text-sm"
                              value={editingWard.code}
                              onChange={(e) => setEditingWard({ ...editingWard, code: e.target.value })}
                            />
                            <Input
                              type="text"
                              placeholder="Ward name"
                              className="h-8 text-sm"
                              value={editingWard.name}
                              onChange={(e) => setEditingWard({ ...editingWard, name: e.target.value })}
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <button className="rounded p-1 text-green-600 hover:bg-green-100" onClick={() => handleUpdateWard(editingWard)} aria-label="Save ward">
                              <Check className="h-3 w-3" />
                            </button>
                            <button className="rounded p-1 text-gray-600 hover:bg-gray-100" onClick={() => setEditingWard(null)} aria-label="Cancel edit">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex w-full items-center justify-between">
                          <div>
                            <span className="text-sm font-medium">Ward {ward.code}</span>
                            <span className="ml-2 text-xs text-gray-500">- {ward.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button className="rounded p-1 hover:bg-gray-100" onClick={() => setEditingWard(ward)} aria-label="Edit ward">
                              <Edit3 className="h-3 w-3" />
                            </button>
                            <button className="rounded p-1 text-rose-600 hover:bg-gray-100" onClick={() => setDeletingWard(ward.id)} aria-label="Delete ward">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Program Types */}
            <div className="rounded-xl border p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-600" />
                  <span className="font-medium">Program Types</span>
                </div>
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs"
                  onClick={() => setShowAddProgramTypeForm(true)}
                >
                  <Plus className="h-3 w-3" /> Add
                </motion.button>
              </div>

              <div className="space-y-2">
                {showAddProgramTypeForm && (
                  <div className="flex items-center justify-between rounded-lg border bg-gray-50 px-3 py-2">
                    <div className="flex w-full items-center gap-2">
                      <div className="grid flex-1 grid-cols-2 gap-2">
                        <Input
                          type="text"
                          placeholder="Program type code"
                          className="h-8 text-sm"
                          value={newProgramType.code}
                          onChange={(e) => setNewProgramType({ ...newProgramType, code: e.target.value })}
                        />
                        <Input
                          type="text"
                          placeholder="Program type name"
                          className="h-8 text-sm"
                          value={newProgramType.name}
                          onChange={(e) => setNewProgramType({ ...newProgramType, name: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <button className="rounded p-1 text-green-600 hover:bg-green-100" onClick={() => handleAddProgramType(newProgramType)} aria-label="Save program type">
                          <Check className="h-3 w-3" />
                        </button>
                        <button
                          className="rounded p-1 text-gray-600 hover:bg-gray-100"
                          onClick={() => {
                            setShowAddProgramTypeForm(false);
                            setNewProgramType({ name: "", code: "" });
                          }}
                          aria-label="Cancel"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {(programTypes ?? []).length === 0 && !showAddProgramTypeForm ? (
                  <div className="py-3 text-center text-sm text-gray-500">No program types found</div>
                ) : (
                  (programTypes ?? []).map((type) => (
                    <div key={type.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                      {deletingProgramType === type.id ? (
                        <div className="flex w-full items-center justify-between">
                          <div className="text-sm text-rose-600">Delete this program type?</div>
                          <div className="flex items-center gap-1">
                            <button
                              className="rounded p-1 text-rose-600 hover:bg-rose-100"
                              onClick={() => {
                                handleDeleteProgramType(type.id);
                                setDeletingProgramType(null);
                              }}
                              aria-label="Confirm delete"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button className="rounded p-1 text-gray-600 hover:bg-gray-100" onClick={cancelDelete} aria-label="Cancel delete">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ) : editingProgramType && editingProgramType.id === type.id ? (
                        <div className="flex w-full items-center gap-2">
                          <div className="grid flex-1 grid-cols-2 gap-2">
                            <Input
                              type="text"
                              placeholder="Program type code"
                              className="h-8 text-sm"
                              value={editingProgramType.code}
                              onChange={(e) => setEditingProgramType({ ...editingProgramType, code: e.target.value })}
                            />
                            <Input
                              type="text"
                              placeholder="Program type name"
                              className="h-8 text-sm"
                              value={editingProgramType.name}
                              onChange={(e) => setEditingProgramType({ ...editingProgramType, name: e.target.value })}
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <button className="rounded p-1 text-green-600 hover:bg-green-100" onClick={() => handleUpdateProgramType(editingProgramType)} aria-label="Save program type">
                              <Check className="h-3 w-3" />
                            </button>
                            <button className="rounded p-1 text-gray-600 hover:bg-gray-100" onClick={() => setEditingProgramType(null)} aria-label="Cancel edit">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex w-full items-center justify-between">
                          <div>
                            <span className="text-sm font-medium">{type.name}</span>
                            {type.code && <span className="ml-2 text-xs text-gray-500">- {type.code}</span>}
                          </div>
                          <div className="flex items-center gap-1">
                            <button className="rounded p-1 hover:bg-gray-100" onClick={() => setEditingProgramType(type)} aria-label="Edit program type">
                              <Edit3 className="h-3 w-3" />
                            </button>
                            <button className="rounded p-1 text-rose-600 hover:bg-gray-100" onClick={() => setDeletingProgramType(type.id)} aria-label="Delete program type">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Funding Sources */}
            <div className="rounded-xl border p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-600" />
                  <span className="font-medium">Funding Sources</span>
                </div>
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs"
                  onClick={() => setShowAddFundingSourceForm(true)}
                >
                  <Plus className="h-3 w-3" /> Add
                </motion.button>
              </div>

              <div className="space-y-2">
                {showAddFundingSourceForm && (
                  <div className="flex items-center justify-between rounded-lg border bg-gray-50 px-3 py-2">
                    <div className="flex w-full items-center gap-2">
                      <div className="grid flex-1 grid-cols-2 gap-2">
                        <Input
                          type="text"
                          placeholder="Funding source code"
                          className="h-8 text-sm"
                          value={newFundingSource.code}
                          onChange={(e) => setNewFundingSource({ ...newFundingSource, code: e.target.value })}
                        />
                        <Input
                          type="text"
                          placeholder="Funding source name"
                          className="h-8 text-sm"
                          value={newFundingSource.name}
                          onChange={(e) => setNewFundingSource({ ...newFundingSource, name: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <button className="rounded p-1 text-green-600 hover:bg-green-100" onClick={() => handleAddFundingSource(newFundingSource)} aria-label="Save funding source">
                          <Check className="h-3 w-3" />
                        </button>
                        <button
                          className="rounded p-1 text-gray-600 hover:bg-gray-100"
                          onClick={() => {
                            setShowAddFundingSourceForm(false);
                            setNewFundingSource({ name: "", code: "" });
                          }}
                          aria-label="Cancel"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {(fundingSources ?? []).length === 0 && !showAddFundingSourceForm ? (
                  <div className="py-3 text-center text-sm text-gray-500">No funding sources found</div>
                ) : (
                  (fundingSources ?? []).map((source) => (
                    <div key={source.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                      {deletingFundingSource === source.id ? (
                        <div className="flex w-full items-center justify-between">
                          <div className="text-sm text-rose-600">Delete this funding source?</div>
                          <div className="flex items-center gap-1">
                            <button
                              className="rounded p-1 text-rose-600 hover:bg-rose-100"
                              onClick={() => {
                                handleDeleteFundingSource(source.id);
                                setDeletingFundingSource(null);
                              }}
                              aria-label="Confirm delete"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button className="rounded p-1 text-gray-600 hover:bg-gray-100" onClick={cancelDelete} aria-label="Cancel delete">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ) : editingFundingSource && editingFundingSource.id === source.id ? (
                        <div className="flex w-full items-center gap-2">
                          <div className="grid flex-1 grid-cols-2 gap-2">
                            <Input
                              type="text"
                              placeholder="Funding source code"
                              className="h-8 text-sm"
                              value={editingFundingSource.code}
                              onChange={(e) => setEditingFundingSource({ ...editingFundingSource, code: e.target.value })}
                            />
                            <Input
                              type="text"
                              placeholder="Funding source name"
                              className="h-8 text-sm"
                              value={editingFundingSource.name}
                              onChange={(e) => setEditingFundingSource({ ...editingFundingSource, name: e.target.value })}
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <button className="rounded p-1 text-green-600 hover:bg-green-100" onClick={() => handleUpdateFundingSource(editingFundingSource)} aria-label="Save funding source">
                              <Check className="h-3 w-3" />
                            </button>
                            <button className="rounded p-1 text-gray-600 hover:bg-gray-100" onClick={() => setEditingFundingSource(null)} aria-label="Cancel edit">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex w-full items-center justify-between">
                          <div>
                            <span className="text-sm font-medium">{source.name}</span>
                            {source.code && <span className="ml-2 text-xs text-gray-500">- {source.code}</span>}
                          </div>
                          <div className="flex items-center gap-1">
                            <button className="rounded p-1 hover:bg-gray-100" onClick={() => setEditingFundingSource(source)} aria-label="Edit funding source">
                              <Edit3 className="h-3 w-3" />
                            </button>
                            <button className="rounded p-1 text-rose-600 hover:bg-gray-100" onClick={() => setDeletingFundingSource(source.id)} aria-label="Delete funding source">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </Card>

        {/* 7. Miscellaneous */}
        <Card>
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Globe className="h-4 w-4" /> Miscellaneous
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 text-sm">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <div>
                <div className="text-xs text-gray-500">Language</div>
                <select className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm">
                  <option>English</option>
                  <option>Nepali</option>
                </select>
              </div>
              <div>
                <div className="text-xs text-gray-500">Theme / Branding</div>
                <div className="flex items-center gap-2">
                  <input placeholder="Header text" className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" />
                  <button className="mt-1 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs">
                    <ImageIcon className="h-4 w-4" /> Logo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Shell>
  );
}
