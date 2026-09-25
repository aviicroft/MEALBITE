"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  UtensilsCrossed,
  LayoutDashboard,
  History,
  Truck,
  ShieldAlert,
  Menu,
  X,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { UserSessionProfile, isAdminRole } from "@/types/user";

interface NavbarProps {
  user?: UserSessionProfile | null;
  userRole?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({ user, userRole }) => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const effectiveRole = user?.role || userRole;
  const isSignedIn = !!user;
  const isAdmin = isAdminRole(effectiveRole);

  const studentLinks = [
    { href: "/student/dashboard", label: "Live Status", icon: LayoutDashboard },
    { href: "/student/book", label: "Book Food", icon: UtensilsCrossed },
    { href: "/student/bookings", label: "My Passes", icon: History },
    { href: "/student/history", label: "Delivery Log", icon: Truck },
  ];

  const adminLinks = [
    { href: "/admin/dashboard", label: "Dashboard", icon: ShieldAlert },
    { href: "/admin/meals", label: "Meals", icon: UtensilsCrossed },
    { href: "/admin/bookings", label: "Bookings", icon: History },
    { href: "/admin/scanner", label: "QR Scanner", icon: ShieldAlert },
    { href: "/admin/deliveries", label: "Deliveries", icon: Truck },
    { href: "/admin/history", label: "History", icon: History },
  ];

  const activeLinks = isAdmin ? adminLinks : studentLinks;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="flex items-center space-x-2.5 font-bold text-slate-900 group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs group-hover:bg-indigo-700 transition-colors">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-slate-900 leading-none">
                  HostelMeals
                </span>
                <span className="text-[11px] font-medium text-slate-500 tracking-normal mt-0.5">
                  Delivery Tracking
                </span>
              </div>
            </Link>

            {isSignedIn && (
              <Badge
                variant={isAdmin ? "admin" : "student"}
                className="ml-2 hidden sm:inline-flex"
              >
                {isAdmin ? "Warden / Admin" : "Student"}
              </Badge>
            )}
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {isSignedIn && (
              <>
                {activeLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-indigo-50 text-indigo-700 font-semibold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                {/* Quick switch link for admins to preview student view */}
                {isAdmin && (
                  <Link
                    href="/student/dashboard"
                    className="text-xs text-slate-500 hover:text-slate-700 px-2.5 py-1.5 rounded-md hover:bg-slate-50"
                  >
                    Student View
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* User Auth Action Area */}
          <div className="flex items-center space-x-3">
            {!isSignedIn ? (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Register</Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-800">
                    {user?.name || "Hostel Resident"}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {isAdmin ? "Admin Portal" : user?.roomNumber ? `Room ${user.roomNumber}` : "Student"}
                  </span>
                </div>

                <div className="w-9 h-9 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-semibold text-sm">
                  {user?.name ? user.name[0].toUpperCase() : <UserIcon className="w-4 h-4" />}
                </div>

                <Link
                  href="/logout"
                  title="Sign Out"
                  className="hidden sm:inline-flex p-2 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </Link>

                {/* Mobile menu button */}
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && isSignedIn && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-4 space-y-2">
          <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Role:</span>
            <Badge variant={isAdmin ? "admin" : "student"}>
              {isAdmin ? "Warden / Admin" : "Student"}
            </Badge>
          </div>
          {activeLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-5 h-5 text-slate-500" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              href="/student/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-xs text-slate-500 hover:bg-slate-50"
            >
              <span>Switch to Student View</span>
            </Link>
          )}
          <Link
            href="/logout"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-xs text-rose-600 hover:bg-rose-50 font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </Link>
        </div>
      )}
    </header>
  );
};
