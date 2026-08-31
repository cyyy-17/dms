"use client";

import { useEffect, useState, useMemo } from "react";
import { ShieldCheck, Cpu } from "lucide-react";

interface CryptographicLaserScannerProps {
  isScanning: boolean;
  statusText?: string;
  isComplete?: boolean;
  checksum?: string | null;
  className?: string;
}

const HEX_CHARS = "0123456789ABCDEF";

function generateRandomHex(length = 32): string {
  let res = "";
  for (let i = 0; i < length; i++) {
    res += HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)];
  }
  return res;
}

export default function CryptographicLaserScanner({
  isScanning,
  statusText = "Calculating SHA-256 cryptographic digest...",
  isComplete = false,
  checksum,
  className = "",
}: CryptographicLaserScannerProps) {
  const [streamHex, setStreamHex] = useState<string>("0x8F4A2C19E73D0B5A61C990234EF85012");

  useEffect(() => {
    if (!isScanning) return;
    const interval = setInterval(() => {
      setStreamHex(generateRandomHex(36));
    }, 60);

    return () => clearInterval(interval);
  }, [isScanning]);

  const chunkedHex = useMemo(() => {
    return streamHex.match(/.{1,4}/g)?.join(" ") || streamHex;
  }, [streamHex]);

  if (!isScanning && !isComplete) return null;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-blue-500/30 bg-slate-950 p-4 text-white shadow-xl transition-all ${className}`}
    >
      {/* Dynamic Laser Beam */}
      {isScanning && (
        <div className="absolute inset-x-0 h-0.5 bg-linear-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#38bdf8] animate-laser-scan pointer-events-none z-10" />
      )}

      {/* Cyber Grid Background Matrix */}
      <div className="absolute inset-0 bg-grid-cyber opacity-30 pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-cyan-300">
              {isComplete ? "Cryptographic Verification Complete" : "Quantum Checksum Stream"}
            </span>
          </div>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
            SHA-256 Engine
          </span>
        </div>

        {/* Live Hex Stream Terminal */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 font-mono text-xs overflow-hidden">
          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
            <span>Buffer Block Stream:</span>
            <span className="text-cyan-400 font-bold">{isComplete ? "LOCKED" : "LIVE SCAN"}</span>
          </div>
          <div className="text-cyan-400/90 font-mono tracking-widest text-[11px] break-all leading-relaxed animate-hex-flux select-none">
            {isComplete && checksum ? checksum : chunkedHex}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1.5">
            {isComplete ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400 inline" />
                <span className="text-emerald-300 font-bold">SHA-256 Immutability Check Passed</span>
              </>
            ) : (
              statusText
            )}
          </span>
          <span className="font-mono text-[10px] text-slate-500">256-bit Digest</span>
        </div>
      </div>
    </div>
  );
}
