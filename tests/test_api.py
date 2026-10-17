from closetab.compile import compile_note
from closetab.ledger import build_sheet
from fastapi.testclient import TestClient

from closetab.app import app

client = TestClient(app)

PLAIN = "stall : named 23\n23/10/2026\ntest - 230\ntest2 - 230\n"


def test_plain_note_closes_through_the_api():
    response = client.post("/api/close", json={"note": PLAIN})
    assert response.status_code == 200
    body = response.json()
    assert body["engine"] == "parser"
    assert body["note"]["stall"] == "named 23"
    assert body["note"]["date"] == "2026-10-23"
    assert body["sheet"]["expected_takings"] == 460
    assert body["sheet"]["counted"] == 0
    assert body["sheet"]["variance"] == -460


def test_health_reports_an_engine():
    response = client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert body["engine"] in {"parser", "gemma"}


def test_invented_price_falls_back_to_the_parser(monkeypatch):
    monkeypatch.setattr(
        "closetab.compile._ask_gemma",
        lambda _text: {
            "stall": "named 23",
            "date": "2026-10-23",
            "lines": [{"item": "test", "qty_sold": 1, "unit_price": 999, "leftover": None}],
            "tender": {"cash": 0, "upi": 0, "card": 0},
            "expenses": [],
        },
    )
    note, engine = compile_note(PLAIN)
    sheet = build_sheet(note)
    assert engine == "parser"
    assert sheet.expected_takings == 460


def test_written_numbers_may_come_from_gemma(monkeypatch):
    monkeypatch.setattr(
        "closetab.compile._ask_gemma",
        lambda _text: {
            "stall": "named 23",
            "date": "23/10/2026",
            "lines": [
                {"item": "test", "qty_sold": 1, "unit_price": 230, "leftover": None},
                {"item": "test2", "qty_sold": 1, "unit_price": 230, "leftover": None},
            ],
            "tender": {"cash": 0, "upi": 0, "card": 0},
            "expenses": [],
        },
    )
    note, engine = compile_note(PLAIN)
    assert engine == "gemma"
    assert note.date == "2026-10-23"
    assert build_sheet(note).expected_takings == 460
