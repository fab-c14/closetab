"""Measure Gemma against the local parser. Writes only numbers this run produced."""

import json
from pathlib import Path

from closetab.compile import compile_note
from closetab.samples import load_samples

OUT = Path(__file__).resolve().parents[1] / "results" / "benchmark.json"


def main() -> None:
    rows = []
    for sample in load_samples():
        note, engine = compile_note(sample["note"])
        rows.append(
            {
                "id": sample["id"],
                "engine": engine,
                "lines": len(note.lines),
                "stall": note.stall,
            }
        )
    if not any(row["engine"] == "gemma" for row in rows):
        raise SystemExit("Gemma did not answer. No score was written.")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"samples": rows}, indent=2), encoding="utf-8")
    print(OUT)


if __name__ == "__main__":
    main()
