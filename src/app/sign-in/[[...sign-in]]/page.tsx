import { SignIn } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

export default function Page() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className={cn(
        "bg-white rounded-2xl border-2 border-neutral-800 shadow-lg p-8 max-w-md w-full"
      )}>
        <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
      </div>
    </div>
  );
} 