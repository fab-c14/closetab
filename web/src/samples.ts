export const SAMPLES = [
  {
    id: "night-kettle",
    title: "Night kettle",
    detail: "Chai, samosa, milk and gas",
    note: `stall: Night kettle
date: 2026-10-15
14 chai 20
9 samosa 30
2 bun-maska 25
samosa leftover 0
chai leftover 6
cash 680
upi 410
bought milk 90
bought gas 40`,
  },
  {
    id: "jam-table",
    title: "Jam table",
    detail: "Jars, cash, and a short restock",
    note: `stall: Jam table
date: 2026-10-15
6 mixed-berry 180
4 ginger 150
ginger leftover 2
cash 900
upi 1080
bought jars 220`,
  },
  {
    id: "corner-cafe",
    title: "Corner cafe",
    detail: "Coffee, buns, and a card total",
    note: `stall: Corner cafe
date: 2026-10-15
22 filter-coffee 25
11 bun 30
filter-coffee leftover 4
cash 700
upi 455
card 120
bought milk 160`,
  },
] as const;
