import json
import os
import re
import urllib.error
import urllib.request

from closetab.parse import _as_iso, parse_note
from closetab.schema import CloseNote, Expense, LineItem, Tender

_PROMPT = """You turn a stall's end-of-day note into JSON.
Return only this object:
{"stall":"string","date":"YYYY-MM-DD or null","lines":[{"item":"string","qty_sold":number or null,"unit_price":number or null,"leftover":number or null}],"tender":{"cash":number,"upi":number,"card":number},"expenses":[{"label":"string","amount":number}]}
Do not invent a price that was not written. A line like "test - 230" is one sale at 230. Money values are numbers, not strings.
Note:
"""
_TIMEOUT = 8


def compile_note(text: str) -> tuple[CloseNote, str]:
    try:
        payload = _ask_gemma(text)
        note = _from_payload(payload)
        if not _uses_only_written_numbers(text, note):
            raise ValueError("Gemma used a number that was not in the note")
        return note, "gemma"
    except (OSError, urllib.error.URLError, TimeoutError, ValueError, KeyError, TypeError, json.JSONDecodeError):
        return parse_note(text), "parser"


def gemma_status() -> dict:
    host = os.environ.get("OLLAMA_HOST", "http://127.0.0.1:11434").rstrip("/")
    model = os.environ.get("CLOSETAB_MODEL", "gemma2:2b")
    try:
        with urllib.request.urlopen(f"{host}/api/tags", timeout=0.8) as response:
            body = json.loads(response.read().decode())
        names = [item.get("name", "") for item in body.get("models") or [] if isinstance(item, dict)]
        ready = any(name == model or name.startswith(model) for name in names)
        return {"reachable": True, "ready": ready, "model": model}
    except (OSError, urllib.error.URLError, TimeoutError, ValueError, json.JSONDecodeError):
        return {"reachable": False, "ready": False, "model": model}


def _ask_gemma(text: str) -> dict:
    host = os.environ.get("OLLAMA_HOST", "http://127.0.0.1:11434").rstrip("/")
    model = os.environ.get("CLOSETAB_MODEL", "gemma2:2b")
    body = json.dumps(
        {
            "model": model,
            "prompt": _PROMPT + text,
            "stream": False,
            "format": "json",
            "options": {"temperature": 0},
        }
    ).encode()
    request = urllib.request.Request(
        f"{host}/api/generate",
        data=body,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=_TIMEOUT) as response:
        raw = json.loads(response.read().decode())
    content = raw.get("response", "")
    parsed = json.loads(content)
    if not isinstance(parsed, dict):
        raise ValueError("Gemma did not return an object")
    return parsed


def _from_payload(payload: dict) -> CloseNote:
    tender_raw = payload.get("tender") or {}
    lines = []
    for row in payload.get("lines") or []:
        if not isinstance(row, dict) or not row.get("item"):
            continue
        lines.append(
            LineItem(
                item=str(row["item"]),
                qty_sold=_num(row.get("qty_sold")),
                unit_price=_num(row.get("unit_price")),
                leftover=_num(row.get("leftover")),
            )
        )
    expenses = []
    for row in payload.get("expenses") or []:
        if not isinstance(row, dict) or row.get("amount") is None:
            continue
        expenses.append(Expense(str(row.get("label") or "expense"), float(row["amount"])))
    date = payload.get("date")
    iso = _as_iso(str(date)) if date else None
    return CloseNote(
        stall=str(payload.get("stall") or "Stall"),
        date=iso,
        lines=lines,
        tender=Tender(
            cash=float(tender_raw.get("cash") or 0),
            upi=float(tender_raw.get("upi") or 0),
            card=float(tender_raw.get("card") or 0),
        ),
        expenses=expenses,
    )


def _num(value) -> float | None:
    if value is None or value == "":
        return None
    return float(value)


def _written_numbers(text: str) -> set[float]:
    return {float(raw) for raw in re.findall(r"-?\d+(?:\.\d+)?", text)}


def _uses_only_written_numbers(text: str, note: CloseNote) -> bool:
    written = _written_numbers(text)
    amounts = [note.tender.cash, note.tender.upi, note.tender.card]
    amounts.extend(item.amount for item in note.expenses)
    for line in note.lines:
        if line.unit_price is not None:
            amounts.append(line.unit_price)
        if line.leftover is not None:
            amounts.append(line.leftover)
        if line.qty_sold is not None and line.qty_sold != 1:
            amounts.append(line.qty_sold)
    return all(amount == 0 or amount in written for amount in amounts)
