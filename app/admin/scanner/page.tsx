import Link from "next/link";
import { ArrowLeft, ShieldCheck, QrCode } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { QrScannerComponent } from "@/components/admin/QrScannerComponent";

export const dynamic = "force-dynamic";

export default function AdminScannerPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link href="/admin/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex items-center space-x-2 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg">
          <ShieldCheck className="w-4 h-4" />
          <span>Warden Authentication Active</span>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">
              Mess QR Code Scanner & Food Collection
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Scan student digital passes at the food counter. Server validates
              booking, transitions status to <strong className="text-emerald-700">COLLECTED</strong>,
              and blocks double-collection attempts.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Scanner */}
      <QrScannerComponent />
    </div>
  );
}
