"use client";

import React, { useState } from "react";
import {
  Truck,
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  X,
  AlertCircle,
} from "lucide-react";
import { IDelivery, DeliveryStatus } from "@/types/delivery";
import { updateDeliveryStatusAction } from "@/actions/delivery.actions";
import { formatDate, formatTime } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface DeliveryControlCardProps {
  delivery: IDelivery;
  onUpdated?: () => void;
}

export const DeliveryControlCard: React.FC<DeliveryControlCardProps> = ({
  delivery,
  onUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [delayModalOpen, setDelayModalOpen] = useState(false);
  const [delayReason, setDelayReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (
    newStatus: DeliveryStatus,
    reason?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      await updateDeliveryStatusAction(delivery.id || delivery._id || "", newStatus, reason);
      setDelayModalOpen(false);
      setDelayReason("");
      if (onUpdated) onUpdated();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to update status";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeVariant = (status: DeliveryStatus) => {
    switch (status) {
      case "PREPARING":
        return "preparing";
      case "DISPATCHED":
        return "dispatched";
      case "ON_THE_WAY":
        return "on_the_way";
      case "ARRIVED":
        return "arrived";
      case "DELAYED":
        return "delayed";
      default:
        return "default";
    }
  };

  const isTerminal = delivery.status === "ARRIVED";

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-bold text-slate-900 text-base">
                {delivery.mealType} SERVICE
              </h4>
              <Badge variant={getBadgeVariant(delivery.status)}>
                {delivery.status}
              </Badge>
            </div>
            <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-slate-400" />
              {delivery.targetHostel}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">Date</span>
            <span className="font-semibold text-slate-700">
              {formatDate(delivery.deliveryDate)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Dispatch Time</span>
            <span className="font-semibold text-slate-700">
              {formatTime(delivery.dispatchTime)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Expected Arrival</span>
            <span className="font-semibold text-indigo-700">
              ~ {formatTime(delivery.expectedArrivalTime)}
            </span>
          </div>
          {delivery.actualArrivalTime && (
            <div>
              <span className="text-slate-400 block text-[10px]">Actual Arrival</span>
              <span className="font-semibold text-emerald-700">
                {formatTime(delivery.actualArrivalTime)}
              </span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Delay Callout Banner if active */}
      {delivery.isDelayed && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Active Delay Alert:</span>
            <p className="text-rose-800">
              {delivery.delayReason || "Hold-up in transit or mess distribution"}
            </p>
          </div>
        </div>
      )}

      {delivery.notes && (
        <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg">
          Note: {delivery.notes}
        </p>
      )}

      {/* Action Buttons to control lifecycle */}
      {!isTerminal ? (
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-600">
            Lifecycle Actions:
          </span>

          <div className="flex flex-wrap items-center gap-2">
            {delivery.status === "PREPARING" && (
              <Button
                variant="outline"
                size="sm"
                isLoading={loading}
                onClick={() => handleStatusChange("DISPATCHED")}
              >
                <PackageCheck className="w-3.5 h-3.5 mr-1 text-blue-600" />
                Dispatch From Kitchen
              </Button>
            )}

            {(delivery.status === "DISPATCHED" || delivery.status === "DELAYED") && (
              <Button
                variant="outline"
                size="sm"
                isLoading={loading}
                onClick={() => handleStatusChange("ON_THE_WAY")}
              >
                <Truck className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                Mark On The Way
              </Button>
            )}

            {(delivery.status === "ON_THE_WAY" ||
              delivery.status === "DISPATCHED" ||
              delivery.status === "DELAYED") && (
              <Button
                variant="primary"
                size="sm"
                isLoading={loading}
                onClick={() => handleStatusChange("ARRIVED")}
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-white" />
                Mark Food Arrived
              </Button>
            )}

            {delivery.status !== "DELAYED" && (
              <Button
                variant="danger"
                size="sm"
                isLoading={loading}
                onClick={() => setDelayModalOpen(true)}
              >
                <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                Flag Delay
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-semibold">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Delivery Completed at {formatTime(delivery.actualArrivalTime)}
          </span>
          <span className="text-slate-400 font-normal">Terminal State</span>
        </div>
      )}

      {/* Delay Reason Modal */}
      {delayModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Flag Delivery Delay
              </h4>
              <button
                onClick={() => setDelayModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Please specify the delay reason. This will instantly broadcast a notice to
              all hostel students tracking this delivery.
            </p>

            <textarea
              value={delayReason}
              onChange={(e) => setDelayReason(e.target.value)}
              rows={3}
              placeholder="e.g. Transportation vehicle delayed due to heavy rain..."
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:ring-2 focus:ring-rose-500"
              required
            />

            <div className="flex items-center justify-end space-x-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDelayModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={loading}
                onClick={() => handleStatusChange("DELAYED", delayReason)}
              >
                Broadcast Delay Notice
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
