"use client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const tones: Record<string, string> = {
  slate: "bg-slate-100 text-slate-700",
  violet: "bg-violet-100 text-violet-700",
  orange: "bg-orange-100 text-orange-700",
  emerald: "bg-emerald-100 text-emerald-700",
  blue: "bg-blue-100 text-blue-700",
};

export function Tag({ children, tone = "slate", className }: { children: React.ReactNode; tone?: keyof typeof tones; className?: string }) {
  return (
    <motion.span whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}
      className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs", tones[tone], className)}>
      {children}
    </motion.span>
  );
}