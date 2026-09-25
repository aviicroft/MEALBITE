"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, History, ShieldAlert, Truck, UtensilsCrossed } from "lucide-react";
import { UserSessionProfile, isAdminRole } from "@/types/user";

interface MobileNavProps {
  user?: UserSessionProfile | null;
  userRole?: string | null;
}

export const MobileNav: React.FC<MobileNavProps> = ({ user, userRole }) => {
  const pathname = usePathname();

  const isSignedIn = !!user;
  if (!isSignedIn) {
    return null;
  }

  const effectiveRole = user?.role || userRole;
  const isAdmin = isAdminRole(effectiveRole);

  const studentLinks = [
    { href: "/student/dashboard", label: "Status", icon: LayoutDashboard },
    { href: "/student/book", label: "Book", icon: UtensilsCrossed },
    { href: "/student/bookings", label: "Passes", icon: History },
    { href: "/student/history", label: "Delivery", icon: Truck },
  ];

  const adminLinks = [
    { href: "/admin/dashboard", label: "Dashboard", icon: ShieldAlert },
    { href: "/admin/scanner", label: "Scanner", icon: ShieldAlert },
    { href: "/admin/meals", label: "Meals", icon: UtensilsCrossed },
    { href: "/admin/deliveries", label: "Deliveries", icon: Truck },
    { href: "/admin/bookings", label: "Roster", icon: History },
  ];

  const links = isAdmin ? adminLinks : studentLinks;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 shadow-lg">
      <div className="flex justify-around items-center">
        {links.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-lg text-[11px] font-medium transition-colors ${
                isActive
                  ? "text-indigo-600 font-semibold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Icon
                className={`w-5 h-5 mb-0.5 ${
                  isActive ? "text-indigo-600" : "text-slate-400"
                }`}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
