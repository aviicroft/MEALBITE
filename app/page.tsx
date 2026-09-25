import Link from "next/link";
import {
  UtensilsCrossed,
  Clock,
  ShieldCheck,
  ArrowRight,
  BellRing,
  Truck,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();
  const isSignedIn = !!user;
  const role = user?.role || null;
  const isAdmin = role === "ADMIN";

  return (
    <div className="space-y-12 py-4 sm:py-8">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto space-y-5">
        <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-200/80 px-3.5 py-1.5 rounded-full text-xs font-medium text-indigo-700">
          <UtensilsCrossed className="w-3.5 h-3.5" />
          <span>Hostel Food Delivery Tracking System</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Never wonder when your hostel meal will arrive.
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
          Get real-time meal dispatch updates, live transit milestones, and instant
          delay alerts right on your phone without repeatedly calling hostel wardens.
        </p>

        {/* Dynamic CTA buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {!isSignedIn ? (
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button size="lg" className="shadow-md">
                  Sign In to Track Food
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" size="lg">
                  Register Account
                </Button>
              </Link>
            </div>
          ) : (
            <Link href={isAdmin ? "/admin/dashboard" : "/student/dashboard"}>
              <Button size="lg" className="shadow-md">
                Go to {isAdmin ? "Admin Console" : "Student Dashboard"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}

          <Link href="#features">
            <Button variant="outline" size="lg">
              Explore Features
            </Button>
          </Link>
        </div>
      </section>

      {/* Role Portal Cards */}
      <section id="features" className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto pt-4">
        {/* Student View Card */}
        <Card className="border-indigo-100 hover:border-indigo-200 hover:shadow-md transition-all">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
                <Clock className="w-5 h-5" />
              </div>
              <Badge variant="student">Student Portal</Badge>
            </div>
            <CardTitle className="mt-3">Track Current Deliveries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>
              View live status milestones: <strong>Preparing</strong>,{" "}
              <strong>Dispatched</strong>, <strong>On the Way</strong>, and{" "}
              <strong>Arrived</strong>.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-500 list-disc list-inside">
              <li>Expected arrival time (ETA) countdown</li>
              <li>Instant delay explanations if meals are held up</li>
              <li>Punctuality and delivery log history</li>
            </ul>
            <div className="pt-2">
              <Link href="/student/dashboard">
                <Button variant="outline" size="sm" className="w-full">
                  Open Student Tracker
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Admin View Card */}
        <Card className="border-purple-100 hover:border-purple-200 hover:shadow-md transition-all">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <Badge variant="admin">Warden / Admin</Badge>
            </div>
            <CardTitle className="mt-3">Warden Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>
              Admins and wardens manage daily breakfast, lunch, snacks, and dinner
              sessions from kitchen dispatch to hostel arrival.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-500 list-disc list-inside">
              <li>One-tap status updates along delivery lifecycle</li>
              <li>Flag delays with customized reasons</li>
              <li>Record exact arrival timestamps for auditing</li>
            </ul>
            <div className="pt-2">
              <Link href="/admin/dashboard">
                <Button variant="outline" size="sm" className="w-full">
                  Open Warden Console
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* System Features Grid */}
      <section className="max-w-5xl mx-auto pt-6 border-t border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 text-center mb-6">
          Core System Capabilities
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
              <Truck className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">Real-Time Milestones</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Standardized state machine guarantees accurate step-by-step visibility from
              kitchen to hostel gate.
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700">
              <BellRing className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">Transparent Delays</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              No more rumors or confusion. Students immediately see official delay reasons
              broadcast by hostel wardens.
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
              <History className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">Delivery Audits</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Full historical records of meal delivery timings, helping administration
              monitor mess caterer punctuality.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
