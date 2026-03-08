import { redirect } from "next/navigation";

export default function LegacySignOutPage() {
  redirect("/auth/signout");
}
