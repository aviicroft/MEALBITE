"use client";

import React, { useState } from "react";
import { Plus, X, UtensilsCrossed, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MealType } from "@/types/delivery";
import { createMealAction } from "@/actions/meal.actions";

interface CreateMealModalProps {
  onSuccess?: () => void;
}

export const CreateMealModal: React.FC<CreateMealModalProps> = ({ onSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mealType, setMealType] = useState<MealType>("DINNER");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [menu, setMenu] = useState("");
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [targetHostel, setTargetHostel] = useState("All Hostels (Block A, B, C)");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize default open/close time based on selected date
  const handleOpenModal = () => {
    const today = new Date().toISOString().split("T")[0];
    setDate(today);
    setOpenTime(`${today}T08:00`);
    setCloseTime(`${today}T19:30`);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createMealAction({
        date,
        type: mealType,
        menu,
        bookingOpen: openTime,
        bookingClose: closeTime,
        targetHostel,
      });

      setIsOpen(false);
      setMenu("");
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create meal";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button size="sm" onClick={handleOpenModal}>
        <Plus className="w-4 h-4 mr-1.5" />
        Schedule Meal & Open Bookings
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-indigo-600" />
                Publish Meal Service
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600"
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Meal Type
                  </label>
                  <select
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value as MealType)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="BREAKFAST">Breakfast</option>
                    <option value="LUNCH">Lunch</option>
                    <option value="SNACKS">Snacks</option>
                    <option value="DINNER">Dinner</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Meal Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Menu Items & Description
                </label>
                <textarea
                  value={menu}
                  onChange={(e) => setMenu(e.target.value)}
                  required
                  rows={3}
                  placeholder="e.g. Paneer Butter Masala, Butter Naan, Jeera Rice, Dal Tadka, Sweet..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Booking Window Opens
                  </label>
                  <input
                    type="datetime-local"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Booking Window Closes
                  </label>
                  <input
                    type="datetime-local"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Hostel / Mess Block
                </label>
                <input
                  type="text"
                  value={targetHostel}
                  onChange={(e) => setTargetHostel(e.target.value)}
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
                  Schedule & Open
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
