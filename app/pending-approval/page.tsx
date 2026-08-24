import Link from "next/link";
import { Clock, ShieldCheck, Mail, ArrowLeft } from "lucide-react";

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="glass-card rounded-2xl py-8 px-6 sm:px-10 shadow-xl border border-slate-200 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Registration Pending Approval
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Your registration has been submitted successfully to the Student & Alumni Services Admin queue.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-3 text-xs text-slate-600">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900">Admin Activation Required:</span> To maintain internal security, access requires explicit Admin role confirmation.
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900">Email Notification:</span> You will receive an automated confirmation email once your account has been approved.
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/login"
              className="w-full py-2.5 px-4 rounded-lg bg-[#0F2962] hover:bg-[#091a42] text-white font-semibold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
