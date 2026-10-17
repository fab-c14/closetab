import { Microphone, SpeakerHigh } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { CountUp } from "./CountUp";
import { HearBars } from "./HearBars";
import { closeLocally } from "./ledger";
import { Logo } from "./Logo";
import { SAMPLES } from "./samples";
import type { CloseResponse, LineItem } from "./types";

const ease = [0.16, 1, 0.3, 1] as const;
const api = import.meta.env.VITE_API_URL ?? "";

const billMotion = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } },
};

const billRow = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
};

const billLines = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const rupee = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

type VoicePhase = "idle" | "hearing" | "speaking";

type SpeechResult = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type Recog = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechResult) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function spokenClose(result: CloseResponse) {
  const costs = result.note.expenses.map((item) => `${item.label} ${Math.round(item.amount)} rupees`).join(", ");
  const gap =
    result.sheet.variance === null
      ? "The gap is blank because a price is missing."
      : `The gap is ${Math.round(result.sheet.variance)} rupees.`;
  return [result.note.stall, gap, costs ? `Costs: ${costs}.` : "No costs on this note."].join(" ");
}

export default function CloseDesk() {
  const reduce = useReducedMotion();
  const [activeId, setActiveId] = useState<string>(SAMPLES[0].id);
  const [note, setNote] = useState<string>(SAMPLES[0].note);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CloseResponse>(() => closeLocally(SAMPLES[0].note));
  const [phase, setPhase] = useState<VoicePhase>("idle");
  const [link, setLink] = useState("Checking the counter");
  const noteRef = useRef(note);
  const heardRef = useRef("");
  const recogRef = useRef<Recog | null>(null);
  noteRef.current = note;

  useEffect(() => {
    let cancelled = false;
    fetch(`${api}/api/health`)
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((body: { engine?: string }) => {
        if (cancelled) return;
        setLink(body.engine === "gemma" ? "Gemma is reading on this machine" : "The counter is ready");
      })
      .catch(() => {
        if (!cancelled) setLink("The API is offline. This page still counts the note.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function chooseSample(id: (typeof SAMPLES)[number]["id"]) {
    const sample = SAMPLES.find((item) => item.id === id) ?? SAMPLES[0];
    setActiveId(sample.id);
    setNote(sample.note);
    setError("");
    void buildSheet(sample.note);
  }

  async function buildSheet(text: string) {
    const local = closeLocally(text);
    const blank =
      local.note.lines.length === 0 && local.note.expenses.length === 0 && local.sheet.counted === 0;
    setResult(local);
    if (blank) {
      setError("This note has no sale, cash, or cost yet. Try test - 230, or cash 400.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${api}/api/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: text }),
      });
      if (!response.ok) {
        setLink("The API rejected the note. The bill is counted in this browser.");
        return;
      }
      const data = (await response.json()) as CloseResponse;
      setResult(data);
      setLink(data.engine === "gemma" ? "Gemma read this note. Code counted the rupees." : "The counter read this note.");
    } catch {
      setLink("The API is offline. This page still counts the note.");
    } finally {
      setLoading(false);
    }
  }

  function startHearing() {
    window.speechSynthesis?.cancel();
    const ctor = (
      window as Window & { SpeechRecognition?: new () => Recog; webkitSpeechRecognition?: new () => Recog }
    ).SpeechRecognition ??
      (window as Window & { webkitSpeechRecognition?: new () => Recog }).webkitSpeechRecognition;
    if (!ctor) {
      setError("This browser cannot hear a note. Type it, or open the page in Chrome.");
      return;
    }
    const recog = new ctor();
    recog.lang = "en-IN";
    recog.interimResults = true;
    recog.continuous = false;
    heardRef.current = "";
    setHeard("");
    recog.onresult = (event) => {
      let text = "";
      for (let index = 0; index < event.results.length; index += 1) {
        text += event.results[index][0].transcript;
      }
      heardRef.current = text;
      setHeard(text);
    };
    recog.onerror = () => setPhase("idle");
    recog.onend = () => {
      setPhase("idle");
      const spoken = heardRef.current.trim();
      if (!spoken) return;
      const next = noteRef.current.trim() ? `${noteRef.current.trim()}\n${spoken}` : spoken;
      setNote(next);
      setActiveId("");
      void buildSheet(next);
    };
    recogRef.current = recog;
    setPhase("hearing");
    setError("");
    recog.start();
  }

  function hearClose() {
    recogRef.current?.stop();
    if (result.note.lines.length === 0 && result.note.expenses.length === 0 && result.sheet.counted === 0) {
      setError("Write a note first. Then I can read the close.");
      return;
    }
    const synth = window.speechSynthesis;
    if (!synth) {
      setError("This browser cannot speak the close.");
      return;
    }
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(spokenClose(result));
    utterance.lang = "en-IN";
    utterance.onstart = () => setPhase("speaking");
    utterance.onend = () => setPhase("idle");
    utterance.onerror = () => setPhase("idle");
    setPhase("speaking");
    setError("");
    synth.speak(utterance);
  }

  return (
    <div className="grid items-stretch overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--panel)] lg:grid-cols-2">
      <form
        className="flex h-full flex-col gap-3 border-b border-[var(--line)] p-5 sm:p-7 lg:border-r lg:border-b-0"
        onSubmit={(event) => {
          event.preventDefault();
          void buildSheet(note);
        }}
      >
        <p className="text-sm text-[var(--muted)]">Pick a stall, or write the night in your own lines. {link}</p>
        <div className="grid gap-2">
          {SAMPLES.map((sample) => {
            const selected = sample.id === activeId;
            return (
              <button
                key={sample.id}
                type="button"
                onClick={() => chooseSample(sample.id)}
                className={`rounded-xl border px-4 py-3 text-left transition-colors duration-300 active:scale-[0.98] ${
                  selected ? "border-[var(--accent)] bg-[var(--wash)]" : "border-[var(--line)] bg-[var(--paper)]"
                }`}
              >
                <span className="block text-sm font-medium">{sample.title}</span>
                <span className="mt-1 block text-sm text-[var(--muted)]">{sample.detail}</span>
              </button>
            );
          })}
        </div>
        <label htmlFor="note" className="mt-3 text-sm font-medium">
          Tonight's note
        </label>
        <p id="note-help" className="text-sm text-[var(--muted)]">
          One sale per line. 14 chai 20, or test - 230. Costs start with bought.
        </p>
        <textarea
          id="note"
          aria-describedby="note-help"
          value={note}
          onChange={(event) => {
            setNote(event.target.value);
            setActiveId("");
          }}
          rows={12}
          className="min-h-72 w-full flex-1 resize-y rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 font-mono text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]"
        />
        {phase !== "idle" ? (
          <p className="flex items-center gap-3 text-sm">
            <HearBars live />
            {phase === "hearing" ? `Hearing${heard ? `: ${heard}` : ""}` : "Speaking the close"}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-[var(--miss)]" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-auto flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            className="rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-ink)] active:scale-[0.98]"
          >
            {loading ? "Reading the note" : "Build the sheet"}
          </button>
          <button
            type="button"
            onClick={startHearing}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--ink)] px-5 py-3 text-sm font-medium active:scale-[0.98]"
          >
            <Microphone size={18} weight="regular" />
            Say the note
          </button>
          <button
            type="button"
            onClick={hearClose}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--ink)] px-5 py-3 text-sm font-medium active:scale-[0.98]"
          >
            <SpeakerHigh size={18} weight="regular" />
            Hear the close
          </button>
        </div>
      </form>
      <div className="h-full bg-[var(--paper)] p-4 sm:p-5">
        <Sheet result={result} reduce={Boolean(reduce)} speaking={phase === "speaking"} />
      </div>
    </div>
  );
}
function lineTotal(line: LineItem) {
  if (line.qty_sold === null || line.unit_price === null) return null;
  return line.qty_sold * line.unit_price;
}

