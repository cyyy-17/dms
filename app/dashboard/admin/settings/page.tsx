import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import AdminSystemSettings from "@/components/AdminSystemSettings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <AdminSystemSettings />;
}
