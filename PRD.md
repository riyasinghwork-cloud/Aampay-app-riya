# AAMPAY app

# Product Requirements Document (PRD)

## Home Loan Platform IA & KYC Redesign

**Version:** V2.0

**Author:** Product Design

**Status:** Ready for Design & Claude Implementation

---

# 1. Overview

This redesign focuses on improving the **information architecture**, **navigation**, and **loan journey** of the Home Loan platform without changing its overall visual language.

The current product has a clean UI but is organized around internal processes (Eligibility, Verification, Documents) rather than the user's mental model.

The redesigned experience should feel like a single guided journey where users always know:

- Where they are
- What they need to do next
- Why they're being asked for information
- What they'll get in return

The primary design principle is:

> **Reward first. Effort second.**
> 

Users should experience value (actual bank offers) as early as possible before being asked to invest time completing a long application.

---

# 2. Product Goals

### Primary Goals

- Reduce drop-off before application completion.
- Increase excitement by surfacing partner bank offers earlier.
- Separate reusable customer identity from loan-specific verification.
- Reduce repeated data collection.
- Create an architecture that scales to future financial products.

### Secondary Goals

- Reduce customer support requests.
- Increase loan application completion rate.
- Reduce repeated document uploads.
- Reduce engineering complexity through state-driven flows.

---

# 3. Current Problems

## Information Architecture

Current navigation reflects internal product modules rather than customer goals.

Users don't think:

> I need to complete Verification.
> 

They think:

> I want to get my home loan.
> 

---

## Reward comes too late

The current redesigned journey delayed bank offers until after application and verification.

This removes the strongest emotional moment.

Users should see:

> HDFC
> 

> SBI
> 

> ICICI
> 

within the first 2 minutes.

---

## KYC and Loan Verification are mixed

Current flow combines

- Identity Verification
- Loan Underwriting

These should remain separate internally.

KYC becomes reusable infrastructure.

Loan verification remains application specific.

---

## Dashboard behaves like navigation

Instead of becoming a command center,

it behaves like another homepage.

---

# 4. Design Principles

### One Goal

Everything inside the platform should answer

> Help me get my home loan.
> 

---

### One Journey

The customer should feel like they are progressing through one continuous journey.

Not navigating between multiple tools.

---

### Reward Before Effort

Show bank offers before asking for documents.

---

### Ask Only When Necessary

Collect information only when it unlocks value.

---

### Reuse Everything

Identity.

Documents.

Addresses.

Employment.

These should persist across products.

---

### State Driven

Navigation should never determine progress.

The user's state determines progress.

---

# 5. User Journey

The platform is divided into two conceptual layers.

## Layer 1

Customer Identity

Reusable forever.

Contains

- KYC
- Documents
- Employment
- Addresses

---

## Layer 2

Loan Journey

Created every time a customer applies for a loan.

Contains

- Eligibility
- Offers
- Application
- Verification
- Approval

---

# 6. KYC Strategy

KYC should only answer one question:

> Who is this customer?
> 

It should **not** determine whether someone qualifies for a loan.

That belongs to underwriting.

KYC should be reusable across every future product.

Examples

- Home Loan
- Loan Transfer
- Send Money
- Investments

# 7. End-to-End KYC Flow (Customer Perspective)

The KYC experience should only appear when the user has decided to apply for a loan (after selecting a preferred bank). It should be state-driven, resumable, and only request information that is missing.

| **State** | **User Action** | **System Validation** | **Next State** |
| --- | --- | --- | --- |
| **KYC-0: Check Existing Identity** | User clicks **Apply** for a bank offer | System checks if customer already has a verified identity | Skip completed steps or begin KYC |
| **KYC-1: Mobile Verification** | Verify mobile number with OTP (if not already verified) | OTP success | Mobile Verified |
| **KYC-2: Email Verification** | Verify email (if pending) | Email confirmed | Email Verified |
| **KYC-3: Identity Type** | System branches automatically based on Resident Indian / NRI selected earlier | Generate required document list | Identity Checklist Created |
| **KYC-4A: Resident Indian Identity** | Upload PAN → Upload Aadhaar → Live Selfie/Liveness (or equivalent eKYC if supported) | Validate PAN, Aadhaar, name match, DOB match | Identity Verified |
| **KYC-4B: NRI Identity** | Upload Passport → Upload Visa / Residence Permit (or OCI/PIO where applicable) → PAN (if applicable/required by lender) → Live Selfie/Liveness | OCR + document validity + face match | Identity Verified |
| **KYC-5: Address Verification** | Confirm Indian correspondence address and overseas address (for NRIs) | Address validation | Address Verified |
| **KYC-6: Compliance Declarations** | FATCA/CRS declaration, Tax Residency, PEP declaration, Consent to bureau checks | Store declarations | Compliance Complete |
| **KYC-7: KYC Complete** | Review summary and submit | Identity profile marked verified and reusable | Continue to Loan Verification |

**Important:**

