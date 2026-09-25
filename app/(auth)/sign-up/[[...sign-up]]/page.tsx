import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-[75vh] items-center justify-center py-12">
      <div className="w-full max-w-md flex flex-col items-center">
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary:
                "bg-indigo-600 hover:bg-indigo-700 text-sm font-medium",
              card: "shadow-md border border-slate-200 rounded-2xl",
            },
          }}
        />
      </div>
    </div>
  );
}
