# Deploying Genies Vote: Vercel (PWA) + Render (API and database)

The website is a static React app installable as a PWA, hosted on **Vercel**. The Express API and PostgreSQL run on
**Render**. Vercel forwards `/api/*` to Render (see `vercel.json`), so the browser only ever talks to one address:
no CORS, and the session cookie stays first-party.

```
Browser ──► Vercel (PWA files) ──/api/*──► Render (Express + PostgreSQL)
```

## 1. Deploy the API and database on Render

1. On <https://render.com>: **New → Blueprint**, pick this repository and branch. `render.yaml` creates the web
   service (`genies-vote-api`) and the database (`genies-vote-db`) and generates the two JWT secrets.
2. When asked for `CORS_ORIGIN`, enter your future Vercel address (for example `https://genies-vote.vercel.app`).
   You can change it later in the service's Environment tab.
3. Wait for the first deploy. Check `https://<your-api>.onrender.com/health` returns `{"status":"OK",...}`.
   The start command runs `prisma migrate deploy`, so the tables are created automatically.
4. Note the API address, for example `https://genies-vote-api.onrender.com`.

> **Free plans are for trying it out.** The free web service sleeps after inactivity (the first request takes about
> a minute) and the free database **expires after 30 days**. Use paid plans for real elections.

## 2. Create the first administrator (no demo data)

Never run `npm run seed` in production: it creates demo accounts with a known password.

**From your computer** (works on every Render plan). Copy the database's *External Database URL* from the Render
dashboard, then:

```bash
npm install
npm run build --workspace=backend
DATABASE_URL='<external database url>' \
ADMIN_EMAIL='you@your-domain.fr' \
ADMIN_PASSWORD='<strong password>' \
npm run admin:create --workspace=backend
```

(On paid plans you can run the same last command in the service's **Shell** tab instead.)
The password needs 8+ characters with an uppercase letter, a lowercase letter, a digit and a symbol.

## 3. Deploy the website on Vercel

1. Edit `vercel.json`: replace `https://REMPLACEZ-PAR-VOTRE-API.onrender.com` with your Render API address, commit and
   push.
2. On <https://vercel.com>: **Add New → Project**, import the repository. Leave the **Root Directory** empty (the repo
   root); `vercel.json` already sets the install command, build command and output folder.
3. **Do not set `VITE_API_URL`.** The site must call `/api` on its own address; the Content-Security-Policy in
   `vercel.json` only allows that.
4. Deploy. Then put the final Vercel address in Render's `CORS_ORIGIN` (if you used a placeholder).

## 4. Check it works

- Open the site, sign in with the administrator you created.
- In Chrome or Edge the address bar offers **Install**; on phones use *Add to Home Screen*. The footer also shows an
  **Installer l'application** link when the browser allows it.
- Switch the phone to airplane mode and reopen the app: the screens load, a notice says you are offline, and the vote
  button is disabled until the connection returns.

## What the PWA does and does not do

- The application shell (pages, scripts, fonts, icons) is cached so the app opens offline.
- **Votes, results, accounts and every `/api` call are never cached and never queued.** A vote is only recorded when
  the server accepts it while you are online.
- New versions are announced with a banner ("Une nouvelle version est disponible"). The page is never reloaded
  without the user choosing to.

## Security notes

- Strict Content-Security-Policy, `X-Frame-Options: DENY`, no third-party requests (fonts are self-hosted).
- Login and registration are limited to 30 attempts per IP per 15 minutes; everything else to 1500. Change them with
  `AUTH_RATE_LIMIT_MAX_REQUESTS` and `RATE_LIMIT_MAX_REQUESTS`. The limiter keeps its counters in memory, which is
  correct for a single API instance.
- `TRUST_PROXY=2` is required so the limiter sees each visitor's real address.
- Keep the repository's secrets out of git: `.env` files are ignored; the JWT secrets live in Render.