- Never ask for already verified information.
- Every step is independently resumable.
- If a document expires, only that document re-enters the flow.
- KYC completion is reusable across all products.

---

# 8. Loan Verification (Underwriting)

This starts **after KYC is complete** and is specific to the selected lender and loan application.

The goal is to answer:

> Can this customer repay this specific loan?
> 

Typical checklist (generated dynamically):

- Employment proof
- Salary slips / overseas income proof
- Bank statements
- Credit report / bureau consent
- Property documents
- Power of Attorney (if applicable)
- Existing loan details (if transfer)
- Additional lender-specific requests

Every document has one of four states:

- Not Started
- Uploaded
- Under Review
- Accepted / Re-upload Required

If a document is rejected, the user returns only to that document—not the entire journey.

---

# 9. Success Metrics

### Business

- ↑ Eligibility → Application conversion
- ↑ Application completion rate
- ↑ Offer selection rate
- ↑ Approved loan rate

### UX

- ↓ Time to first bank offer
- ↓ Drop-off before application
- ↓ Average support tickets per application
- ↓ Duplicate document uploads
- ↑ Resume completion rate

### Engineering

- Single state machine
- Reusable KYC
- Dynamic document engine
- Shared customer profile

---

# 10. Design System (Maintain Existing Visual Language)

The redesign should preserve the current visual identity shown in the existing screens.

### Layout

- Large whitespace
- Single-column centered forms
- Card-based layouts
- Minimal cognitive load

### Color

- Lime green as the primary accent and success color.
- White surfaces with subtle gray backgrounds.
- Black primary CTA.
- Soft green success states.

### Components

- Rounded cards
- Rounded inputs
- Large CTAs
- Minimal shadows
- Simple progress indicators
- Vertical timeline/checklist
- Status chips
- Bank cards

### Typography

- Bold headlines
- Simple sans-serif typography
- Large spacing between sections
- Short explanatory text

### Motion

- Smooth page transitions
- Expandable checklist sections
- Progressive disclosure
- Skeleton loaders during bank search
- Animated progress updates after uploads

No redesign of branding or visual identity is required. This project is focused on improving IA, navigation, state management, and user flow while preserving the existing design language.

---

# 11. Final Information Architecture

| **Side Navigation** | **Section** | **End-to-End User Flow (State Machine)** | **System Behaviour / State Management** |
| --- | --- | --- | --- |
| **🏡 My Loan** | **Overview** | **First-time user** → Empty state → **Start Home Loan** / **Transfer Existing Loan** → Loan Journey created.

**Returning user** → Resume from last incomplete state → Surface latest status, next action, shortlisted banks, latest notifications. | Single source of truth for the user's loan. Always resumes from the latest state instead of sending users to individual screens. |
|  | **Journey** | **State 1 · Discover** → Enter minimum information *(Resident/NRI, Country, Property Value, Annual Income, Occupation)* → Calculate eligibility instantly.

**State 2 · Compare Offers** → Show eligible amount + real-time offers from partner banks *(HDFC, SBI, ICICI...)* → Compare interest rates, tenure & fees → Save/Shortlist offers → **Select Preferred Bank**.

**State 3 · Apply** → Create Loan Application → Complete Personal Details → Employment Details → Property Details → Review & Submit Application.

**State 4 · Verify** → System checks existing Profile → If KYC already completed → Skip.
Else request only missing identity documents *(Passport / Aadhaar / PAN / Visa etc.)* → Generate dynamic underwriting checklist based on applicant type *(Resident/NRI, Salaried/Self-employed)* → Upload only pending documents *(Income Proof, Bank Statements, POA, Credit Report, Property Documents, etc.)* → Submit Verification.

**State 5 · Track** → Bank Review → Additional Documents Requested *(if any)* → User uploads only requested documents → Verification Complete → Loan Approved → Legal Processing → Disbursement → Active Loan.

**Alternative Flow** → Existing Home Loan Transfer follows the same lifecycle *(Discover → Compare Transfer Offers → Apply → Verify → Track)* with transfer-specific data. | Dynamic state engine. Resume from last incomplete state, skip completed states, never ask twice for verified information, generate document checklist based on user profile and lender requirements, and return users only to the affected state if additional information is needed. |
|  | **Timeline** | Auto-generated activity log: Application Created → Eligibility Calculated → Bank Selected → Application Submitted → KYC Completed → Underwriting Started → Additional Documents Requested (if any) → Verification Completed → Loan Approved → Disbursement → Active Loan. | Read-only audit trail generated automatically from system events. |
| **👤 My Profile** | **Profile** | Personal Details → Identity (KYC) → Documents Vault → Addresses → Employment → Tax Residency → Settings. | Persistent customer profile shared across all current and future financial products. Updating Profile automatically updates future applications. KYC is completed once and reused across products. |
| **❓ Help & Support** | **Support** | FAQs → Contact Relationship Manager → Raise Support Ticket → Track Ticket → Receive Notifications & Bank Requests → Continue Loan Journey directly from notification. | Context-aware support where every notification deep-links to the exact pending task in the user's loan journey. |