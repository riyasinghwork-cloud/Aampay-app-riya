# AAMPAY Design System & Prototype Plan

**Source:** Existing webapp screenshots (visual language to preserve)  
**Product direction:** [PRD.md](./PRD.md) — Home Loan IA & KYC Redesign  
**Scope:** Interactive click-through prototype only (no real auth, APIs, or file uploads)

---

# Part 1 — Design Language

Capture and reuse the current product look. This redesign improves IA and flow; it does **not** invent a new brand.

## 1.1 Color Palette

### Brand (primary)

| Token | Role | Value | Usage |
| --- | --- | --- | --- |
| `--color-lime` | Brand / accent / success | `#C5FF4D` | Hero backgrounds, status chips, icon wells, success checkmarks, selected highlights |
| `--color-lime-soft` | Soft success surface | `#E8FFB8` | Light success states, subtle highlights |

### Complementary (pair with lime)

Inspired by soft wellness UIs: a **deep grounding** tone, a **soft tinted** surface, a **cool vibrant** secondary, and a **warm spark** — so neon lime stays the hero without fighting the palette.

| Token | Role | Value | Usage |
| --- | --- | --- | --- |
| `--color-ink` | Deep grounding | `#1C1838` | Section tags, night-style accents, rare dark chrome — makes lime pop (true cool complement) |
| `--color-ink-soft` | Soft tinted surface | `#EEECF5` | Pale card washes, calm secondary panels (like soft lavender cards in reference UIs) |
| `--color-lagoon` | Cool secondary action | `#2F6BFF` | Alternate CTA / link emphasis when black + lime need a third signal (play, secondary program actions) |
| `--color-lagoon-soft` | Soft cool wash | `#E8EFFF` | Soft selected/info surfaces behind lagoon accents |
| `--color-spark` | Warm highlight | `#FFD24A` | Rare sparks (stars, micro-rewards) — warms the cool ink/lagoon axis next to lime |

**Why these work with `#C5FF4D`**
- Lime sits opposite cool blue–violet on the wheel → **ink** + **lagoon** ground and contrast it.
- **ink-soft** / **lagoon-soft** echo the reference’s pale tinted cards without flattening to pure white.
- **spark** (warm gold) bridges neon lime and cool ink the way small warm accents do in night illustrations.

### Neutrals

| Token | Role | Value | Usage |
| --- | --- | --- | --- |
| `--color-black` | Primary text & primary CTA | `#000000` | Headlines, body emphasis, solid black buttons |
| `--color-white` | Surface | `#FFFFFF` | Rare solid fills; glass is preferred |
| `--color-bg` | Page background | `#F5F5F3` | App canvas base |
| `--color-text` | Primary text | `#111111` | Titles, form values |
| `--color-text-secondary` | Secondary text | `#6B6B6B` | Helper copy, labels, meta |
| `--color-text-muted` | Placeholder / hints | `#9A9A9A` | Placeholders, disabled hints |
| `--color-border` | Borders / dividers | `#E5E5E5` | Input borders, card outlines, separators |
| `--color-danger` | Errors (minimal) | `#E11D48` | Validation only — use sparingly |

**Rules**
- Lime = brand energy and success. Ink/lagoon are **complements**, not a second brand — use sparingly (tags, rare CTAs, atmosphere).
- Do **not** theme whole screens as purple/indigo gradients; ink is for small grounding elements and soft mist mixes only.
- Black button = primary action. Lime = accent / selected / success. Lagoon = optional cool secondary action.
- Surfaces may use frosted glass utilities on the flat light grey canvas; bottom sheets are solid white. Avoid heavy shadows and glow.
- **Atmosphere (prototype):** `.app-canvas` is solid `--color-bg` (`#F5F5F3`) — no page gradients. Bottom sheets are solid white. Lime banners and primary black buttons stay solid.

## 1.2 Typography

**Only these font sizes and weights** may be used. No other sizes or weights.

| Token | Value | Tailwind | Typical use |
| --- | --- | --- | --- |
| `--text-body` | **16px** | `text-[16px]` | Body, labels, meta, buttons, secondary copy |
| `--text-title` | **20px** | `text-[20px]` | Section titles, card titles, sheet titles |
| `--text-display` | **32px** | `text-[32px]` | Page heroes, large amounts, primary screen titles |

| Weight | Value | Tailwind | Typical use |
| --- | --- | --- | --- |
| Regular | **400** | `font-normal` | Body, supporting copy, labels |
| SemiBold | **600** | `font-semibold` | Titles, CTAs, emphasis, status badges |

