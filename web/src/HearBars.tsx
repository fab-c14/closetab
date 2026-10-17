import { motion, useReducedMotion } from "motion/react";

export function HearBars({ live }: { live: boolean }) {
  const reduce = useReducedMotion();
  return (
    <span className="inline-flex h-5 items-end gap-1" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((bar) => (
        <motion.span
          key={bar}
          className="w-1 rounded-full bg-[var(--accent)]"
          initial={false}
          animate={
            live && !reduce
              ? { height: ["6px", "18px", "8px"] }
              : { height: "8px" }
          }
          transition={
            live && !reduce
              ? { duration: 0.55, repeat: Infinity, delay: bar * 0.08, ease: "easeInOut" }
              : { duration: 0.2 }
          }
        />
      ))}
    </span>
  );
}
