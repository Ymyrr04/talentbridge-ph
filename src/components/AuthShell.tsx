import type { ReactNode } from "react";
import { Brand } from "./Brand";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-gradient">
      <header className="mx-auto flex max-w-6xl items-center px-6 py-5">
        <Brand />
      </header>
      <main className="flex justify-center px-4 pb-16 pt-6 sm:pt-12">
        <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-elevated sm:p-8">
          <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
