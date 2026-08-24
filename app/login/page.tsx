import Link from "next/link";
import LoginForm from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center space-x-2">
          <div className="w-12 h-12 rounded-xl bg-[#0F2962] flex items-center justify-center text-amber-400 font-bold text-xl shadow-md">
            FA
          </div>
        </Link>
        <h1 className="mt-4 text-2xl font-extrabold text-slate-900 tracking-tight">
          SASDMS Employee Login
        </h1>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          Student & Alumni Services • First Asia Institute of Technology and Humanities
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <LoginForm />
      </div>
    </div>
  );
}
