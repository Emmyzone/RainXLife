# RainXLife

**Ideas from books. Lessons for life.**

A full-stack book-summary and personal-growth publication: a clean, editorial-style public website plus an admin dashboard for publishing new summaries without touching any code.

---

## What's included

- **Public website:** homepage, category pages, search, individual book/article pages, About/Contact/Privacy/Terms/Disclaimer/Affiliate Disclosure pages, sitemap.xml, robots.txt.
- **Admin dashboard:** secure login, create/edit/delete articles, draft vs published status, featured toggle, category management, cover image upload, basic stats.
- **Database:** SQLite (file-based — no separate database server to manage), via `better-sqlite3`.
- **Tech stack:** Node.js, Express, EJS templates (server-rendered, so pages are fast and SEO-friendly), SQLite. No build step, no frontend framework — deliberately simple since you're learning and may work from a phone.

## What's NOT included in this first version

Being upfront about this, as requested:

- **Newsletter / email capture** — the architecture leaves room for it (see `SITE ARCHITECTURE` below) but there's no email service wired up yet.
- **Scheduled publishing** (publish automatically at a future date/time) — you can set a `publication_date`, but an article only appears on the site once its status is switched to "Published." Manual publishing was prioritized for reliability, as the brief allowed.
- **User accounts, comments, ratings** — intentionally left for a future version.
- **Google AdSense ads** — placeholder ad slots exist in the article template, but no live ad code, since your site needs to be built and approved first. See `ADDING GOOGLE ADSENSE LATER` below.
- **EEA/UK cookie-consent banner** — not built, since it's only needed once AdSense (or another ad network) is actually live. The Privacy Policy page explains this will be added at that point.

---

## Project structure

```
rainxlife/
├── server.js                  # App entry point
├── package.json
├── .env.example                # Copy to .env for local dev
├── render.yaml                 # Render deployment config
├── src/
│   ├── db/
│   │   ├── db.js               # SQLite connection + schema (auto-creates tables)
│   │   └── queries.js          # All database read/write functions
│   ├── middleware/
│   │   ├── auth.js             # Protects /admin routes
│   │   └── upload.js           # Handles cover image uploads
│   ├── routes/
│   │   ├── public.js           # Homepage, articles, categories, search, sitemap
│   │   └── admin.js            # Login, dashboard, article/category CRUD
│   ├── scripts/
│   │   ├── create-admin.js     # Run once to create your admin login
│   │   └── seed.js             # Optional: adds one sample article
│   ├── utils/
│   │   ├── slugify.js
│   │   └── readingTime.js
│   ├── views/                  # EJS templates (public site + /views/admin)
│   └── public/                 # CSS, JS, and uploaded images (served directly)
└── data/                       # Created automatically — holds the SQLite database
```

---

## 1. Install dependencies

You'll need [Node.js](https://nodejs.org) 18 or newer installed.

```bash
cd rainxlife
npm install
```

## 2. Run it locally

```bash
cp .env.example .env
```

Open `.env` and fill in at least `SESSION_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.

Then create your admin account (only needs to be run once, or again later to reset your password):

```bash
npm run create-admin
```

(Optional) Add one sample article so the homepage isn't empty:

```bash
npm run seed
```

Start the server:

```bash
npm start
```

Visit **http://localhost:3000** for the public site, and **http://localhost:3000/admin/login** to log in to the dashboard.

## 3. Configure environment variables

All variables live in `.env` locally, or in Render's "Environment" tab in production. Full list in `.env.example`:

| Variable | Purpose |
|---|---|
| `PORT` | Port the server runs on (Render sets this for you) |
| `SESSION_SECRET` | Random string used to sign login sessions — keep it secret |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Used only when you run `npm run create-admin` |
| `SITE_URL` | Your site's public URL (used in SEO tags and the sitemap) |
| `SITE_NAME` | Displayed around the site — defaults to RainXLife |
| `TIKTOK_URL` / `YOUTUBE_URL` | Shown in the footer and article pages |
| `ADSENSE_CLIENT_ID` / `ADSENSE_ENABLED` | See the AdSense section below |
| `DATABASE_PATH` | Where the SQLite file lives — defaults to `./data/rainxlife.db` |

**No secrets are hard-coded anywhere in the code.** The admin password is never stored in plain text — `create-admin.js` hashes it with bcrypt before saving it to the database, and only the hash is stored.

## 4. Database

Nothing to install — SQLite is just a file (`data/rainxlife.db`), created automatically the first time the server runs. The schema (articles, categories, admins tables) is created automatically by `src/db/db.js`.

The six default categories (Personal Development, Money & Wealth, Psychology, Business, Productivity, Life) are created automatically the first time you run the app. You can add, rename, or remove categories anytime from **Admin → Categories**.

## 5. Create the admin account

Already covered in step 2 — run `npm run create-admin` after setting `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your environment. Run it again anytime to reset your password (it updates the existing account instead of creating a duplicate).

