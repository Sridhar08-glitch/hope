# Running the Holora Web apps on another laptop (same LAN)

Run all four Next.js apps on a **second laptop** while the **Django backend keeps running on your main machine** (or any one host on the same Wi-Fi/LAN).

| App | Port | URL on the laptop running it |
|-----|------|------------------------------|
| admin | 3000 | http://localhost:3000 |
| trainer | 3001 | http://localhost:3001 |
| trainer-apply | 3002 | http://localhost:3002 |
| event-apply | 3003 | http://localhost:3003 |

The whole thing hinges on **one setting**: `NEXT_PUBLIC_API_URL`, the backend base URL. The apps are pure JavaScript (no native builds); the trainer WebSocket URL is derived from that same setting automatically.

### How it works (why `localhost` won't do)
The **browser on the second laptop** makes the API calls. `localhost` there points at the second laptop, not your backend — so you must use the **backend host's LAN IP** (e.g. `http://192.168.1.42:8000/HoloraPerformance`). You still open the apps at `http://localhost:300x` on the second laptop; that means the browser's `Origin` is `http://localhost:300x`, which is what the backend's CORS must allow.

---

## A. On the backend host (your main machine)

The backend is env-driven — no code edits, just start it with the right env and open the port.

1. **Find your LAN IP**
   ```bash
   ipconfig getifaddr en0        # macOS Wi-Fi (try en1 if empty)
   # or:  ifconfig | grep "inet "
   ```
   Say it's `192.168.1.42`.

2. **Start Django bound to all interfaces** (Daphne already does `-b 0.0.0.0 -p 8000`) with:
   ```bash
   export ALLOWED_HOSTS="localhost,127.0.0.1,192.168.1.42"
   export CORS_ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003"
   # then start the backend as usual (daphne / run_daphne.py / manage.py runserver 0.0.0.0:8000)
   ```
   > `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` are read from env in `Hope/settings.py`. `CORS_ALLOW_ALL_ORIGINS` is `False`, so the origins above must be listed. If you'll also open the apps from another device's browser using this host's IP, add `http://192.168.1.42:3000` (etc.) to `CORS_ALLOWED_ORIGINS` too.

3. **Allow inbound TCP 8000** through the host firewall (macOS: System Settings → Network → Firewall, or disable temporarily for testing on a trusted network).

4. **Sanity check from the second laptop:**
   ```bash
   curl -i http://192.168.1.42:8000/HoloraPerformance/trainer/trainer/my-notifications/unread-count/
   # 401 Unauthorized = reachable (good). Connection refused/timeout = firewall/binding/IP issue.
   ```

---

## B. On the second laptop (runs the apps)

1. **Install toolchain** — Node 20 and pnpm 9.15.4:
   ```bash
   corepack enable          # honors the repo's packageManager: pnpm@9.15.4
   # or: npm i -g pnpm@9.15.4
   node -v                  # should be v20.x
   ```

2. **Get the repo and install** (from repo root):
   ```bash
   pnpm install             # installs the per-platform Tailwind v4 binary — do NOT copy node_modules across machines
   ```

3. **Point the apps at the backend** — one command writes `.env.local` into all four apps:
   ```bash
   ./scripts/set-api-url.sh http://192.168.1.42:8000/HoloraPerformance
   # or run it with no args to auto-detect and prompt
   ```
   (Or copy each `apps/*/.env.example` to `apps/*/.env.local` and edit by hand.)

4. **Run the apps** — each in its own terminal:
   ```bash
   pnpm dev:admin           # http://localhost:3000
   pnpm dev:trainer         # http://localhost:3001
   pnpm dev:trainer-apply   # http://localhost:3002
   pnpm dev:event-apply     # http://localhost:3003
   ```

---

## Verify (end-to-end)

1. Open **http://localhost:3001** (trainer) on the second laptop and log in.
2. In the browser **Network** tab, confirm requests go to `http://192.168.1.42:8000/HoloraPerformance/...` and return **200** — not CORS-blocked, not `ERR_CONNECTION_REFUSED`.
3. Trainer app: Network → **WS** should show a socket to `ws://192.168.1.42:8000/ws/?token=…`.
4. Load **http://localhost:3000** (admin) and log in similarly.
5. **http://localhost:3002 / :3003** (apply forms) will load and show "open from the Holora app" unless opened with a `?token=<JWT>` — that's expected (see gotchas).

---

## Gotchas

- **Restart dev after changing the URL.** `NEXT_PUBLIC_*` is read at startup; a running `next dev` won't pick up a new `.env.local` until restarted. For **production builds** it's inlined — rebuild after changing it.
- **Apply apps require the var.** `trainer-apply` and `event-apply` have no `localhost` fallback and hard-fail if `NEXT_PUBLIC_API_URL` is unset. They're normally launched from the Flutter app with a `?token=<JWT>`.
- **CORS error?** Copy the exact `Origin` the browser console prints into the backend `CORS_ALLOWED_ORIGINS`, then restart Django.
- **"inferred workspace root" warning** on build/dev is harmless — caused by a stray `~/package-lock.json` in a parent directory. Remove it or ignore.
- **Legacy `application/` (CRA)** is not part of the pnpm workspace — ignore it for this setup.
- **Production serving:** `next start` defaults every app to port 3000 — pass `-p <port>` per app if serving production builds instead of `dev`.

---

## Not covered here
Public hosting / HTTPS, reverse proxy, and Docker are out of scope — this is LAN dev-server access. Ask if you want a cloud deploy or a Docker Compose bundling frontend + backend.