function Sheet({
  result,
  reduce,
  speaking,
}: {
  result: CloseResponse;
  reduce: boolean;
  speaking: boolean;
}) {
  const { note, sheet } = result;
  const empty = sheet.variance === null && note.lines.length === 0 && note.expenses.length === 0;
  if (empty) {
    return (
      <div className="bill rounded-b-xl px-6 pt-8 pb-10 sm:px-8">
        <Logo mark={36} />
        <p className="mt-8 text-lg font-medium">Nothing counted yet.</p>
        <p className="mt-2 max-w-[32ch] text-sm text-[var(--muted)]">
          Pick Night kettle. The bill prints a finished close.
        </p>
      </div>
    );
  }

  const billKey = [
    note.stall,
    note.date,
    sheet.variance,
    sheet.counted,
    sheet.expenses_total,
    note.lines.map((line) => line.item).join("|"),
  ].join("-");

  const tenders: [string, number][] = [
    ["Cash", note.tender.cash],
    ["UPI", note.tender.upi],
    ["Card", note.tender.card],
  ];

  return (
    <motion.article
      key={billKey}
      className="bill relative overflow-hidden rounded-b-xl px-5 pt-8 pb-8 sm:px-8"
      initial={reduce ? false : "hidden"}
      animate="show"
      variants={reduce ? undefined : billMotion}
    >
      {reduce ? null : (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-6 z-10 h-0.5 bg-[var(--accent)]"
          initial={{ top: 28, opacity: 0.9 }}
          animate={{ top: "100%", opacity: 0 }}
          transition={{ duration: 1.35, ease, delay: 0.05 }}
        />
      )}

      <motion.header variants={reduce ? undefined : billRow} className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-[0.18em] text-[var(--accent)]">CLOSE</p>
          <h3 className="mt-2 text-2xl font-medium tracking-tight">{note.stall || "Untitled stall"}</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">{note.date ?? "No date on the note"}</p>
        </div>
        <Logo mark={44} word={false} />
      </motion.header>

      <motion.div variants={reduce ? undefined : billRow} className="mt-6 border-t border-dashed border-[var(--line)]" />

      <section className="mt-5">
        <motion.p variants={reduce ? undefined : billRow} className="font-mono text-xs tracking-[0.16em] text-[var(--muted)]">
          SALES
        </motion.p>
        <motion.ul variants={reduce ? undefined : billLines} className="mt-3">
          {note.lines.map((line) => (
            <motion.li
              key={line.item}
              variants={reduce ? undefined : billRow}
              className="flex items-baseline justify-between gap-4 border-b border-[var(--line)]/70 py-3 text-sm"
            >
              <span>
                <span className="font-mono text-[var(--muted)]">{line.qty_sold ?? "?"}</span>
                <span className="ml-3">{line.item}</span>
                <span className="mt-0.5 block text-xs text-[var(--muted)]">
                  {line.unit_price === null ? "Price missing" : `${rupee.format(line.unit_price)} each`}
                  {line.leftover === null ? "" : `, ${line.leftover} left`}
                </span>
              </span>
              <span className="font-mono">{lineTotal(line) === null ? "Blank" : rupee.format(lineTotal(line) as number)}</span>
            </motion.li>
          ))}
        </motion.ul>
      </section>

      <BillTotal label="Expected" value={sheet.expected_takings} reduce={reduce} />

      <section className="mt-6">
        <motion.p variants={reduce ? undefined : billRow} className="font-mono text-xs tracking-[0.16em] text-[var(--muted)]">
          IN THE BOX
        </motion.p>
        <motion.ul variants={reduce ? undefined : billLines} className="mt-3">
          {tenders.map(([label, amount]) => (
            <motion.li
              key={label}
              variants={reduce ? undefined : billRow}
              className="flex items-baseline justify-between gap-4 py-2 text-sm"
            >
              <span>{label}</span>
              <span className="font-mono">{rupee.format(amount)}</span>
            </motion.li>
          ))}
        </motion.ul>
      </section>

      <BillTotal label="Counted" value={sheet.counted} reduce={reduce} />

      <section className="mt-6">
        <motion.p variants={reduce ? undefined : billRow} className="font-mono text-xs tracking-[0.16em] text-[var(--muted)]">
          COSTS
        </motion.p>
        {note.expenses.length === 0 ? (
          <motion.p variants={reduce ? undefined : billRow} className="mt-3 text-sm text-[var(--muted)]">
            No costs on this note.
          </motion.p>
        ) : (
          <motion.ul variants={reduce ? undefined : billLines} className="mt-3">
            {note.expenses.map((item) => (
              <motion.li
                key={item.label}
                variants={reduce ? undefined : billRow}
                className="flex items-baseline justify-between gap-4 py-2 text-sm"
              >
                <span>{item.label}</span>
                <span className="font-mono">{rupee.format(item.amount)}</span>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </section>

      <BillTotal label="Spent" value={sheet.expenses_total} reduce={reduce} />

      <motion.div variants={reduce ? undefined : billRow} className="mt-6 border-t-4 border-double border-[var(--ink)]" />

      <motion.div variants={reduce ? undefined : billRow} className="mt-5">
        <p className="flex items-center gap-3 text-sm text-[var(--muted)]">
          {speaking ? <HearBars live /> : null}
          Gap
        </p>
        <p
          className={`mt-2 font-mono text-5xl tracking-tight sm:text-6xl ${
            sheet.variance !== null && sheet.variance < 0 ? "text-[var(--miss)]" : "text-[var(--accent)]"
          }`}
        >
          <motion.span
            className="inline-block"
            animate={speaking && !reduce ? { scale: [1, 1.03, 1] } : { scale: 1 }}
            transition={speaking && !reduce ? { duration: 0.8, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
          >
            <CountUp value={sheet.variance} duration={1.15} />
          </motion.span>
        </p>
        <p className="mt-2 max-w-[36ch] text-sm text-[var(--muted)]">
          {sheet.variance === null
            ? "A line is missing its price, so the gap stays blank."
            : sheet.variance < 0
              ? "The box is short of the written sales."
              : "Counted money minus written sales."}
        </p>
      </motion.div>

      <motion.div variants={reduce ? undefined : billRow} className="mt-6 flex items-baseline justify-between gap-4 border-t border-[var(--line)] pt-4">
        <span className="text-sm">Left after costs</span>
        <span className="font-mono text-xl">
          <CountUp value={sheet.profit} duration={1} />
        </span>
      </motion.div>

      {sheet.unpriced.length > 0 ? (
        <motion.p variants={reduce ? undefined : billRow} className="mt-4 text-sm text-[var(--miss)]">
          Add a price for {sheet.unpriced.join(", ")}.
        </motion.p>
      ) : null}

      {sheet.restock.length > 0 ? (
        <motion.ul variants={reduce ? undefined : billRow} className="mt-5 border-t border-dashed border-[var(--line)] pt-4">
          {sheet.restock.map((item) => (
            <li key={item.item} className="flex items-baseline justify-between gap-4 py-1 text-sm">
              <span>Buy tomorrow</span>
              <span>
                {item.item}
                <span className="text-[var(--muted)]">, {item.reason}</span>
              </span>
            </li>
          ))}
        </motion.ul>
      ) : null}

      <motion.p variants={reduce ? undefined : billRow} className="mt-6 text-xs leading-relaxed text-[var(--muted)]">
        {result.engine === "gemma"
          ? "Gemma read the note on this machine. The rupees were counted in code."
          : "The written lines were counted in code. Start Ollama with gemma2:2b if you want Gemma to read a messier note."}
      </motion.p>
    </motion.article>
  );
}

function BillTotal({ label, value, reduce }: { label: string; value: number | null; reduce: boolean }) {
  return (
    <motion.div variants={reduce ? undefined : billRow} className="mt-3 flex items-baseline justify-between gap-4">
      <span className="text-sm font-medium">{label}</span>
      <span className="font-mono text-lg">
        <CountUp value={value} duration={0.8} />
      </span>
    </motion.div>
  );
}

