import Link from "next/link";
import { HelpCircle, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
      <Card className="max-w-md w-full border-slate-200 text-center">
        <CardHeader className="flex flex-col items-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
            <HelpCircle className="w-6 h-6" />
          </div>
          <CardTitle className="text-xl text-slate-900">Page Not Found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            The page you requested could not be located. It might have been moved or
            does not exist.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            <Link href="/student/dashboard" className="w-full sm:w-auto">
              <Button variant="primary" size="sm" className="w-full sm:w-auto">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/" className="w-full sm:w-auto">
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
