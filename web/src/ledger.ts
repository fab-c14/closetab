import type { CloseResponse } from "./types";

type Line = CloseResponse["note"]["lines"][number];

const stall = /^stall\s*:\s*(.+)$/i;
const dateLabel = /^date\s*:\s*(.+)$/i;
const tender = /^(cash|upi|card)\s+[-–—]?\s*(-?\d+(?:\.\d+)?)$/i;
const bought = /^bought\s+(.+?)\s+[-–—]?\s*(-?\d+(?:\.\d+)?)$/i;
const left = /^(.+?)\s+leftover\s+(\d+(?:\.\d+)?)$/i;
const sold = /^(\d+(?:\.\d+)?)\s+(.+?)\s+[-–—]?\s*(\d+(?:\.\d+)?)$/;
const dashed = /^([^\d\s].*?)\s+[-–—]\s+(\d+(?:\.\d+)?)$/;
const unpriced = /^(\d+(?:\.\d+)?)\s+(.+)$/;

export function closeLocally(text: string): CloseResponse {
  const lines = new Map<string, Line>();
  const note: CloseResponse["note"] = {
    stall: "Stall",
    date: null,
    lines: [],
    tender: { cash: 0, upi: 0, card: 0 },
    expenses: [],
  };

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const stallMatch = line.match(stall);
    if (stallMatch) {
      note.stall = stallMatch[1].trim();
      continue;
    }
    const dateMatch = line.match(dateLabel);
    const iso = asIso(dateMatch ? dateMatch[1] : line);
    if (iso) {
      note.date = iso;
      continue;
    }
    const tenderMatch = line.match(tender);
    if (tenderMatch) {
      const kind = tenderMatch[1].toLowerCase() as "cash" | "upi" | "card";
      note.tender[kind] += Number(tenderMatch[2]);
      continue;
    }
    const boughtMatch = line.match(bought);
    if (boughtMatch) {
      note.expenses.push({ label: boughtMatch[1].trim(), amount: Number(boughtMatch[2]) });
      continue;
    }
    const leftMatch = line.match(left);
    if (leftMatch) {
      lineFor(lines, leftMatch[1].trim()).leftover = Number(leftMatch[2]);
      continue;
    }
    const soldMatch = line.match(sold);
    if (soldMatch) {
      const item = lineFor(lines, soldMatch[2].trim());
      item.qty_sold = Number(soldMatch[1]);
      item.unit_price = Number(soldMatch[3]);
      continue;
    }
    const dashMatch = line.match(dashed);
    if (dashMatch) {
      const item = lineFor(lines, dashMatch[1].trim());
      item.qty_sold = 1;
      item.unit_price = Number(dashMatch[2]);
      continue;
    }
    const open = line.match(unpriced);
    if (open) {
      lineFor(lines, open[2].trim()).qty_sold = Number(open[1]);
    }
  }

  note.lines = [...lines.values()];
  const blank =
    note.lines.length === 0 &&
    note.expenses.length === 0 &&
    note.tender.cash === 0 &&
    note.tender.upi === 0 &&
    note.tender.card === 0;

  if (blank) {
    return {
      engine: "parser",
      note,
      sheet: {
        expected_takings: null,
        counted: 0,
        variance: null,
        expenses_total: 0,
        profit: null,
        unpriced: [],
        restock: [],
      },
    };
  }

  let expected = 0;
  let priced = true;
  const missing: string[] = [];
  for (const item of note.lines) {
    if (item.qty_sold === null || item.unit_price === null) {
      priced = false;
      if (!missing.includes(item.item)) missing.push(item.item);
      continue;
    }
    expected += item.qty_sold * item.unit_price;
  }
  const counted = note.tender.cash + note.tender.upi + note.tender.card;
  const expensesTotal = note.expenses.reduce((sum, item) => sum + item.amount, 0);
  const restock = note.lines.flatMap((item) => {
    if (item.leftover === null) return [];
    if (item.leftover <= 0) return [{ item: item.item, leftover: item.leftover, reason: "sold out" }];
    if (item.leftover <= 5) return [{ item: item.item, leftover: item.leftover, reason: "running low" }];
    return [];
  });

  return {
    engine: "parser",
    note,
    sheet: {
      expected_takings: priced ? round(expected) : null,
      counted: round(counted),
      variance: priced ? round(counted - expected) : null,
      expenses_total: round(expensesTotal),
      profit: priced ? round(expected - expensesTotal) : null,
      unpriced: missing,
      restock,
    },
  };
}

function asIso(text: string) {
  const raw = text.trim();
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return validIso(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  const dmy = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) return validIso(Number(dmy[3]), Number(dmy[2]), Number(dmy[1]));
  return null;
}

function validIso(year: number, month: number, day: number) {
  if (year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function lineFor(lines: Map<string, Line>, name: string) {
  const key = name.toLowerCase();
  const existing = lines.get(key);
  if (existing) return existing;
  const created: Line = { item: name, qty_sold: null, unit_price: null, leftover: null };
  lines.set(key, created);
  return created;
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
