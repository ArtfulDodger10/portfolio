---
name: case-file-entry
description: Add a new project/case to the Grimoire portfolio or update one (status brewing → published, new links, new detections, new cert). Use for "add the KryBit post", "the APK case is published", "add this repo to the portfolio", "update my CV link".
---

# Adding or updating a case file

1. Read the source of truth first: the published blog post (`../artfuldodger10.github.io/_posts/`) and the repo README.
   Do **not** pull claims from lab case folders, chats or drafts — only what is published.
2. Edit `src/content/site.ts` only (the CV PDF in `public/` is the other source the analyst may update):
   - `caseFiles` entry: `id`, `title`, `codename` (a short wizarding name, original, 2–4 words),
     `status`, `date` (Mon YYYY), `chain` (3–5 stages), `summary` (≤ 2 sentences), `outcomes` (2–3),
     `tools`, `links` (empty `href` while sealed), optional one-line `note`.
   - Order: newest and strongest first; brewing items sit just after the flagship.
   - Published post → add to `prophet.editions` (newest first) and remove it from `prophet.upcoming`.
   - Detections → `charms.rules`; certifications/training → `owls`; CV link → `links.resume`.
3. Hygiene: no phone, no lab paths/VM names/hwids, no victim data; domains and IPs never appear in the site
   (the Map shows stages). If a claim was [INF] in the case, don't present it as fact.
4. Keep the rest of the presence in sync (same session):
   - Chirpy `_tabs/portfolio.md` in `../artfuldodger10.github.io` (served at `/projects/`; `/portfolio/` is this repo)
   - profile README case-files table in `../ArtfulDodger10/README.md`
   The analyst commits from VS Code; new files stay unstaged unless they press `+` — remind them to check.
5. `npm run build`, look at the card in the browser pane (expand "Revelio"), check links open.
