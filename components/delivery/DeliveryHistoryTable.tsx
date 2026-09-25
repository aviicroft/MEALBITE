"use client";

import React, { useState, useTransition } from "react";
import {
  Filter,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { IDelivery, DeliveryStatus } from "@/types/delivery";
import { formatDate, formatTime } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface DeliveryHistoryTableProps {
  initialDeliveries: IDelivery[];
  isAdmin?: boolean;
  onFilterChange?: (filters: {
    mealType?: string;
    status?: string;
    date?: string;
  }) => Promise<IDelivery[]>;
}

export const DeliveryHistoryTable: React.FC<DeliveryHistoryTableProps> = ({
  initialDeliveries,
  onFilterChange,
}) => {
  const [deliveries, setDeliveries] = useState<IDelivery[]>(initialDeliveries);
  const [mealFilter, setMealFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  // Trigger filtering
  const handleApplyFilter = (
    newMeal = mealFilter,
    newStatus = statusFilter,
    newDate = dateFilter
  ) => {
    if (!onFilterChange) {
      // Local client fallback filtering
      let filtered = [...initialDeliveries];
      if (newMeal !== "ALL") {
        filtered = filtered.filter((d) => d.mealType === newMeal);
      }
      if (newStatus !== "ALL") {
        filtered = filtered.filter((d) => d.status === newStatus);
      }
      if (newDate) {
        const targetDateStr = new Date(newDate).toDateString();
        filtered = filtered.filter(
          (d) => new Date(d.deliveryDate).toDateString() === targetDateStr
        );
      }
      setDeliveries(filtered);
      return;
    }

    startTransition(async () => {
      try {
        const result = await onFilterChange({
          mealType: newMeal,
          status: newStatus,
          date: newDate,
        });
        setDeliveries(result);
      } catch (err) {
        console.error("Filter error:", err);
      }
    });
  };

  const handleResetFilters = () => {
    setMealFilter("ALL");
    setStatusFilter("ALL");
    setDateFilter("");
    if (!onFilterChange) {
      setDeliveries(initialDeliveries);
    } else {
      startTransition(async () => {
        const result = await onFilterChange({
          mealType: "ALL",
          status: "ALL",
          date: "",
        });
        setDeliveries(result);
      });
    }
  };

  // Helper for status badge variant
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

  return (
    <div className="space-y-4">
      {/* Filtering Toolbar */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 font-semibold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Filter By:</span>
          </div>

          {/* Meal Filter */}
          <select
            value={mealFilter}
            onChange={(e) => {
              setMealFilter(e.target.value);
              handleApplyFilter(e.target.value, statusFilter, dateFilter);
            }}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            aria-label="Filter by meal type"
          >
            <option value="ALL">All Meals</option>
            <option value="BREAKFAST">Breakfast</option>
            <option value="LUNCH">Lunch</option>
            <option value="SNACKS">Snacks</option>
            <option value="DINNER">Dinner</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              handleApplyFilter(mealFilter, e.target.value, dateFilter);
            }}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            aria-label="Filter by delivery status"
          >
            <option value="ALL">All Statuses</option>
            <option value="ARRIVED">Arrived</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="ON_THE_WAY">On The Way</option>
            <option value="PREPARING">Preparing</option>
            <option value="DELAYED">Delayed</option>
          </select>

          {/* Date Filter */}
          <div className="flex items-center space-x-1">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                handleApplyFilter(mealFilter, statusFilter, e.target.value);
              }}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer text-xs"
              aria-label="Filter by date"
            />
          </div>
        </div>

        {(mealFilter !== "ALL" || statusFilter !== "ALL" || dateFilter !== "") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="text-xs text-slate-500 hover:text-slate-800"
          >
            Reset Filters
          </Button>
        )}
      </div>

      {/* Loading Overlay */}
      {isPending && (
        <div className="py-8 text-center text-xs text-indigo-600 flex items-center justify-center space-x-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Updating delivery records...</span>
        </div>
      )}

      {/* Empty State */}
      {!isPending && deliveries.length === 0 && (
        <div className="py-12 px-4 text-center bg-white rounded-xl border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-800 text-base">
            No delivery records found
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {mealFilter !== "ALL" || statusFilter !== "ALL" || dateFilter !== ""
              ? "No deliveries match your current filter settings. Try clearing the filter."
              : "No past food deliveries are logged in the database yet."}
          </p>
          {(mealFilter !== "ALL" || statusFilter !== "ALL" || dateFilter !== "") && (
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* Desktop Table View */}
      {!isPending && deliveries.length > 0 && (
        <>
          <div className="hidden md:block overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-2xs">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Meal</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Dispatch Time</th>
                  <th className="py-3 px-4">Expected Arrival</th>
                  <th className="py-3 px-4">Actual Arrival</th>
                  <th className="py-3 px-4">Delay Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deliveries.map((item) => {
                  const isItemDelayed = item.isDelayed || item.status === "DELAYED";
                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                        {formatDate(item.deliveryDate)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {item.mealType}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={getBadgeVariant(item.status)}>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {formatTime(item.dispatchTime)}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-indigo-700">
                        ~ {formatTime(item.expectedArrivalTime)}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-900">
                        {formatTime(item.actualArrivalTime)}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {isItemDelayed ? (
                          <div className="flex items-center space-x-1.5 text-rose-700">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span className="font-medium">
                              {item.delayReason || "Reported delay"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-emerald-700 flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>On Time</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Stack View */}
          <div className="md:hidden space-y-3">
            {deliveries.map((item) => {
              const isItemDelayed = item.isDelayed || item.status === "DELAYED";
              return (
                <div
                  key={item._id}
                  className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 block">
                        {formatDate(item.deliveryDate)}
                      </span>
                      <h4 className="font-bold text-slate-900 text-base">
                        {item.mealType}
                      </h4>
                    </div>
                    <Badge variant={getBadgeVariant(item.status)}>
                      {item.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Dispatch</span>
                      <span className="font-medium text-slate-700">
                        {formatTime(item.dispatchTime)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Expected</span>
                      <span className="font-medium text-indigo-700">
                        {formatTime(item.expectedArrivalTime)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Actual</span>
                      <span className="font-semibold text-slate-900">
                        {formatTime(item.actualArrivalTime)}
                      </span>
                    </div>
                  </div>

                  {isItemDelayed ? (
                    <div className="flex items-start space-x-2 text-xs text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-100">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{item.delayReason || "Delay reported in transit"}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1.5 text-xs text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Delivered on schedule</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
