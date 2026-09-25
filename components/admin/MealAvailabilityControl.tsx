"use client";

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { updateMealAvailabilityAction } from "@/actions/meal.actions";
import { MealAvailability } from "@/types/delivery";

interface MealAvailabilityControlProps {
  mealId: string;
  availability: MealAvailability;
}

export function MealAvailabilityControl({
  mealId,
  availability,
}: MealAvailabilityControlProps) {
  const [currentAvailability, setCurrentAvailability] = useState(availability);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextAvailability: MealAvailability =
    currentAvailability === "AVAILABLE" ? "FINISHED" : "AVAILABLE";

  async function handleChange() {
    setLoading(true);
    setError(null);

    try {
      const result = await updateMealAvailabilityAction(mealId, nextAvailability);
      if (result.success) {
        setCurrentAvailability(result.availability);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update food status");
    } finally {
      setLoading(false);
    }
  }

  const isAvailable = currentAvailability === "AVAILABLE";

  return (
    <div className="flex flex-col items-end gap-1">
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
          isAvailable
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-rose-200 bg-rose-50 text-rose-800"
        }`}
      >
        {isAvailable ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
        Food Status: {currentAvailability}
      </span>
      <Button
        size="sm"
        variant={isAvailable ? "secondary" : "outline"}
        onClick={handleChange}
        isLoading={loading}
        disabled={loading}
        className="text-xs"
      >
        {isAvailable ? "Mark Food Finished" : "Mark Food Available"}
      </Button>
      {error && <span className="max-w-44 text-right text-[10px] text-rose-600">{error}</span>}
    </div>
  );
}
