import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import {
  Calendar,
  MapPin,
  QrCode,
  UtensilsCrossed,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  getLiveDeliveryAction,
  getRecentNotificationsAction,
} from "@/actions/delivery.actions";
import {
  getAvailableMealsAction,
  getUserActiveBookingsAction,
} from "@/actions/booking.actions";
import { DelayAlertBanner } from "@/components/delivery/DelayAlertBanner";
import { DeliveryTimeline } from "@/components/delivery/DeliveryTimeline";
import { formatDate, formatTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const user = await getCurrentUser();
  const [liveDelivery, notifications, availableMeals, activeBookings] =
    await Promise.all([
      getLiveDeliveryAction(),
      getRecentNotificationsAction(),
      getAvailableMealsAction(),
      getUserActiveBookingsAction(),
    ]);

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const getBadgeVariant = (status: string) => {
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

  const primaryActivePass = activeBookings.length > 0 ? activeBookings[0] : null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Welcome & Info Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Student Dining Hub
          </span>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">
            {user?.name ? `Welcome back, ${user.name}!` : "Hostel Dining Portal"}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {todayStr}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              Hostel Common Counter
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/student/book">
            <Button size="sm">
              <UtensilsCrossed className="w-4 h-4 mr-1.5" />
              Book Food
            </Button>
          </Link>
          <Link href="/student/bookings">
            <Button variant="outline" size="sm">
              <QrCode className="w-4 h-4 mr-1.5" />
              My QR Passes ({activeBookings.length})
            </Button>
          </Link>
        </div>
      </div>

      {/* Active Booking QR Pass Spotlight (if student has booked food) */}
      {primaryActivePass && (
        <div className="bg-linear-to-r from-indigo-900 to-indigo-700 text-white p-5 rounded-2xl shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                Ready for Collection
              </span>
            </div>
            <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-semibold self-start sm:self-auto">
              BOOKED &amp; CONFIRMED
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black tracking-tight">
                {primaryActivePass.meal?.type} Collection Pass Active
              </h3>
              <p className="text-xs text-indigo-100 mt-0.5 line-clamp-1">
                Menu: {primaryActivePass.meal?.menu}
              </p>
            </div>

            <Link href={`/student/pass/${primaryActivePass.id}`}>
              <Button size="sm" className="bg-white text-indigo-950 hover:bg-slate-100 font-bold">
                <QrCode className="w-4 h-4 mr-1.5 text-indigo-700" />
                Show QR Pass
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Delay Notifications & Alert Banner */}
      <DelayAlertBanner
        isDelayed={liveDelivery?.isDelayed || liveDelivery?.status === "DELAYED"}
        delayReason={liveDelivery?.delayReason}
        mealType={liveDelivery?.mealType || "meal"}
        notifications={notifications}
      />

      {/* Today's Available Meals for Booking */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Today&apos;s Meal Menus
          </h2>
          <Link
            href="/student/book"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            View All &amp; Book →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {availableMeals.slice(0, 2).map((meal) => (
            <Card key={meal.id} className="p-4 border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">
                  {meal.type} Service
                </span>
                {meal.availability === "FINISHED" ? (
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                    FINISHED
                  </span>
                ) : meal.hasBooked ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    BOOKED
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                    AVAILABLE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded-md">
                {meal.menu}
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Closes: {formatTime(meal.bookingClose)}</span>
                <Link
                  href="/student/book"
                  className="font-bold text-indigo-600 hover:underline"
                >
                  {meal.hasBooked
                    ? "View Pass"
                    : meal.availability === "FINISHED"
                    ? "Food Finished"
                    : "Book Meal"}
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Live Food Delivery Tracking Card */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Live Food Delivery Tracking
          </h2>
          <Link
            href="/student/history"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Delivery History →
          </Link>
        </div>

        {liveDelivery ? (
          <Card className="border-indigo-100 overflow-hidden shadow-xs">
            {/* Status Header Strip */}
            <div
              className={`px-5 py-3 text-white flex items-center justify-between ${
                liveDelivery.status === "ARRIVED"
                  ? "bg-emerald-600"
                  : liveDelivery.isDelayed || liveDelivery.status === "DELAYED"
                  ? "bg-rose-600"
                  : "bg-indigo-600"
              }`}
            >
              <div className="flex items-center space-x-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    liveDelivery.status === "ARRIVED"
                      ? "bg-white"
                      : "bg-white animate-pulse"
                  }`}
                ></span>
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {liveDelivery.status === "ARRIVED"
                    ? "Delivered Meal"
                    : "Active Delivery Session"}
                </span>
              </div>
              <Badge
                variant={getBadgeVariant(liveDelivery.status)}
                className="bg-white/20 text-white border-white/30"
              >
                {liveDelivery.status}
              </Badge>
            </div>

            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-xl text-slate-900">
                    {liveDelivery.mealType} SERVICE
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-1">
                    Destination: {liveDelivery.targetHostel} • Scheduled for{" "}
                    {formatDate(liveDelivery.deliveryDate)}
                  </p>
                </div>

                <div className="text-left sm:text-right bg-slate-50 p-2.5 rounded-lg border border-slate-100 sm:bg-transparent sm:p-0 sm:border-0">
                  {liveDelivery.actualArrivalTime ? (
                    <>
                      <span className="text-xs text-slate-500 block">
                        Actual Arrival
                      </span>
                      <span className="text-lg font-bold text-emerald-700">
                        {formatTime(liveDelivery.actualArrivalTime)}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-slate-500 block">
                        Expected Arrival
                      </span>
                      <span className="text-lg font-bold text-indigo-700">
                        ~ {formatTime(liveDelivery.expectedArrivalTime)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Accessible Timeline */}
              <DeliveryTimeline
                status={liveDelivery.status}
                dispatchTime={liveDelivery.dispatchTime}
                expectedArrivalTime={liveDelivery.expectedArrivalTime}
                actualArrivalTime={liveDelivery.actualArrivalTime}
                isDelayed={
                  liveDelivery.isDelayed || liveDelivery.status === "DELAYED"
                }
                delayReason={liveDelivery.delayReason}
              />
            </CardContent>
          </Card>
        ) : (
          <Card className="text-center py-8">
            <CardContent className="space-y-2">
              <UtensilsCrossed className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-500">
                No active deliveries currently in transit.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
