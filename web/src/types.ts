export type LineItem = {
  item: string;
  qty_sold: number | null;
  unit_price: number | null;
  leftover: number | null;
};

export type CloseResponse = {
  engine: "gemma" | "parser";
  note: {
    stall: string;
    date: string | null;
    lines: LineItem[];
    tender: { cash: number; upi: number; card: number };
    expenses: { label: string; amount: number }[];
  };
  sheet: {
    expected_takings: number | null;
    counted: number;
    variance: number | null;
    expenses_total: number;
    profit: number | null;
    unpriced: string[];
    restock: { item: string; leftover: number | null; reason: string }[];
  };
};

export type Sample = { id: string; title: string; note: string };
