"use client";
import { Card } from "@/components/ui/Card";
import Shell from "@/components/layout/Shell";
import { RecentWork } from "@/components/widgets/RecentWork";
import { TimeManagement } from "@/components/widgets/TimeManagement";
import { TeamChat } from "@/components/widgets/TeamChat";
import { Plus, Upload, CheckCircle2, Clock, ListChecks, Files, DollarSign, TrendingUp, AlertTriangle, Calendar, Eye, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function DashboardPage() {
  const stats = [
    { 
      label: "Total Programs (FY 2025/26)", 
      value: 128, 
      icon: Files, 
      tone: "from-indigo-100 to-indigo-50",
      change: "+12%",
      changeType: "positive"
    },
    { 
      label: "Pending Approval", 
      value: 23, 
      icon: Clock, 
      tone: "from-amber-100 to-amber-50",
      change: "+5",
      changeType: "negative"
    },
    { 
      label: "Budget vs Spent", 
      value: "Rs. 45.2M", 
      icon: DollarSign, 
      tone: "from-emerald-100 to-emerald-50",
      progress: 68,
      subtitle: "Rs. 68.5M allocated"
    },
    { 
      label: "Payments Pending", 
      value: 34, 
      icon: TrendingUp, 
      tone: "from-violet-100 to-violet-50",
      change: "Rs. 12.3M",
      changeType: "neutral"
    },
  ];

  const wardStats = [
    { ward: "Ward 1", programs: 8, budget: "Rs. 5.2M", spent: "Rs. 3.1M" },
    { ward: "Ward 2", programs: 12, budget: "Rs. 7.8M", spent: "Rs. 4.9M" },
    { ward: "Ward 3", programs: 6, budget: "Rs. 4.1M", spent: "Rs. 2.8M" },
    { ward: "Ward 4", programs: 15, budget: "Rs. 9.3M", spent: "Rs. 6.2M" },
  ];

  const pendingApprovals = [
    { id: "PRG-001", name: "Road Maintenance", ward: 5, type: "Program Approval", priority: "high" },
    { id: "PRG-002", name: "Water Supply", ward: 3, type: "Contract Review", priority: "medium" },
    { id: "PRG-003", name: "School Building", ward: 7, type: "Payment Request", priority: "high" },
    { id: "PRG-004", name: "Health Post", ward: 2, type: "Verification", priority: "low" },
    { id: "PRG-005", name: "Street Lighting", ward: 9, type: "Committee Minutes", priority: "medium" },
  ];

  const recentActivity = [
    { action: "Ward 5 uploaded Cost Estimation for Road Project", time: "2h ago", type: "upload", link: "/programs/PRG-001" },
    { action: "Contract for School Building approved by CAO", time: "4h ago", type: "approval", link: "/programs/PRG-003" },
    { action: "Payment request of Rs. 50,000 rejected by Accounts", time: "6h ago", type: "rejection", link: "/programs/PRG-002" },
    { action: "Ward 3 submitted Verification Report", time: "8h ago", type: "submission", link: "/programs/PRG-004" },
    { action: "New program 'Street Lighting' created in Ward 9", time: "1d ago", type: "creation", link: "/programs/PRG-005" },
  ];

  const activePrograms = [
    { id: "PRG-001", name: "Road Maintenance - Ward 5", ward: 5, budget: "Rs. 2.5M", status: "Ongoing", progress: 75 },
    { id: "PRG-002", name: "Water Supply Upgrade - Ward 3", ward: 3, budget: "Rs. 1.8M", status: "Pending", progress: 0 },
    { id: "PRG-003", name: "School Building - Ward 7", ward: 7, budget: "Rs. 3.2M", status: "Approved", progress: 15 },
    { id: "PRG-004", name: "Health Post Expansion - Ward 2", ward: 2, budget: "Rs. 1.2M", status: "Ongoing", progress: 45 },
  ];

  const notifications = [
    { type: "deadline", message: "Fiscal Year closing in 10 days", priority: "high" },
    { type: "approval", message: "5 programs awaiting your approval", priority: "medium" },
    { type: "payment", message: "Payment deadline for Ward 5 tomorrow", priority: "high" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ongoing': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Completed': return 'bg-violet-50 text-violet-700 border-violet-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'upload': return '📤';
      case 'approval': return '✅';
      case 'rejection': return '❌';
      case 'submission': return '📝';
      case 'creation': return '🆕';
      default: return '📋';
    }
  };

  return (
    <Shell rightRail={<><RecentWork /><TimeManagement /><TeamChat /></>}>
      {/* 1. Header / Quick Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${s.tone}`}>
                  <s.icon className="h-6 w-6 text-gray-700" />
                </div>
                {s.change && (
                  <span className={`text-xs font-medium ${s.changeType === 'positive' ? 'text-emerald-600' : s.changeType === 'negative' ? 'text-rose-600' : 'text-gray-600'}`}>
                    {s.change}
                  </span>
                )}
              </div>
              <div className="mb-2">
                <div className="text-xs text-gray-500">{s.label}</div>
                <div className="text-2xl font-semibold">{s.value}</div>
                {s.subtitle && <div className="text-xs text-gray-500">{s.subtitle}</div>}
              </div>
              {s.progress && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${s.progress}%` }}></div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Ward-level Stats for CAO/Planning Officer */}
      <Card>
        <div className="flex items-center justify-between border-b p-4">
          <div className="text-sm font-medium">Ward-wise Overview</div>
          <Link href="/reports" className="text-xs text-gray-600 hover:underline">View All</Link>
        </div>
        <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 lg:grid-cols-4">
          {wardStats.map((ward) => (
            <div key={ward.ward} className="rounded-lg border p-3 text-sm">
              <div className="font-medium text-gray-900">{ward.ward}</div>
              <div className="text-xs text-gray-500 mt-1">{ward.programs} programs</div>
              <div className="text-xs text-gray-500">Budget: {ward.budget}</div>
              <div className="text-xs text-gray-500">Spent: {ward.spent}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 2. Charts Section */}
        <Card>
          <div className="flex items-center justify-between border-b p-4">
            <div className="text-sm font-medium">Budget Utilization</div>
            <select className="text-xs border rounded-lg px-2 py-1">
              <option>By Ward</option>
              <option>By Program</option>
            </select>
          </div>
          <div className="p-4">
            <div className="h-48 rounded-lg border bg-gray-50 flex items-center justify-center text-sm text-gray-500">
              📊 Budget vs Expenses Chart
              <br />
              <span className="text-xs">(Chart component would go here)</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b p-4">
            <div className="text-sm font-medium">Program Status Breakdown</div>
          </div>
          <div className="p-4">
            <div className="h-48 rounded-lg border bg-gray-50 flex items-center justify-center text-sm text-gray-500">
              🥧 Status Distribution Pie Chart
              <br />
              <span className="text-xs">(Chart component would go here)</span>
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Task/Approval Queue */}
      <Card>
        <div className="flex items-center justify-between border-b p-4">
          <div className="text-sm font-medium">Your Pending Approvals</div>
          <Link href="/approvals" className="text-xs text-gray-600 hover:underline flex items-center gap-1">
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="divide-y">
          {pendingApprovals.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4">
              <div className="flex-1">
                <div className="text-sm font-medium">{item.name}</div>
                <div className="text-xs text-gray-500">{item.id} · Ward {item.ward} · {item.type}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center rounded-lg px-2 py-1 text-xs ${
                  item.priority === 'high' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 
                  item.priority === 'medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 
                  'bg-gray-50 text-gray-700 border border-gray-200'
                }`}>
                  {item.priority} priority
                </span>
                <Link href={`/programs/${encodeURIComponent(item.id)}`} className="text-xs text-gray-600 hover:underline">
                  <Eye className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 4. Recent Activity Feed */}
        <Card>
          <div className="flex items-center justify-between border-b p-4">
            <div className="text-sm font-medium">Recent Activity</div>
            <Link href="/reports" className="text-xs text-gray-600 hover:underline">View Logs</Link>
          </div>
          <div className="p-4 space-y-3">
            {recentActivity.map((activity, i) => (
              <Link key={i} href={activity.link} className="block hover:bg-gray-50 rounded-lg p-2 -m-2">
                <div className="flex items-start gap-3">
                  <span className="text-lg">{getActivityIcon(activity.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-900">{activity.action}</div>
                    <div className="text-xs text-gray-500">{activity.time}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* 5. Programs Overview */}
        <Card>
          <div className="flex items-center justify-between border-b p-4">
            <div className="text-sm font-medium">Active Programs</div>
            <Link href="/programs" className="text-xs text-gray-600 hover:underline">View All</Link>
          </div>
          <div className="p-4 space-y-3">
            {activePrograms.map((program) => (
              <div key={program.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <Link href={`/programs/${encodeURIComponent(program.id)}`} className="text-sm font-medium hover:underline block truncate">
                      {program.name}
                    </Link>
                    <div className="text-xs text-gray-500">Ward {program.ward} · {program.budget}</div>
                  </div>
                  <span className={`inline-flex items-center rounded-lg border px-2 py-1 text-xs ${getStatusColor(program.status)}`}>
                    {program.status}
                  </span>
                </div>
                {program.progress > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${program.progress}%` }}></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 6. Notifications/Reminders */}
      <Card>
        <div className="flex items-center justify-between border-b p-4">
          <div className="text-sm font-medium">Notifications & Reminders</div>
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {notifications.map((notification, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${
                notification.priority === 'high' ? 'border-rose-200 bg-rose-50' : 'border-amber-200 bg-amber-50'
              }`}>
                <AlertTriangle className={`h-4 w-4 ${
                  notification.priority === 'high' ? 'text-rose-500' : 'text-amber-500'
                }`} />
                <div className="flex-1">
                  <div className="text-sm font-medium">{notification.message}</div>
                  <div className="text-xs text-gray-600">Action required</div>
                </div>
                <button className="text-xs text-gray-600 hover:underline">Dismiss</button>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Quick Links */}
      <Card>
        <div className="flex flex-wrap items-center gap-3 p-4">
          {[
            { label: "+ Add Program", icon: Plus, href: "/programs/new" },
            { label: "View Approvals", icon: Clock, href: "/approvals" },
            { label: "Generate Reports", icon: TrendingUp, href: "/reports" },
            { label: "System Settings", icon: CheckCircle2, href: "/settings" },
          ].map((q) => (
            <Link key={q.label} href={q.href} className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm hover:bg-gray-50">
              <motion.span whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-flex items-center gap-2">
                <q.icon className="h-4 w-4" /> {q.label}
              </motion.span>
            </Link>
          ))}
        </div>
      </Card>
    </Shell>
  );
}
