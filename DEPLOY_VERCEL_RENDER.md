# Deploying Genies Vote: Vercel (PWA) + Render (API and database)

## How the product works

0. **Organisers sign up** on `/signup`. The super administrator approves or refuses each request (menu **Inscriptions**)
   before the person can sign in; the applicant is notified by e-mail. Sign-ups can be closed with one switch.
1. The **administrator** signs in, creates a vote (a question and a list of candidates) and opens it.
2. They share **one link with the audience**. Each person sends a request to take part (name and e-mail address, no
   account); the administrator approves it on the vote page, and the person's screen then continues **by itself** to the
   ballot. Each person votes once. (Optional: with an e-mail service configured, a vote can instead use a 6-digit code
   sent by e-mail, with no approval needed.)
3. Each **candidate** gets **a private link** showing only their own live percentage.
4. The administrator follows everything live; the audience sees the results when the vote is closed.

The ballot is secret: it stores only the chosen candidate, with no date and no link to the voter. The voter list only
records that someone has voted, to prevent a second vote.

## Architecture

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
3. Wait for the first deploy (the build runs `npm install --include=dev`: Render sets `NODE_ENV=production`, which would otherwise skip
   the `prisma` and `typescript` packages the build needs). Check `https://<your-api>.onrender.com/health` returns `{"status":"OK",...}`.
   The start command runs `prisma migrate deploy`, so the tables are created automatically.
4. Note the API address, for example `https://genies-vote-api.onrender.com`.

> **Free plans are for trying it out.** The free web service sleeps after inactivity (the first request takes about
> a minute) and the free database **expires after 30 days**. Use paid plans for real elections.

## 2. (Optional) Send e-mails

**You can skip this section.** By default no e-mail is needed: the administrator approves each person, and organiser
sign-ups are approved on the **Inscriptions** page (the applicant simply signs in again later).

If you want codes sent by e-mail (a vote can then be created with the "Code envoyé par e-mail" option), add these in
Render → `genies-vote-api` → **Environment**. Render's free plans block SMTP, so use an HTTP e-mail API such as Brevo
(free up to 300 e-mails a day; validate a sender address and create an API key in your Brevo account):

- `EMAIL_PROVIDER` = `brevo` (or `smtp` on a paid Render plan, with `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`)
- `BREVO_API_KEY` = your key
- `EMAIL_FROM` = the validated sender address
- `PUBLIC_APP_URL` = your site address, so the e-mails contain the right links

Without these settings the "e-mail code" option is simply hidden in the vote form.

## 3. Create the first administrator (no demo data)

Only the **first** account is created this way. Every other organiser requests access on the site and is approved from
the **Inscriptions** page.

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

## 4. Deploy the website on Vercel

1. Edit `vercel.json`: replace `https://REMPLACEZ-PAR-VOTRE-API.onrender.com` with your Render API address, commit and
   push.
2. On <https://vercel.com>: **Add New → Project**, import the repository. Leave the **Root Directory** empty (the repo
   root); `vercel.json` already sets the install command, build command and output folder.
3. **Do not set `VITE_API_URL`.** The site must call `/api` on its own address; the Content-Security-Policy in
   `vercel.json` only allows that.
4. Deploy. Then put the final Vercel address in Render's `CORS_ORIGIN` (if you used a placeholder).

## 5. Check it works

- Open the site, sign in with the administrator you created, and create a vote: question, candidates, then **Open**.
- Open the audience link in a private window and send a request to take part. On the vote page, approve it: the private
  window should move on to the ballot by itself within a few seconds.
- Open a candidate's private link: it shows only that candidate's live percentage.
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
