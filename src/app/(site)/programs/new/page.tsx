"use client";
import { useMemo, useState } from "react";
import Shell from "@/components/layout/Shell";
import { Card } from "@/components/ui/Card";
import { RecentWork } from "@/components/widgets/RecentWork";
import { TimeManagement } from "@/components/widgets/TimeManagement";
import { TeamChat } from "@/components/widgets/TeamChat";
import { motion } from "framer-motion";
import { Calendar, FileText, Upload, X, ChevronDown } from "lucide-react";
import Link from "next/link";

export default function CreateProgramPage() {
  const today = new Date();
  const year = today.getFullYear();
  const [programId] = useState<string>(() => `PRG-${year}-${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, "0")}`);

  const fiscalYears = useMemo(() => [year - 1, year, year + 1], [year]);

  const [form, setForm] = useState({
    code: programId,
    name: "",
    fiscalYear: String(year),
    ward: "",
    type: "new",
    budget: "",
    funding: "Red Book",
    description: "",
    startDate: "",
    endDate: "",
    officer: "",
    tags: "",
  });

  type FileItem = { id: string; file: File };
  const [redBookFiles, setRedBookFiles] = useState<FileItem[]>([]);
  const [execFiles, setExecFiles] = useState<FileItem[]>([]);

  function handleChange<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleAddFiles(target: "red" | "exec", files: FileList | null) {
    if (!files) return;
    const items: FileItem[] = Array.from(files).map((f) => ({ id: `${target}-${f.name}-${f.size}-${f.lastModified}`, file: f }));
    if (target === "red") setRedBookFiles((p) => [...p, ...items]);
    if (target === "exec") setExecFiles((p) => [...p, ...items]);
  }

  function removeFile(target: "red" | "exec", id: string) {
    if (target === "red") setRedBookFiles((p) => p.filter((x) => x.id !== id));
    if (target === "exec") setExecFiles((p) => p.filter((x) => x.id !== id));
  }

  return (
    <Shell rightRail={<><RecentWork /><TimeManagement /><TeamChat /></>}>
      <Card>
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <div className="text-lg font-semibold">Create New Program</div>
            <div className="text-xs text-gray-500">Fill in details from Red Book or Executive decisions.</div>
          </div>
          <div className="text-xs text-gray-500">Program Code</div>
        </div>
        <div className="flex items-center justify-between p-4">
          <div className="text-sm"><span className="text-gray-500">Auto-generated:</span> <span className="font-medium">{form.code}</span></div>
          <Link href="/programs" className="text-sm text-gray-600 hover:underline">Cancel / Back to List</Link>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
        {/* Left: Program Info */}
        <Card>
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-xs text-gray-600">Program ID</label>
              <input value={form.code} onChange={(e) => handleChange("code", e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-600">Program Name</label>
              <input value={form.name} onChange={(e) => handleChange("name", e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" placeholder="e.g., Road Maintenance - Ward 12" />
            </div>
            <div>
              <label className="text-xs text-gray-600">Fiscal Year</label>
              <div className="relative mt-1">
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select value={form.fiscalYear} onChange={(e) => handleChange("fiscalYear", e.target.value)} className="w-full appearance-none rounded-xl border bg-white px-3 py-2 text-sm">
                  {fiscalYears.map((fy) => (<option key={fy} value={fy}>{fy}</option>))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-600">Ward</label>
              <input value={form.ward} onChange={(e) => handleChange("ward", e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" placeholder="e.g., 12 (comma separated for multi)" />
            </div>
            <div>
              <label className="text-xs text-gray-600">Program Type</label>
              <select value={form.type} onChange={(e) => handleChange("type", e.target.value)} className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm">
                <option value="new">New Program</option>
                <option value="carried">Carried-over</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600">Budget Amount</label>
              <input value={form.budget} onChange={(e) => handleChange("budget", e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" placeholder="e.g., 1,000,000" />
            </div>
            <div>
              <label className="text-xs text-gray-600">Funding Source</label>
              <select value={form.funding} onChange={(e) => handleChange("funding", e.target.value)} className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm">
                <option>Red Book</option>
                <option>Executive</option>
                <option>Other</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-600">Description</label>
              <textarea value={form.description} onChange={(e) => handleChange("description", e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" rows={4} placeholder="Brief summary and objectives" />
            </div>
          </div>
        </Card>

        {/* Right: Uploads + Controls */}
        <div className="space-y-4">
          <Card>
            <div className="border-b p-4 text-sm font-medium">File Uploads</div>
            <div className="space-y-4 p-4">
              <div>
                <div className="mb-1 text-xs font-semibold text-gray-500">Red Book Scan / Document (PDF)</div>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-4 text-sm hover:bg-gray-50">
                  <Upload className="h-4 w-4" /> Upload files
                  <input multiple accept="application/pdf" type="file" className="hidden" onChange={(e) => handleAddFiles("red", e.target.files)} />
                </label>
                <div className="mt-2 space-y-2">
                  {redBookFiles.map((f) => (
                    <div key={f.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                      <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-gray-500" /> {f.file.name}</div>
                      <button onClick={() => removeFile("red", f.id)} className="text-xs text-rose-600 hover:underline"><X className="mr-1 inline h-3 w-3" /> Remove</button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold text-gray-500">Executive Approval Document (PDF)</div>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-4 text-sm hover:bg-gray-50">
                  <Upload className="h-4 w-4" /> Upload files
                  <input multiple accept="application/pdf" type="file" className="hidden" onChange={(e) => handleAddFiles("exec", e.target.files)} />
                </label>
                <div className="mt-2 space-y-2">
                  {execFiles.map((f) => (
                    <div key={f.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                      <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-gray-500" /> {f.file.name}</div>
                      <button onClick={() => removeFile("exec", f.id)} className="text-xs text-rose-600 hover:underline"><X className="mr-1 inline h-3 w-3" /> Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="border-b p-4 text-sm font-medium">Metadata / Controls</div>
            <div className="grid grid-cols-1 gap-4 p-4">
              <div>
                <label className="text-xs text-gray-600">Category Tags</label>
                <input value={form.tags} onChange={(e) => handleChange("tags", e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" placeholder="e.g., road, maintenance" />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs text-gray-600">Start Date</label>
                  <div className="relative mt-1">
                    <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input type="date" value={form.startDate} onChange={(e) => handleChange("startDate", e.target.value)} className="w-full rounded-xl border bg-white px-3 py-2 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-600">End Date</label>
                  <div className="relative mt-1">
                    <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input type="date" value={form.endDate} onChange={(e) => handleChange("endDate", e.target.value)} className="w-full rounded-xl border bg-white px-3 py-2 text-sm" />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-600">Responsible Officer</label>
                <select value={form.officer} onChange={(e) => handleChange("officer", e.target.value)} className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm">
                  <option value="">Select officer...</option>
                  <option>Planning Officer</option>
                  <option>CAO</option>
                  <option>Executive Officer</option>
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="rounded-xl border px-3 py-2 text-sm">Save Draft</motion.button>
                <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="rounded-xl bg-gray-900 px-3 py-2 text-sm text-white">Submit for Approval</motion.button>
                <Link href="/programs" className="text-sm text-gray-600 hover:underline">Cancel / Back to List</Link>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* History side panel */}
      <Card>
        <div className="p-4">
          <div className="mb-1 text-sm font-medium">History</div>
          <div className="rounded-xl border bg-gray-50 p-8 text-center text-xs text-gray-500">Empty until saved</div>
        </div>
      </Card>
    </Shell>
  );
}

