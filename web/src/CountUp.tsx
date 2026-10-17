import { animate, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

const rupee = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatRupee(value: number | null) {
  if (value === null) return "Blank";
  return rupee.format(value);
}

export function CountUp({ value, duration = 0.9 }: { value: number | null; duration?: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (value === null) {
      node.textContent = "Blank";
      return;
    }
    if (reduce) {
      node.textContent = rupee.format(value);
      return;
    }
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (next) => {
        node.textContent = rupee.format(next);
      },
    });
    return () => controls.stop();
  }, [duration, reduce, value]);

  return <span ref={ref}>{value === null ? "Blank" : rupee.format(0)}</span>;
}
