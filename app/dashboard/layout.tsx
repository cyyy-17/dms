import { getAuthenticatedUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();

  // Hard auth guard — unauthenticated users are redirected to login.
  // The demo fallback has been removed; this system is production-only.
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <DashboardSidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader user={user} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