**Rules**
- Do **not** use `text-xs` / `text-sm` / `text-lg` / arbitrary sizes other than `16` / `20` / `32`.
- Do **not** use `font-medium`, `font-bold`, `font-extrabold`, or other weights — only `font-normal` and `font-semibold`.
- Default body is Regular 16px; titles are SemiBold 20px or 32px.
- Font family: Plus Jakarta Sans (see `globals.css` / layout).

**Voice**
- Short sentences.
- Reward-first copy (“See bank offers”, not “Complete verification”).
- Explain *why* when asking for data.

## 1.3 Spacing scale

**Only these values** may be used for padding, margin, gap, and stack spacing (`space-y` / `space-x`). No other spacing values.

| Token | Value | Tailwind | Typical use |
| --- | --- | --- | --- |
| `--space-1` | **4px** | `1` (`p-1`, `gap-1`, `mt-1`, …) | Space **between text** (title→subtitle, label→value, meta stacks) |
| `--space-4` | **16px** | `4` | Space **between buttons**, and **button ↔ text**; default card padding |
| `--space-8` | **32px** | `8` | Larger section breaks, sheet body breathing room |
| `--space-16` | **64px** | `16` | Rare page-level separation |

**Rules**
- Prefer `gap-*` / `space-y-*` over ad-hoc margins when stacking siblings.
- **Do not use 8px** (`2` / `p-2` / `gap-2` / `mt-2` / `space-y-2`, etc.) for layout spacing.
- **Exception — status chips:** horizontal padding only is **8px** (`px-[8px]`).
- Text → text = **4px**. Button → button and button ↔ text = **16px**.
- **Heading ↔ subtext:** no extra spacing (no margin/padding between a title and its supporting line).
- Do **not** use Tailwind `0.5`, `1.5`, `2`, `2.5`, `3`, `5`, `6`, `7`, `9`, `10`, `12`, `14`, etc. for spacing utilities.
- Element **sizes** (icon boxes, control heights) are separate from this spacing scale.
- Border radius is separate (not part of the spacing scale).

## 1.4 Layout

- Mobile-first single column (max content width ≈ 390–430px centered on desktop).
- Generous whitespace; one primary question or task per screen.
- Centered forms and vertical stacks.
- Soft page padding: **16px** (`p-4` / `px-4`).
- Section spacing: **16px** or **32px** between major blocks (`space-y-4` / `space-y-8`).

## 1.5 Components

### Buttons
- **Primary:** Black fill, white text, full pill radius (`border-radius: 999px`), large tap target (height ≈ 48–56px), full-width on mobile forms.
- **Secondary / ghost:** White or transparent with dark text; optional light border.
- **Accent:** Lime fill, black text — for highlight moments (Get Started on lime hero, success actions).

### Cards
- White background, rounded corners (12–20px).
- Thin border (`--color-border`) or very soft shadow (optional, minimal).
- Bank offer cards: logo, rate, amount, short benefit line; selected state = black border + hard offset shadow.
- Status header cards may use full lime background with black text.

### Inputs
- Rounded rectangles (10–14px), white fill, light gray border (`--color-border`).
- Label above field; placeholder in muted gray.
- **Active / focused:** solid black border (`border-black`) — same as open accordion cards in bottom sheets.
- Country/phone: flag or code prefix + number field.
- Dropdowns match input styling.

### Accordion / sheet cards
- Inactive: white fill, `--color-border`.
- **Open / selected / active:** white fill, solid black border + definitive hard shadow (`.app-active-shadow` = `4px 4px 0 0 #000`, no blur).
- Bank offers: selected = black border + hard shadow; unselected = light border.

### Upload zone (prototype)
- Dashed border box, centered lime circular icon with upload/plus mark.
- Empty copy: “Upload PAN front” / document name.
- **Click → instant uploaded state** (no file picker): filename stub + lime checkmark; optional “Replace” text that toggles back.

### Lists & checklists
- Vertical rows: left icon (often in lime circle), title + short subtitle, right chevron.
- Expandable checklist sections for journey / KYC / underwriting.
- Status chips: Not Started / Uploaded / Under Review / Accepted (lime for success). Horizontal padding **8px** (`px-[8px]`). Font size **`--text-body` (16px)** + SemiBold; do not use uppercase / wide tracking on chip labels.

### Progress
- Simple step label or thin progress bar.
- Vertical timeline for My Loan → Timeline.
- Skeleton shimmer on “searching banks” mock delay (optional, 600–1000ms).

### Navigation (revamped IA)
- Side / bottom nav with three destinations from PRD:
  - **My Loan** (Overview · Journey · Timeline)
  - **My Profile**
  - **Help & Support**
- Active item: black text or lime accent marker — keep minimal.

## 1.6 Motion

Animate the **one most important status signal** on each screen — and layer light supporting motion for polish.

