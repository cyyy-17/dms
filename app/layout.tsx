import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SASDMS — Institutional Document Management & Cryptographic Workflow | FAITH Colleges",
  description:
    "Official internal Document Management and Sequential Approval System for the Student & Alumni Services (SAS) Department of First Asia Institute of Technology and Humanities (FAITH Colleges).",
  keywords: [
    "FAITH Colleges",
    "SASDMS",
    "Student & Alumni Services",
    "Document Management System",
    "Sequential Approval Workflow",
    "Smart Anchor E-Signatures",
    "Data Privacy Act RA 10173",
  ],
  icons: {
    icon: [
      { url: "/images/faith-crest.png", sizes: "any" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/images/faith-crest.png",
    apple: [
      { url: "/images/faith-crest.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full antialiased ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-full flex flex-col font-sans bg-slate-950 text-slate-100 selection:bg-amber-400 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
