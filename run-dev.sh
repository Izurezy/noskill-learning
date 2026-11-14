#!/usr/bin/env bash

# Starts the study frontend, game event API, and Phaser game for local development.
set -euo pipefail

project_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
game_dir="$project_root/Game-server"
frontend_dir="$project_root/frontend"

if [[ ! -x "$game_dir/node_modules/.bin/vite" ]]; then
    echo "Missing game dependencies. Run: cd Game-server && npm install" >&2
    exit 1
fi

if [[ -x "$frontend_dir/.venv/bin/python" ]]; then
    python_bin="$frontend_dir/.venv/bin/python"
else
    python_bin="python3"
fi

api_pid=""
game_pid=""
frontend_pid=""

cleanup() {
    trap - EXIT INT TERM
    for pid in "$api_pid" "$game_pid" "$frontend_pid"; do
        if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null || true
        fi
    done
    wait 2>/dev/null || true
}

trap cleanup EXIT INT TERM

(cd "$game_dir" && exec node server.mjs) &
api_pid=$!

(cd "$game_dir" && exec ./node_modules/.bin/vite --config vite/config.dev.mjs) &
game_pid=$!

(cd "$frontend_dir" && exec "$python_bin" app.py) &
frontend_pid=$!

echo "Study frontend: http://127.0.0.1:5000"
echo "Phaser game:    http://localhost:8080"
echo "Game API:       http://localhost:3001"
echo "Press Ctrl+C to stop all services."

wait
