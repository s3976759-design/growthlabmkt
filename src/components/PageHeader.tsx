import { ReactNode } from "react";

interface Props {
  eyebrow: string;
  title: string;
  description?: string;
  children?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, children }: Props) {
  return (
    <div className="flex flex-col gap-4 border-b border-border/60 px-6 py-8 md:flex-row md:items-end md:justify-between md:px-10 md:py-10">
      <div className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-insight">
          {eyebrow}
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight md:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
