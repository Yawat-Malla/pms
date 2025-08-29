"use client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import Shell from "@/components/layout/Shell";
import { RecentWork } from "@/components/widgets/RecentWork";
import { TimeManagement } from "@/components/widgets/TimeManagement";
import { UpcomingDeadlines } from "@/components/widgets/UpcomingDeadlines";
import { Plus, CheckCircle2, Clock, ListChecks, Files, DollarSign, TrendingUp, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalPrograms: {
    value: number;
    change: string;
    changeType: "positive" | "negative" | "neutral";
  };
  pendingApprovals: {
    value: number;
    change: string;
    changeType: "positive" | "negative" | "neutral";
  };
  budget: {
    allocated: number;
    spent: number;
    percentage: number;
    formattedAllocated: string;
    formattedSpent: string;
  };
  pendingPayments: {
    count: number;
    amount: number;
    formattedAmount: string;
  };
  fiscalYear: string;
}

interface WardStat {
  ward: string;
  wardName: string;
  programs: number;
  budget: string;
  spent: string;
  budgetRaw: number;
  spentRaw: number;
  spentPercentage: number;
}

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  time: string;
  type: string;
  user: string;
  link: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  timeAgo: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [wardStats, setWardStats] = useState<WardStat[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch all dashboard data in parallel
        const [statsRes, wardStatsRes, activityRes, notificationsRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/dashboard/ward-stats'),
          fetch('/api/dashboard/recent-activity?limit=5'),
          fetch('/api/notifications?limit=3&unread=true')
        ]);

        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data.stats);
        }

        if (wardStatsRes.ok) {
          const data = await wardStatsRes.json();
          setWardStats(data.wardStats || []);
        }

        if (activityRes.ok) {
          const data = await activityRes.json();
          setActivityLogs(data.activities || []);
        }

        if (notificationsRes.ok) {
          const data = await notificationsRes.json();
          setNotifications(data.notifications || []);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Shell rightRail={<><RecentWork /><TimeManagement /><UpcomingDeadlines /></>}>
        <Card>
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading dashboard...</span>
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
              <div className="text-red-600 mb-2">Error loading dashboard</div>
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
  const dashboardStats = stats ? [
    {
      label: `Total Programs (${stats.fiscalYear})`,
      value: stats.totalPrograms.value,
      icon: Files,
      tone: "from-indigo-100 to-indigo-50",
      change: stats.totalPrograms.change,
      changeType: stats.totalPrograms.changeType
    },
    {
      label: "Pending Approval",
      value: stats.pendingApprovals.value,
      icon: Clock,
      tone: "from-amber-100 to-amber-50",
      change: stats.pendingApprovals.change,
      changeType: stats.pendingApprovals.changeType
    },
    {
      label: "Budget vs Spent",
      value: stats.budget.formattedSpent,
      icon: DollarSign,
      tone: "from-emerald-100 to-emerald-50",
      progress: stats.budget.percentage,
      subtitle: `${stats.budget.formattedAllocated} allocated`
    },
    {
      label: "Payments Pending",
      value: stats.pendingPayments.count,
      icon: TrendingUp,
      tone: "from-violet-100 to-violet-50",
      change: stats.pendingPayments.formattedAmount,
      changeType: "neutral" as const
    },
  ] : [];



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
    <Shell rightRail={<><RecentWork /><TimeManagement /><UpcomingDeadlines /></>}>
      {/* 1. Header / Quick Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((s) => (
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
              {s.progress !== undefined && (
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
          {wardStats.length > 0 ? wardStats.map((ward) => (
            <div key={ward.ward} className="rounded-lg border p-3">
              <div className="text-sm font-medium mb-2">{ward.ward}</div>
              <div className="space-y-1 text-xs text-gray-600">
                <div>Programs: {ward.programs}</div>
                <div>Budget: {ward.budget}</div>
                <div>Spent: {ward.spent}</div>
                {ward.spentPercentage > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                    <div
                      className="bg-blue-600 h-1 rounded-full"
                      style={{ width: `${Math.min(ward.spentPercentage, 100)}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          )) : (
            <div className="col-span-full text-center text-gray-500 py-8">
              No ward data available
            </div>
          )}
        </div>
      </Card>

      {/* 3. Quick Actions */}
      <Card>
        <div className="flex items-center justify-between border-b p-4">
          <div className="text-lg font-semibold">Quick Actions</div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/programs/new" className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
              <Plus className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium text-sm">New Program</div>
                <div className="text-xs text-gray-500">Create program</div>
              </div>
            </Link>
            <Link href="/approvals" className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium text-sm">Approvals</div>
                <div className="text-xs text-gray-500">Review pending</div>
              </div>
            </Link>
            <Link href="/reports" className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
              <Files className="h-5 w-5 text-purple-600" />
              <div>
                <div className="font-medium text-sm">Reports</div>
                <div className="text-xs text-gray-500">Generate reports</div>
              </div>
            </Link>
            <Link href="/settings" className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
              <ListChecks className="h-5 w-5 text-gray-600" />
              <div>
                <div className="font-medium text-sm">Settings</div>
                <div className="text-xs text-gray-500">System config</div>
              </div>
            </Link>
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
            {activityLogs.length > 0 ? activityLogs.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg">
                <div className="text-lg">{getActivityIcon(activity.type)}</div>
                <div className="flex-1">
                  <div className="text-sm">{activity.description}</div>
                  <div className="text-xs text-gray-500">{activity.time} • {activity.user}</div>
                </div>
                <Link href={activity.link} className="text-blue-600 hover:underline text-sm">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )) : (
              <div className="text-center text-gray-500 py-8">
                No recent activity
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* 5. Notifications & Reminders */}
      <Card>
        <div className="flex items-center justify-between border-b p-4">
          <div className="text-lg font-semibold">Notifications & Reminders</div>
          <button className="text-sm text-blue-600 hover:underline">Mark All Read</button>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {notifications.length > 0 ? notifications.map((notification) => (
              <div key={notification.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <AlertTriangle className={`h-5 w-5 mt-0.5 ${notification.priority === 'high' ? 'text-rose-500' : notification.priority === 'medium' ? 'text-amber-500' : 'text-emerald-500'}`} />
                <div className="flex-1">
                  <div className="text-sm font-medium">{notification.title}</div>
                  <div className="text-sm text-gray-600">{notification.message}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {notification.timeAgo} • Priority: {notification.priority}
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center text-gray-500 py-8">
                No notifications
              </div>
            )}
          </div>
        </div>
      </Card>
    </Shell>
  );
}
