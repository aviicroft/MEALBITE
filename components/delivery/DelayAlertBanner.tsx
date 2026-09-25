import React from "react";
import { AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { INotification } from "@/types/delivery";

interface DelayAlertBannerProps {
  isDelayed?: boolean;
  delayReason?: string;
  mealType?: string;
  notifications?: INotification[];
}

export const DelayAlertBanner: React.FC<DelayAlertBannerProps> = ({
  isDelayed,
  delayReason,
  mealType = "meal",
  notifications = [],
}) => {
  const activeAlert = notifications.find((n) => n.type === "DELAY_ALERT");

  if (!isDelayed && !activeAlert && notifications.length === 0) {
    return null;
  }

  // Active delay alert takes highest priority
  if (isDelayed || activeAlert) {
    const reasonText =
      delayReason ||
      activeAlert?.message ||
      "Unexpected preparation or logistics hold-up";

    return (
      <div
        role="alert"
        aria-live="polite"
        className="p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-900 rounded-r-xl shadow-xs space-y-1"
      >
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" aria-hidden="true" />
          <h4 className="font-bold text-sm sm:text-base">
            Today&apos;s {mealType.toLowerCase()} delivery is delayed
          </h4>
        </div>
        <p className="text-xs sm:text-sm text-rose-800 pl-7">
          {delayReason
            ? `Today's ${mealType.toLowerCase()} delivery is delayed due to ${delayReason}.`
            : reasonText}
        </p>
      </div>
    );
  }

  // General recent notification banner
  const latest = notifications[0];
  if (!latest) return null;

  const isArrival = latest.type === "ARRIVAL";

  return (
    <div
      role="status"
      className={`p-3.5 border-l-4 rounded-r-xl shadow-2xs flex items-start space-x-3 text-xs sm:text-sm ${
        isArrival
          ? "bg-emerald-50 border-emerald-500 text-emerald-900"
          : "bg-indigo-50 border-indigo-500 text-indigo-900"
      }`}
    >
      {isArrival ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
      ) : (
        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
      )}
      <div className="space-y-0.5">
        <span className="font-semibold block">{latest.title}</span>
        <p className="opacity-90">{latest.message}</p>
      </div>
    </div>
  );
};