## 6. Publish your first article

1. Go to `/admin/login` and log in.
2. Click **+ New Article**.
3. Fill in the book title, author, category, and content sections (Introduction, What This Book Is About, Key Lessons, Takeaway, etc.).
4. Optionally upload a cover image, or paste an image URL.
5. Set **Status** to "Published" (or leave as "Draft" to save it for later).
6. Click **Create Article** — it will immediately appear on the homepage and its category page if published.

The URL slug is generated from the title automatically, or you can set your own (e.g. `atomic-habits-summary` → `/books/atomic-habits-summary`).

---

## 7. Deploy to GitHub

```bash
cd rainxlife
git init
git add .
git commit -m "Initial commit — RainXLife"
```

Create a new empty repository on GitHub, then:

```bash
git remote add origin https://github.com/YOUR-USERNAME/rainxlife.git
git branch -M main
git push -u origin main
```

`.env` and the `data/` folder are excluded via `.gitignore` — your secrets and local database never get pushed.

## 8. Deploy to Render

1. Go to [render.com](https://render.com) and create a new **Web Service**, connected to your GitHub repo.
2. Render should detect `render.yaml` automatically and pre-fill most settings. If not, set them manually:
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Environment:** Node
3. Add a **persistent disk** (Render dashboard → your service → Disks) mounted at `/opt/render/project/src/data` — this keeps your SQLite database and uploaded images across deploys and restarts. Without this, your data would reset every time you redeploy. (`render.yaml` already requests this disk, sized at 1GB — Render's free tier includes it.)
4. In the **Environment** tab, add the variables listed in the table above (`SESSION_SECRET` can be auto-generated by Render; set `SITE_URL` to your Render URL once you have it, e.g. `https://rainxlife.onrender.com`).
5. Deploy. Once it's live, open a **Shell** from your Render service dashboard and run:
   ```bash
   npm run create-admin
   ```
   This creates your admin login directly on the live database.
6. Log in at `https://your-site.onrender.com/admin/login` and publish your first article.

## 9. Connect a custom domain later

In Render: your service → **Settings** → **Custom Domains** → add your domain and follow Render's DNS instructions (usually a CNAME or A record with your domain registrar). Once connected, update `SITE_URL` in your environment variables to match your real domain, so SEO tags and the sitemap point to the right place.

## 10. Adding Google AdSense later

1. Apply for AdSense once your site has real content and is live at its real domain.
2. Once approved, set two environment variables on Render: `ADSENSE_ENABLED=true` and `ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX` (your publisher ID).
3. That's it for the site-wide script — it's already wired into every page's `<head>` behind that flag.
4. The article page template (`src/views/article.ejs`) has two empty `.ad-slot` placeholder `<div>`s — one mid-article, one after the article — with comments marking exactly where to paste your AdSense ad unit `<ins>` code. Sidebar/other placements can be added the same way.
5. AdSense will need to re-crawl your site's `ads.txt` — you can add a static `ads.txt` file to `src/public/` once Google gives you the exact line to include.

---

## Content & originality guardrails

The article form is structured (Introduction / What the Book Is About / Key Lessons / Takeaway / Who Should Read This) specifically to encourage original explanation rather than copying text from the book. There's no bulk-import or "paste whole book" feature — you write each field yourself. Every article page automatically displays a note crediting the original book and author, and stating that it's an original interpretation, not a reproduction.

## Security notes

- Admin routes (`/admin/*` except `/admin/login`) are protected by session-based authentication — no session, no access.
- Passwords are hashed with bcrypt; plain-text passwords are never stored.
- Session cookies are `httpOnly`, and marked `secure` automatically in production (`NODE_ENV=production`, which Render sets).
- No API keys or secrets are hard-coded in the source — everything sensitive comes from environment variables, and `.env` is git-ignored.

## Known limitations (so nothing surprises you)

- SQLite works well for a single-server deployment like this, but isn't meant for multiple server instances writing at once — fine for Render's free/single-instance tier and most solo-publisher use cases.
- Image uploads are stored on disk (`src/public/uploads/`), so the Render persistent disk (step 8.3 above) is required for them to survive redeploys.
- There is no rich-text (WYSIWYG) editor in the admin form — content fields are plain text areas. Basic HTML you type is sanitized and allowed if you want bold/italic/links, but there's no visual toolbar in this version.
