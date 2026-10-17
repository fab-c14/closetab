import { ArrowDown, Calculator, CaretDown, List, Microphone, Notebook, SpeakerHigh, X } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import CloseDesk from "./CloseDesk";
import { Logo } from "./Logo";
import { CountUp } from "./CountUp";
import { HearBars } from "./HearBars";
import { SectionCut } from "./SectionCut";
import Waves from "./Waves";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const ease = [0.16, 1, 0.3, 1] as const;

const nightChart = [
  { name: "Expected", value: 600 },
  { name: "Counted", value: 1090 },
  { name: "Costs", value: 130 },
  { name: "Gap", value: 490 },
];

const steps = [
  {
    icon: Notebook,
    title: "Write or speak the note",
    body: "A sale is one line, like 14 chai 20. Cash, UPI, and card each get a line. A cost starts with bought, like bought milk 90.",
  },
  {
    icon: Microphone,
    title: "Gemma reads the words",
    body: "The open model turns the note into items, tenders, and costs. If a price was never written, it stays blank. The model does not guess a rupee amount.",
  },
  {
    icon: Calculator,
    title: "Code counts the bill",
    body: "Expected sales are quantity times price. Counted money is cash plus UPI plus card. The gap is counted money minus expected sales. Profit is expected sales minus costs.",
  },
  {
    icon: SpeakerHigh,
    title: "You hear the close",
    body: "The sheet shows the gap, every cost, and what to buy tomorrow. Hear the close reads that bill aloud. The bars move only while the voice is on.",
  },
];

const questions = [
  {
    q: "What does the sheet count?",
    a: "Written sales, then cash, UPI, and card. Costs such as milk, gas, or jars are listed on their own. The gap is counted money minus written sales.",
  },
  {
    q: "Who does the arithmetic?",
    a: "Gemma can read a messy note. The rupees are added in code. If a price was never written, that line stays blank instead of becoming zero.",
  },
  {
    q: "Does the cash total leave this computer?",
    a: "With Ollama running, the note is read on this machine. If Gemma is offline, the page still builds the sheet from the lines you wrote.",
  },
  {
    q: "How does voice work?",
    a: "Say the note to add a spoken line. Hear the close to have the stall, the gap, and each cost read back. Chrome or Edge is required. The bars move only while the page is hearing or speaking.",
  },
  {
    q: "What if the box is short?",
    a: "A negative gap means the counted money is below the written sales. A positive gap means the box holds more than the note explains. Both stay on the sheet.",
  },
  {
    q: "Is there a fee for each close?",
    a: "No per-note model bill when Gemma runs locally. You are not paying a hosted API every time the stall locks up.",
  },
];

