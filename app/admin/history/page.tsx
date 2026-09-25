import Link from "next/link";
import { ArrowLeft, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getDeliveryHistoryAction } from "@/actions/delivery.actions";
import { DeliveryHistoryTable } from "@/components/delivery/DeliveryHistoryTable";
import { DeliveryFilters } from "@/types/delivery";

export const dynamic = "force-dynamic";

export default async function AdminHistoryPage() {
  const deliveries = await getDeliveryHistoryAction();

  async function handleFilter(filters: DeliveryFilters) {
    "use server";
    return await getDeliveryHistoryAction(filters);
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Link href="/admin/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Admin Console
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-purple-600" />
                <CardTitle>Warden Delivery Audit & History</CardTitle>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Full delivery audit trail. Filter by date, meal, and status to evaluate
                mess caterer performance and track transit delays.
              </p>
            </div>
            <span className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-md self-start sm:self-auto">
              Total Records: {deliveries.length}
            </span>
          </div>
        </CardHeader>

        <CardContent>
          <DeliveryHistoryTable
            initialDeliveries={deliveries}
            isAdmin={true}
            onFilterChange={handleFilter}
          />
        </CardContent>
      </Card>
    </div>
  );
}
