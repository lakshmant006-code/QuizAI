# Push and deploy

## 1. Push to GitHub

Run from the repository root. I can't push for you — my GitHub access is read-only — so this part is yours:

```bash
git add .
git commit -m "QuizAI — bento dashboard, wireframes, design system"
git push
```

First time only, if the remote isn't set:

```bash
git init
git branch -M main
git remote add origin git@github.com:lakshmant006-code/QuizAI.git
git push -u origin main
```

Swap in `https://github.com/lakshmant006-code/QuizAI.git` if you authenticate over HTTPS.

## 2. Deploy on Vercel

The repo is a static site — no build command, no install step.

**Dashboard route:** vercel.com → Add New → Project → import `lakshmant006-code/QuizAI`, then:

| Setting | Value |
| --- | --- |
| Framework Preset | Other |
| Build Command | *(leave empty)* |
| Output Directory | *(leave empty)* |
| Install Command | *(leave empty)* |

Hit Deploy. `vercel.json` already routes the domain root to the app.

**CLI route:**

```bash
npm i -g vercel
vercel          # preview deploy
vercel --prod   # production
```

## Routes once live

| URL | Screen |
| --- | --- |
| `/` | Landing → sign in → dashboard, summaries, tasks, quizzes, profile |
| `/wireframes` | Low-fidelity wireframes, all seven screens |
| `/ui_kits/quizai-app/` | Original UI kit recreation |
| `/motion/quizai-motion.html` | Motion reel |

Sign-in is a mock — any email and password gets you in.

## Alternatives

**GitHub Pages** — Settings → Pages → Source: `main`, folder `/ (root)`. Note that Pages ignores `vercel.json`, so the app lives at `/templates/localhost-app/` rather than the root.

**Netlify** — drag the repo folder onto app.netlify.com/drop, or connect the repo with build settings left blank. Add a `_redirects` file containing `/  /templates/localhost-app/index.html  200` for root routing.

## Before you ship

- `motion/node_modules/` should not be committed — add it to `.gitignore` if it isn't already.
- Nothing persists: uploaded PDFs, task state, and quiz answers reset on reload.
- PDF upload is simulated (title derived from filename); quiz questions come from a fixed bank in `templates/quizai-landing/Landing.jsx`.
