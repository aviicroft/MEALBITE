"use client";

import React, { useState } from "react";
import { Plus, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MealType } from "@/types/delivery";
import { createDeliveryAction } from "@/actions/delivery.actions";

interface CreateDeliveryModalProps {
  onSuccess?: () => void;
}

export const CreateDeliveryModal: React.FC<CreateDeliveryModalProps> = ({
  onSuccess,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mealType, setMealType] = useState<MealType>("DINNER");
  const [deliveryDate, setDeliveryDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [expectedTime, setExpectedTime] = useState("20:15");
  const [targetHostel, setTargetHostel] = useState("All Hostels (Block A, B, C)");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createDeliveryAction({
        mealType,
        deliveryDate,
        expectedArrivalTime: expectedTime,
        targetHostel,
        notes,
      });

      setIsOpen(false);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create delivery";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button size="sm" onClick={() => setIsOpen(true)}>
        <Plus className="w-4 h-4 mr-1.5" />
        New Delivery Session
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 id="modal-title" className="font-bold text-lg text-slate-900">
                Create Food Delivery Session
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Meal Service Type
                </label>
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value as MealType)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 text-xs"
                >
                  <option value="BREAKFAST">Breakfast</option>
                  <option value="LUNCH">Lunch</option>
                  <option value="SNACKS">Snacks</option>
                  <option value="DINNER">Dinner</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Delivery Date
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Expected Arrival
                  </label>
                  <input
                    type="time"
                    value={expectedTime}
                    onChange={(e) => setExpectedTime(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Target Hostel / Destination
                </label>
                <input
                  type="text"
                  value={targetHostel}
                  onChange={(e) => setTargetHostel(e.target.value)}
                  required
                  placeholder="e.g. All Hostels (Block A, B, C)"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Operational Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Van number, special mess menu, or packaging notes..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" isLoading={loading}>
                  Initialize Session
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
