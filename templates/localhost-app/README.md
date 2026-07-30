# QuizAI — runnable app

Static site. No build step, no npm install, no bundler. React, Babel, GSAP and Font Awesome load from CDN, so you need an internet connection the first time.

These two pages hold no duplicated source — they load the real design system (`styles.css`, `tokens/`, `_ds_bundle.js`) and the real screen sources (`templates/quizai-landing/Landing.jsx`, `templates/quizai-wireframes/Wireframes.jsx`) straight from the project. Edit those and reload; nothing needs re-copying.

## Run it on localhost

Serve **from the project root**, not from this folder — the pages reference the project's stylesheet and bundle via relative paths.

```bash
# from the repository root
python3 -m http.server 5173
```

Then open:

- **http://localhost:5173/templates/localhost-app/** — landing → sign in → dashboard, summaries, tasks, quizzes, profile
- **http://localhost:5173/templates/localhost-app/wireframes.html** — low-fidelity wireframes, all seven screens

Node alternative: `npx serve -l 5173` from the same directory.

It must be served over HTTP — opening the files with a `file://` path will fail, because browsers block the JSX fetches.

Sign-in is a mock: any email and password gets you into the dashboard.

## Deploying

`vercel.json` at the repository root rewrites `/` to `ui_kits/quizai-app/index.html`. Point it here instead if you want the full app at the domain root:

```json
{ "rewrites": [{ "source": "/", "destination": "/templates/localhost-app/index.html" }] }
```

## Push to GitHub

Run this from the repository root, not from this folder:

```bash
git add .
git commit -m "QuizAI app"
git push
```

First time only, if the remote isn't set yet:

```bash
git init
git branch -M main
git remote add origin git@github.com:lakshmant006-code/QuizAI.git
git push -u origin main
```

Use `https://github.com/lakshmant006-code/QuizAI.git` as the remote instead if you authenticate over HTTPS.

## Known limits

- **Nothing persists.** Uploaded PDFs, completed tasks, and quiz answers live in React state and reset on reload.
- **PDF upload is simulated.** The drop zone derives a title from the filename; there's no PDF text extraction and no AI call.
- **Quiz questions come from a fixed bank** in `templates/quizai-landing/Landing.jsx` (`MCQ_BANK`, `TF_BANK`, `SA_BANK`), not from a model.

## Making it real

Three things to replace, in rough order of effort:

1. **Persistence** — swap the `React.useState` calls in `QuizAiLanding` for a store backed by `localStorage` (fastest) or an API.
2. **PDF parsing** — add `pdf.js` to extract text on drop, then send it to your model.
3. **Question generation** — replace `buildQuestions()` with a call to your LLM endpoint, keeping the same return shape (`{kind, q, opts, correct}` / `{kind:'sa', q, answer}`) so the UI needs no changes.
