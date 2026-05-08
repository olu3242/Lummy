import { cn } from "@/lib/cn";

interface IconBubbleProps {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  color?: "violet" | "emerald" | "amber" | "coral";
}

const SIZE_STYLES = {
  sm: "h-10 w-10 rounded-xl",
  md: "h-12 w-12 rounded-2xl",
  lg: "h-14 w-14 rounded-2xl",
};

const COLOR_STYLES = {
  violet: "bg-violet-100 text-violet-600",
  emerald: "bg-emerald-100 text-emerald-600",
  amber: "bg-amber-100 text-amber-600",
  coral: "bg-orange-100 text-orange-600",
};

/**
 * Icon container bubble — used in feature cards and step items.
 */
export function IconBubble({
  children,
  className,
  size = "md",
  color = "violet",
}: IconBubbleProps) {
  return (
    <div
      className={cn(
        "flex flex-shrink-0 items-center justify-center",
        SIZE_STYLES[size],
        COLOR_STYLES[color],
        className
      )}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}
