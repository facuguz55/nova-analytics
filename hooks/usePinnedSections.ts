"use client";
import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "nova_pinned_sections";
const SYNC_EVENT  = "nova:pinned-changed";

export function usePinnedSections() {
  const [pinned, setPinned] = useState<string[]>([]);

  useEffect(() => {
    const load = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        setPinned(saved ? (JSON.parse(saved) as string[]) : []);
      } catch {
        setPinned([]);
      }
    };
    load();
    window.addEventListener(SYNC_EVENT, load);
    return () => window.removeEventListener(SYNC_EVENT, load);
  }, []);

  const toggle = useCallback((label: string) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const prev: string[] = saved ? JSON.parse(saved) : [];
      const next = prev.includes(label)
        ? prev.filter((l) => l !== label)
        : [...prev, label];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setPinned(next);
      window.dispatchEvent(new CustomEvent(SYNC_EVENT));
    } catch { /* noop */ }
  }, []);

  return { pinned, toggle };
}
