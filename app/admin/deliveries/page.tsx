import Link from "next/link";
import { ArrowLeft, Truck, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getDeliveryHistoryAction } from "@/actions/delivery.actions";
import { CreateDeliveryModal } from "@/components/admin/CreateDeliveryModal";
import { DeliveryControlCard } from "@/components/admin/DeliveryControlCard";

export const dynamic = "force-dynamic";

export default async function AdminDeliveriesPage() {
  const deliveries = await getDeliveryHistoryAction();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Admin Console
            </Button>
          </Link>
          <Link href="/admin/history">
            <Button variant="outline" size="sm">
              <History className="w-4 h-4 mr-1.5" />
              Audit Logs
            </Button>
          </Link>
        </div>

        <CreateDeliveryModal />
      </div>

      {/* Main Delivery Management Container */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle>Active & Scheduled Deliveries</CardTitle>
              <p className="text-xs text-slate-500 mt-1">
                Advance delivery milestones along the verified state machine. Flag delays
                with explanatory reasons to alert students immediately.
              </p>
            </div>
            <span className="text-xs text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md self-start sm:self-auto">
              State Machine: PREPARING → DISPATCHED → ON_THE_WAY → ARRIVED
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {deliveries.length > 0 ? (
            deliveries.map((delivery) => (
              <DeliveryControlCard key={delivery._id} delivery={delivery} />
            ))
          ) : (
            <div className="text-center py-12 space-y-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-500 mx-auto flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">
                No delivery sessions found
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Start by creating a new delivery session for today&apos;s breakfast, lunch,
                snacks, or dinner.
              </p>
              <CreateDeliveryModal />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
