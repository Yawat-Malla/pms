"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  exit: { opacity: 0, y: 8, transition: { duration: 0.2 } },
};

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <motion.div variants={fadeIn} initial="initial" animate="animate" exit="exit"
      className={cn("rounded-2xl border border-gray-200/80 bg-white shadow-sm", className)}>
      {children}
    </motion.div>
  );
}
