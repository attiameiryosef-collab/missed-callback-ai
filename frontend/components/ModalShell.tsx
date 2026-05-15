"use client";

import { useEffect, useState, type ReactNode } from "react";

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  itemKey?: string | null;
  children: ReactNode;
  skeleton: ReactNode;
  header: ReactNode;
}

const ENTER_MS = 180;
const EXIT_MS = 150;
const SKELETON_MS = 220;

export function ModalShell({
  open,
  onClose,
  itemKey,
  children,
  skeleton,
  header,
}: ModalShellProps) {
  // Keep the panel mounted across the exit animation so it can slide out cleanly.
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  // Brief skeleton phase so opening the modal doesn't feel like a content pop.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setReady(false);
      const enter = setTimeout(() => setShown(true), 10);
      const ready = setTimeout(() => setReady(true), SKELETON_MS);
      return () => {
        clearTimeout(enter);
        clearTimeout(ready);
      };
    }
    setShown(false);
    const t = setTimeout(() => setMounted(false), EXIT_MS);
    return () => clearTimeout(t);
  }, [open, itemKey]);

  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mounted, onClose]);

  if (!mounted) return null;

  return (
    <div
      className={
        "fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 " +
        `transition-opacity ease-out ` +
        (shown ? "opacity-100 duration-200" : "opacity-0 duration-150")
      }
      onClick={onClose}
      aria-hidden={!shown}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={
          "bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col " +
          "transition-all ease-out " +
          (shown
            ? "opacity-100 translate-y-0 sm:scale-100 duration-200"
            : "opacity-0 translate-y-3 sm:translate-y-0 sm:scale-95 duration-150")
        }
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200">
          <div className="min-w-0 flex-1 pr-3">{header}</div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1.5 transition-colors"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div
          className={
            "overflow-y-auto px-6 py-5 transition-opacity ease-out " +
            (ready ? "opacity-100 duration-200" : "opacity-0 duration-100")
          }
        >
          {ready ? children : null}
        </div>
        {!ready ? (
          <div className="overflow-y-auto px-6 py-5 -mt-[1px]">{skeleton}</div>
        ) : null}
      </div>
    </div>
  );
}

export function ModalSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="flex gap-2">
        <div className="h-5 w-28 rounded-full bg-slate-200" />
        <div className="h-5 w-20 rounded-full bg-slate-100" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-20 rounded bg-slate-200" />
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-5/6 rounded bg-slate-100" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="h-3 w-16 rounded bg-slate-200" />
          <div className="h-4 w-24 rounded bg-slate-100" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-20 rounded bg-slate-200" />
          <div className="h-4 w-28 rounded bg-slate-100" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-20 rounded bg-slate-200" />
        <div className="h-10 rounded-lg bg-slate-100" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-20 rounded bg-slate-200" />
        <div className="h-32 rounded-lg bg-slate-100" />
      </div>
    </div>
  );
}
