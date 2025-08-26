"use client";
import { MoreHorizontal, MessageSquare } from "lucide-react";
import { Card } from "../ui/Card";
import { Tag } from "../ui/Tag";
import { Avatar } from "../ui/Avatar";
import { motion } from "framer-motion";

export type Task = {
  id: string;
  title: string;
  assignees: string[];
  tags: { label: string; tone?: "slate" | "violet" | "orange" | "emerald" | "blue" }[];
  metrics?: { comments?: number; likes?: number; views?: number };
};

export function TaskCard({ task }: { task: Task }) {
  return (
    <motion.div layout>
      <Card className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="text-sm font-medium text-gray-800">{task.title}</div>
          <button className="rounded-lg p-1 hover:bg-gray-100"><MoreHorizontal className="h-4 w-4 text-gray-500" /></button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {task.tags.map((t, i) => (
            <Tag key={i} tone={t.tone || "slate"}>{t.label}</Tag>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex -space-x-2">
            {task.assignees.map((n) => (
              <div key={n} className="first:ml-0"><Avatar name={n} /></div>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{task.metrics?.comments ?? 0}</span>
            <span className="inline-flex items-center gap-1"><EyeIcon />{task.metrics?.views ?? 0}</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="2">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
