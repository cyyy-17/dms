import { getAuthenticatedUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import SessionTimeoutManager from "@/components/SessionTimeoutManager";
import IdleSessionLock from "@/components/IdleSessionLock";
import OnboardingTour from "@/components/OnboardingTour";
import KeyboardShortcutsModal from "@/components/KeyboardShortcutsModal";
import NetworkStatusBanner from "@/components/NetworkStatusBanner";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/ToastContext";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();

  // Hard auth guard — unauthenticated users are redirected to login.
  if (!user) {
    redirect("/login");
  }

  return (
    <ToastProvider>
      <div className="flex h-dvh overflow-hidden bg-slate-100 text-slate-900 selection:bg-amber-400 selection:text-slate-950">
        <DashboardSidebar user={user} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <DashboardHeader user={user} />
          <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 w-full">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </div>
        <NetworkStatusBanner />
        <SessionTimeoutManager />
        <IdleSessionLock
          userEmail={user.email}
          userName={user.fullName || `${user.firstName} ${user.lastName}`}
          userRole={user.role}
        />
        <OnboardingTour />
        <KeyboardShortcutsModal />
      </div>
    </ToastProvider>
  );
}
