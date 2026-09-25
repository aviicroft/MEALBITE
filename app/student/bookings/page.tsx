import Link from "next/link";
import {
  QrCode,
  CheckCircle2,
  Clock,
  Calendar,
  UtensilsCrossed,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { getUserBookingHistoryAction } from "@/actions/booking.actions";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDate, formatTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudentBookingsPage() {
  const bookings = await getUserBookingHistoryAction();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "BOOKED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Clock className="w-3 h-3" />
            BOOKED (ACTIVE)
          </span>
        );
      case "COLLECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            COLLECTED
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" />
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <AlertCircle className="w-3 h-3" />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Personal Passes
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
            My Meal Bookings & QR Passes
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Access your active QR code passes for food collection and review past dining
            history.
          </p>
        </div>

        <Link href="/student/book">
          <Button size="sm">
            <UtensilsCrossed className="w-4 h-4 mr-1.5" />
            Book Another Meal
          </Button>
        </Link>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {bookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookings.map((booking) => {
              const isBooked = booking.status === "BOOKED";

              return (
                <Card
                  key={booking.id}
                  className={`overflow-hidden transition-all ${
                    isBooked
                      ? "border-indigo-300 ring-1 ring-indigo-200 shadow-xs"
                      : "border-slate-200"
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                        <UtensilsCrossed className="w-4 h-4 text-indigo-600" />
                        {booking.meal?.type || "Meal"} Service
                      </span>
                      {getStatusBadge(booking.status)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(booking.meal?.date || booking.bookedAt)}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-1">
                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg line-clamp-2">
                      {booking.meal?.menu || "Menu items"}
                    </p>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                      <span className="text-[11px] text-slate-400">
                        Booked: {formatTime(booking.bookedAt)}
                      </span>

                      <Link href={`/student/pass/${booking.id}`}>
                        <Button
                          size="sm"
                          variant={isBooked ? "primary" : "outline"}
                          className="text-xs"
                        >
                          <QrCode className="w-3.5 h-3.5 mr-1" />
                          {isBooked ? "Open QR Pass" : "View Receipt"}
                        </Button>
                      </Link>
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
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                No Bookings Yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You haven&apos;t booked any meals yet. Book today&apos;s breakfast, lunch, or
                dinner to get your QR pass.
              </p>
              <Link href="/student/book">
                <Button size="sm">
                  <UtensilsCrossed className="w-4 h-4 mr-1.5" />
                  View Today&apos;s Menu & Book
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
