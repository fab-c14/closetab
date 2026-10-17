import re

from closetab.schema import CloseNote, Expense, LineItem, Tender

_STALL = re.compile(r"^stall\s*:\s*(.+)$", re.IGNORECASE)
_DATE_LABEL = re.compile(r"^date\s*:\s*(.+)$", re.IGNORECASE)
_TENDER = re.compile(r"^(cash|upi|card)\s+[-–—]?\s*(-?\d+(?:\.\d+)?)$", re.IGNORECASE)
_BOUGHT = re.compile(r"^bought\s+(.+?)\s+[-–—]?\s*(-?\d+(?:\.\d+)?)$", re.IGNORECASE)
_LEFT = re.compile(r"^(.+?)\s+leftover\s+(\d+(?:\.\d+)?)$", re.IGNORECASE)
_SOLD = re.compile(r"^(\d+(?:\.\d+)?)\s+(.+?)\s+[-–—]?\s*(\d+(?:\.\d+)?)$")
_DASH = re.compile(r"^([^\d\s].*?)\s+[-–—]\s+(\d+(?:\.\d+)?)$")
_UNPRICED = re.compile(r"^(\d+(?:\.\d+)?)\s+(.+)$")


def parse_note(text: str) -> CloseNote:
    note = CloseNote()
    by_name: dict[str, LineItem] = {}

    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue

        stall = _STALL.match(line)
        if stall:
            note.stall = stall.group(1).strip()
            continue

        labeled_date = _DATE_LABEL.match(line)
        iso = _as_iso(labeled_date.group(1) if labeled_date else line)
        if iso:
            note.date = iso
            continue

        tender = _TENDER.match(line)
        if tender:
            kind = tender.group(1).lower()
            amount = float(tender.group(2))
            setattr(note.tender, kind, getattr(note.tender, kind) + amount)
            continue

        bought = _BOUGHT.match(line)
        if bought:
            note.expenses.append(Expense(bought.group(1).strip(), float(bought.group(2))))
            continue

        left = _LEFT.match(line)
        if left:
            _line_for(by_name, left.group(1).strip()).leftover = float(left.group(2))
            continue

        sold = _SOLD.match(line)
        if sold:
            item = _line_for(by_name, sold.group(2).strip())
            item.qty_sold = float(sold.group(1))
            item.unit_price = float(sold.group(3))
            continue

        dashed = _DASH.match(line)
        if dashed:
            item = _line_for(by_name, dashed.group(1).strip())
            item.qty_sold = 1
            item.unit_price = float(dashed.group(2))
            continue

        unpriced = _UNPRICED.match(line)
        if unpriced:
            item = _line_for(by_name, unpriced.group(2).strip())
            item.qty_sold = float(unpriced.group(1))
            continue

    if not isinstance(note.tender, Tender):
        note.tender = Tender()
    note.lines = list(by_name.values())
    return note


def _as_iso(text: str) -> str | None:
    raw = text.strip()
    iso = re.fullmatch(r"(\d{4})-(\d{2})-(\d{2})", raw)
    if iso:
        return _valid_iso(int(iso.group(1)), int(iso.group(2)), int(iso.group(3)))
    dmy = re.fullmatch(r"(\d{1,2})[/-](\d{1,2})[/-](\d{4})", raw)
    if dmy:
        return _valid_iso(int(dmy.group(3)), int(dmy.group(2)), int(dmy.group(1)))
    return None


def _valid_iso(year: int, month: int, day: int) -> str | None:
    if not (2000 <= year <= 2100 and 1 <= month <= 12 and 1 <= day <= 31):
        return None
    return f"{year:04d}-{month:02d}-{day:02d}"


def _line_for(by_name: dict[str, LineItem], name: str) -> LineItem:
    key = name.casefold()
    if key not in by_name:
        by_name[key] = LineItem(item=name)
    return by_name[key]
