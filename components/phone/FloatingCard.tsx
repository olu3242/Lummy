"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface FloatingCardProps {
  children: React.ReactNode;
  className?: string;
  /** Framer motion animation delay in seconds */
  delay?: number;
  rotate?: number;
}

/**
 * Glassmorphic floating card used around the phone mockup.
 * Rendered as a client component to support Framer Motion entrance.
 */
export function FloatingCard({
  children,
  className,
  delay = 0,
  rotate = 0,
}: FloatingCardProps) {
  return (
    <motion.div
      initial={{ y: 18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay, ease: [0.25, 0.1, 0.25, 1] }}
      style={{ rotate }}
      className={cn(
        "absolute float-card rounded-3xl p-5",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
