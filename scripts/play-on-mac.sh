#!/usr/bin/env bash
# Always launch the game on the Mac (play host).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
git pull --ff-only || true
echo "Serving Philosopher's Stone at http://localhost:4174"
npm start
