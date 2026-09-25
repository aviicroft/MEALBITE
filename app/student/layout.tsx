import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { syncCurrentUser } from "@/lib/auth";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Auto-sync authenticated user profile with MongoDB User model
  try {
    await syncCurrentUser();
  } catch (error) {
    console.warn("Could not sync user with database:", error);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-4 gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Student Portal
          </h1>
          <p className="text-sm text-slate-500">
            Track daily hostel mess meal deliveries, arrival times, and delay notices.
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}
