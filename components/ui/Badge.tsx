import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "student"
    | "admin"
    | "preparing"
    | "dispatched"
    | "on_the_way"
    | "arrived"
    | "delayed";
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "default",
  children,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider";

  const variants = {
    default: "bg-slate-100 text-slate-800 border border-slate-200",
    student: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    admin: "bg-purple-50 text-purple-700 border border-purple-200",
    preparing: "bg-amber-50 text-amber-800 border border-amber-300",
    dispatched: "bg-blue-50 text-blue-800 border border-blue-300",
    on_the_way: "bg-indigo-50 text-indigo-800 border border-indigo-300",
    arrived: "bg-emerald-50 text-emerald-800 border border-emerald-300",
    delayed: "bg-rose-50 text-rose-800 border border-rose-300 animate-pulse",
  };

  return (
    <span className={cn(baseStyles, variants[variant], className)} {...props}>
      {children}
    </span>
  );
};
