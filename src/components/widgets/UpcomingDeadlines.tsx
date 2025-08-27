"use client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { motion } from "framer-motion";
import { Calendar, Clock } from "lucide-react";

const DEMO_DEADLINES = [
  {
    id: 1,
    programName: "Road Maintenance - Ward 12",
    deadline: "2025-02-15",
    status: "Active",
    type: "Site Inspection"
  },
  {
    id: 2,
    programName: "Water Supply Upgrade",
    deadline: "2025-02-20",
    status: "Pending",
    type: "Document Submission"
  },
  {
    id: 3,
    programName: "School Renovation Project",
    deadline: "2025-02-25",
    status: "Active",
    type: "Progress Review"
  },
  {
    id: 4,
    programName: "Health Post Expansion",
    deadline: "2025-03-01",
    status: "Pending",
    type: "Final Approval"
  },
  {
    id: 5,
    programName: "Street Lighting Installation",
    deadline: "2025-03-05",
    status: "Active",
    type: "Quality Check"
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Completed': return 'bg-emerald-100 text-emerald-700';
    case 'Active': return 'bg-blue-100 text-blue-700';
    case 'Pending': return 'bg-amber-100 text-amber-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const getDaysUntil = (deadline: string) => {
  const today = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return `${diffDays} days`;
};

export function UpcomingDeadlines() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <Card>
        <div className="flex items-center gap-2 border-b p-3">
          <Calendar className="h-4 w-4 text-gray-600" />
          <div className="text-sm font-medium">Upcoming Deadlines</div>
        </div>
        <div className="p-3">
          <div className="space-y-2">
            {DEMO_DEADLINES.map((deadline) => (
              <div key={deadline.id} className="rounded-lg border p-2 text-xs">
                <div className="flex items-start justify-between mb-1">
                  <div className="font-medium text-gray-900 line-clamp-2">
                    {deadline.programName}
                  </div>
                  <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs ${getStatusColor(deadline.status)}`}>
                    {deadline.status}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-gray-600 mb-1">
                  <Clock className="h-3 w-3" />
                  <span className="text-gray-600">Loading...</span>
                </div>
                <div className="text-gray-500">
                  {deadline.type} • {deadline.deadline}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center gap-2 border-b p-3">
        <Calendar className="h-4 w-4 text-gray-600" />
        <div className="text-sm font-medium">Upcoming Deadlines</div>
      </div>
      <div className="p-3">
        <div className="space-y-2">
          {DEMO_DEADLINES.map((deadline) => {
            const daysUntil = getDaysUntil(deadline.deadline);
            const isUrgent = daysUntil === 'Today' || daysUntil === 'Tomorrow' || daysUntil === 'Overdue';
            
            return (
              <motion.div
                key={deadline.id}
                whileHover={{ x: 2 }}
                className={`rounded-lg border p-2 text-xs ${
                  isUrgent ? 'border-amber-200 bg-amber-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="font-medium text-gray-900 line-clamp-2">
                    {deadline.programName}
                  </div>
                  <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs ${getStatusColor(deadline.status)}`}>
                    {deadline.status}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-gray-600 mb-1">
                  <Clock className="h-3 w-3" />
                  <span className={isUrgent ? 'font-medium text-amber-700' : ''}>
                    {daysUntil}
                  </span>
                </div>
                <div className="text-gray-500">
                  {deadline.type} • {new Date(deadline.deadline).toLocaleDateString()}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Card>
  );
} 