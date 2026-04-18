# FlowMonix Landing Page — Task List

## Status Legend
- [ ] To do
- [x] Done
- [~] In progress

---

## Setup
- [x] Create `/landing` folder structure
- [x] Init Next.js 15 project (configured manually)
- [x] Configure Tailwind CSS + postcss
- [x] tsconfig with @/* path alias
- [ ] Set up environment variables (.env.local)

---

## Core Pages

### `/` — Landing Page
- [x] Hero section (headline + subheadline + CTAs)
- [x] Problem section
- [x] Solution section
- [x] Core value loop (5-step visual)
- [x] Features section (Incident Detection, AI Debugging, Alerts, Retry, Status Page)
- [x] Who It's For
- [x] Pricing teaser
- [x] Trust section (placeholder for testimonials)
- [x] Final CTA
- [x] Footer

### `/waitlist` — Waitlist Form
- [ ] Email field
- [ ] Instance count dropdown
- [ ] Agency/personal qualifier question
- [ ] Submit to DB or email service (Resend / Supabase)
- [ ] Redirect to /thanks on success

### `/thanks` — Thank You Page
- [ ] Confirmation headline
- [ ] Referral link generation (unique per user)
- [ ] "First 200 users get Pro free for 3 months" scarcity block
- [ ] Share buttons (Twitter/X, copy link)
- [ ] Queue position indicator (optional)

---

## Email Sequences (Resend)
- [ ] Email 1 — Instant: confirm + value restate
- [ ] Email 2 — Day 2: pain education
- [ ] Email 3 — Day 4: value loop + Loom demo link
- [ ] Email 4 — Launch: invite + urgency

---

## Assets & Polish
- [ ] Screenshot / demo GIF of dashboard (capture from app)
- [ ] Loom walkthrough recording for Email 3
- [ ] OG image for social sharing
- [ ] Favicon (use FlowMonix brand mark)
- [ ] Mobile responsive QA
- [ ] Deploy to Vercel (flowmonix.com)

---

## Analytics & Tracking
- [ ] Add PostHog or Plausible for page analytics
- [ ] Track waitlist conversions (form submit event)
- [ ] Track referral link clicks

---

## Done
- [x] landingpage.md copy finalized and corrected (5 fixes applied)
- [x] Folder + task list created
- [x] All landing page sections built and verified (builds clean)
  - Hero (dashboard mockup, glow orbs, staggered animations)
  - Problem (4 cards with red/orange accents)
  - Solution (4 cards with indigo accents + bg numbers)
  - Value Loop (5-step flow, desktop horizontal / mobile vertical)
  - Features (5 cards, 2-col grid, last spans full width)
  - Who It's For (3 audience cards with tags)
  - Pricing (3 plans, Pro highlighted with gradient border)
  - Trust (checklist + placeholder testimonials)
  - Waitlist form (email + instance count + agency qualifier + success state)
  - CTA Final (gradient section)
  - Footer (minimal 3-col)
