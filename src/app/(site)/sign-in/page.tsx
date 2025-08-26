"use client";
import { Card } from "@/components/ui/Card";
import { motion } from "framer-motion";
import { Building2 } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gray-100/60 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Site Title */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Municipality PMS</h1>
          <p className="text-sm text-gray-600 mt-1">Project Management System</p>
        </div>

        <Card>
          <div className="p-6">
            <div className="mb-1 text-lg font-semibold">Sign in</div>
            <div className="mb-4 text-xs text-gray-500">Access your account to continue</div>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-600">Email</div>
                <input type="email" className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" placeholder="you@example.com" />
              </div>
              <div>
                <div className="text-xs text-gray-600">Password</div>
                <input type="password" className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" placeholder="••••••••" />
              </div>
              <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="w-full rounded-xl bg-gray-900 px-3 py-2 text-sm font-medium text-white">Sign in</motion.button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