| Signal | Classes | Where |
| --- | --- | --- |
| Progress fill | `.motion-progress-fill` (+ shimmer while mid-journey) | Overview journey `%` |
| Indeterminate | `.motion-progress-indeterminate` | DigiLocker redirect / fetch |
| Success / done | `.animate-check-pop`, `.animate-tick-draw`, `.animate-success-reveal`, `.animate-pop-in` | Checks, eligibility, KYC complete, cards |
| In progress | `.animate-pulse-soft`, `.animate-spin-slow`, `.animate-pulse-ring` | Track badges, under-review, open steps |
| Active / selected | `.animate-active-border`, `.app-active-shadow`, `.app-press-shadow` | Open accordion, selected bank, CTAs |
| Enter / lists | `.motion-stagger`, `.animate-slide-up`, `.animate-nav-in` | Pages, sheets, nav, bank offers |
| Illustration | `.animate-float-soft` | Main-page human mark |

- Soft page transitions (fade). Accordion expand/collapse. Upload toggle uses check-pop.
- Bottom sheets: backdrop fade + slide-up panel.
- Primary buttons: hard-shadow press (offset shrinks on `:active`).
- Respect `prefers-reduced-motion` (animations disabled in CSS).
- Avoid decorative bounce spam, glow stacks, or emoji.

## 1.7 Do / Don’t

| Do | Don’t |
| --- | --- |
| Preserve lime + black + white language | Redesign brand colors |
| One goal per screen | Dashboard clutter in hero/journey steps |
| Fake uploads on click | Real `input[type=file]` / cloud upload |
| State-driven screen switching | Real backend / auth / OTP |
| Show bank offers early | Hide offers behind full KYC |

---

# Part 2 — Prototype Scope

## What this prototype **is**
- A clickable UI that walks through the home-loan journey from the PRD.
- Local UI state only (`useState` / simple route map).
- Pre-filled or ignore-able form fields; Continue always advances (optional light “required” highlight if empty — still allow skip for demo).
- Document “upload” = click dashed box → show uploaded success UI.

## What this prototype **is not**
- Not a production app.
- No real OTP, email verify, OCR, bureau pulls, or bank APIs.
- No persistent database (in-memory state is enough; optional `localStorage` for resume demo).
- No real payments or disbursement.

---

# Part 3 — Step-by-Step Execution Plan

Build in order. Each phase should be demoable on its own.

## Phase 0 — Project shell
1. Scaffold a simple React (+ Vite) or Next.js app with Tailwind (or CSS variables matching tokens above).
2. Define CSS variables for colors, radii, spacing.
3. Create a single `PrototypeApp` shell with:
   - `screen` / `step` state
   - `goTo(screenId)` helper
   - Shared layout: top bar (optional logo), content, primary CTA footer
4. Add a sticky **demo reset** control (dev-only) to return to start.

**Done when:** Blank shell renders with lime/black/white tokens and one placeholder screen.

---

## Phase 1 — Entry & Discover (Reward setup)
**Screens**
1. **Landing / empty Overview** — “Start Home Loan” / “Transfer Existing Loan”
2. **Discover · Minimum info** — Resident/NRI, Country, Property Value, Annual Income, Occupation
3. **Eligibility result** — Eligible amount summary → CTA “See bank offers”

**Interactions**
- Toggle Resident vs NRI (branches later KYC).
- Inputs are cosmetic; Continue always works.
- Optional 800ms skeleton before eligibility “result.”

**Done when:** User can reach eligibility in a few clicks with no real calculation.

---

## Phase 2 — Compare Offers (emotional peak)
**Screens**
4. **Offers list** — Mock cards: HDFC, SBI, ICICI (rate, tenure, fees, eligible amount)
5. **Offer detail** — Benefits, short comparison notes
6. **Shortlist** — Save/heart toggle (local state); Select Preferred Bank

**Interactions**
- Click card → detail → **Apply with this bank**
- Shortlist toggles fill/outline only
- Selecting a bank locks `selectedBank` into app state for later screens

**Done when:** Offers appear within the first ~2 minutes of the click path (matches PRD principle).

---

## Phase 3 — Apply (loan application)
**Screens**
7. Personal details  
8. Employment details  
9. Property details  
10. Review & submit application  

**Interactions**
- Multi-step form with Back / Continue
- Review shows read-only summary of mock data
- Submit → move to Verify (do not invent a dead end)

**Done when:** Application path completes into verification without real validation.

---

## Phase 4 — KYC (identity only, resumable)
Trigger only after bank selected (PRD). Skip screens already “completed” via boolean flags in state.

