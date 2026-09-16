import type { ReactNode } from "react";

export function PageSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-border py-8 first:border-t-0">
      <div className="mb-4">
        <h2 className="text-h3 text-foreground">{title}</h2>
        {hint ? <p className="mt-1 text-small text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function Swatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="min-w-0">
      <div className={`h-12 rounded-lg border border-border ${className}`} />
      <p className="mt-1.5 truncate font-mono text-[11px] text-muted-foreground">{name}</p>
    </div>
  );
}
