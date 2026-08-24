import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SASDMS — Student & Alumni Services Document Management System | FAITH Colleges",
  description:
    "Official internal Document Management and Sequential Approval System for the Student & Alumni Services Department of First Asia Institute of Technology and Humanities (FAITH Colleges).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-50 antialiased">
      <body className="min-h-full flex flex-col font-sans text-slate-900 selection:bg-amber-100 selection:text-amber-900">
        {children}
      </body>
    </html>
  );
}
