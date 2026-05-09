"use client";

import { useEffect, useState } from "react";

interface UseScrollOptions {
  threshold?: number;
}

/**
 * Returns `true` when the window has scrolled past `threshold` pixels.
 * Used by Navbar to switch between transparent and opaque backgrounds.
 */
export function useScroll({ threshold = 50 }: UseScrollOptions = {}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > threshold);
    };

    // Run once to set initial state
    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return scrolled;
}
