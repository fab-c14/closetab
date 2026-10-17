type LogoProps = {
  mark?: number;
  word?: boolean;
  className?: string;
};

export function Logo({ mark = 40, word = true, className = "" }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <img src="/favicon.svg" alt="" width={mark} height={mark} className="shrink-0" style={{ width: mark, height: mark }} />
      {word ? <span className="font-medium tracking-tight">CloseTab</span> : null}
    </span>
  );
}
