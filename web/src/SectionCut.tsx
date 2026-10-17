import { useId } from "react";

const edges = {
  curve: "M0 64C240 16 500 104 760 52C1020 4 1240 92 1440 40",
  wave: "M0 72C150 24 300 108 480 66C700 16 860 112 1080 60C1240 24 1360 88 1440 48",
  scallop: "M0 70Q72 28 144 70T288 70T432 70T576 70T720 70T864 70T1008 70T1152 70T1296 70T1440 70",
  fold: "M0 46C380 46 620 108 980 58C1180 30 1320 72 1440 42",
} as const;

type CutKind = keyof typeof edges;

export function SectionCut({
  kind,
  fill,
  texture,
}: {
  kind: CutKind;
  fill: string;
  texture?: "dots" | "rules";
}) {
  const patternId = useId().replace(/:/g, "");
  const edge = edges[kind] ?? edges.curve;
  const shape = `${edge} V120 H0 Z`;
  return (
    <svg
      aria-hidden
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      className="pointer-events-none absolute right-0 -bottom-px left-0 h-16 w-full text-[var(--accent)] md:h-24"
    >
      <defs>
        {texture === "dots" ? (
          <pattern id={patternId} width="18" height="18" patternUnits="userSpaceOnUse">
            <rect width="18" height="18" fill={fill} />
            <circle cx="1" cy="1" r="1.15" fill="rgba(13,122,69,0.35)" />
          </pattern>
        ) : null}
        {texture === "rules" ? (
          <pattern id={patternId} width="4" height="32" patternUnits="userSpaceOnUse">
            <rect width="4" height="32" fill={fill} />
            <path d="M0 31.5H4" stroke="rgba(13,122,69,0.14)" strokeWidth="1" />
          </pattern>
        ) : null}
      </defs>
      <path d={shape} fill={texture ? `url(#${patternId})` : fill} />
      <path d={edge} fill="none" stroke="currentColor" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
