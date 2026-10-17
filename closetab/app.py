from dataclasses import asdict
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from closetab.compile import compile_note, gemma_status
from closetab.ledger import build_sheet
from closetab.samples import load_samples

app = FastAPI(title="CloseTab")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class CloseRequest(BaseModel):
    note: str = Field(min_length=1)


@app.get("/api/health")
def health() -> dict:
    gemma = gemma_status()
    return {"ok": True, "engine": "gemma" if gemma["ready"] else "parser", "gemma": gemma}


@app.get("/api/samples")
def samples() -> dict:
    return {"samples": load_samples()}


@app.post("/api/close")
def close(body: CloseRequest) -> dict:
    note, engine = compile_note(body.note)
    sheet = build_sheet(note)
    return {"engine": engine, "note": asdict(note), "sheet": asdict(sheet)}


_DIST = Path(__file__).resolve().parents[1] / "web" / "dist"
if _DIST.exists():
    app.mount("/", StaticFiles(directory=_DIST, html=True), name="web")
