<!--
  QuizAI — Design Base
  Purpose: the single source of truth for how QuizAI looks and feels. Written in
  an XML-prompt style so it can be pasted verbatim into an AI coding/design agent
  as a base/system prompt, or read by a human as a spec. When you build or change
  UI, conform to the rules below. Values mirror app/tokens.css — if they ever
  drift, tokens.css wins and this file should be updated to match.
-->

<design_system name="QuizAI" version="1.0">

  <overview>
    QuizAI turns any PDF into quizzes, flashcards, and summaries. The UI is clean,
    academic, and confidence-building: a warm maroon-and-gold palette on calm
    neutral surfaces, generous whitespace, soft cards, and one friendly octopus
    mascot. Prefer clarity over decoration. Never invent new colors, fonts, or
    icon sets — compose from the tokens defined here.
  </overview>

  <principles>
    <principle>Token-first: every color, space, radius, shadow, and type style comes from a CSS variable in app/tokens.css. No hard-coded hex or px when a token exists.</principle>
    <principle>Calm surfaces, decisive accents: neutral grays carry the layout; maroon signals primary action and brand; gold is a sparing highlight, never a background for large areas.</principle>
    <principle>Soft, not flat: cards use subtle radii and low-spread shadows. Avoid harsh borders — use hairlines.</principle>
    <principle>Motion is a reward, not noise: animate on meaningful moments (quiz generated, correct answer). Always honor prefers-reduced-motion.</principle>
    <principle>Accessible by default: maintain contrast, provide aria labels for icon-only controls, keep hit targets >= 40px.</principle>
  </principles>

  <brand>
    <name>QuizAI</name>
    <logo>Maroon rounded square badge containing a Phosphor brain glyph, followed by the wordmark "QuizAI" in the display font, weight 700, letter-spacing -0.02em, color var(--asu-maroon).</logo>
    <mascot>A friendly octopus. Appears in the dashboard card; celebrates quiz generation with a confetti burst. Keep it playful and secondary — it supports, never dominates.</mascot>
    <voice>Encouraging, plain-spoken, student-to-student. Short sentences. No jargon, no credit/paywall anxiety. Example: "Turn a chapter into a practice test in seconds."</voice>
  </brand>

  <color_tokens>
    <brand>
      <token name="--asu-maroon" value="#8C1D40" role="primary brand / primary action" />
      <token name="--asu-maroon-dark" value="#6E1733" role="primary hover" />
      <token name="--asu-maroon-darker" value="#501025" role="primary active" />
      <token name="--asu-gold" value="#FFC627" role="highlight / celebration accent (use sparingly)" />
    </brand>
    <neutrals>
      <token name="--gray-1" value="#191919" role="primary text" />
      <token name="--gray-2" value="#484848" role="secondary text" />
      <token name="--gray-3" value="#747474" role="muted text" />
      <token name="--gray-4" value="#BFBFBF" role="default border" />
      <token name="--gray-5" value="#D0D0D0" role="input border" />
      <token name="--gray-6" value="#E8E8E8" role="subtle border / divider" />
      <token name="--gray-7" value="#FAFAFA" role="faint fill" />
      <token name="--white" value="#FFFFFF" role="surface base" />
    </neutrals>
    <surfaces>
      <token name="--surface-app" value="#F5F5F7" role="page background" />
      <token name="--surface-panel" value="#FBFBFD" role="panel / inset background" />
      <token name="--surface-maroon-tint" value="#F1E4E8" role="selected / brand-tinted fill" />
      <token name="--surface-gold-tint" value="#FFF6DF" role="badge / callout fill" />
      <token name="--hairline" value="rgba(0,0,0,0.07)" role="default hairline border" />
      <token name="--hairline-strong" value="rgba(0,0,0,0.14)" role="emphasized hairline" />
    </surfaces>
    <status>
      <token name="--success" value="#4C7A14" bg="--success-bg #EBF5DE" />
      <token name="--danger" value="#C62828" bg="--danger-bg #FBEAEA" />
    </status>
    <semantic_aliases>
      <token name="--brand-primary" maps="--asu-maroon" />
      <token name="--brand-primary-hover" maps="--asu-maroon-dark" />
      <token name="--text-body" maps="--gray-1" />
      <token name="--text-muted" maps="--gray-3" />
      <token name="--bg-page" maps="--surface-app" />
    </semantic_aliases>
    <rules>
      <rule>Primary buttons: maroon background, white text, --shadow-button.</rule>
      <rule>Gold is for accents (celebration bubble, badges) — never large fills or body text.</rule>
      <rule>Text on maroon must be white; text on gold must be --gray-1 (never white).</rule>
    </rules>
  </color_tokens>

  <typography>
    <fonts>
      <font var="--font-display" family="Poppins" weights="400,500,600,700" use="landing headings, brand wordmark, buttons" />
      <font var="--font-sans" family="Arial, Helvetica, sans-serif" use="body and app UI fallback" />
      <font var="--font-mono" family="SFMono-Regular, Consolas, monospace" use="code / rare technical text" />
    </fonts>
    <scale>
      <size name="--fs-xs" value="12px" /><size name="--fs-sm" value="13px" /><size name="--fs-base" value="15px" />
      <size name="--fs-md" value="17px" /><size name="--fs-lg" value="20px" /><size name="--fs-xl" value="26px" />
      <size name="--fs-2xl" value="34px" /><size name="--fs-3xl" value="44px" />
    </scale>
    <text_styles note="use these composite `font:` shorthands directly">
      <style name="--text-display" spec="700 44px/1.2" use="hero" />
      <style name="--text-h1" spec="700 34px/1.2" />
      <style name="--text-h2" spec="700 26px/1.2" />
      <style name="--text-h3" spec="700 20px/1.2" use="card titles" />
      <style name="--text-body" spec="400 15px/1.5" />
      <style name="--text-small" spec="400 13px/1.5" use="captions, helper text" />
      <style name="--text-label" spec="700 13px/1.5" use="buttons, chips, eyebrow labels" />
    </text_styles>
    <letter_spacing>Tighten large display type with --ls-tight (-0.025em); use --ls-caps (0.04em) for uppercase eyebrow labels.</letter_spacing>
  </typography>

  <spacing_layout>
    <spacing_scale unit="px">4 (--space-1), 8, 12, 16, 20, 24, 32, 40, 48, 64, 80</spacing_scale>
    <radius>
      <token name="--radius-sm" value="8px" use="inputs, small buttons, chips" />
      <token name="--radius-md" value="10px" use="segmented controls" />
      <token name="--radius-lg" value="16px" use="cards" />
      <token name="--radius-xl" value="20px" use="hero / large panels" />
      <token name="--radius-pill" value="999px" use="pills, toggles" />
    </radius>
    <container max="--container-max 1120px" />
    <grid>Dashboard uses a bento grid of cards. Keep gutters at --space-4 to --space-6. Content max-width 1120px, centered.</grid>
  </spacing_layout>

  <elevation_motion>
    <shadows>
      <token name="--shadow-card" value="0 1px 2px rgba(0,0,0,0.04)" use="resting cards" />
      <token name="--shadow-raised" value="0 8px 24px rgba(0,0,0,0.07)" use="hover / floating chips" />
      <token name="--shadow-elevated" use="popovers / prominent panels" />
      <token name="--shadow-modal" use="dialogs" />
      <token name="--shadow-button" value="0 2px 6px rgba(140,29,64,0.18)" use="primary buttons" />
    </shadows>
    <easing>
      <token name="--ease-standard" value="cubic-bezier(.4,0,.2,1)" />
      <token name="--ease-out-back" value="cubic-bezier(.34,1.56,.64,1)" use="playful entrances / celebration" />
    </easing>
    <durations fast="150ms" base="240ms" slow="420ms" />
    <rules>
      <rule>Always gate non-essential motion behind `@media (prefers-reduced-motion: reduce)` or a matchMedia check; skip confetti, wobble, and scale-pop when reduced.</rule>
      <rule>Celebration (quiz generated) uses motion.dev/framer-motion with --ease-out-back and gold accents.</rule>
    </rules>
  </elevation_motion>

  <iconography library="Phosphor Icons" source="https://phosphoricons.com" package="@phosphor-icons/web">
    <import>Global stylesheet import in app/layout.tsx: `import "@phosphor-icons/web/regular";`</import>
    <weight>Default weight is "regular" — base class `ph`. Bold/fill/duotone are available via their own imports (`@phosphor-icons/web/bold`, `.../fill`) plus the `ph-bold` / `ph-fill` base classes; add them only if a specific need arises. Keep the app on regular for a cohesive look.</weight>
    <usage>Render an icon as `&lt;i className="ph ph-&lt;name&gt;" /&gt;`. Example: `&lt;i className="ph ph-brain" /&gt;`. Size and color are controlled by the parent's `font-size` and `color` (icons are a font).</usage>
    <icon_only_controls>Any icon-only button/link MUST have an accessible name (aria-label) or adjacent visually-hidden text. Decorative icons get `aria-hidden`.</icon_only_controls>
    <canonical_map note="the app's current icon vocabulary — reuse these before introducing new glyphs">
      <icon concept="brand / AI" name="ph-brain" />
      <icon concept="AI magic / generate" name="ph-magic-wand" />
      <icon concept="question / quiz" name="ph-question" />
      <icon concept="summary / document text" name="ph-file-text" />
      <icon concept="PDF file" name="ph-file-pdf" />
      <icon concept="correct / verified" name="ph-check-circle" />
      <icon concept="check" name="ph-check" />
      <icon concept="close / wrong" name="ph-x" />
      <icon concept="favorite / score" name="ph-star" />
      <icon concept="progress / stats" name="ph-chart-bar" />
      <icon concept="trending up" name="ph-trend-up" />
      <icon concept="offline / connectivity" name="ph-wifi-high" />
      <icon concept="speed / free" name="ph-lightning" />
      <icon concept="account" name="ph-user" />
      <icon concept="home" name="ph-house" />
      <icon concept="sign out" name="ph-sign-out" />
      <icon concept="email" name="ph-envelope" />
      <icon concept="privacy / secure" name="ph-lock" />
      <icon concept="date / schedule" name="ph-calendar" />
      <icon concept="add" name="ph-plus" />
      <icon concept="edit" name="ph-pencil-simple" />
      <icon concept="delete" name="ph-trash" />
      <icon concept="submit / send" name="ph-paper-plane-tilt" />
      <icon concept="rate up" name="ph-thumbs-up" />
      <icon concept="rate down" name="ph-thumbs-down" />
    </canonical_map>
    <adding_new>When a new concept is needed, pick the closest Phosphor glyph from phosphoricons.com, prefer the regular weight, and add it to the canonical_map above so the vocabulary stays consistent.</adding_new>
  </iconography>

  <components>
    <component name="Button" variants="primary, ghost">
      <primary>maroon bg, white text, --radius-lg (landing) or --radius-sm (app), font --text-label, --shadow-button; hover -> --brand-primary-hover.</primary>
      <ghost>white bg, --gray-1 text, 1px --gray-5 border, no shadow.</ghost>
      <state>Disabled at 0.5 opacity; loading shows a spinner and "Working…".</state>
    </component>
    <component name="Card">
      <spec>bg --surface-white, --radius-lg, --shadow-card, padding --space-5 to --space-6, hairline border optional.</spec>
    </component>
    <component name="Segmented control" example="upload method toggle">
      <spec>Panel bg --surface-panel, 1px --hairline, --radius-md, inner padding 4px. Active segment: maroon bg + white text. Inactive: transparent + --gray-2.</spec>
    </component>
    <component name="Input">
      <spec>1px --gray-5 border, --radius-sm, padding 8px 10px, font --text-body. Focus uses --hairline-selected.</spec>
    </component>
    <component name="Chip / option toggle">
      <spec>Selected: --surface-maroon-tint bg, --asu-maroon text/border. Unselected: white bg, --gray-2 text, --gray-5 border. --radius-sm.</spec>
    </component>
    <component name="Badge">
      <spec>--surface-gold-tint bg, --asu-maroon text, --text-label, --radius-pill.</spec>
    </component>
  </components>

  <accessibility>
    <rule>Color is never the only signal — pair with icon or text (e.g. correct = green + ph-check-circle).</rule>
    <rule>Icon-only buttons require aria-label.</rule>
    <rule>Respect prefers-reduced-motion for all animations.</rule>
    <rule>Body text >= 15px; helper text >= 13px. Maintain WCAG AA contrast on all text.</rule>
    <rule>Live regions (aria-live="polite") for async status like generation progress and the mascot announcement.</rule>
  </accessibility>

  <do_and_dont>
    <do>Compose from tokens; reuse the canonical icon map; keep maroon for primary action and gold for sparing accents.</do>
    <do>Use the composite `--text-*` styles for consistent type.</do>
    <dont>Introduce new fonts, raw hex values, drop shadows outside the shadow tokens, or a second icon library alongside Phosphor.</dont>
    <dont>Put white text on gold, or use gold as a large background.</dont>
    <dont>Animate without a reduced-motion fallback.</dont>
  </do_and_dont>

</design_system>
