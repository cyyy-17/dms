"use client";

import { useSyncExternalStore, useState, useEffect, useRef } from "react";
import { WifiOff, Wifi, X } from "lucide-react";

function subscribeToOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineSnapshot() {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

function getServerOnlineSnapshot() {
  return true;
}

export default function NetworkStatusBanner() {
  const isOnline = useSyncExternalStore(
    subscribeToOnline,
    getOnlineSnapshot,
    getServerOnlineSnapshot
  );

  const [showRestored, setShowRestored] = useState(false);
  const prevOnlineRef = useRef(true);

  useEffect(() => {
    if (!prevOnlineRef.current && isOnline) {
      setShowRestored(true);
      const timer = setTimeout(() => setShowRestored(false), 4000);
      return () => clearTimeout(timer);
    }
    prevOnlineRef.current = isOnline;
  }, [isOnline]);

  if (isOnline && !showRestored) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
      {!isOnline ? (
        <div className="glass-panel px-4 py-2 rounded-2xl bg-amber-500/95 text-white border border-amber-400 shadow-xl flex items-center gap-2.5 text-xs font-bold backdrop-blur-md">
          <WifiOff className="w-4 h-4 animate-pulse shrink-0" />
          <span>Campus Network Offline — Offline session protection active</span>
        </div>
      ) : showRestored ? (
        <div className="glass-panel px-4 py-2 rounded-2xl bg-emerald-600/95 text-white border border-emerald-400 shadow-xl flex items-center gap-2.5 text-xs font-bold backdrop-blur-md">
          <Wifi className="w-4 h-4 shrink-0" />
          <span>Connection Restored — Online synchronization active</span>
          <button
            type="button"
            onClick={() => setShowRestored(false)}
            className="p-0.5 hover:bg-emerald-700 rounded-lg ml-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
