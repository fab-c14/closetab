from dataclasses import dataclass, field


@dataclass
class LineItem:
    item: str
    qty_sold: float | None = None
    unit_price: float | None = None
    leftover: float | None = None


@dataclass
class Expense:
    label: str
    amount: float


@dataclass
class Tender:
    cash: float = 0
    upi: float = 0
    card: float = 0


@dataclass
class CloseNote:
    stall: str = "Stall"
    date: str | None = None
    lines: list[LineItem] = field(default_factory=list)
    tender: Tender = field(default_factory=Tender)
    expenses: list[Expense] = field(default_factory=list)


@dataclass
class RestockItem:
    item: str
    leftover: float | None
    reason: str


@dataclass
class CloseSheet:
    expected_takings: float | None
    counted: float
    variance: float | None
    expenses_total: float
    profit: float | None
    unpriced: list[str]
    restock: list[RestockItem]
