"use client";
import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Users, 
  BarChart3, 
  Settings, 
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = useMemo(() => ([
    { id: "dashboard", icon: Home, label: "Dashboard", href: "/dashboard" },
    { id: "programs", icon: () => (
      <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-orange-500 rounded-md flex items-center justify-center">
        <div className="w-2.5 h-2.5 bg-white rounded-sm opacity-80"></div>
      </div>
    ), label: "Programs", href: "/programs" },
    { id: "approvals", icon: Users, label: "Approvals", href: "/approvals" },
    { id: "reports", icon: BarChart3, label: "Reports", href: "/reports" },
  ]), []);

  const bottomItems = useMemo(() => ([
    { id: "settings", icon: Settings, label: "Settings", href: "/settings" },
    { id: "logout", icon: Settings, label: "Sign out", href: "/sign-in" },
  ]), []);

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
            <div className="w-6 h-6 bg-gray-800 rounded-full"></div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">John Doe</div>
            <div className="text-xs text-gray-500">Project Manager</div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "bg-gradient-to-br from-purple-100 to-orange-100 border border-purple-200" 
                    : "hover:bg-gray-50"
                }`}
                title={item.label}
              >
                <IconComponent className={`w-5 h-5 ${
                  isActive ? "text-purple-600" : "text-gray-600"
                }`} />
                <span className={`text-sm ${isActive ? "text-gray-900 font-medium" : "text-gray-700"}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="px-3 py-4 border-t border-gray-100">
        <nav className="space-y-1">
          {bottomItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "bg-gradient-to-br from-purple-100 to-orange-100 border border-purple-200" 
                    : "hover:bg-gray-50"
                }`}
                title={item.label}
              >
                <IconComponent className={`w-5 h-5 ${
                  isActive ? "text-purple-600" : "text-gray-600"
                }`} />
                <span className={`text-sm ${isActive ? "text-gray-900 font-medium" : "text-gray-700"}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="mt-4 flex justify-center">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-sm opacity-80"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