export default function App() {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const rise = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.7, ease },
      };
  const links = [
    ["#product", "Product"],
    ["#how", "How"],
    ["#desk", "Desk"],
    ["#count", "Count"],
    ["#voice", "Voice"],
    ["#questions", "Questions"],
  ];

  return (
    <div className="relative min-h-[100dvh] bg-[var(--paper)] text-[var(--ink)]">
      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--paper)]/90 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4">
          <a href="#top" className="text-lg">
            <Logo mark={40} />
          </a>
          <nav className="hidden items-center gap-6 text-sm lg:flex">
            {links.map(([href, label]) => (
              <a key={href} href={href} className="transition-colors duration-300 hover:text-[var(--accent)]">
                {label}
              </a>
            ))}
          </nav>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--line)] lg:hidden"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={20} weight="regular" /> : <List size={20} weight="regular" />}
          </button>
        </div>
        {open ? (
          <nav className="grid gap-1 border-t border-[var(--line)] px-4 py-3 lg:hidden">
            {links.map(([href, label]) => (
              <a key={href} href={href} className="rounded-xl px-3 py-3 text-base" onClick={() => setOpen(false)}>
                {label}
              </a>
            ))}
          </nav>
        ) : null}
      </header>

      <main id="top" className="relative z-10">
        <section className="relative overflow-hidden pt-16 pb-28 sm:pt-20 sm:pb-32 lg:pt-24">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <Waves
              lightMode
              paused={Boolean(reduce)}
              lineColor="#0d7a45"
              accentColor="#14201a"
              backgroundColor="#f4f8f5"
              opacity={0.55}
              speed={0.4}
              amplitude={20}
              spacing={18}
              mouseStrength={0.4}
              mouseRadius={140}
              fade={0.12}
            />
          </div>
          <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 lg:grid-cols-2 lg:gap-14">
          <div>
            <motion.h1
              {...rise}
              className="max-w-[12ch] text-4xl leading-[1.05] font-medium tracking-tight md:text-5xl lg:text-6xl"
            >
              Count the box before you lock it.
            </motion.h1>
            <motion.span
              aria-hidden
              className="mt-5 block h-px w-16 origin-left bg-[var(--accent)]"
              initial={reduce ? false : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.7, ease, delay: 0.2 }}
            />
            <motion.p
              {...(reduce ? {} : { ...rise, transition: { duration: 0.7, ease, delay: 0.08 } })}
              className="mt-5 max-w-[36ch] text-base leading-relaxed text-[var(--muted)]"
            >
              Speak the night's note, or pick a stall. The sheet shows the gap and every cost.
            </motion.p>
            <motion.a
              {...(reduce ? {} : { ...rise, transition: { duration: 0.7, ease, delay: 0.16 } })}
              href="#desk"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[var(--ink)] px-5 py-3 text-sm font-medium text-[var(--paper)] active:scale-[0.98]"
            >
              Open the desk
              <ArrowDown size={16} weight="bold" />
            </motion.a>
          </div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.12 }}
            className="relative"
          >
            <img
              src="/stall-day.jpg"
              alt="A daylight cafe counter with a blank paper slip and a steel cash tray."
              className="aspect-[16/10] w-full rounded-xl object-cover"
            />
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease, delay: 0.35 }}
              className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 shadow-[0_18px_40px_rgba(20,32,26,0.12)] sm:absolute sm:right-auto sm:bottom-4 sm:left-4 sm:mt-0 sm:w-64"
            >
              <p className="text-sm text-[var(--muted)]">Night kettle sample</p>
              <p className="mt-1 font-mono text-3xl tracking-tight">
                <CountUp value={490} />
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">Gap after cash and UPI</p>
            </motion.div>
          </motion.div>
          </div>
          <SectionCut kind="curve" fill="var(--foam)" />
        </section>

        <section id="product" className="relative bg-[var(--foam)] pt-16 pb-28 sm:pt-20 sm:pb-32">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="max-w-[16ch] text-3xl font-medium tracking-tight md:text-5xl">
              CloseTab is the last bill of the night.
            </h2>
            <p className="mt-6 max-w-[62ch] text-lg leading-relaxed text-[var(--muted)]">
              A chai stall, a weekend table, or a small cafe already writes the day in a messy note. CloseTab turns that note into a close: expected sales, money in the box, every cost, the gap, and what to buy tomorrow.
            </p>
            <p className="mt-4 max-w-[62ch] text-base leading-relaxed">
              Gemma, an open model, reads the words. A ledger in code does the rupees. Your cash total does not have to go to a paid chat API.
            </p>
          </div>
          <SectionCut kind="wave" fill="var(--tide)" texture="dots" />
        </section>

        <section id="how" className="field-dots relative pt-16 pb-28 sm:pt-20 sm:pb-32">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="text-3xl font-medium tracking-tight md:text-4xl">How a note becomes a close</h2>
            <ol className="mt-12">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <motion.li
                    key={step.title}
                    initial={reduce ? false : { opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.55, ease, delay: reduce ? 0 : index * 0.06 }}
                    className="grid grid-cols-1 gap-3 border-t border-[var(--accent)]/25 py-8 sm:grid-cols-[auto_1fr] sm:gap-5"
                  >
                    <Icon size={26} weight="regular" className="text-[var(--accent)]" />
                    <div>
                      <h3 className="text-2xl font-medium">{step.title}</h3>
                      <p className="mt-3 max-w-[58ch] text-base leading-relaxed text-[var(--muted)]">{step.body}</p>
                    </div>
                  </motion.li>
                );
              })}
            </ol>
          </div>
          <SectionCut kind="scallop" fill="var(--reed)" texture="rules" />
        </section>

        <section id="desk" className="field-rules relative pt-16 pb-28 sm:pt-20 sm:pb-32">
          <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-3xl font-medium tracking-tight md:text-5xl">Tonight's close</h2>
          <motion.span
            className="mt-5 block h-px w-16 origin-left bg-[var(--accent)]"
            initial={reduce ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{ duration: 0.7, ease }}
          />
          <p className="mt-5 max-w-[46ch] text-base leading-relaxed text-[var(--muted)]">
            The note stays on the left. The bill prints on the right.
          </p>
          <div className="mt-10">
            <CloseDesk />
          </div>
          </div>
          <SectionCut kind="fold" fill="var(--lagoon)" />
        </section>

        <section id="count" className="relative bg-[var(--lagoon)] pt-16 pb-28 sm:pt-20 sm:pb-32">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="text-3xl font-medium tracking-tight md:text-5xl">Night kettle, line by line</h2>
            <p className="mt-4 max-w-[46ch] text-base leading-relaxed text-[var(--muted)]">
              These figures come from the sample note, not from a guessed total.
            </p>
            <div className="mt-10 grid items-stretch overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--paper)] lg:grid-cols-2">
              <div className="grid content-between gap-8 border-b border-[var(--line)] p-6 sm:p-8 lg:border-r lg:border-b-0">
                <div className="grid gap-8">
                  <BillGroup
                    title="Sales"
                    rows={[
                      ["14 chai at 20", "280"],
                      ["9 samosa at 30", "270"],
                      ["2 bun-maska at 25", "50"],
                    ]}
                  />
                  <BillGroup
                    title="In the box"
                    rows={[
                      ["Cash", "680"],
                      ["UPI", "410"],
                      ["Counted", "1,090"],
                    ]}
                  />
                  <BillGroup
                    title="Costs"
                    rows={[
                      ["Milk", "90"],
                      ["Gas", "40"],
                      ["Spent", "130"],
                    ]}
                  />
                </div>
                <div className="flex items-baseline justify-between gap-4 border-t-4 border-double border-[var(--ink)] pt-4">
                  <span className="text-sm">Left after costs</span>
                  <span className="font-mono text-2xl text-[var(--accent)]">
                    <CountUp value={470} />
                  </span>
                </div>
              </div>
              <div className="flex min-h-80 flex-col p-6 sm:p-8">
                <h3 className="text-sm font-medium">Same night, drawn</h3>
                <p className="mt-2 max-w-[36ch] text-sm leading-relaxed text-[var(--muted)]">
                  Expected 600. Counted 1,090. The gap is 490.
                </p>
                <div className="mt-6 h-72 w-full flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={nightChart} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fill: "#4e5c54", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#4e5c54", fontSize: 12 }} axisLine={false} tickLine={false} width={48} />
                      <Tooltip
                        cursor={{ fill: "rgba(13,122,69,0.08)" }}
                        contentStyle={{
                          background: "#f7faf8",
                          border: "1px solid #c9d5cc",
                          borderRadius: 12,
                          color: "#14201a",
                        }}
                        formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Rupees"]}
                      />
                      <Bar dataKey="value" fill="#0d7a45" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
          <SectionCut kind="curve" fill="var(--pool)" />
        </section>

        <section id="voice" className="relative bg-[var(--pool)] pt-16 pb-28 sm:pt-20 sm:pb-32">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid items-stretch overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--panel)] lg:grid-cols-2">
              <div className="flex flex-col justify-between gap-10 border-b border-[var(--line)] p-6 sm:p-8 lg:border-r lg:border-b-0">
                <div>
                  <h2 className="max-w-[14ch] text-3xl font-medium tracking-tight md:text-4xl">The bill can listen.</h2>
                  <p className="mt-4 max-w-[42ch] text-base leading-relaxed text-[var(--muted)]">
                    Say a line and it is added to the note. Hear the close and the page reads the gap and each cost.
                  </p>
                  <p className="mt-6 flex items-center gap-3 text-sm">
                    <HearBars live={!reduce} />
                    The bars move only while a voice is on.
                  </p>
                </div>
                <div className="border-t border-[var(--line)] pt-6">
                  <h3 className="text-2xl font-medium tracking-tight">No fee per close</h3>
                  <p className="mt-3 max-w-[42ch] text-base leading-relaxed text-[var(--muted)]">
                    Gemma reads the note on this computer. The arithmetic does not come with a token invoice.
                  </p>
                </div>
              </div>
              <img
                src="/coins-day.jpg"
                alt="Coins and a blank paper slip on a pale table in daylight."
                className="h-full min-h-72 w-full object-cover"
              />
            </div>
          </div>
          <SectionCut kind="scallop" fill="var(--glen)" />
        </section>

        <section id="questions" className="relative bg-[var(--glen)] pt-16 pb-28 sm:pt-20 sm:pb-32">
          <div className="mx-auto max-w-7xl px-4">
            <div className="rounded-[28px] border border-[var(--line)] bg-[var(--panel)] px-6 py-8 sm:px-8">
              <h2 className="text-3xl font-medium tracking-tight">Questions</h2>
              <div className="mt-6 border-t border-[var(--line)]">
                {questions.map((item) => (
                  <details key={item.q} className="group border-b border-[var(--line)] py-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium">
                      {item.q}
                      <CaretDown size={18} weight="regular" className="shrink-0 transition-transform duration-300 group-open:rotate-180" />
                    </summary>
                    <p className="mt-3 max-w-[68ch] text-sm leading-relaxed text-[var(--muted)]">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
          <SectionCut kind="wave" fill="var(--paper)" />
        </section>
      </main>

      <footer className="relative z-10 bg-[var(--paper)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-8 text-sm text-[var(--muted)]">
          <Logo mark={32} />
          <span>MIT</span>
        </div>
      </footer>
    </div>
  );
}

function BillGroup({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div>
      <h3 className="font-mono text-xs tracking-[0.16em] text-[var(--muted)]">{title.toUpperCase()}</h3>
      <ul className="mt-3">
        {rows.map(([label, amount]) => (
          <li key={label} className="flex items-baseline justify-between gap-4 border-b border-[var(--line)] py-2.5 text-sm last:border-b-0">
            <span>{label}</span>
            <span className="font-mono">₹{amount}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
