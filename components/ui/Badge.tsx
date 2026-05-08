import { cn } from "@/lib/cn";

interface BadgeProps {
  children: React.ReactNode;
  withDot?: boolean;
  className?: string;
}

/**
 * Pill-shaped badge used for section labels and announcements.
 */
export function Badge({ children, withDot = false, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-violet-300/30 bg-white/5 px-4 py-2",
        "text-xs font-black uppercase tracking-widest text-violet-200 backdrop-blur",
        className
      )}
    >
      {withDot && (
        <span
          className="h-1.5 w-1.5 rounded-full bg-brand-emerald animate-pulse-dot"
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
