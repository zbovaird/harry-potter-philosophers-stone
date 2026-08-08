#!/usr/bin/env bash
# Mac play host — pull latest full-assets branch and serve locally.
set -euo pipefail
HP="${HP_GAME_DIR:-$HOME/Projects/harry-potter-philosophers-stone}"
[[ -d "$HP" ]] || HP="/Users/zbovaird/Projects/harry-potter-philosophers-stone"
cd "$HP"
git fetch origin
git checkout cursor/full-assets-vfx-ccff 2>/dev/null || git checkout main && git pull origin main
git pull origin cursor/full-assets-vfx-ccff 2>/dev/null || true
command -v lsof >/dev/null && lsof -ti:4174 | xargs kill -9 2>/dev/null || true
nohup npm start > /tmp/hp-game-4174.log 2>&1 &
sleep 2
open "http://localhost:4174"
echo "Game ready at http://localhost:4174"
