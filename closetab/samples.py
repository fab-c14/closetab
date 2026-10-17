from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXAMPLES = ROOT / "examples"

SAMPLES = (
    ("night-kettle", "Night kettle"),
    ("jam-table", "Jam table"),
    ("corner-cafe", "Corner cafe"),
)


def load_samples() -> list[dict[str, str]]:
    loaded = []
    for sample_id, title in SAMPLES:
        path = EXAMPLES / f"{sample_id}.txt"
        loaded.append({"id": sample_id, "title": title, "note": path.read_text(encoding="utf-8").strip()})
    return loaded
