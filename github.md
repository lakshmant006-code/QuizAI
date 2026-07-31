repo: lakshmant006-code/QuizAI
branch: main

## Pending push

These changes exist **only in this project** — they have not been committed or pushed. I have read-only GitHub access, so run the commands below from the repository root to publish them.

```bash
git add .
git commit -m "Bento dashboard, PDF-to-flashcard mark, plainer copy, deploy config"
git push
```

Changed since the last sync:

- **Dashboard rebuilt as a bento grid** (`templates/quizai-landing/Landing.jsx`) — 12-column layout split into labelled Quizzes / Summaries / Tasks bands, mixed tile sizes, filled maroon and ink accent tiles carrying the headline numbers, an animated 7-day bar chart, and a task-progress bar driven by real completion state.
- **New `PdfFlashIcon`** — a maroon PDF page fronting a stacked deck with a bolt badge; used in the upload zone (layers float while a file is read) and on uploaded flashcards in place of the subject dot.
- **Upload zone promoted** to a 4-column tile leading the Quizzes band, with a vertical layout that fills the row.
- **Copy rewritten throughout** — removed AI-boasting and instructional filler. "Turn a PDF into a flashcard / drop a file or click to browse, the title is detected automatically" → "Add a document / PDF, Word, or plain text". Landing headline → "Read it once. Remember it properly."; badge "AI-powered studying" → "Study companion"; feature headings lost their adjectives; dropped the "fire a synapse" and "study smarter, remember longer" lines.
- **Fixed a fatal load-order race** — `Landing.jsx` and `templates/quizai-app/App.jsx` destructured the design-system namespace at module-evaluation time, before `ds-base.js` had appended the bundle; the throw aborted evaluation and the page rendered nothing. Components now resolve at render time, with a `useDsReady` hook that re-renders if the bundle lands after first paint.
- **`ds-base.js` deduped** — links only `styles.css` (which `@import`s the tokens) and guards the bundle append, so repeat loads are no-ops.
- **Deploy config** — `vercel.json` now routes `/` to the full landing+app (was pointing at the old UI kit) and adds `/wireframes`; added `DEPLOY.md` and a `.gitignore` that excludes `motion/node_modules/`.

## Last sync

date: 2026-07-30T17:41:20Z

### Updated in this project

- Pulled the upstream token set — new neutral surface scale (`--surface-app`, `--surface-panel`, `--surface-chip`), a hairline system (`--hairline`, `--hairline-strong`, `--hairline-selected`), a four-step shadow scale, letter-spacing tokens, and revised radii (sm 8, lg 16, new xl 20) and display sizes (34/44px).
- Synced all component primitives to upstream: `Card` gained a `neutral` default tint with hairline borders and `--shadow-card`/`--shadow-raised` hover elevation; `StatTile`, `QuizHistoryItem`, `SummaryCard`, `Badge`, `Avatar`, `Input`, `NavBar` and `Button` follow.
- Added upstream's two new foundation cards (Elevation Scale, Neutral Surfaces & Hairlines) and the `motion/quizai-motion.html` reel, now registered in the Design System tab.
- Brought in `vercel.json` and `screenshots/figma-rebuild-reference.md`, and moved the runnable app to `templates/localhost-app/`, where it now loads the project's real stylesheet, tokens, bundle and screen sources instead of holding duplicate copies.

## Sync history

### 2026-07-30T17:42:00Z (earlier this day)

- Repository had no commits yet, so nothing could be imported. Packaged the design work as a runnable static site and recorded the association.

## Screen map

| Project screen | Repo files |
| --- | --- |
| `templates/localhost-app/index.html` (landing → app) | `templates/quizai-landing/Landing.jsx`, `styles.css`, `tokens/*.css`, `_ds_bundle.js` |
| `templates/localhost-app/wireframes.html` | `templates/quizai-wireframes/Wireframes.jsx` |
| `templates/quizai-landing/Landing.jsx` | `templates/quizai-landing/{Landing.jsx,QuizaiLanding.dc.html,ds-base.js}` |
| `templates/quizai-wireframes/Wireframes.jsx` | `templates/quizai-wireframes/{Wireframes.jsx,QuizaiWireframes.dc.html}` |
| `templates/quizai-app/App.jsx` | `templates/quizai-app/{App.jsx,QuizaiApp.dc.html,ds-base.js}` |
| `ui_kits/quizai-app/index.html` | `ui_kits/quizai-app/*` |
| `components/**` (Button, Input, Badge, Avatar, NavBar, Card, StatTile, QuizHistoryItem, SummaryCard, BrainMark) | `components/{core,cards,brand}/*` |
| `guidelines/*.card.html` | `guidelines/*.card.html` |
| `tokens/*.css`, `styles.css` | `tokens/*.css`, `styles.css` |
| `motion/quizai-motion.html` | `motion/quizai-motion.html` |

Not imported: `motion/node_modules/` (dependency tree), `motion/ref-frames/` (24 verification PNGs, ~3.5 MB), `.claude/settings.local.json`.

`commit:` is intentionally omitted — the tree endpoint returns a tree hash, not a commit sha.
