#!/usr/bin/env bash
#
# set-api-url.sh — write NEXT_PUBLIC_API_URL into every app's .env.local
#
# Usage:
#   ./scripts/set-api-url.sh http://192.168.1.42:8000/HoloraPerformance
#   ./scripts/set-api-url.sh                # interactive: auto-detects LAN IP, prompts
#
# Run this on the machine that will RUN the web apps. The URL must be the
# Django backend's address reachable FROM this machine — use the backend
# host's LAN IP (not "localhost") when the backend is on a different computer.
#
set -euo pipefail

# Resolve repo root (this script lives in <repo>/scripts/).
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APPS=(admin trainer trainer-apply event-apply)

# Best-effort LAN IP detection (macOS en0/en1, then Linux).
detect_ip() {
  local ip=""
  if command -v ipconfig >/dev/null 2>&1; then
    ip="$(ipconfig getifaddr en0 2>/dev/null || true)"
    [ -z "$ip" ] && ip="$(ipconfig getifaddr en1 2>/dev/null || true)"
  fi
  if [ -z "$ip" ] && command -v hostname >/dev/null 2>&1; then
    ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
  fi
  echo "$ip"
}

API_URL="${1:-}"

if [ -z "$API_URL" ]; then
  guess_ip="$(detect_ip)"
  default_url="http://${guess_ip:-localhost}:8000/HoloraPerformance"
  echo "No URL given. Detected LAN IP: ${guess_ip:-<none>}"
  read -r -p "Backend base URL [${default_url}]: " API_URL
  API_URL="${API_URL:-$default_url}"
fi

# Sanity: must look like http(s)://host[:port]/HoloraPerformance
case "$API_URL" in
  http://*|https://*) ;;
  *) echo "ERROR: URL must start with http:// or https:// (got: $API_URL)"; exit 1 ;;
esac
case "$API_URL" in
  *"localhost"*|*"127.0.0.1"*)
    echo "WARNING: URL uses localhost/127.0.0.1 — only correct if the backend runs on THIS machine."
    echo "         For a backend on another computer, use its LAN IP instead." ;;
esac

echo
echo "Writing NEXT_PUBLIC_API_URL=$API_URL to:"
for app in "${APPS[@]}"; do
  dir="$ROOT/apps/$app"
  if [ ! -d "$dir" ]; then
    echo "  - apps/$app  (SKIP: not found)"
    continue
  fi
  printf 'NEXT_PUBLIC_API_URL=%s\n' "$API_URL" > "$dir/.env.local"
  echo "  - apps/$app/.env.local"
done

echo
echo "Done. Restart any running dev servers so they pick up the new value:"
echo "  pnpm dev:admin | pnpm dev:trainer | pnpm dev:trainer-apply | pnpm dev:event-apply"
echo "(NEXT_PUBLIC_* is inlined at build time — for production, rebuild after changing this.)"
