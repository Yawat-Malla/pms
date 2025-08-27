"use client";
import { Card } from "@/components/ui/Card";
import Shell from "@/components/layout/Shell";
import { RecentWork } from "@/components/widgets/RecentWork";
import { TimeManagement } from "@/components/widgets/TimeManagement";
import { UpcomingDeadlines } from "@/components/widgets/UpcomingDeadlines";
import { Plus, Upload, CheckCircle2, Clock, ListChecks, Files, DollarSign, TrendingUp, AlertTriangle, Calendar, Eye, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { HydrationSafe } from "@/components/ui/HydrationSafe";

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
    { id: "PRG-001", name: "Road Maintenance", ward: 5, type: "Program Approval", priority: "high", link: "/programs/PRG-001" },
    { id: "PRG-002", name: "Water Supply", ward: 3, type: "Contract Review", priority: "medium", link: "/programs/PRG-002" },
    { id: "PRG-003", name: "School Building", ward: 7, type: "Payment Request", priority: "high", link: "/programs/PRG-003" },
    { id: "PRG-004", name: "Health Post", ward: 2, type: "Verification", priority: "low", link: "/programs/PRG-004" },
    { id: "PRG-005", name: "Street Lighting", ward: 9, type: "Committee Minutes", priority: "medium", link: "/programs/PRG-005" },
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

      {/* 2. Ward Overview */}
      <Card>
        <div className="flex items-center justify-between border-b p-4">
          <div className="text-lg font-semibold">Ward Overview</div>
          <Link href="/programs" className="text-sm text-blue-600 hover:underline">View All</Link>
        </div>
        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-4">
          {wardStats.map((ward) => (
            <div key={ward.ward} className="rounded-lg border p-3">
              <div className="text-sm font-medium mb-2">{ward.ward}</div>
              <div className="space-y-1 text-xs text-gray-600">
                <div>Programs: {ward.programs}</div>
                <div>Budget: {ward.budget}</div>
                <div>Spent: {ward.spent}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 3. Task/Approval Queue */}
      <Card>
        <div className="flex items-center justify-between border-b p-4">
          <div className="text-lg font-semibold">Your Pending Approvals</div>
          <Link href="/approvals" className="text-sm text-blue-600 hover:underline">View All</Link>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {pendingApprovals.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                  <div>
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-xs text-gray-500">Ward {item.ward} • {item.type}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-lg border px-2 py-1 text-xs ${getPriorityColor(item.priority)}`}>
                    {item.priority}
                  </span>
                  <Link href={item.link} className="text-blue-600 hover:underline text-sm">View</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* 4. Recent Activity */}
      <Card>
        <div className="flex items-center justify-between border-b p-4">
          <div className="text-lg font-semibold">Recent Activity</div>
          <Link href="/reports" className="text-sm text-blue-600 hover:underline">View All</Link>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {recentActivity.map((activity, i) => (
              <div key={i} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg">
                <div className="text-lg">{getActivityIcon(activity.type)}</div>
                <div className="flex-1">
                  <div className="text-sm">{activity.action}</div>
                  <div className="text-xs text-gray-500">{activity.time}</div>
                </div>
                <Link href={activity.link} className="text-blue-600 hover:underline text-sm">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* 5. Active Programs */}
      <Card>
        <div className="flex items-center justify-between border-b p-4">
          <div className="text-lg font-semibold">Active Programs</div>
          <Link href="/programs" className="text-sm text-blue-600 hover:underline">View All</Link>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {activePrograms.map((program) => (
              <div key={program.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-sm">{program.name}</div>
                  <span className={`inline-flex items-center rounded-lg border px-2 py-1 text-xs ${getStatusColor(program.status)}`}>
                    {program.status}
                  </span>
                </div>
                <div className="text-xs text-gray-600 mb-2">Ward {program.ward} • {program.budget}</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${program.progress}%` }}></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">{program.progress}% complete</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* 6. Notifications & Reminders */}
      <Card>
        <div className="flex items-center justify-between border-b p-4">
          <div className="text-lg font-semibold">Notifications & Reminders</div>
          <button className="text-sm text-blue-600 hover:underline">Mark All Read</button>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {notifications.map((notification, i) => (
              <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                <AlertTriangle className={`h-5 w-5 mt-0.5 ${notification.priority === 'high' ? 'text-rose-500' : notification.priority === 'medium' ? 'text-amber-500' : 'text-emerald-500'}`} />
                <div className="flex-1">
                  <div className="text-sm">{notification.message}</div>
                  <div className="text-xs text-gray-500">Priority: {notification.priority}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </Shell>
  );
}
