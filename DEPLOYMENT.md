Deployment notes for Spider Facilities
=======================================

This fork of PatrolTech has not been customized yet — these are the
infra pieces needed to get `backend` + `dashboard` + `app` running as
containers, either locally for a test drive or on a real host later.

## Rebranding done so far

`app` and `dashboard` shipped under the upstream project's own name —
its open-source product is coincidentally also called "Spider," which
is not related to Spider Facilities. Replaced throughout both
frontends and the backend's account/password-recovery emails:

- Page titles, meta/OG tags, theme-color (now the site's `--accent`
  blue `#1d4ed8`) in both `index.html` files
- On-screen brand text ("Spider" → "Spider Facilities") in the login
  page, toolbar, dashboard sidebar, and the dashboard's public
  marketing shell
- The generic PatrolTech icon swapped for the real logo
  (`assets/icon-512.png` from the marketing site, copied in as
  `spider-facilities-icon.png`)
- `app/src/index.html` also had its favicon/manifest/OG-image
  **hardcoded to `app.patroltech.online`** — a real bug independent of
  branding, since those would have tried to load from the original
  author's domain in production. Now relative paths.
- Backend emails (`new-account`/`recover-password`, html+txt) no
  longer say "PatrolTech," no longer link to `dashboard.patroltech.com`,
  and no longer hotlink their logo from the original author's server.
  The "from" name/address and the dashboard link are now env-driven
  (`MAIL_FROM_NAME`, `MAIL_FROM_ADDRESS`, `APP_URL` — see
  `.env.example`) instead of hardcoded, so changing them later doesn't
  need another code edit. Also fixed `parseContent()` in
  `emailService.ts`, which only replaced a template token's *first*
  occurrence — a problem now that `{{appUrl}}` appears twice in some
  templates.
- Set `robots: noindex, nofollow` on both apps — this is a login
  portal, not something that should show up in search results.

Rebuilt and re-verified end-to-end after these changes (register →
JWT → protected route, dashboard/app serving, correct titles) — see
below.

**Not done yet, and out of scope for a text/asset-reference pass:**
a full favicon set (favicon.ico, apple-touch-icon, android-chrome-*)
still shows the generic PatrolTech icon — regenerating those from the
real logo needs an image pipeline, not just file references. Angular
Material's theme palette (buttons, accents throughout the app) also
still uses PatrolTech's default teal/blue, not Spider Facilities'
`#1d4ed8` — deeper styling work than this pass covered.

## What was added

- `backend/Dockerfile`, `dashboard/Dockerfile`, `app/Dockerfile`,
  `.dockerignore` for each — none of this existed before; the repo
  only shipped a compose file for the MariaDB dependency
  (`backend/etc/docker/docker-compose.yaml`), not for the app itself.
- `dashboard/nginx.conf`, `app/nginx.conf` — SPA fallback routing;
  `app`'s also exempts the Angular service worker files from caching.
- Root `docker-compose.yml` — wires mariadb + backend + dashboard + app
  together. Supersedes the DB-only compose file under `backend/etc/docker/`
  for a full local run.
- `.env.example` — copy to `.env`, fill in real values. `JWT_SECRET`
  in the existing `backend/.env` is the literal string `"secret"` —
  replace it (`openssl rand -hex 32`) before this touches anything
  beyond your own machine.

## Running it locally

```
cp .env.example .env    # then edit .env with real values
docker compose build
docker compose up -d
```

First boot only — the schema doesn't create itself:

```
docker compose exec backend npx sequelize-cli db:migrate --env development
```

(`--env development` is not a typo: `backend/config/config.json`'s
`production` block is a stale template from upstream — root user, no
password, `database_production` — and doesn't match this compose
setup. The app's actual DB connection at runtime reads `DB_*` from
`.env` directly (`backend/src/db.ts`), so this only affects which
config block the migration CLI reads. Worth fixing upstream at some
point, not blocking today.)

Once up: backend on `:3000`, dashboard on `:8081`, officer app on `:8082`.

## Still open before this can go live publicly

1. **AGPLv3.** Hosting this for your agency staff/clients to log into
   over the network — even unmodified — means offering them the
   source of the exact running version (typically a visible "Source"
   link in the footer). I haven't added a placeholder link because
   there's nothing to point it at yet (no public fork/repo exists) —
   this needs your call on comply-vs-commercial-license before it's
   wired up.
2. **Real hosting.** This is containerized but not deployed anywhere.
   Needs a host (VPS/cloud), a domain/subdomain pointed at it (e.g.
   `portal.spiderfacilities.co.uk` for the dashboard), and TLS
   (Caddy or nginx-proxy + Let's Encrypt in front of the containers
   is the common pattern) — none of which I can provision without
   your credentials.
3. **CI is not usable as-is.** `.github/workflows/deploy-dashboard.yml`
   and all three `Makefile`s deploy over SSH to the original author's
   own servers (`srv07.ingenierosweb.co`, `patroltech.online`). Left
   untouched rather than guessing at replacement values — needs your
   actual server details before it points anywhere useful.
4. **SMTP.** Password-recovery email needs real `SMTP_*` (or AWS SES)
   creds in `.env` — currently blank.
