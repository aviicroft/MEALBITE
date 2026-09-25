"use client";

import { useEffect } from "react";
import { logoutAction } from "@/actions/auth.actions";
import { Loader2 } from "lucide-react";

export default function LogoutPage() {
  useEffect(() => {
    logoutAction();
  }, []);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      <p className="text-sm font-medium text-slate-600">Signing you out...</p>
    </div>
  );
}
