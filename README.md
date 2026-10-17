# CloseTab

End-of-day closer for market stalls and small cafes. Paste the night's note. Gemma reads it into a small JSON note. Python does every rupee.

Built for the [Hacktoberfest 2026 Week 2 Side Hustle challenge](https://dev.to/challenges/hacktoberfest-week2-2026-10-12). This repository started during that window.

The hero wave is the Waves component from [React Bits](https://reactbits.dev/backgrounds/waves), used from its published source. The ledger, the note parser, and the rest of the page are original.

## Run it

```bash
pip install -r requirements.txt pytest
pytest
ollama pull gemma2:2b
uvicorn closetab.app:app --reload --port 8000
```

In another terminal:

```bash
cd web
npm install
npm run dev
```

Open http://127.0.0.1:5173. If Ollama is not running, the sheet still builds from the written lines and the page says so.

## Tracks this project can enter

Only list a track in the DEV post after that piece is actually in use.

- Gemma: local Ollama model `gemma2:2b` reads the note.
- Render: `render.yaml` hosts the page and the API.
- GitHub Actions: `.github/workflows/test.yml` runs the ledger tests. That is the Actions part of the Copilot category, not a claim that Copilot wrote the app.
- Tinker: `tinker/benchmark.py` records a real Gemma run. Do not enter Tinker until a fine-tune beats that baseline with measured numbers.

## After the deadline

Commits made after 18 October 2026, 11:59 p.m. PDT, are post-submission work.
