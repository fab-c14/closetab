from pathlib import Path

from closetab.ledger import build_sheet
from closetab.parse import parse_note

ROOT = Path(__file__).resolve().parents[1]


def _note(name: str):
    return parse_note((ROOT / "examples" / name).read_text(encoding="utf-8"))


def test_night_kettle_math():
    sheet = build_sheet(_note("night-kettle.txt"))
    assert sheet.expected_takings == 600
    assert sheet.counted == 1090
    assert sheet.variance == 490
    assert sheet.expenses_total == 130
    assert sheet.profit == 470
    assert sheet.unpriced == []
    assert [(item.item, item.reason) for item in sheet.restock] == [("samosa", "sold out")]


def test_jam_table_restock():
    sheet = build_sheet(_note("jam-table.txt"))
    assert sheet.expected_takings == 1680
    assert sheet.counted == 1980
    assert sheet.variance == 300
    assert sheet.profit == 1460
    assert sheet.restock[0].item == "ginger"
    assert sheet.restock[0].reason == "running low"


def test_missing_price_blocks_a_fake_total():
    note = parse_note("stall: Late cart\n4 chai\ncash 80\n")
    sheet = build_sheet(note)
    assert sheet.expected_takings is None
    assert sheet.variance is None
    assert sheet.profit is None
    assert sheet.counted == 80
    assert "chai" in sheet.unpriced


def test_blank_note_is_not_a_zero_close():
    sheet = build_sheet(parse_note("hello there\n"))
    assert sheet.expected_takings is None
    assert sheet.variance is None
    assert sheet.counted == 0


def test_plain_words_with_a_slash_date_and_dash_prices():
    note = parse_note("stall : named 23\n23/10/2026\ntest - 230\ntest2 - 230\n")
    assert note.stall == "named 23"
    assert note.date == "2026-10-23"
    assert [(item.item, item.qty_sold, item.unit_price) for item in note.lines] == [
        ("test", 1, 230),
        ("test2", 1, 230),
    ]
    sheet = build_sheet(note)
    assert sheet.expected_takings == 460
    assert sheet.counted == 0
    assert sheet.variance == -460
    assert sheet.profit == 460


def test_tender_lines_are_not_treated_as_sales():
    note = parse_note("stall: Box\ncash 100\nupi 40\ncard 10\n")
    sheet = build_sheet(note)
    assert sheet.counted == 150
    assert note.lines == []
