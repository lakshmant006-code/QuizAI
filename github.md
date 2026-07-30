repo: lakshmant006-code/QuizAI
branch: main

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
