import React from "react";
import {
  UtensilsCrossed,
  PackageCheck,
  Truck,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { DeliveryStatus } from "@/types/delivery";
import { formatTime } from "@/lib/utils";

interface DeliveryTimelineProps {
  status: DeliveryStatus;
  dispatchTime?: Date | string | null;
  expectedArrivalTime?: Date | string | null;
  actualArrivalTime?: Date | string | null;
  isDelayed?: boolean;
  delayReason?: string;
}

export const DeliveryTimeline: React.FC<DeliveryTimelineProps> = ({
  status,
  dispatchTime,
  expectedArrivalTime,
  actualArrivalTime,
  isDelayed,
  delayReason,
}) => {
  const steps = [
    {
      key: "PREPARING",
      label: "Kitchen Prep",
      icon: UtensilsCrossed,
      detail: "Meals packaged at mess",
    },
    {
      key: "DISPATCHED",
      label: "Dispatched",
      icon: PackageCheck,
      detail: dispatchTime ? `Left at ${formatTime(dispatchTime)}` : "Awaiting dispatch",
    },
    {
      key: "ON_THE_WAY",
      label: "On The Way",
      icon: Truck,
      detail: "In transit to hostel",
    },
    {
      key: "ARRIVED",
      label: "Arrived",
      icon: CheckCircle2,
      detail: actualArrivalTime
        ? `Arrived at ${formatTime(actualArrivalTime)}`
        : `ETA ~ ${formatTime(expectedArrivalTime)}`,
    },
  ];

  // Helper to determine step completion index
  const statusIndexMap: Record<DeliveryStatus, number> = {
    PREPARING: 0,
    DISPATCHED: 1,
    ON_THE_WAY: 2,
    ARRIVED: 3,
    DELAYED: 1, // Delayed retains context
  };

  const currentIdx = statusIndexMap[status] ?? 0;

  return (
    <div className="space-y-4 py-2" aria-label="Delivery progress timeline">
      {/* Delay Callout if active */}
      {isDelayed && (
        <div className="flex items-center space-x-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-semibold">Held up in transit:</span>
          <span className="truncate">{delayReason || "Transit / weather delay"}</span>
        </div>
      )}

      {/* Stepper Grid */}
      <nav aria-label="Progress">
        <ol className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = idx < currentIdx || (status === "ARRIVED" && idx === 3);
            const isCurrent = idx === currentIdx && status !== "ARRIVED";

            let iconContainerStyle = "bg-slate-100 text-slate-400 border border-slate-200";
            let labelStyle = "text-slate-500";

            if (isCompleted) {
              iconContainerStyle = "bg-emerald-600 text-white shadow-xs";
              labelStyle = "text-slate-800 font-semibold";
            } else if (isCurrent) {
              iconContainerStyle = isDelayed
                ? "bg-rose-600 text-white ring-4 ring-rose-100 shadow-sm"
                : "bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-sm animate-pulse";
              labelStyle = isDelayed
                ? "text-rose-700 font-bold"
                : "text-indigo-700 font-bold";
            }

            return (
              <li
                key={step.key}
                className="flex flex-col items-center text-center p-3 rounded-xl bg-slate-50/70 border border-slate-100"
                aria-current={isCurrent ? "step" : undefined}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${iconContainerStyle}`}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <span className={`text-xs mt-2 ${labelStyle}`}>
                  {step.label}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 max-w-[120px] truncate">
                  {step.detail}
                </span>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
};
