# ⛳ Golf Fantasy Pool

A live fantasy golf pool tracker for tournament weekends. Pulls real-time scores from ESPN, runs Monte Carlo simulations for win probabilities, and tracks five scoring categories across your group.

**Live features:**
- ESPN leaderboard data with 2-minute auto-refresh
- Monte Carlo simulation (2,000 iterations) generating per-category win odds
- Five scoring categories: Champion (20%), Best 4 Score (30%), Best 8 Thru 2 Rounds (20%), Most Cuts Made (20%), Match Play Wins (10%)
- Expandable player cards with individual golfer breakdowns
- Excel upload for importing draft picks from a spreadsheet
- Works on desktop and mobile

---

## Quick Start (GitHub Pages)

### 1. Create the repo

Go to [github.com/new](https://github.com/new) and create a new repository:
- **Name:** `golf-pool` (or whatever you like)
- **Public** (required for free GitHub Pages)
- Skip the "initialize with README" checkbox — we'll push our own files

### 2. Push the code

Open a terminal and run:

```bash
cd golf-pool
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/wtbourne90/golf-pool.git
git push -u origin main
```

Replace `wtbourne90` with your GitHub username.

### 3. Enable GitHub Pages

1. Go to your repo on GitHub → **Settings** → **Pages** (left sidebar)
2. Under **Source**, select **Deploy from a branch**
3. Set branch to **main** and folder to **/ (root)**
4. Click **Save**
5. Wait ~60 seconds, then your site is live at:

```
https://wtbourne90.github.io/golf-pool/
```

That's it. Share that URL with the group.

---

## Before Each Tournament

### Option A: Upload from Excel

1. Open the app in your browser
2. On the setup screen, click the upload zone or drag your `.xlsx` file
3. The parser auto-detects player names and golfer picks from your snake-draft spreadsheet
4. Review, adjust the pot amount, and hit **Start Pool**

### Option B: Enter picks manually

1. Type player names and golfer picks directly into the setup form
2. Golfer names should match ESPN's display format (e.g., "Scottie Scheffler", not just "Scheffler") for best matching — though fuzzy matching handles most cases

### Option C: Edit the code directly

If you want to hardcode picks for a specific tournament, edit `index.html` and update the default player names in the `renderSetup` function, then push:

```bash
git add index.html
git commit -m "Update picks for The Masters 2026"
git push
```

GitHub Pages will redeploy in ~60 seconds.

---

## During the Tournament

**No action needed.** Once the page is loaded:

- Scores auto-refresh every 2 minutes from ESPN's live API
- Monte Carlo odds recalculate on each refresh
- Everyone just keeps the page open in their browser
- Manual refresh button available anytime

The app stores your tournament configuration in localStorage, so it persists across browser sessions. No data is sent to any server — everything runs in the browser.

---

## Updating the App

To push code changes (bug fixes, new features, style tweaks):

```bash
# Make your changes to index.html
git add index.html
git commit -m "Description of change"
git push
```

Live in ~60 seconds. No build step, no dependencies to install.

---

## Scoring Categories

| Category | Weight | Description |
|---|---|---|
| Champion | 20% | Pool player whose golfer wins the tournament |
| Best 4 Score | 30% | Lowest combined 4-round total from your best 4 golfers |
| Best 8 Thru 2 | 20% | Lowest combined R1+R2 score from your best 8 golfers |
| Most Cuts Made | 20% | Most golfers making the weekend |
| Match Play Wins | 10% | Each draft slot is a match — all Pick #1 golfers compete, all Pick #2s, etc. Lowest total score wins 1 pt (ties split ½). Most points wins; ties split pot. |

All categories are **winner-take-all** — no prize splitting.

---

## Spreadsheet Format

The Excel upload parser expects a snake-draft format like this:

| Name | Pick | Player |
|---|---|---|
| Judy | 1 | McIlroy |
| Tucker | 2 | Scheffler |
| Jay | 3 | Rahm |
| ... | ... | ... |
| Chuck | 8 | Zalatoris |
| *(blank row)* | | |
| Chuck | 9 | Spieth |
| Graham | 10 | Lowry |
| ... | ... | ... |

The parser looks for columns labeled **"Name"** and **"Player"** in the first ~20 rows. It also auto-detects entry fee if present and calculates the pot.

If your spreadsheet uses different column headers, just make sure one column has participant names and another has golfer names — the parser has fallback detection for common layouts.

---

## Alternate Deployment Options

Already on Git, so switching is easy:

- **Netlify**: Drag the `golf-pool/` folder into [app.netlify.com/drop](https://app.netlify.com/drop), or connect the GitHub repo
- **Cloudflare Pages**: Connect the GitHub repo at [dash.cloudflare.com](https://dash.cloudflare.com) → Pages
- **Vercel**: `npx vercel` from the project folder, or connect the repo at [vercel.com](https://vercel.com)

---

## Tech Stack

- **Zero dependencies** — single `index.html` file, no build step
- **SheetJS** (via CDN) — Excel file parsing in the browser
- **ESPN public golf API** — live leaderboard data
- **localStorage** — tournament config persistence
- **Box-Muller transform** — normal distribution for Monte Carlo round simulation (mean +0.8, std 3.2 relative to par)
