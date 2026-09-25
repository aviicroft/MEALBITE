import Link from "next/link";
import { ArrowLeft, UtensilsCrossed, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getAdminMealsAction } from "@/actions/meal.actions";
import { CreateMealModal } from "@/components/admin/CreateMealModal";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminMealsPage() {
  const meals = await getAdminMealsAction();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Dashboard
            </Button>
          </Link>
          <Link href="/admin/bookings">
            <Button variant="outline" size="sm">
              <Users className="w-4 h-4 mr-1.5" />
              View Bookings
            </Button>
          </Link>
        </div>

        <CreateMealModal />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle>Hostel Meal Sessions & Menus</CardTitle>
              <p className="text-xs text-slate-500 mt-1">
                Configure daily breakfast, lunch, snacks, and dinner sessions. When published,
                meals are instantly available for student booking and delivery tracking.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md self-start sm:self-auto">
              Total Sessions: {meals.length}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {meals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {meals.map((meal) => {
                const now = new Date();
                const isOpen =
                  now >= new Date(meal.bookingOpen) &&
                  now <= new Date(meal.bookingClose);

                return (
                  <div
                    key={meal.id}
                    className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                          <UtensilsCrossed className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">
                            {meal.type} Service
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            {formatDate(meal.date)}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          isOpen
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {isOpen ? "BOOKING OPEN" : "CLOSED"}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                        Menu
                      </span>
                      <p className="text-slate-700 font-medium line-clamp-2">
                        {meal.menu}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <span className="text-slate-500 flex items-center gap-1 font-medium">
                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                        <strong>{meal._count?.bookings || 0}</strong> bookings
                      </span>

                      <Link href={`/admin/bookings?mealId=${meal.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs">
                          Review List →
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 space-y-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500">
                No meals scheduled yet. Click &quot;Schedule Meal &amp; Open Bookings&quot; to
                add today&apos;s breakfast, lunch, or dinner.
              </p>
              <CreateMealModal />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
