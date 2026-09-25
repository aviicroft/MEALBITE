import Link from "next/link";
import { ArrowLeft, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getDeliveryHistoryAction } from "@/actions/delivery.actions";
import { DeliveryHistoryTable } from "@/components/delivery/DeliveryHistoryTable";
import { DeliveryFilters } from "@/types/delivery";

export const dynamic = "force-dynamic";

export default async function StudentHistoryPage() {
  const deliveries = await getDeliveryHistoryAction();

  // Server action callback passed for dynamic client filtering
  async function handleFilter(filters: DeliveryFilters) {
    "use server";
    return await getDeliveryHistoryAction(filters);
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Link href="/student/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Live Tracker
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-indigo-600" />
                <CardTitle>Delivery History & Punctuality Logs</CardTitle>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Historical records of all hostel meal dispatches, arrival timestamps, and
                documented delay explanations.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md self-start sm:self-auto">
              Total Logged: {deliveries.length}
            </span>
          </div>
        </CardHeader>

        <CardContent>
          <DeliveryHistoryTable
            initialDeliveries={deliveries}
            onFilterChange={handleFilter}
          />
        </CardContent>
      </Card>
    </div>
  );
}