**Screens (state machine)**
| ID | Screen | Click behavior |
| --- | --- | --- |
| KYC-0 | Check identity | Auto-branch mock: “New customer” vs “KYC already done” toggle for demo |
| KYC-1 | Mobile OTP | Enter any 6 digits or click Verify → success |
| KYC-2 | Email verify | Click “Send link” / “I’ve verified” → continue |
| KYC-3 | Identity type | Auto from Resident/NRI; show checklist preview |
| KYC-4A | Resident: PAN → Aadhaar → Selfie | Each upload box click → uploaded state |
| KYC-4B | NRI: Passport → Visa/OCI → PAN → Selfie | Same click-to-upload |
| KYC-5 | Address | Confirm address form (cosmetic) |
| KYC-6 | Compliance | Checkboxes (FATCA/CRS/PEP/bureau consent) → Continue |
| KYC-7 | KYC complete | Summary → Continue to Loan Verification |

**Upload pattern (all docs)**
```
empty dashed zone  →  onClick  →  uploaded row (filename + lime check)
```
No OS file dialog.

**Done when:** Resident and NRI paths both demo; completed steps can be skipped via state flags.

---

## Phase 5 — Loan Verification (underwriting)
**Screens**
11. Dynamic checklist generated from mock profile (Salaried vs Self-employed, Resident/NRI, selected bank)
12. Per-document upload screens or expandable list items
13. Submit verification

**Document row states (click cycle for demo)**  
`Not Started` → click upload → `Uploaded` → optional click “Mark under review” → `Under Review` → `Accepted`  
(Or simplify to Not Started → Uploaded → Accepted.)

Examples: Salary slips, bank statements, property docs, POA, credit report consent.

**Done when:** Rejected/re-upload can be simulated on one document without restarting the whole journey.

---

## Phase 6 — Track & Timeline
**Screens**
14. **Track status** — Bank review → Approved → Legal → Disbursement → Active (advance via “Simulate next status” demo button or auto-step)
15. **Timeline** — Read-only event list generated from journey milestones
16. **Overview (returning user)** — Resume card: latest status, next action, shortlisted banks

**Interactions**
- Notifications list: each item deep-links to the pending screen
- Help entry points can deep-link to the same pending task

**Done when:** Returning-user Overview clearly resumes mid-journey.

---

## Phase 7 — Shell IA (My Loan / Profile / Help)
**Screens**
17. **My Loan** tabs: Overview | Journey | Timeline  
18. **My Profile:** Personal · Identity (KYC status) · Documents vault · Addresses · Employment · Tax · Settings (mostly static/read-only with edit stubs)  
19. **Help & Support:** FAQs · Contact RM · Raise ticket (fake) · Ticket list  

**Interactions**
- Nav switches sections without resetting loan state
- Profile shows KYC as reusable / complete after Phase 4
- Support notification → jumps into exact Verify/KYC step

**Done when:** Full PRD nav is clickable and state persists across sections.

---

## Phase 8 — Polish pass
1. Match spacing, pill CTAs, lime accents to screenshots.
2. Add 2–3 motions: screen fade, checklist expand, upload check pop-in.
3. Add empty → in-progress → complete Overview variants.
4. Optional Transfer Existing Loan fork that reuses Discover → Offers → Apply → Verify → Track with transfer-specific labels.
5. Smoke-test full happy path on mobile width.

**Done when:** A stakeholder can click Start → Offers → Apply → KYC → Verify → Track without dead ends.

---

# Part 4 — Suggested Screen Map (prototype IDs)

| ID | Screen |
| --- | --- |
| `landing` | Start Home Loan / Transfer |
| `discover` | Min eligibility inputs |
| `eligibility` | Eligible amount |
| `offers` | Bank offer grid/list |
| `offer_detail` | Single bank detail |
| `apply_personal` | Personal details |
| `apply_employment` | Employment |
| `apply_property` | Property |
| `apply_review` | Review & submit |
| `kyc_*` | KYC-0 … KYC-7 |
| `verify_checklist` | Underwriting checklist |
| `verify_doc` | Single doc upload |
| `track` | Status tracker |
| `timeline` | Activity log |
| `overview` | My Loan overview |
| `profile` | My Profile hub |
| `help` | Help & Support |

---

# Part 5 — Implementation Notes

- Prefer one `AppState` object: `{ residency, selectedBank, kyc: {...}, docs: {...}, loanStatus, shortlist[] }`.
- Navigation never “owns” progress — buttons call `advanceFrom(currentState)`.
- For uploads: `onClick={() => setDoc(id, 'uploaded')}` only.
- Keep copy reward-first on early screens; save effort-heavy KYC until after bank selection.
- Visual QA against the provided screenshot mosaic: lime hero moments, black pills, dashed upload boxes, bank logo cards, lime success headers.

---

**Next step (when ready):** Scaffold Phase 0–2 first so offers appear early, then layer Apply → KYC → Verify → Track → shell nav.
