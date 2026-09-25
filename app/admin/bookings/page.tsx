import Link from "next/link";
import { ArrowLeft, QrCode, CheckCircle2, Clock, UtensilsCrossed } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { prisma } from "@/lib/prisma";
import { formatDate, formatTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ mealId?: string }>;
}) {
  const { mealId } = await searchParams;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {};
  if (mealId) {
    where.mealId = mealId;
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      user: true,
      meal: true,
    },
    orderBy: { bookedAt: "desc" },
    take: 50,
  });

  const total = bookings.length;
  const collected = bookings.filter((b) => b.status === "COLLECTED").length;
  const pending = bookings.filter((b) => b.status === "BOOKED").length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Dashboard
            </Button>
          </Link>
          <Link href="/admin/meals">
            <Button variant="outline" size="sm">
              <UtensilsCrossed className="w-4 h-4 mr-1.5" />
              Meal Menus
            </Button>
          </Link>
        </div>

        <Link href="/admin/scanner">
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
            <QrCode className="w-4 h-4 mr-1.5" />
            Open QR Camera Scanner
          </Button>
        </Link>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">
            Total Bookings
          </span>
          <span className="text-2xl font-black text-slate-900 block mt-1">
            {total}
          </span>
        </div>

        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Collected
          </span>
          <span className="text-2xl font-black text-emerald-900 block mt-1">
            {collected}
          </span>
        </div>

        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-200 shadow-2xs">
          <span className="text-[11px] font-bold text-indigo-700 uppercase flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Pending Collection
          </span>
          <span className="text-2xl font-black text-indigo-900 block mt-1">
            {pending}
          </span>
        </div>
      </div>

      {/* Student Bookings Roster */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle>Student Meal Booking Roster</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time collection log. Only students with valid QR passes can be
                issued meals.
              </p>
            </div>
            <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
              Showing latest {bookings.length} records
            </span>
          </div>
        </CardHeader>

        <CardContent>
          {bookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-y border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Student</th>
                    <th className="py-3 px-3">Room / ID</th>
                    <th className="py-3 px-3">Meal</th>
                    <th className="py-3 px-3">Booked At</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Collection Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookings.map((booking) => {
                    const isCollected = booking.status === "COLLECTED";
                    return (
                      <tr key={booking.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          {booking.user.name}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {booking.user.email}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500">
                          {booking.user.roomNumber || "Main Block"} •{" "}
                          {booking.user.studentId || "Student"}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {booking.meal.type}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {formatDate(booking.meal.date)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500">
                          {formatTime(booking.bookedAt)}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              isCollected
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-indigo-50 text-indigo-800 border border-indigo-200"
                            }`}
                          >
                            {isCollected ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                COLLECTED
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3" />
                                BOOKED
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[11px] text-slate-500">
                          {isCollected ? (
                            <span>
                              {formatTime(booking.collectedAt)} by{" "}
                              <strong>{booking.collectedBy}</strong>
                            </span>
                          ) : (
                            <span className="text-slate-400">Awaiting QR scan</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-xs text-slate-500">
              No bookings recorded yet for this criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
