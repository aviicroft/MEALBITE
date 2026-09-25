import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { requireRole, syncCurrentUser } from "@/lib/auth";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Server-side Clerk public metadata enforcement.
  await requireRole(["admin"]);

  // Auto-sync admin user profile with MongoDB User model
  try {
    await syncCurrentUser();
  } catch (error) {
    console.warn("Could not sync admin user with database:", error);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-purple-200 pb-4 gap-3 bg-purple-50/50 p-4 rounded-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Warden Administration Console
              </h1>
              <Badge variant="admin">ADMIN PRIVILEGES</Badge>
            </div>
            <p className="text-xs text-slate-500">
              Manage food dispatch sessions, broadcast delay notices, and update arrival times.
            </p>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
