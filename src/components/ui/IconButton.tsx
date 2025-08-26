"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function IconButton({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
      className={cn("inline-flex h-9 w-9 items-center justify-center rounded-xl border bg-white text-gray-600 hover:bg-gray-50", className)}>
      {children}
    </motion.button>
  );
}
