# AAMPAY Prototype — Implementation Steps

Derived from [PRD.md](./PRD.md). Interactive click-through only (no real auth, OTP, OCR, or bank APIs).

**Principle:** Reward first, effort second — bank offers before KYC/documents.

**UI rule:** One home for the loan journey with **step cards + progress bar**. Step forms open in a **bottom sheet** (steps stay visible behind). Status + next action + CTA = `JourneyCard` on empty home. Clickable prototype only.

---

## Flow map (what we build)

```
Landing
  → Discover (min info)
  → Eligibility
  → Compare Offers → Select bank
  → Apply (Personal → Employment → Property → Review)
  → KYC (identity only, skip what’s done)
  → Loan Verification (underwriting checklist)
  → Track (bank review → approved → disbursed → active)
  ↔ Overview / Timeline / Profile / Help (shell IA)
```

Transfer Existing Loan reuses the same lifecycle with transfer-specific labels.

---

## Step 0 — Shell & state machine ✅ DONE
1. Mobile frame (max ~430px) centered on `#212121` page background.
2. Single `AppState` + `goTo()` / `resumeJourney()` from `loanStatus`.
3. Shared UI: Screen, Button, Field, UploadBox (click → uploaded).
4. Bottom nav: My Loan · Profile · Help. Demo Reset.

**Done when:** Frame + tokens + one screen + reset works.

**Completed:** Phone frame on `#212121`, design tokens + Plus Jakarta Sans, `PrototypeProvider` state machine (`goTo`, `resumeJourney`, `reset`), shared UI primitives, landing screen, bottom nav, Reset demo on landing + header.

---

## Step 1 — Entry & Discover ✅ DONE
1. Landing empty state: **Start Home Loan** / **Transfer Existing Loan**.
2. Discover (single page) accordions:
   - **Your details**
   - **Your eligibility**
   - **Compare bank offers** (incl. offer detail + Apply) → leaves only when starting Apply

**Done when:** Landing → details → eligibility → bank offers on one page (no real calc).

**Completed:** Landing CTAs set `loanType`; transfer-specific copy; Resident locks country to India; defaults fill empty fields; 800ms eligibility + offers skeletons inside accordions; cosmetic amount; shortlist/save; inline offer detail; Apply navigates to the Apply flow.

---

## Step 2 — Compare Offers (emotional peak)
1. Offers list: HDFC, SBI, ICICI (rate, tenure, fees, amount).
2. Offer detail + shortlist toggle.
3. **Select Preferred Bank** → locks bank into state → Apply.

**Done when:** Offers appear early (~first 2 minutes of the click path).

---

## Step 3 — Apply ✅ DONE (single page)
Personal → Employment → Property → Review as **accordions on one page**. Submit → KYC.

---

## Step 4 — KYC ✅ DONE (single page)
Check → Mobile → Email → Docs → Address → Compliance → Complete as **accordions on one page**.

---

## Step 5 — Loan Verification (underwriting)
1. Dynamic checklist from profile (Resident/NRI, Salaried/Self-employed, bank).
2. Docs: Not Started → Uploaded → Under Review → Accepted (click cycle).
3. Income, bank statements, property, POA, credit consent, etc.
4. Re-upload one rejected doc without restarting the journey.
5. Submit → Track.

**Done when:** Checklist + status cycle + submit into Track.

---

## Step 6 — Track & Timeline
1. Track: Bank review → Extra docs (optional) → Approved → Legal → Disbursement → Active.
2. Timeline: auto event log from milestones.
3. Overview (returning): status, next action, shortlist, resume CTA.

**Done when:** Returning Overview resumes mid-journey.

---

## Step 7 — Shell IA
1. **My Loan:** Overview · Journey resume · Timeline.
2. **My Profile:** Personal, Identity/KYC, Docs vault, Addresses, Employment, Tax, Settings (stubs OK).
3. **Help:** FAQs, Contact RM, Raise/track ticket; notifications deep-link to pending task.

**Done when:** Nav switches without resetting loan state; Profile reflects KYC reuse.

---

## Step 8 — Polish
1. Match lime/black/white spacing & CTAs to design system.
2. Motions: screen fade, checklist expand, upload check pop.
3. Overview variants: empty / in-progress / complete.
4. Transfer fork with transfer-specific copy.
5. Smoke-test full happy path at mobile width.

**Done when:** Start → Offers → Apply → KYC → Verify → Track has no dead ends.

---

## Build order (this session)

Implement in this order so each phase is demoable:

1. ~~Step 0 — Shell~~ ✅  
2. ~~Step 1 — Discover~~ ✅  
3. ~~Step 2 — Offers~~ ✅ (inside Discover)  
4. ~~Step 3 — Apply~~ ✅  
5. ~~Step 4 — KYC~~ ✅  
6. Step 5 — Verify  
7. Step 6 — Track / Timeline / Overview  
8. Step 7 — Profile / Help  
9. Step 8 — Polish  

Say **“implement Step N”** (or “continue”) to proceed one phase at a time.
