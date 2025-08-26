"use client";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Task, TaskCard } from "@/components/kanban/TaskCard";
import { motion, AnimatePresence } from "framer-motion";


export default function KanbanColumn({ title, initial = [] as Task[] }) {
const [tasks, setTasks] = useState<Task[]>(initial);
return (
<section className="space-y-3">
<div className="flex items-center justify-between">
<h3 className="text-sm font-semibold text-gray-700">{title}</h3>
<button onClick={() => setTasks((t) => [{ id: crypto.randomUUID(), title: "New task", assignees: ["New User"], tags: [{ label: "Docs" }], metrics: { comments: 0, views: 0 } }, ...t])}
className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">
<Plus className="h-4 w-4" /> Add
</button>
</div>
<AnimatePresence initial={false}>
<motion.div layout className="space-y-3">
{tasks.map((task) => (
<TaskCard key={task.id} task={task} />
))}
</motion.div>
</AnimatePresence>
</section>
);
}