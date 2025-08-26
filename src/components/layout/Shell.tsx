"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Card } from "../ui/Card";
import Navbar from "../sidebar/Navbar";

export default function Shell({ children, rightRail }: { children: React.ReactNode; rightRail?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100/60">
      <div className="grid grid-cols-[18rem_1fr_22rem] gap-4 p-4">
        <Card className="sticky top-4 h-[calc(100vh-2rem)] overflow-hidden"><Navbar /></Card>
        <AnimatePresence mode="wait">
          <motion.main key="main" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }} className="space-y-4">{children}</motion.main>
        </AnimatePresence>
        <div className="sticky top-4 h-fit space-y-4">{rightRail}</div>
      </div>
    </div>
  );
}
