from closetab.schema import CloseNote, CloseSheet, RestockItem

RESTOCK_AT = 5


def _round(value: float) -> float:
    return round(value + 0.0, 2)


def note_is_blank(note: CloseNote) -> bool:
    return (
        not note.lines
        and not note.expenses
        and note.tender.cash == 0
        and note.tender.upi == 0
        and note.tender.card == 0
    )


def build_sheet(note: CloseNote, restock_at: float = RESTOCK_AT) -> CloseSheet:
    if note_is_blank(note):
        return CloseSheet(None, 0, None, 0, None, [], [])

    unpriced: list[str] = []
    expected = 0.0
    priced = True
    for line in note.lines:
        if line.qty_sold is None or line.unit_price is None:
            if line.item not in unpriced:
                unpriced.append(line.item)
            priced = False
            continue
        expected += line.qty_sold * line.unit_price

    counted = note.tender.cash + note.tender.upi + note.tender.card
    expenses_total = sum(item.amount for item in note.expenses)
    expected_takings = _round(expected) if priced else None
    variance = _round(counted - expected) if priced else None
    profit = _round(expected - expenses_total) if priced else None

    restock: list[RestockItem] = []
    for line in note.lines:
        if line.leftover is None:
            continue
        if line.leftover <= 0:
            restock.append(RestockItem(line.item, line.leftover, "sold out"))
        elif line.leftover <= restock_at:
            restock.append(RestockItem(line.item, line.leftover, "running low"))

    return CloseSheet(
        expected_takings=expected_takings,
        counted=_round(counted),
        variance=variance,
        expenses_total=_round(expenses_total),
        profit=profit,
        unpriced=unpriced,
        restock=restock,
    )
