#!/usr/bin/env python3
"""Generate short per-spell cast WAV files (procedural tones)."""
from __future__ import annotations

import math
import struct
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "assets" / "audio" / "spells"

# id -> (base_hz, slide_mul, duration_s)
SPELL_TONES = {
    "expelliarmus": (420, 1.7, 0.22),
    "stupefy": (380, 1.9, 0.24),
    "impedimenta": (520, 1.5, 0.2),
    "protego": (340, 1.3, 0.28),
    "leviosa": (610, 1.4, 0.26),
    "petrificus": (480, 1.6, 0.23),
    "incendio": (290, 2.1, 0.25),
    "accio": (550, 1.55, 0.22),
    "alohomora": (640, 1.35, 0.2),
    "patronus": (880, 1.25, 0.35),
    "avada": (220, 2.4, 0.3),
    "crucio": (260, 2.0, 0.28),
    "bombarda": (180, 2.6, 0.32),
    "lumos": (720, 1.2, 0.18),
    "finite": (500, 1.1, 0.2),
}


def write_spell_wav(path: Path, base_hz: float, slide_mul: float, duration: float) -> None:
    sample_rate = 22050
    n = int(sample_rate * duration)
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        frames = bytearray()
        for i in range(n):
            t = i / sample_rate
            env = math.exp(-t * 8) * (1 - t / duration)
            freq = base_hz * (slide_mul ** (t / duration))
            sample = math.sin(2 * math.pi * freq * t) * env * 0.35
            sample += math.sin(2 * math.pi * freq * 2 * t) * env * 0.08
            frames.extend(struct.pack("<h", int(max(-32767, min(32767, sample * 32767)))))
        wf.writeframes(frames)


def main() -> int:
    for spell_id, (base, slide, dur) in SPELL_TONES.items():
        out = OUT / f"{spell_id}.wav"
        write_spell_wav(out, base, slide, dur)
        print(f"Wrote {out}")
    print(f"Generated {len(SPELL_TONES)} spell WAVs in {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
