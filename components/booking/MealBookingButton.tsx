"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { bookMealAction } from "@/actions/booking.actions";

interface MealBookingButtonProps {
  mealId: string;
  isOpen: boolean;
  isAvailable: boolean;
  buttonText: string;
}

export const MealBookingButton: React.FC<MealBookingButtonProps> = ({
  mealId,
  isOpen,
  isAvailable,
  buttonText,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBook = async () => {
    if (!isOpen || !isAvailable) return;
    setLoading(true);
    setError(null);

    try {
      const res = await bookMealAction(mealId);
      if (res.success && res.booking) {
        router.push(`/student/pass/${res.booking.id}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to book meal";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end space-y-1">
      <Button
        size="sm"
        disabled={!isOpen || !isAvailable || loading}
        isLoading={loading}
        onClick={handleBook}
        variant={isOpen && isAvailable ? "primary" : "secondary"}
        className="text-xs"
      >
        {buttonText}
      </Button>

      {error && (
        <span className="text-[11px] text-rose-600 flex items-center gap-1 mt-1 font-medium">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </span>
      )}
    </div>
  );
};
