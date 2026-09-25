import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Calendar,
  History,
  Hourglass,
  QrCode,
  UtensilsCrossed,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  getAdminDashboardStatsAction,
  getLiveDeliveryAction,
} from "@/actions/delivery.actions";
import { CreateDeliveryModal } from "@/components/admin/CreateDeliveryModal";
import { formatTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStatsAction();
  const activeDelivery = await getLiveDeliveryAction();

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Operational Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-2 text-xs sm:text-sm text-slate-700">
          <Calendar className="w-4 h-4 text-purple-600" />
          <span className="font-semibold">Operations Date:</span>
          <span className="text-slate-500">{todayStr}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/scanner">
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
              <QrCode className="w-4 h-4 mr-1.5" />
              QR Scanner
            </Button>
          </Link>
          <Link href="/admin/meals">
            <Button variant="outline" size="sm">
              <UtensilsCrossed className="w-4 h-4 mr-1.5" />
              Meals
            </Button>
          </Link>
          <Link href="/admin/bookings">
            <Button variant="outline" size="sm">
              <Users className="w-4 h-4 mr-1.5" />
              Bookings
            </Button>
          </Link>
          <CreateDeliveryModal />
        </div>
      </div>

      {/* Operational KPI Grid (Section 7 Requirements) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Meals */}
        <Card className="border-slate-200">
          <CardHeader className="pb-1 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase text-slate-500">
                Today&apos;s Meals
              </span>
              <UtensilsCrossed className="w-4 h-4 text-slate-400" />
            </div>
            <CardTitle className="text-2xl font-black text-slate-900 mt-1">
              {stats.todayMeals}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 p-4">
            <p className="text-[11px] text-slate-400">Scheduled menus</p>
          </CardContent>
        </Card>

        {/* Today's Bookings */}
        <Card className="border-indigo-100 bg-indigo-50/20">
          <CardHeader className="pb-1 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase text-indigo-700">
                Today&apos;s Bookings
              </span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <CardTitle className="text-2xl font-black text-indigo-900 mt-1">
              {stats.todayBookings}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 p-4">
            <p className="text-[11px] text-indigo-600">Student passes created</p>
          </CardContent>
        </Card>

        {/* Collected Count */}
        <Card className="border-emerald-200/70 bg-emerald-50/20">
          <CardHeader className="pb-1 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase text-emerald-700">
                Collected
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-black text-emerald-900 mt-1">
              {stats.collectedCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 p-4">
            <p className="text-[11px] text-emerald-600">QR scanned &amp; issued</p>
          </CardContent>
        </Card>

        {/* Pending Collection Count */}
        <Card className="border-amber-200/70 bg-amber-50/20">
          <CardHeader className="pb-1 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase text-amber-700">
                Pending Collection
              </span>
              <Hourglass className="w-4 h-4 text-amber-600" />
            </div>
            <CardTitle className="text-2xl font-black text-amber-900 mt-1">
              {stats.pendingCollectionCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 p-4">
            <p className="text-[11px] text-amber-600">Awaiting counter scan</p>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Tracking Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Delivery Status */}
        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Active Meal Delivery Status
              </span>
              <Link href="/admin/deliveries">
                <Button variant="outline" size="sm" className="text-xs">
                  Manage Deliveries
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {activeDelivery ? (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">
                    {activeDelivery.mealType} Service
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-800">
                    {activeDelivery.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Expected</span>
                    <span>~ {formatTime(activeDelivery.expectedArrivalTime)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Dispatched</span>
                    <span>{formatTime(activeDelivery.dispatchTime)}</span>
                  </div>
                </div>
                {activeDelivery.isDelayed && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-700 font-semibold pt-1 border-t border-slate-200">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Delay: {activeDelivery.delayReason}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">
                No active delivery in transit.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Hub */}
        <Card className="border-slate-200">
          <CardHeader>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Warden Operations Hub
            </span>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href="/admin/scanner"
              className="flex items-center justify-between p-3 rounded-lg border border-purple-200 bg-purple-50/50 hover:bg-purple-100/50 transition-colors"
            >
              <div className="flex items-center space-x-2.5">
                <QrCode className="w-5 h-5 text-purple-600" />
                <div>
                  <span className="font-bold text-xs text-slate-900 block">
                    Launch QR Camera Scanner
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Verify and issue food at distribution gate
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-purple-700">Open →</span>
            </Link>

            <Link
              href="/admin/history"
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100/70 transition-colors"
            >
              <div className="flex items-center space-x-2.5">
                <History className="w-5 h-5 text-slate-600" />
                <div>
                  <span className="font-bold text-xs text-slate-900 block">
                    Delivery Audit Log
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Review historical delivery punctuality and delays
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-700">View →</span>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
