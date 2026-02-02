"use client";

import { useEffect, useRef } from "react";
import { useInView, useMotionValue, animate } from "framer-motion";

interface AnimatedCounterProps {
  target: number;
  suffix?: string;
  duration?: number;
}

export default function AnimatedCounter({
  target,
  suffix = "",
  duration = 2,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (!isInView) return;

    const controls = animate(motionValue, target, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => {
        if (ref.current) {
          ref.current.textContent = Math.round(latest) + suffix;
        }
      },
    });

    return () => controls.stop();
  }, [isInView, target, suffix, duration, motionValue]);

  return <span ref={ref}>0{suffix}</span>;
}
