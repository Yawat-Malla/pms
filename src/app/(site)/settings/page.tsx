"use client";
import Shell from "@/components/layout/Shell";
import { Card } from "@/components/ui/Card";
import { RecentWork } from "@/components/widgets/RecentWork";
import { TimeManagement } from "@/components/widgets/TimeManagement";
import { TeamChat } from "@/components/widgets/TeamChat";
import { motion } from "framer-motion";
import { UserPlus, Users, ShieldCheck, Lock, GitCompare, FileCog, Wrench, Globe, Image as ImageIcon, Plus, Trash2, Edit3, ChevronDown } from "lucide-react";

export default function SettingsPage() {
  return (
    <Shell rightRail={<><RecentWork /><TimeManagement /><TeamChat /></>}>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* 1. User & Role Management */}
        <Card>
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2 text-sm font-medium"><Users className="h-4 w-4" /> User & Role Management</div>
            <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-3 py-2 text-xs text-white"><UserPlus className="h-3 w-3" /> Add User</motion.button>
          </div>
          <div className="p-4">
            <div className="mb-3 rounded-xl border">
              {[{name: "Alex Parker", role: "Admin"},{name: "Sam Kim", role: "Ward Secretary"},{name: "Riya Mehta", role: "Planning Officer"},{name: "CAO Office", role: "CAO"}].map((u) => (
                <div key={u.name} className="flex items-center justify-between border-b p-3 last:border-b-0">
                  <div>
                    <div className="text-sm font-medium">{u.name}</div>
                    <div className="text-xs text-gray-500">Role: {u.role}</div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button className="rounded-lg border px-2 py-1"><Edit3 className="mr-1 inline h-3 w-3" /> Edit</button>
                    <button className="rounded-lg border px-2 py-1 text-rose-600"><Trash2 className="mr-1 inline h-3 w-3" /> Delete</button>
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
                  <label className="inline-flex items-center gap-2"><input type="checkbox" /> Restrict users to their ward's programs</label>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 2. Workflow Configurations */}
        <Card>
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2 text-sm font-medium"><GitCompare className="h-4 w-4" /> Workflow Configurations</div>
          </div>
          <div className="grid grid-cols-1 gap-4 p-4">
            <div>
              <div className="mb-1 text-xs text-gray-500">Approval Flow</div>
              <div className="rounded-xl border p-3 text-sm">
                Ward Secretary → Planning Officer → CAO
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {["Program","Payments","Contracts"].map((module) => (
                <div key={module} className="rounded-xl border p-3 text-xs">
                  <div className="mb-2 font-medium">{module} Approvers</div>
                  <div className="flex items-center gap-2">
                    <select className="w-full rounded-xl border bg-white px-3 py-2"><option>Ward Secretary</option><option>Planning Officer</option><option>CAO</option></select>
                    <select className="w-full rounded-xl border bg-white px-3 py-2"><option>Planning Officer</option><option>CAO</option></select>
                  </div>
                  <label className="mt-2 inline-flex items-center gap-2"><input type="checkbox" /> Re-upload allowed on rejection</label>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* 3. Status Management */}
        <Card>
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="h-4 w-4" /> Status Management (CAO-only)</div>
          </div>
          <div className="p-4 text-sm">
            <div className="rounded-xl border p-3">
              <div className="mb-2 text-xs text-gray-500">Change Program Status</div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <select className="rounded-xl border bg-white px-3 py-2 text-sm"><option>Active</option><option>Completed</option><option>Archived</option></select>
                <input placeholder="Reason (required)" className="rounded-xl border px-3 py-2 text-sm" />
                <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} className="rounded-xl bg-indigo-600 px-3 py-2 text-sm text-white">Update Status</motion.button>
              </div>
              <label className="mt-3 inline-flex items-center gap-2 text-xs"><input type="checkbox" /> Lock completed files (read-only)</label>
            </div>
          </div>
        </Card>

        {/* 4. Document & Upload Settings */}
        <Card>
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2 text-sm font-medium"><FileCog className="h-4 w-4" /> Document & Upload Settings</div>
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
            <label className="inline-flex items-center gap-2 text-xs"><input type="checkbox" defaultChecked /> Allow multiple uploads per field</label>
            <div>
              <div className="text-xs text-gray-500">Mandatory uploads per step</div>
              <div className="mt-1 grid grid-cols-1 gap-2 md:grid-cols-2">
                {["Program","Verification","Payments","Contracts"].map((s) => (
                  <label key={s} className="inline-flex items-center justify-between rounded-xl border px-3 py-2 text-xs">
                    <span>{s}</span>
                    <select className="rounded-lg border bg-white px-2 py-1 text-xs"><option>Optional</option><option>Required</option></select>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* 5. System Config / Admin Tools */}
        <Card>
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2 text-sm font-medium"><Wrench className="h-4 w-4" /> System Config / Admin Tools</div>
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
                <select className="rounded-xl border bg-white px-3 py-2 text-sm"><option>Annual</option><option>Quarterly</option></select>
              </div>
            </div>
          </div>
        </Card>

        {/* 6. Miscellaneous */}
        <Card>
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2 text-sm font-medium"><Globe className="h-4 w-4" /> Miscellaneous</div>
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 text-sm">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <div>
                <div className="text-xs text-gray-500">Language</div>
                <select className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"><option>English</option><option>Nepali</option></select>
              </div>
              <div>
                <div className="text-xs text-gray-500">Theme / Branding</div>
                <div className="flex items-center gap-2">
                  <input placeholder="Header text" className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" />
                  <button className="mt-1 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs"><ImageIcon className="h-4 w-4" /> Logo</button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Shell>
  );
}
