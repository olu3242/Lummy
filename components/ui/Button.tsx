import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "ghost" | "outline" | "nav";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary: [
    "bg-grad-brand text-white font-black",
    "shadow-violet hover:shadow-violet-lg",
    "hover:-translate-y-0.5 active:translate-y-0",
    "transition-all duration-200",
  ].join(" "),

  ghost: [
    "bg-white/5 border border-white/15 text-white font-bold",
    "hover:bg-white/10 hover:border-white/20",
    "backdrop-blur transition-all duration-200",
  ].join(" "),

  outline: [
    "border border-white/15 text-white font-bold",
    "hover:border-brand-violet/50 hover:bg-brand-violet/8",
    "transition-all duration-200",
  ].join(" "),

  nav: [
    "text-white/80 font-semibold text-sm",
    "hover:text-white hover:bg-white/8",
    "rounded-xl transition-all duration-150",
  ].join(" "),
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm rounded-xl",
  md: "px-6 py-3 text-sm rounded-2xl",
  lg: "px-8 py-4 text-base rounded-3xl",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-body",
        "touch-target select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet focus-visible:ring-offset-2 focus-visible:ring-offset-dark",
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
