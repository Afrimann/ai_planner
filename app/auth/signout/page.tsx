import Link from "next/link";
import { signOutAction } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";

export default function SignOutPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg items-center justify-center px-6 py-12">
      <div className="w-full rounded-xl border border-border bg-card p-6 sm:p-8">
        <h1 className="text-xl font-semibold text-foreground">Sign out</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Are you sure you want to sign out of your account?
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <form action={signOutAction} className="w-full sm:w-auto">
            <Button type="submit" fullWidth className="sm:min-w-36">
              Yes, sign out
            </Button>
          </form>

          <Link
            href="/dashboard"
            className="inline-flex h-11 w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-black transition-all duration-200 outline-none hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-gray-300/50 sm:min-w-36 sm:w-auto"
          >
            Cancel
          </Link>
        </div>
      </div>
    </main>
  );
}
