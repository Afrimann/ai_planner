import { redirect } from "next/navigation";
import { getCurrentAuthenticatedUser } from "@/lib/auth";
import SettingsClient from "./SettingsClient";

// server component that fetches the current user and passes it to a
// client-side form component
export default async function SettingsPage() {
  const user = await getCurrentAuthenticatedUser();
  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <section className="">
      <SettingsClient user={user} />
    </section>
  );
}
