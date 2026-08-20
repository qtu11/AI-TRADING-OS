"use client";

import React from "react";
import { ShieldAlert, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0B0F14] text-slate-100 min-h-screen flex items-center justify-center p-4 font-sans antialiased">
        <div className="w-full max-w-md bg-[#111820] border border-[#202A35] rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-rose-400 font-bold">
              Critical Runtime Barrier
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Application Recovery Mode
            </h2>
            <p className="text-xs text-slate-400">
              A critical layout exception occurred. Click below to re-initialize your session securely.
            </p>
          </div>

          <button
            onClick={() => reset()}
            className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            Re-initialize Application
          </button>
        </div>
      </body>
    </html>
  );
}
