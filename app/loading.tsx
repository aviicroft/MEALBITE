import React from "react";

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 py-12">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="text-xs text-slate-500 font-medium tracking-wide animate-pulse">
        Loading hostel delivery information...
      </p>
    </div>
  );
}
