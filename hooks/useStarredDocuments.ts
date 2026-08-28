"use client";

import { useState, useCallback, useMemo, useSyncExternalStore } from "react";

const STORAGE_KEY = "sasdms_starred_documents";

function getSnapshot(): string {
  if (typeof window === "undefined") return "[]";
  try {
    return localStorage.getItem(STORAGE_KEY) || "[]";
  } catch {
    return "[]";
  }
}

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("sasdms_starred_change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("sasdms_starred_change", callback);
  };
}

export function useStarredDocuments() {
  const rawData = useSyncExternalStore(subscribe, getSnapshot, () => "[]");
  const [localFallback, setLocalFallback] = useState<string[]>([]);

  const starredSet = useMemo(() => {
    try {
      return new Set<string>(JSON.parse(rawData));
    } catch {
      return new Set<string>(localFallback);
    }
  }, [rawData, localFallback]);

  const toggleStar = useCallback(
    (documentId: string) => {
      let current: string[] = [];
      try {
        current = JSON.parse(getSnapshot());
      } catch {
        current = localFallback;
      }

      const set = new Set(current);
      if (set.has(documentId)) {
        set.delete(documentId);
      } else {
        set.add(documentId);
      }

      const nextArr = Array.from(set);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextArr));
        window.dispatchEvent(new Event("sasdms_starred_change"));
      } catch {
        setLocalFallback(nextArr);
      }
    },
    [localFallback]
  );

  const isStarred = useCallback(
    (documentId: string) => {
      return starredSet.has(documentId);
    },
    [starredSet]
  );

  return {
    starredIds: starredSet,
    toggleStar,
    isStarred,
    isLoaded: true,
    starredCount: starredSet.size,
  };
}
