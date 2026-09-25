import Link from "next/link";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <Card className="max-w-md w-full text-center border-rose-200">
        <CardHeader className="flex flex-col items-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <CardTitle className="text-xl text-slate-900">Access Restricted</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            You do not have administrative privileges to access the Hostel Warden Console.
            If you are a student, please use the Student Tracking portal.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            <Link href="/student/dashboard">
              <Button variant="primary" size="sm" className="w-full sm:w-auto">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Go to Student Portal
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Home className="w-4 h-4 mr-1.5" />
                Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
