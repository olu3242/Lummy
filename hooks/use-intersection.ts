"use client";

import { useEffect, useRef, useState } from "react";

interface UseIntersectionOptions extends IntersectionObserverInit {
  /** Once visible, stop observing (default: true) */
  once?: boolean;
}

/**
 * Returns [ref, isVisible] for scroll-triggered entrance animations.
 *
 * @example
 * const [ref, visible] = useIntersection<HTMLDivElement>({ threshold: 0.1 });
 * <div ref={ref} className={visible ? "animate-fade-up" : "opacity-0"} />
 */
export function useIntersection<T extends Element>({
  threshold = 0.1,
  rootMargin = "0px",
  once = true,
}: UseIntersectionOptions = {}): [React.RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return [ref, visible];
}
