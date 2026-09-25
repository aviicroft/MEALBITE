"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error captured:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
      <Card className="max-w-md w-full border-rose-200 text-center">
        <CardHeader className="flex flex-col items-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <CardTitle className="text-xl text-slate-900">
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            {error.message ||
              "An unexpected error occurred while loading this page. Please try again or return home."}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => reset()}
              className="w-full sm:w-auto"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Try Again
            </Button>
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Home className="w-4 h-4 mr-1.5" />
                Return Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
