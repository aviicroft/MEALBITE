import Link from "next/link";
import {
  UtensilsCrossed,
  Clock,
  Calendar,
  CheckCircle2,
  QrCode,
} from "lucide-react";
import { getAvailableMealsAction } from "@/actions/booking.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MealBookingButton } from "@/components/booking/MealBookingButton";
import { formatDate, formatTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudentBookPage() {
  const meals = await getAvailableMealsAction();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Hostel Dining Service
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
            Book Today&apos;s Meals
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Book your meal in advance to receive your personal QR collection pass.
            Food is issued upon scanning by the hostel warden.
          </p>
        </div>

        <Link href="/student/bookings">
          <Button variant="outline" size="sm">
            <QrCode className="w-4 h-4 mr-1.5" />
            My Bookings & Passes
          </Button>
        </Link>
      </div>

      {/* Available Meals Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-800">
          Available Meal Sessions
        </h2>

        {meals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meals.map((meal) => {
              const now = new Date();
              const openTime = new Date(meal.bookingOpen);
              const closeTime = new Date(meal.bookingClose);
              const isOpen = now >= openTime && now <= closeTime;
              const isPast = now > closeTime;
              const isFoodAvailable = meal.availability === "AVAILABLE";

              return (
                <Card
                  key={meal.id}
                  className={`overflow-hidden transition-all ${
                    meal.hasBooked
                      ? "border-emerald-300 ring-1 ring-emerald-200"
                      : "border-slate-200 hover:border-indigo-300 hover:shadow-xs"
                  }`}
                >
                  {/* Top Status Strip */}
                  <div
                    className={`px-4 py-2 text-xs font-semibold flex items-center justify-between ${
                      meal.hasBooked
                        ? "bg-emerald-50 text-emerald-800 border-b border-emerald-100"
                        : isOpen && isFoodAvailable
                        ? "bg-indigo-50 text-indigo-800 border-b border-indigo-100"
                        : "bg-slate-100 text-slate-500 border-b border-slate-200"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <UtensilsCrossed className="w-3.5 h-3.5" />
                      {meal.type} SERVICE
                    </span>

                    {meal.hasBooked ? (
                      <span className="flex items-center gap-1 text-emerald-700 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        BOOKED
                      </span>
                    ) : !isFoodAvailable ? (
                      <span className="text-rose-700 font-bold">FOOD FINISHED</span>
                    ) : isOpen ? (
                      <span className="text-indigo-600 font-bold">
                        OPEN FOR BOOKING
                      </span>
                    ) : isPast ? (
                      <span className="text-slate-400">BOOKING CLOSED</span>
                    ) : (
                      <span className="text-amber-600 font-medium">OPENS SOON</span>
                    )}
                  </div>

                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(meal.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Closes: {formatTime(meal.bookingClose)}
                      </span>
                    </div>

                    <CardTitle className="text-lg text-slate-900 mt-2">
                      Menu Description
                    </CardTitle>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1">
                      {meal.menu}
                    </p>
                  </CardHeader>

                  <CardContent className="pt-2">
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                      <div className="space-y-1">
                        <span className="block text-[11px] text-slate-500">
                          {meal._count?.bookings || 0} students booked
                        </span>
                        <span className={`text-[11px] font-bold ${isFoodAvailable ? "text-emerald-700" : "text-rose-700"}`}>
                          {isFoodAvailable ? "Food Available" : "Food Finished"}
                        </span>
                      </div>

                      {meal.hasBooked && meal.userBooking ? (
                        <Link href={`/student/pass/${meal.userBooking.id}`}>
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                            <QrCode className="w-4 h-4 mr-1.5" />
                            View QR Pass
                          </Button>
                        </Link>
                      ) : (
                        <MealBookingButton
                          mealId={meal.id}
                          isOpen={isOpen && isFoodAvailable}
                          isAvailable={isFoodAvailable}
                          buttonText={
                            !isFoodAvailable
                              ? "Food Finished"
                              : isOpen
                              ? "Book This Meal"
                              : isPast
                              ? "Booking Closed"
                              : "Opens Soon"
                          }
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                No Meals Scheduled Yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Hostel wardens have not published today&apos;s meal menus yet. Please
                check back shortly.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
