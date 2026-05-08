import { cn } from "@/lib/cn";

interface LogoProps {
  className?: string;
  iconSize?: "sm" | "md";
}

export function Logo({ className, iconSize = "md" }: LogoProps) {
  const sizes = {
    sm: "h-8 w-8 rounded-[10px]",
    md: "h-10 w-10 rounded-2xl",
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex items-center justify-center bg-grad-brand shadow-violet-sm flex-shrink-0",
          sizes[iconSize]
        )}
        aria-hidden="true"
      >
        {/* Lummy logomark — interlocking squares */}
        <svg
          viewBox="0 0 24 24"
          className={iconSize === "sm" ? "h-3.5 w-3.5" : "h-4.5 w-4.5"}
          fill="none"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="7" height="7" rx="1.5" fill="white" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" fill="white" opacity="0.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" fill="white" opacity="0.5" />
          <circle cx="17.5" cy="17.5" r="3.5" fill="white" opacity="0.9" />
        </svg>
      </div>
      <span className="font-display text-2xl font-black tracking-tight text-white">
        Lummy
      </span>
    </div>
  );
}
