import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Calendar,
  UtensilsCrossed,
  QrCode,
} from "lucide-react";
import { getBookingPassAction } from "@/actions/booking.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDate, formatTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudentPassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let data;
  try {
    data = await getBookingPassAction(id);
  } catch (error) {
    console.error("Pass error:", error);
    notFound();
  }

  const { booking, qrDataUrl } = data;
  const isCollected = booking.status === "COLLECTED";

  return (
    <div className="max-w-md mx-auto space-y-6 py-2">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <Link href="/student/book">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Book Meals
          </Button>
        </Link>
        <Link href="/student/bookings">
          <Button variant="ghost" size="sm">
            All Passes
          </Button>
        </Link>
      </div>

      {/* Main Digital QR Pass Card */}
      <Card className="overflow-hidden border-2 border-indigo-200/80 shadow-md">
        {/* Pass Top Banner */}
        <div
          className={`px-5 py-3 text-white flex items-center justify-between ${
            isCollected ? "bg-emerald-600" : "bg-indigo-600"
          }`}
        >
          <div className="flex items-center space-x-2">
            <UtensilsCrossed className="w-4 h-4" />
            <span className="text-xs font-bold tracking-wider uppercase">
              Hostel Food Collection Pass
            </span>
          </div>
          <span
            className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
              isCollected
                ? "bg-white text-emerald-800"
                : "bg-white/20 text-white"
            }`}
          >
            {booking.status}
          </span>
        </div>

        <CardHeader className="text-center pb-2">
          <span className="text-xs text-slate-400 font-medium">
            Meal Service
          </span>
          <CardTitle className="text-2xl font-black text-slate-900">
            {booking.meal.type}
          </CardTitle>
          <div className="flex items-center justify-center gap-3 text-xs text-slate-500 mt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {formatDate(booking.meal.date)}
            </span>
            <span>•</span>
            <span>Hostel Mess Counter</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 text-center">
          {/* QR Code Presentation Area */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center space-y-3">
            {!isCollected ? (
              <>
                <div className="bg-white p-3 rounded-xl shadow-xs border border-slate-200">
                  <Image
                    src={qrDataUrl}
                    alt="Booking QR Code Pass"
                    width={224}
                    height={224}
                    unoptimized
                    className="w-56 h-56 object-contain"
                  />
                </div>
                <div className="text-center space-y-1">
                  <span className="text-xs font-bold text-indigo-700 flex items-center justify-center gap-1">
                    <QrCode className="w-4 h-4" />
                    Present to Warden at Food Counter
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Opaque cryptographically secure pass. Scanned once by staff.
                  </p>
                </div>
              </>
            ) : (
              <div className="py-8 px-4 space-y-3 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black text-emerald-800">
                  SUCCESS: Food Collected!
                </h3>
                <p className="text-xs text-emerald-700 max-w-xs mx-auto">
                  This meal was issued and verified by hostel staff. This pass has
                  been permanently completed and cannot be reused.
                </p>
                {booking.collectedAt && (
                  <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                    Collected at:{" "}
                    <strong>{formatTime(booking.collectedAt)}</strong>
                    {booking.collectedBy && ` by ${booking.collectedBy}`}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Student & Menu Information */}
          <div className="text-left bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2.5 text-xs">
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
              <span className="text-slate-500">Student Name</span>
              <span className="font-semibold text-slate-900">
                {booking.user?.name || "Hostel Resident"}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
              <span className="text-slate-500">Booked At</span>
              <span className="font-medium text-slate-700">
                {formatTime(booking.bookedAt)}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block mb-1">Menu Items</span>
              <p className="text-slate-700 font-medium leading-relaxed bg-white p-2 rounded-md border border-slate-200/70">
                {booking.meal.menu}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
