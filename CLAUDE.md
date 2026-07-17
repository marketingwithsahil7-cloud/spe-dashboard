# Soccer Pro Elite — Master Context File

> Read this ENTIRE file at the start of every session before writing any code.

---

## 1. PROJECT OVERVIEW

**Soccer Pro Elite (SPE)** is a Football Academy Management Progressive Web App.

- **Users:** ~40 student athletes, 2 head coaches + 2 assistant coaches
- **Batches:** 5-6 PM and 6-7 PM daily sessions
- **Stack:** React + Vite + TypeScript + Tailwind CSS + Supabase
- **Hosting:** Netlify (free tier, zero cost)
- **Design Standard:** $50,000 custom sports-tech platform. NOT a template. NOT a shadcn clone.
- **GitHub:** https://github.com/marketingwithsahil7-cloud/spe-dashboard

---

## 2. TECH STACK

| Package | Version | Purpose |
|---|---|---|
| react | ^19.2.6 | UI library |
| react-dom | ^19.2.6 | DOM renderer |
| react-router-dom | ^7.17.0 | Client-side routing |
| zustand | ^5.0.14 | Auth + global state |
| @supabase/supabase-js | ^2.108.1 | Database, auth, storage |
| lucide-react | ^1.18.0 | Icons (ONLY icon library) |
| recharts | ^3.8.1 | Charts/analytics |
| framer-motion | ^12.40.0 | Page transitions, layout animations |
| three | ^0.184.0 | 3D engine |
| @react-three/fiber | ^9.6.1 | React renderer for Three.js |
| @react-three/drei | ^10.7.7 | R3F helpers |
| react-countup | ^6.5.3 | Animated stat counters |
| date-fns | ^4.4.0 | Date utilities |
| gsap | ^3.15.0 | All UI animations (use over CSS transitions) |
| lenis | ^1.3.23 | Smooth scrolling |
| tailwindcss | ^3.4.19 | Styling (v3) |
| vite | ^8.0.12 | Build tool |
| vite-plugin-pwa | ^1.3.0 | PWA manifest + SW |
| typescript | ~6.0.2 | Type safety |
| jspdf / jspdf-autotable | latest | PDF generation (reports, invoices) — dynamically imported |

---

## 3. DESIGN SYSTEM

### Colors
```
Pitch Black:   #0A0A0F  → bg-pitch         (primary background)
Surface:       #12121A  → bg-surface        (card backgrounds)
Surface Light: #1A1A2E  → bg-surfaceLight   (hover, elevated cards)
Grass Green:   #00FF87  → text-grass / bg-grass  (HERO accent)
Grass Dim:     #00CC6A  → text-grassDim     (secondary green)
Stadium Amber: #FFB800  → text-amber        (warnings, fees due)
Hot Red:       #FF3D57  → text-danger       (overdue, errors)
Ice Blue:      #00D4FF  → text-ice          (info, links)
Pure White:    #FFFFFF  → text-white        (primary text)
Slate 400:     #94A3B8                      (secondary text)
Slate 600:     #475569                      (muted, borders)
Glass Border:  rgba(255,255,255,0.08)
Glass BG:      rgba(255,255,255,0.04)
```

### Typography
- **Display / Numbers:** `font-display` → Oswald (weights 400, 500, 600, 700)
  - Use for: stats, large numbers, section headings, nav labels
- **Body / UI:** `font-body` → Inter (weights 400, 500, 600, 700)
  - Use for: paragraphs, labels, buttons, form inputs

Type scale: `xs` 0.75rem → `sm` 0.875rem → `base` 1rem → `lg` 1.125rem → `xl` 1.25rem → `2xl` 1.5rem → `3xl` 1.875rem → `4xl` 2.25rem → `5xl` 3rem (hero stats only)

### Glassmorphism (the signature look)
```css
.glass {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}
.glass-hover:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.12);
}
.glass-button:hover {
  background: rgba(0, 255, 135, 0.1);
  border-color: rgba(0, 255, 135, 0.3);
  box-shadow: 0 0 20px rgba(0, 255, 135, 0.2);
}
```

### Glow Effects
```css
.glow-green { box-shadow: 0 0 20px rgba(0,255,135,0.3), 0 0 60px rgba(0,255,135,0.1); }
.glow-amber { box-shadow: 0 0 20px rgba(255,184,0,0.3), 0 0 60px rgba(255,184,0,0.1); }
.glow-red   { box-shadow: 0 0 20px rgba(255,61,87,0.4); animation: pulseRed 2s ease-in-out infinite; }
```

### Gradients
```css
Hero:    linear-gradient(135deg, #00FF87 0%, #00D4FF 100%)  → .bg-hero-gradient / .text-gradient
Danger:  linear-gradient(135deg, #FF3D57 0%, #FF6B6B 100%)  → .bg-danger-gradient
Card:    linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%) → .bg-card-gradient
```

---

## 4. ANIMATION SYSTEM

### Skills Available — invoke via `/skill-name` before building

**GSAP Suite (prefer GSAP over CSS transitions for ALL motion):**
- `gsap-core` → tweens, fromTo, set, defaults
- `gsap-timeline` → orchestrated sequences (page load, card entrance)
- `gsap-scrolltrigger` → scroll-based reveals
- `gsap-plugins` → SplitText (headings), MorphSVG (icon morphing)
- `gsap-react` → useGSAP hook, cleanup, refs
- `gsap-frameworks` → Vite-specific setup, chunk splitting
- `gsap-performance` → will-change, GPU transforms, mobile optimization
- `gsap-utils` → gsap.utils.toArray, matchMedia for responsive

**React Three Fiber (3D — dashboard only, lazy loaded):**
- `r3f-fundamentals` → Canvas, scene graph
- `r3f-animation` → rotating soccer ball, float animation
- `r3f-geometry` → low-poly icosahedron geometry
- `r3f-materials` → glass/metallic PBR
- `r3f-shaders` → custom green wireframe GLSL shader
- `r3f-textures` → soccer ball panel textures
- `r3f-lighting` → ambient + spot for hero
- `r3f-interaction` → hover/touch tilt on 3D elements
- `r3f-postprocessing` → bloom on green edges
- `r3f-loaders` → GLTF loading if needed

**Motion & Scroll:**
- `motion-framer` → AnimatePresence (page transitions), layout animations, spring physics
- `lenis` → buttery smooth scroll, integrated with GSAP ScrollTrigger

**Design:**
- `frontend-design` → component design, layout composition
- `ui-ux-pro-max` → interaction patterns, micro-interactions, accessibility
- `web-design-guidelines` → spacing, typography hierarchy, visual rhythm

### Animation Rules

| Interaction | Tool | Spec |
|---|---|---|
| Page transitions | Framer Motion AnimatePresence | mode="wait", exit: opacity 0 y:-10 0.2s, enter: opacity 1 y:0 0.3s power2.out |
| Page load sequence | GSAP Timeline | 1) sidebar slides left 0.4s → 2) topbar fade 0.2s → 3) cards stagger 0.1s each → 4) charts 0.4s → 5) 3D 0.3s |
| Card entrances | GSAP stagger | opacity 0→1, y 30→0, scale 0.95→1, stagger 0.08s, ease: "back.out(1.2)" |
| Stats numbers | react-countup | 0 → value over 1.5s, trigger on viewport enter |
| Attendance toggle | GSAP spring | scale 1→1.15→1, green glow pulse once, 0.3s |
| Hover (all cards) | GSAP | scale 1→1.02, 0.2s power2.out, glow intensifies, border brightens |
| Trial alert bar | GSAP marquee | horizontal infinite, 60px/s, pause on hover |
| Overdue badge | CSS animation | pulseRed 2s loop, scale + glow |
| Skeleton loading | CSS shimmer | green sweep left→right, 1.5s cycle |
| Smooth scroll | Lenis | lerp: 0.1, duration: 1.2, disabled in modals |
| 3D soccer ball | R3F | Y-axis rotation 0.005 rad/frame, float ±0.1, bloom on edges |
| Custom cursor | Vanilla JS | 8px green dot, mix-blend-mode: difference, magnetic on buttons |

### Performance Rules (NON-NEGOTIABLE)
1. Every page: `React.lazy()` + `Suspense` with skeleton fallback
2. Three.js: dynamic import, DASHBOARD ONLY — mobile gets 2D SVG soccer ball
3. GSAP: `gsap.matchMedia()` — reduce/skip complex animations below 768px
4. Images: lazy load, WebP, Supabase CDN `?width=200` for thumbnails
5. Fonts: `display=swap`, preload Inter 400+600, load Oswald async
6. Bundle: < 200KB initial JS — Three.js / Recharts / GSAP in separate chunks
7. Tap targets: minimum 44×44px with 8px spacing
8. Lenis: disable if `navigator.hardwareConcurrency < 4`

---

## 5. DATABASE SCHEMA

### students
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | gen_random_uuid() |
| name | TEXT NOT NULL | |
| photo_url | TEXT | Supabase Storage URL |
| batch | TEXT | '5-6 PM' \| '6-7 PM' \| 'Both' |
| parent_name | TEXT | |
| parent_phone | TEXT | Format: +91XXXXXXXXXX |
| billing_cycle_day | INT | 1–31, per-student billing date |
| monthly_fee | INT | Default 2000 (₹) |
| fee_is_fixed | BOOLEAN | Default true. false = flexible fee (e.g. one-time registration ≠ recurring), amount entered fresh each payment |
| status | TEXT | 'active' \| 'trial' \| 'closed' |
| join_date | DATE \| NULL | Nullable — "unknown" join date supported |
| dob | DATE \| NULL | Used to derive age category (U10/U15/Open) |
| academy_id | UUID | Fixed: 00000000-...-000001 |

### attendance
`student_id, date, batch, present` — UNIQUE(student_id, date, batch)

### payments
`student_id, amount, paid_date, for_cycle, mode (cash/upi/online), note, is_reason_only`
- `for_cycle` (e.g. `'2026-06'`) is the source of truth for fee-status computation — NOT `paid_date`'s calendar month.
- `is_reason_only` (bool, default `false`) — set when a coach types something into the Fee Note field instead of leaving it blank. A `true` row means "student isn't paying this month, here's why" — NOT an actual payment: `amount` is stored as `0` (excluding it from revenue sums for free, since those just `SUM(amount)`), `mode` is `null`, and `note` holds the reason. The row still counts toward `for_cycle` fee-status resolution (`get_fee_status`/`computeFeeStatus` only check row existence, not amount), so the student shows as cycle-resolved rather than overdue — `FeeCard`/`PaymentList` render these distinctly ("Not Paying — Reason Given" / "No Payment" badge) instead of as a normal paid amount. See [[GOTCHAS]].

### trials
`name, parent_phone, trial_date, status (pending/closed/not_closed/no_response), follow_up_date`

### events
`title, type (tournament/friendly), date, location, details, age_category`
- `age_category` values are inconsistent in practice: `null` or `'all'` for "All Ages" (creating via `useEvents().addEvent` normalizes falsy → `'all'`, but `updateEvent` does not, so edited events can still end up `null`), and `'U10'` / `'U15'` / `'Open'` (capitalized, matching `AgeCategory` from `ageCategories.ts`) for a restricted category — NOT lowercase `'u10'/'u15'/'open'` despite what older docs here said. Any code reading `age_category` should normalize case and treat `null`/falsy/anything-unrecognized as "all" — see `getEventAgeTarget()` in `AvailabilityTracker.tsx`.

### event_availability
`event_id, student_id, status (available/not_available/maybe/no_response)`

### coaches
`user_id (auth.users ref, no FK), name, role (owner/head/assistant), per_session_rate, login_email, is_active (bool, default true), coaching_days (text[], nullable)`
- `coaching_days` — which weekdays this coach is scheduled to coach, stored lowercase full day names (`'tuesday'`, matching `academy_settings.training_days`'s convention). Set at creation via the owner's Coach Management panel (`SettingsPage.tsx`'s `CoachesTab`); editable per-coach afterward. Informational only — does not currently gate anything (e.g. a coach can still mark attendance on a day outside their own `coaching_days`, as long as it's an academy day per section 12's academy-day gate). See section 14h.
- New coach accounts (real Supabase Auth logins, not just roster rows) are created via the `create-coach` Edge Function — see section 14i. Coaches added before this existed (e.g. Jay, Priya) have `user_id = NULL` until/unless migrated onto a real login separately.

### academy_settings
`academy_name, tagline, logo_url, training_days (text[]), academy_id (unique)`
- Storage bucket: `academy-assets` (public) — logos stored at `logos/main-logo.<ext>`

### coach_attendance
`coach_id, date, batch, session, confirmed_by_coach, disputed, verified, session_note`
- `session_note` (nullable TEXT) — optional free-text note captured at mark time, e.g. "Left early due to emergency." One note per row (i.e. per coach, per date, per batch) — see [[GOTCHAS]].

### student_reports
`student_id, month (1–12), year, skill_ratings (JSONB), coach_remarks (TEXT), pdf_url (TEXT), created_by`
- UNIQUE(student_id, month, year)
- skill_ratings keys: ball_control, passing, shooting, speed_agility, discipline_attitude, teamwork — each 0–5
- Storage bucket: `student-reports` (public) — PDFs at `{studentId}/{year}-{MM}.pdf`

### expenses / emergency_fund_transactions / financial_notes
Financial system tables (head/owner only, RLS-gated). `expenses`: title, amount, fund_type, category, note, recorded_by, withdrawn_by, is_cross_fund, purpose, expected_repayment_date. `emergency_fund_transactions`: type, amount, transaction_date, coach_id, purpose, note, repaid, repaid_amount, repaid_date. `financial_notes`: content, author_id.

### students_missing_report_this_month (VIEW)
Active students who have no `student_reports` row for the current calendar month. Used by dashboard reminder card.

### SQL Functions
- `get_fee_status(p_student_id UUID)` → `(next_due_date, days_overdue, fee_status)`
  - fee_status: `'overdue'` | `'due_today'` | `'due_soon'` (≤2 days) | `'paid'`
- `get_dashboard_stats()` → `(total_active, today_attendance, monthly_revenue, pending_fees)`

---

## 6. USER ROLES & PERMISSIONS

Three roles: `owner` (Sahil), `head` (Sandeep), `assistant` (Jay, others).

`isHeadOrOwner()` in authStore — used for all existing head-coach gates.
`isOwner()` — Sahil-only superpowers.

| Feature | Owner (Sahil) | Head Coach | Assistant Coach |
|---|---|---|---|
| Add/edit/delete students, fees, trials, payroll, events | ✓ | ✓ | ✗ |
| View Team List, Financials (Revenue/Emergency/Notes) | ✓ | ✓ | ✓ (view-only) |
| Add expense / fund transaction, mark repaid, add/delete financial note, download financial PDF | ✓ | ✓ | ✗ |
| Mark attendance | ✓ | ✓ | ✓ |
| View coaches / Events | ✓ | ✓ | ✓ |
| Send WhatsApp messages (fee reminders, trial follow-ups, event notify-parents) | ✓ | ✓ | ✓ |
| Settings page | ✓ (admin tabs) | ✓ (read-only) | ✓ (read-only) |
| Add/edit/remove coaches | ✓ | ✗ | ✗ |
| Change coach roles | ✓ | ✗ | ✗ |
| Deactivate coach login | ✓ | ✗ | ✗ |
| Upload academy logo | ✓ | ✗ | ✗ |
| Edit academy name/settings | ✓ | ✗ | ✗ |
| Export CSV (danger zone) | ✓ | ✗ | ✗ |

`is_active = false` on a coaches row → login blocked (deactivated banner shown on login).

`usePermissions` hook is the single source of truth. Alongside 20+ specific semantic flags (`canManageCoaches`, `canChangeRoles`, `canDeactivateCoach`, `canManageSettings`, `canUploadLogo`, `canExportData`, `canAccessDangerZone`, `canGenerateReport`, `canSeeTeamList`, ...) it also exposes a generic `isHeadOrOwner: boolean` — reach for a specific flag first; fall back to `isHeadOrOwner` only for a one-off write button that doesn't warrant its own named permission (e.g. `RevenueFund`'s Add Expense button, `EventCard`'s Delete button uses the more specific `canManageEvents` instead). `PermissionRoute` layout route wraps head-only paths and redirects assistants (or anyone lacking the permission) to `/attendance`. `DefaultRedirect` sends every role to `/dashboard` — `DashboardPage` itself renders role-appropriate content (see Phase 22).

Students, Fees, and Trials pages remain fully head/owner-only (route-gated, `canSeeStudents`/`canSeeFees`/`canSeeTrials` = `headOrOwner`) — they were not brought into the Phase 24 "assistant view-only" pattern; only Financials and the new Team List page were.

---

## 7. BUSINESS LOGIC

### Fee Billing
- Each student has a `billing_cycle_day` (1–31)
- Fee is due on that day each month
- Status ladder: `paid` → `due_soon` (≤2 days) → `due_today` → `overdue`
- Fee status is computed from whether a payment exists with `for_cycle = currentCycle` — never from `paid_date`'s calendar month (paying early/late must not corrupt status).
- Flexible-fee students (`fee_is_fixed = false`): PaymentForm leaves amount blank instead of pre-filling `monthly_fee`; fee-status tracking is otherwise identical.
- **Reason-for-not-paying**: typing anything into PaymentForm's Note field switches it into "reason mode" — Amount/Amount Type/Mode fields disable, the submit button relabels to "Save Reason", and no real payment is recorded. Instead a `payments` row is inserted with `is_reason_only = true`, `amount = 0`, `mode = null`, `note = <reason>`. Revenue sums (`SUM(amount)`) are unaffected since the row contributes 0; the student still resolves out of the overdue/due-soon buckets for that cycle (a row exists) but renders as "Not Paying — Reason Given" everywhere, not "Paid ₹X". See `is_reason_only` in section 5 and [[GOTCHAS]].
- WhatsApp reminder: `wa.me/{phone}?text={encodeURIComponent(message)}` — 5 dynamic English scenarios (due_soon/due_today/1-3d/4-7d/7+d overdue).
- Legacy Hindi template (superseded by dynamic English reminders): `"Namaste 🙏 {parent_name} ji, {student_name} ka is mahine ka fee ₹{amount} abhi tak pending hai. Kripya jaldi pay karein. — Soccer Pro Elite Academy"`

### Trial Flow
`pending` → coach follows up → `closed` (joined) | `not_closed` (didn't join) | `no_response`
- `closed` trials can be auto-converted to `active` student
- WhatsApp follow-up messages: 3 psychological scenarios by days-since-trial, English copy.

### Coach Fraud Prevention
Mark session → peer confirms → head/owner approves → payout calculated. Owner-marked/confirmed sessions skip peer confirmation (instant `confirmed_by_coach: true, verified: true`).

### Payment Invoices & Reports
- Payment invoice PDF (receipt-style, 148×210mm) + monthly financial PDF report + student report card PDF — all via jsPDF, dynamically imported to keep them out of the initial bundle.
- Both invoice and report card support native OS share sheet (`navigator.share` with file) via `sharePdfFile()`, with desktop download-link fallback.

---

## 8. FILE STRUCTURE

```
src/
  components/
    ui/           Button, Card, Badge, Avatar, Modal, Drawer,
                  Input, Select, Toggle, Skeleton, CustomCursor
    layout/       AppLayout, Sidebar, TopBar, MobileDrawer, navItems.ts (shared NAV_ITEMS)
    dashboard/    StatsCards, TrialAlertBar, ActionPanel, Charts, SoccerBall3D
    students/     StudentList, StudentCard, StudentForm, StudentProfile, ReportCardForm
    attendance/   AttendanceSheet, AttendanceToggle, AttendanceHistory
    fees/         FeeDashboard, FeeCard, PaymentForm, PaymentHistory, WhatsAppReminder
    trials/       TrialList, TrialCard, TrialForm, TrialResolve
    coaches/      CoachList, CoachAttendance, PayrollApproval
    financials/   RevenueFund, EmergencyFund, FinancialNotes
  pages/
    DashboardPage, StudentsPage, TeamListPage, AttendancePage, FeesPage,
    TrialsPage, CoachesPage, EventsPage, FinancialsPage, SettingsPage, LoginPage
  hooks/
    useAuth, useStudents, useAttendance, usePayments,
    useTrials, useCoaches, useDashboard, useFinancials, useReports,
    useAcademySettings, useLenis, useGSAP, useMediaQuery, usePermissions
  lib/
    supabase.ts       Supabase client init
    database.types.ts Generated types (or manual)
    utils.ts          formatCurrency, formatDate, formatPhone, etc.
    constants.ts      BATCHES, FEE_STATUS, ROLES, WA_TEMPLATE
    animations.ts     Shared GSAP presets (cardEntrance, pageLoad, stagger)
    ageCategories.ts  getAge(dob), getAgeCategory(dob) → U10/U15/Open
    generateInvoice.ts, generateMonthlyReport.ts, generateReportCard.ts  jsPDF generators
    sharePdf.ts        Web Share API wrapper + download fallback
  store/
    authStore.ts      Zustand: user, role, session, loading, authError
  types/
    index.ts          All TypeScript interfaces matching DB schema
supabase/
  schema.sql          Original bootstrap schema — stale, see section 14 for the
                      real migration history that's been applied on top of it
  functions/
    create-coach/     Edge Function — owner-only real Auth login creation, see 14i
```

---

## 9. BUILD PHASES — ALL COMPLETE & VERIFIED

- [x] **Phase 0:** Scaffold — Vite+React+TS, Tailwind design system, `supabase/schema.sql`
- [x] **Phase 1:** Supabase client + Zustand auth + Login page + AppLayout shell
- [x] **Phase 2:** Dashboard — StatsCards, Charts, 3D soccer ball, TrialAlertBar, GSAP page-load timeline
- [x] **Phase 3:** Students module — list, add/edit form, profile, photo upload
- [x] **Phase 4:** Attendance — mark sheet, batch toggle, history, spring toggle animation
- [x] **Phase 5:** Fees — due dashboard, record payment, WhatsApp remind
- [x] **Phase 6:** Trials — add/resolve, convert-to-student, status filters
- [x] **Phase 7:** Coach attendance + payroll approval (peer-confirm anti-fraud flow)
- [x] **Phase 8:** Tournaments/Events + player availability
- [x] **Phase 9 (2026-06-14):** Role-Based Access Control — `usePermissions`, `PermissionRoute`, role-aware nav + redirects
- [x] **Phase 10 (2026-06-15):** Financial System — Revenue Fund / Emergency Fund / Notes tabs, head+owner only
- [x] **Phase 11 (2026-06-15):** UX batch — attendance report w/ WhatsApp share, schedule lock, smart fee reminders, toast + confirm dialog systems
- [x] **Phase 12 (2026-06-15):** Visual polish — ambient 3D backgrounds, GSAP/Framer page transitions, SuccessOverlay, mobile gestures (swipe, pull-to-refresh, ripple)
- [x] **Phase 13 (2026-06-16):** Penalty-kick login animation (pure CSS+GSAP, no WebGL) + Owner role + Settings page (Academy/Coaches/Danger Zone tabs)
- [x] **Phase 14 (2026-06-17):** Monthly PDF report, Age categories (U10/U15/Open), Events RLS fix, app-wide Drawer/Modal scroll fix
- [x] **Phase 15 (2026-06-17):** PWA + Netlify deploy — manifest, icons, Workbox caching, manual chunk splitting
- [x] **Phase 16 (2026-06-18):** Student Report Card PDF + WhatsApp/Share link sharing
- [x] **Phase 17 (2026-06-28):** Pre-launch fixes — nullable `join_date`, fee due-date cycle logic (`for_cycle` based), Lenis/drawer scroll-stuck fix, Payment Invoice PDF + WhatsApp + native Share
- [x] **Phase 18 (2026-06-28):** Flexible vs Fixed monthly fee toggle (`fee_is_fixed` column + UI)
- [x] **Phase 19 (2026-06-28):** Critical navigation-stuck bug fix — see [[GOTCHAS]] pointer-events pattern
- [x] **Phase 20 (2026-07-01):** Fees page performance fix — eliminated full students+payments refetch after every payment (was re-rendering/re-animating all 20+ cards); `useStudents({ lite: true })` trims the Fees query to fee-relevant columns; `FeeCard` wrapped in `React.memo`; `PaymentForm` reset-on-open bug fixed (was silently wiping note/date/mode for flexible-fee students on every render). See section 12.
- [x] **Phase 21 (2026-07-01):** Fee management — month selector, past-month audit view, half-month + note UX. `useStudents`/`usePayments` both take an optional `month` ('yyyy-MM', default current) and key fee status + payment queries off `for_cycle` for that month instead of always-current-month. New `MonthSelector` (prev/next arrows, disabled past current month) drives `FeeDashboard`'s `selectedMonth` state. Viewing a past month switches `computeFeeStatus` into audit mode — no `due_soon`/`due_today`, just `paid` vs `overdue` (displayed as "No record for [Month]" in `FeeCard`/`Badge`, not urgency language). `PaymentForm` gets a `defaultMonth` prop pre-selecting "For Month" from the Fees page's selected month, a "Half Month" toggle (halves `monthly_fee` for fixed-fee students, stays editable), and an enlarged/relabeled Note field ("Note / Reason", 3 rows, multi-example placeholder) — `PaymentHistory` already rendered `p.note` under each entry, no change needed there.
- [x] **Phase 22 (2026-07-01):** Assistant Coach Personal Dashboard. `/dashboard` is now open to all roles (`canSeeDashboard: true` in `usePermissions`) and is every role's default landing route (`DefaultRedirect` no longer branches by role). `DashboardPage` is a thin switch — `role === 'assistant'` renders the new `AssistantDashboard` (today's per-batch session status vs. `academy_settings.training_days`, this month's session/earnings summary, last-7-days session log, "Mark Today's Attendance" CTA to `/coaches?tab=attendance`); everyone else gets the existing head/owner body (extracted into `HeadOwnerDashboard`, unchanged). New `fetchCoachAttendanceRange(coachId, start, end)` helper added to `useCoaches.ts` for the 7-day window (a pure calendar-month fetch would miss records that cross a month boundary, e.g. querying on the 1st for the last 7 days). Superseded and deleted `MyCoachPanel.tsx` / the "My Stats" tab on `CoachesPage` — assistants now only see an `Attendance` tab there (personal stats live on `/dashboard` instead); the tab bar itself is hidden entirely when a role only has one tab. Removed the dead `ROUTES.MY_DASHBOARD` constant.
- [x] **Phase 23 (2026-07-01):** Coach attendance privacy + session notes. `CoachAttendance.tsx`'s "Mark Sessions" section (`SectionA`) now computes `visibleCoaches` — head/owner still see every coach per batch, assistants see only their own row (filtered by `c.id === currentCoach?.id`); the "Mark All" / "All marked" bulk-action UI is hidden entirely when there's only one visible coach. Added an optional per-batch "Session Note" textarea (shown while any visible coach in that batch is still unmarked) — its text is attached to whichever coach's row gets marked next via a new optional `note` param threaded through `markCoachAttendance` → `coach_attendance.session_note`, and rendered read-only (small, italic, slate) under that coach's row once saved. Required a DB migration — see section 14c.
- [x] **Phase 24 (2026-07-01):** Team List page, Financials month selector, Events WhatsApp notify-parents — plus a "view-only assistant" permissions pass on the pages touched.
  - **Team List** (`TeamListPage.tsx`, new route `/team-list`, `canSeeTeamList: true` for all roles): pure read-only roster. `useStudents({ lite: true }).filterByStatus('active')` grouped into U10 / U15 / "Open / Age Unknown" via `getAgeCategory(dob)` — the third bucket deliberately merges the `'Open'` category (16+) with `null`/unparseable DOB (age unknown) into one section, since the page has no separate "unknown" concept in the UI. No photos, no edit affordances, numbered list only.
  - **Financials month selector**: `FinancialsPage` replaced its two independent month controls (a header date label, and a `<select>` inside `RevenueFund`) with one page-level `MonthSelector` (`selectedMonth` string state, same component as Fees) feeding `useFinancials(filterMonth, filterYear)`. `MonthSelector` gained an optional `min` prop (disables the left arrow at that month) so Financials can cap the range to the trailing 12 months; Fees' usage is unaffected since the prop is optional. `RevenueFund`'s internal `<select>` and `getMonthYearOptions()` were deleted as redundant.
  - **Permissions pass on Financials**: `canSeeFinancials` flipped from `headOrOwner` to `true` — assistants can now open the page at all, which meant auditing every write path inside it (previously nobody needed to, since the whole page was blocked). Added a generic `isHeadOrOwner: boolean` to `usePermissions()` and threaded it as a prop into `RevenueFund` (gates Add Expense + per-row Edit/Delete), `EmergencyFund` (gates Add Transaction + the Mark Repaid toggle/form), and `FinancialNotes` (gates the Add Note box + per-note Delete) — none of these three components previously took any permission input since they'd only ever rendered for head/owner. Download Report button in `FinancialsPage` itself also gated on `isHeadOrOwner`.
  - **Events — Notify Parents**: `AvailabilityTracker.tsx` gained a `NotifyParentsSection` (visible to all roles — this is communication, not editing) between the event-meta block and the availability summary chips. Filters `useActiveStudents()` by the event's `age_category` via `getEventAgeTarget()` (see [[GOTCHAS]] on `age_category`'s inconsistent stored values), renders one row per matching student with a per-student "Send Message ↗" `wa.me` link, plus a "Send to All" button that opens links via a `setTimeout` loop with an 800ms gap (not `Promise.all` / no delay — browsers block near-simultaneous `window.open` popups) and shows "Opening X of Y…" progress. New `generateEventNotifyMessage(student, event)` in `useEvents.ts` (co-located with the existing `generateBroadcastMessage`) builds the personal "you've been selected, reply YES/NO" message; new `toWhatsAppPhone()` in `utils.ts` normalizes a stored phone (handles a leading `0`, a bare 10-digit number, or an existing `91`/`+91` prefix) into the bare-digit form `wa.me` needs.
  - **Events — Delete**: `EventCard` gained a Delete button next to Edit (both gated on the existing `canManageEvents`, unchanged/still `headOrOwner` — no new flag needed here since availability-viewing/broadcast/notify were already open to all and only the destructive actions needed gating). `EventsPage` wires it through the shared `ConfirmDialog` component (same one `SettingsPage` uses for coach removal) and the previously-unused `deleteEvent` from `useEvents()`.
  - Students, Fees, and Trials pages were deliberately **not** touched — see section 6.
- [x] **Phase 25 (2026-07-12):** Five bug fixes — coach session counting, fee reason-for-not-paying, payment deletion, emergency fund RLS gap, invoice history retrieval.
  - **Coach session counting** (highest priority): sessions/payouts were counting one row per time-slot instead of one per day. New `groupAttendanceByDate`/`countSessionDays`/`countVerifiedSessionDays` helpers in `useCoaches.ts` group `coach_attendance` rows by unique `date` before counting; `fetchMonthlyPayroll`, the `useCoaches()` hook's `load()`, `calculatePayroll`, `PayrollApproval.tsx`'s "Verify N Sessions" count, and `AssistantDashboard.tsx` (including its "Recent Sessions" list, now grouped per day instead of per row) all switched to the new helpers. See [[GOTCHAS]].
  - **Fee reason-for-not-paying**: `PaymentForm`'s Note field now doubles as a mode switch — typing anything into it disables Amount/Amount Type/Mode and relabels the submit button to "Save Reason"; submitting inserts a `payments` row with the new `is_reason_only = true`, `amount = 0` instead of a real payment. `FeeCard`, `PaymentList` (`PaymentHistory.tsx`), and the success view in `PaymentForm` all render these rows distinctly ("Not Paying — Reason Given" / reason text) instead of as a paid amount. Requires a DB migration — see section 14d.
  - **Payment deletion**: `usePayments.ts` gained `deletePayment(id)`; `PaymentList` gained per-row delete (icon button, only rendered when the caller passes `onDelete` — gated on `canRecordPayment` in `FeeDashboard.tsx`) behind a `ConfirmDialog`. `useStudents().applyPaymentOptimistic` gained an optional third `hasPayment` param (default `true`) so deleting a student's only payment for the viewed cycle correctly reverts their fee-status badge locally instead of needing a full refetch.
  - **Invoice history retrieval**: the invoice-building logic previously inline in `PaymentForm.tsx` was extracted to `src/lib/invoiceHelpers.ts` (`buildInvoice`, reusable outside the payment-success flow). `PaymentList` gained a per-row "view invoice" icon (hidden for `is_reason_only` rows, which never had one) that regenerates/re-uploads the PDF on demand via `buildInvoice` and opens it — works even for older payments predating this feature, since generation is idempotent (`upsert: true` on the same `{paymentId}.pdf` storage path).
  - **Emergency Fund RLS gap**: root-caused to the same "owner added to `coaches.role` after policies were written" class of bug as the Phase 13 payments incident (section 12) — `emergency_fund_transactions`' policies (created ad-hoc, never in `supabase/schema.sql`) only recognized `role = 'head'`. Fix is a SQL migration the owner must run manually — see section 14e (out of reach of this codebase since it requires direct Supabase SQL Editor / service-role access, not the anon key `.env` uses).
- [x] **Phase 26 (2026-07-17):** Delete affordances (students/trials/emergency fund), owner-only coach account creation, academy-day attendance gate, mobile side-nav drawer.
  - **Delete students**: `useStudents().deleteStudent(id)` changed from a soft delete (set `status: 'closed'`) to a hard delete — explicitly removes `attendance`/`payments`/`event_availability`/`student_reports` rows for that student, then the `students` row itself. `StudentCard` gained a delete icon (gated on the existing `canDeleteStudent`), `StudentsPage` holds `deleteTarget` state + a `ConfirmDialog` ("This will delete all their attendance, fee records, and data") + a toast on success/failure. Requires a DB migration — see section 14f.
  - **Delete trials**: `useTrials()` gained `deleteTrial(id)`; `TrialCard` gained a delete icon (gated on `canSeeTrials`, i.e. head/owner — the Trials page is already head/owner-only end to end, so no new permission flag was added); `TrialList` holds the `deleteTarget`/`ConfirmDialog`/toast state, same pattern as students. Requires a DB migration — see section 14g (`trials` never had a DELETE policy).
  - **Delete emergency fund transactions**: `useFinancials()` gained `deleteEmergencyTransaction(id)`; `EmergencyFund.tsx`'s `TxRow` gained a delete icon (gated on the `isHeadOrOwner` prop already threaded through since Phase 24); `EmergencyFund`/`FinancialsPage` hold the `deleteTarget`/`ConfirmDialog` state. No new RLS needed — the Phase 25 emergency-fund RLS fix (section 14e) already granted head/owner DELETE on this table.
  - **Owner-only coach account creation**: previously "Add Coach" in Settings → Coach Management only inserted a `coaches` roster row with no real login (the note in the UI said to create the Supabase Auth account manually in the dashboard). Now it calls a new `create-coach` Edge Function (`supabase/functions/create-coach/index.ts`) that creates a real Auth user via the service-role key (never exposed to the frontend) and the `coaches` row in one call, rolling back the auth user if the roster insert fails. The Add Coach form gained a required password field and a coaching-days multi-select (reusing the same day-toggle UI as `AcademyTab`'s training-days picker); `CoachRow`'s edit mode also gained the coaching-days toggle for existing coaches. New `coaches.coaching_days TEXT[]` column — see section 14h. Edge Function must be deployed manually via the Supabase CLI — see section 14i.
  - **Coach attendance restricted to academy days**: `CoachAttendance.tsx`'s `SectionA` now reads `academy_settings.training_days` (falling back to `['tuesday','thursday','saturday']` if unset) and computes `isAcademyDay` for the currently-selected date. On a non-academy day, the batch-marking UI is replaced with a blocked message instead of being rendered; `handleMark`/`handleMarkAll` also early-return as defense in depth even though the UI already hides the triggering buttons. Coach attendance only — student attendance (`AttendanceSheet.tsx`) is untouched.
  - **Mobile side-nav drawer**: replaced the mobile bottom tab bar (`BottomNav.tsx`, deleted) with a hamburger menu (`TopBar.tsx`, mobile-only via `md:hidden`) that opens a new `MobileDrawer.tsx` — a left-sliding drawer (portal + backdrop, same structural pattern as `ConfirmDialog`/`Drawer`) listing every nav item with active-route highlighting, plus the coach info/sign-out block from the desktop `Sidebar`. Nav item config was deduplicated out of `Sidebar.tsx` into a new shared `src/components/layout/navItems.ts` (`NAV_ITEMS`), which both `Sidebar` and `MobileDrawer` now import. `AppLayout.tsx` no longer renders `BottomNav`; its `<main>` bottom padding and several pages' FAB offsets (`StudentList`, `TrialList`) that were tuned to clear the old 68px bottom bar were reduced accordingly (`pb-24`/`bottom-24` → `pb-8`/`bottom-6` roughly, mobile only — desktop `md:` values unchanged). Desktop is unaffected — the persistent `Sidebar` (`hidden md:flex`) already covered `md:`+ breakpoints and continues to.

---

## 10. SAMPLE DATA

> **PRODUCTION LAUNCH — 2026-06-19**
> All sample/seed data was cleared from the database. The app is now live and ready for real student data entry.
> Backup CSVs of all seed data (students, attendance, payments, trials, events, event_availability, student_reports) were exported from Supabase before deletion.
> Coaches table was NOT cleared — Sahil (owner), Sandeep Rawat (head), Jay + Priya (assistant) remain.

**NEVER hardcode student/coach data in frontend components. Always fetch from Supabase.**

---

## 11. CONVENTIONS

| Rule | Detail |
|---|---|
| Components | PascalCase (`StudentCard.tsx`) |
| Hooks / utils | camelCase (`useStudents.ts`) |
| Supabase queries | ONLY inside hooks, never directly in components |
| Dates | Always use `date-fns` functions |
| Icons | `lucide-react` only |
| Auth state | Zustand (`authStore`) |
| UI state | `useState` / `useReducer` inside component |
| Mobile breakpoint | 768px |
| Every page | loading skeleton + empty state + error state |
| Animations | GSAP for complex orchestration, Framer Motion for page transitions + layout |
| 3D | R3F only on Dashboard, always `React.lazy()` + dynamic import |
| Comments | Only when WHY is non-obvious. No "what" comments. |
| Error handling | Only at system boundaries (Supabase calls, user input) |

---

## 12. GOTCHAS & NON-OBVIOUS TECHNICAL NOTES

Hard-won lessons — read before touching these areas to avoid re-introducing fixed bugs.

- **jsPDF is Latin-1 only (Helvetica).** `₹`, `⚽`, `✓` and other non-ASCII glyphs render as garbage. Use `Rs.` prefix and plain-text badges ("PAID") in all generated PDFs (invoices, reports, report cards).
- **Drawer/Modal scrollable bodies need explicit `minHeight: 0`.** `flex: 1` alone doesn't override the browser's `min-height: auto` default, so content can't shrink to allow scrolling. Every scroll container also needs `data-drawer-scroll="true"` so Lenis's `prevent` callback (`useLenis.ts`) skips wheel-event interception there and lets native scroll take over.
- **Drawer panel must be a `position:fixed` sibling of its backdrop, not a child.** Framer Motion's `will-change:transform` on an ancestor creates a CSS containing block that breaks `position:fixed` children.
- **Any full-screen overlay must set `pointer-events:none` once its exit/fade animation starts**, not just on unmount. `SuccessOverlay` and `Drawer`'s backdrop both had invisible-but-present elements silently blocking every tap after close — looked exactly like a frozen app. Also memoize any close/onDone callbacks passed into GSAP effects (`useCallback`) so timelines aren't torn down and pointer-events reset mid-animation on every parent re-render.
- **RLS policies must be updated in lockstep with role enum changes.** `coaches.role` gained `'owner'` in Phase 13, but `payments`/`coach_attendance` RLS still checked only `role = 'head'` for months — silently rejected all of Sahil's writes.
- **`vite.config.ts` manual chunk splitting must use the function form**, not the object form — object form throws TS2769 with the current Rollup version.
- **Every "required" DB column needs an explicit default in insert code**, not just a DB default — a `null` sent explicitly from the client still fails a NOT NULL/constraint check (`age_category` on `events` was the case that caught this).
- **Fee status must key off `for_cycle`, never `paid_date`'s calendar month** — a student paying next month's fee early would otherwise show as "paid" for the wrong month. `usePayments(month)`'s list query and `useStudents({ month })`'s paid-check both filter on `.eq('for_cycle', targetCycle)`, not a `paid_date` date-range — this is deliberate so the Fees page's month selector and the "Paid" tab always agree on what counts as "for that month" regardless of when the payment was actually recorded.
- **`computeFeeStatus` takes a required `targetCycle` ('yyyy-MM') and only applies `due_soon`/`due_today` when `targetCycle` is the current calendar month.** Any other (necessarily past, since the Fees page's `MonthSelector` can't go future) month collapses unpaid students straight to `overdue` — `FeeCard`/`Badge` then relabel that as "No record for [Month]" when `isCurrentMonth` is false, since "47 days overdue" language doesn't make sense for a January audit done in July. Don't call `computeFeeStatus` with a stale/omitted cycle — it will silently apply the wrong month's due-date math.
- **`useStudents().applyPaymentOptimistic(studentId, forCycle)` only patches local state if `forCycle` matches the hook's *currently loaded* `month`.** If a coach records a payment whose `for_cycle` differs from the Fees page's selected month (shouldn't normally happen since `PaymentForm`'s `defaultMonth` pre-fills from `selectedMonth`, but the dropdown is still user-editable), the optimistic update is a no-op and that student's card won't reflect the change until the next natural `load()` — this is intentional (avoids showing a false-positive "paid" badge for a month the coach isn't viewing), not a bug.
- **Never `refetch()` a whole list hook after a single-row mutation on a list-heavy page.** `FeeDashboard` used to call `refetchStudents()` + implicit `usePayments` reload after every payment save — 2 full network round trips and a brand-new array reference for all 20+ students, forcing every `FeeCard` to re-render and replay its GSAP entrance. Fixed with per-hook optimistic updates: `useStudents().applyPaymentOptimistic(studentId, forCycle)` patches just the one changed student in place (reusing the same `computeFeeStatus` used on load), and `usePayments().addPayment` appends the inserted row locally instead of re-querying the month. Pair this with `React.memo` on the list-item component (`FeeCard`) — memoization only helps if the array producing its props doesn't get a fresh reference for unrelated items, and only if any callback props (e.g. `onRecordPay`) are wrapped in `useCallback` too.
- **List hooks should only show a loading skeleton once per mount, not on every refetch.** Track a `hasLoadedOnce` ref and skip `setIsLoading(true)` on subsequent `load()` calls once it's set — otherwise every background refresh blanks a populated list even though the data barely changed.
- **`useStudents` supports a `lite: true` option** (`useStudents.ts`) that selects only fee-relevant columns (`id, name, batch, parent_name, parent_phone, billing_cycle_day, monthly_fee, fee_is_fixed, status, dob`) — used by `FeeDashboard`, which never needs `photo_url`/`join_date`/`academy_id`. `Avatar` already falls back to initials when `src` is missing, so this is a safe trim, not a functional change. Don't apply `lite` to pages that render actual student photos (StudentsPage, StudentProfile).
- **`academy_settings.training_days` stores lowercase full day names** (`'monday'`, `'tuesday'`, ...) — `SettingsPage`'s day picker writes them that way. Anything comparing against `date-fns`'s `format(date, 'EEEE')` (which returns `'Monday'`, capitalized) must `.toLowerCase()` first, or the comparison silently never matches. `AssistantDashboard`'s "is today a training day" / "next training day" logic does this.
- **`coach_attendance.session_note` is per-row (per coach + date + batch), not a true shared session-level field**, even though it's framed to coaches as a "session note." `CoachAttendance.tsx`'s per-batch textarea attaches its text to whichever coach's row gets marked next, then clears — it doesn't retroactively apply to already-marked rows or sync across coaches marking the same batch/date. This is fine in practice because assistants can only mark their own row (see `visibleCoaches` in `SectionA`), so one coach per batch per day is the common case; if two coaches ever mark the same batch/date, each keeps their own independent note.
- **Opening multiple `wa.me` links in a row must use a `setTimeout` chain, not `Promise.all`/a plain loop.** Browsers only allow a `window.open()` popup per user gesture reliably when they're spaced out — firing several in the same tick gets most of them silently blocked. `NotifyParentsSection`'s "Send to All" (`AvailabilityTracker.tsx`) opens one link, waits 800ms via `setTimeout`, then opens the next, recursively — don't "optimize" this into a `for` loop or `Promise.all`.
- **A coach "session" is one DAY, not one attendance row.** `coach_attendance` has one row per batch/time-slot, so a coach who takes both the 5-6 PM and 6-7 PM batch on the same date has two rows but worked ONE session that day. Every session count and payout (`useCoaches.ts`'s `fetchMonthlyPayroll`/`load()`/`calculatePayroll`, `PayrollApproval.tsx`, `AssistantDashboard.tsx`) must group by unique `date` first — use the shared `groupAttendanceByDate`/`countSessionDays`/`countVerifiedSessionDays` helpers exported from `useCoaches.ts` rather than `.length`/`.filter(...).length` on the raw attendance array, or you'll double-count coaches who take both batches.
- **`payments.is_reason_only = true` is a sentinel, not a real payment.** `amount` is `0` and `mode` is `null` on these rows specifically so revenue sums (which just `SUM(amount)`) net out correctly without extra filtering — don't "fix" a reason-only row's amount to be non-zero, and don't filter these out of fee-status queries (they're meant to resolve the cycle, just not as a paid amount). Any new code that reads `payments` for revenue/totals is automatically correct; any code that renders a payment row should check `is_reason_only` first and branch its display (see `PaymentList` in `PaymentHistory.tsx`).
- **A render-phase `if (condition) { setState(...) }` guard is not a substitute for `useEffect`.** `PaymentForm`'s old reset-on-open logic re-ran on *every* render as long as `amount === ''` — harmless for fixed-fee students (amount becomes non-empty immediately) but for flexible-fee students (amount starts and can stay `''`) it silently wiped `note`/`paidDate`/`mode` back to defaults the moment the coach touched any other field first. Reset-on-open logic belongs in a `useEffect` keyed on a *stable* identity (`student?.id`, not the whole object) so it only fires when the drawer actually opens for a new student, not on every unrelated re-render.

---

## 13. KNOWN ISSUES

| Issue | Status |
|---|---|
| `THREE.Clock deprecated` warning from `useFrame` in `SoccerBall3D.tsx` | **Known · minor** — originates inside R3F/Three.js internals, does not affect functionality |
| `student-photos` Supabase Storage bucket | **Manual setup required if not already run** — SQL in section 14; without it photo upload throws a storage error |
| `coach_attendance.session_note` column | **Manual setup required if not already run** — SQL in section 14c; without it, marking attendance with a note filled in throws an insert error |
| `payments.is_reason_only` column | **Manual setup required if not already run** — SQL in section 14d; without it, using the "reason for not paying" feature in PaymentForm throws an insert error |
| `emergency_fund_transactions` RLS owner gap | **Manual setup required if not already run** — SQL in section 14e; without it, the owner role (Sahil) gets a silent/rejected insert when adding an Emergency Fund transaction (same root-cause class as the Phase 13 payments RLS bug — the owner role was added after this table's policies were first written) |
| `students`/`attendance`/`event_availability`/`student_reports` DELETE policies | **Manual setup required if not already run** — SQL in section 14f; without it, deleting a student from the Students page throws an RLS error on the cascade cleanup or the final student row delete |
| `trials` DELETE policy | **Manual setup required if not already run** — SQL in section 14g; without it, deleting a trial entry throws an RLS error |
| `coaches.coaching_days` column | **Manual setup required if not already run** — SQL in section 14h; without it, creating or editing a coach's coaching days throws an insert/update error |
| `create-coach` Edge Function | **Manual deploy required** — code in section 14i; without deploying it, the "Add Coach" form in Settings → Coach Management fails since it calls a function that doesn't exist yet on the project |

All other previously-tracked issues (TS build errors, login animation race, WebGL context loss, Events RLS, Drawer scroll, payment RLS role mismatch, coach-attendance pending-for-owner, navigation-stuck) are **resolved** — root-cause patterns are captured in section 12 (Gotchas) to prevent regression.

---

## 14. SUPABASE STORAGE — student-photos bucket

Run this in the Supabase SQL Editor to create the storage bucket and RLS policies:

```sql
-- 1. Create the public bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-photos', 'student-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Authenticated users can upload (insert) to their own student paths
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'student-photos');

-- 3. Authenticated users can update/replace photos (upsert uses UPDATE)
CREATE POLICY "Authenticated users can update photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'student-photos');

-- 4. Public read — anyone can view photo URLs
CREATE POLICY "Public read for student photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'student-photos');
```

After running the SQL, photo uploads in StudentForm will work. Public URLs follow the pattern:
`https://<project>.supabase.co/storage/v1/object/public/student-photos/<studentId>/avatar.<ext>`

---

## 14b. SUPABASE STORAGE — payment-invoices bucket

Run this SQL to enable payment invoice PDF generation:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-invoices', 'payment-invoices', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload invoices"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'payment-invoices');

CREATE POLICY "Authenticated users can update invoices"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'payment-invoices');

CREATE POLICY "Public read for invoices"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'payment-invoices');
```

Invoice PDFs are stored at `payment-invoices/{paymentId}.pdf` and served via public URL.

---

## 14c. SUPABASE MIGRATION — coach_attendance.session_note column

Run this SQL to enable per-session notes on coach attendance (Phase 23):

```sql
ALTER TABLE coach_attendance
ADD COLUMN IF NOT EXISTS session_note TEXT;
```

No RLS changes needed — the existing `"Authenticated users can insert coach_attendance"` policy (`WITH CHECK (TRUE)`) already covers inserting a row with `session_note` set.

---

## 14d. SUPABASE MIGRATION — payments.is_reason_only column

Run this SQL to enable the "reason for not paying" fee feature (Phase 25):

```sql
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS is_reason_only BOOLEAN NOT NULL DEFAULT false;
```

No RLS changes needed — inserting a reason-only row goes through the same INSERT policy as a normal payment.

---

## 14e. SUPABASE RLS FIX — emergency_fund_transactions owner gap

The `emergency_fund_transactions` table (added ad-hoc during Phase 10, never captured in `supabase/schema.sql`) was found to reject inserts from the `owner` role — same root-cause class as the Phase 13 `payments`/`coach_attendance` RLS bug documented in section 12: the `coaches.role` enum gained `'owner'` after this table's policies were first written, and they were never updated in lockstep. Run this in the Supabase SQL Editor to reset the table's policies with `owner` included (safe to re-run; it drops whatever policies currently exist on the table by name and recreates them):

```sql
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'emergency_fund_transactions'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON emergency_fund_transactions', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE emergency_fund_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read emergency_fund_transactions"
  ON emergency_fund_transactions FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Head or owner can insert emergency_fund_transactions"
  ON emergency_fund_transactions FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM coaches WHERE user_id = auth.uid() AND role IN ('owner', 'head'))
  );

CREATE POLICY "Head or owner can update emergency_fund_transactions"
  ON emergency_fund_transactions FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM coaches WHERE user_id = auth.uid() AND role IN ('owner', 'head'))
  );

CREATE POLICY "Head or owner can delete emergency_fund_transactions"
  ON emergency_fund_transactions FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM coaches WHERE user_id = auth.uid() AND role IN ('owner', 'head'))
  );
```

While auditing this, `payments` DELETE (needed for the new fee-deletion feature, Phase 25) was also checked: `supabase/schema.sql` still shows `role = 'head'` only (line ~318), but section 13's Known Issues marks the payments RLS role mismatch as historically resolved, meaning the live database's policy was already patched to include `'owner'` directly (outside this file). If deleting a payment as the owner ever throws an RLS error in practice, apply the identical drop-and-recreate pattern above to the `payments` table instead.

---

## 14f. SUPABASE RLS — student deletion (Phase 26)

`useStudents().deleteStudent(id)` now hard-deletes a student (previously it only soft-closed the record — see section 12 if that behavior is referenced elsewhere) and explicitly cleans up `attendance`, `payments`, `event_availability`, and `student_reports` rows for that student before deleting the `students` row itself. Run this SQL to add the DELETE policies these operations need (owner + head only), and to add a DELETE policy on `students` itself, which never had one:

```sql
CREATE POLICY "Head or owner can delete students"
  ON students FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM coaches WHERE user_id = auth.uid() AND role IN ('owner', 'head'))
  );

CREATE POLICY "Head or owner can delete attendance"
  ON attendance FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM coaches WHERE user_id = auth.uid() AND role IN ('owner', 'head'))
  );

CREATE POLICY "Head or owner can delete event_availability"
  ON event_availability FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM coaches WHERE user_id = auth.uid() AND role IN ('owner', 'head'))
  );

CREATE POLICY "Head or owner can delete student_reports"
  ON student_reports FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM coaches WHERE user_id = auth.uid() AND role IN ('owner', 'head'))
  );

-- payments DELETE: reset with the same drop-and-recreate pattern as 14e, in case the
-- live policy still only checks role = 'head' (see note at the end of section 14e).
DROP POLICY IF EXISTS "Head coaches can delete payments" ON payments;
DROP POLICY IF EXISTS "Head or owner can delete payments" ON payments;
CREATE POLICY "Head or owner can delete payments"
  ON payments FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM coaches WHERE user_id = auth.uid() AND role IN ('owner', 'head'))
  );
```

---

## 14g. SUPABASE RLS — trial deletion (Phase 26)

`trials` never had a DELETE policy. Run this to enable the new delete-trial feature on the Trials page (owner + head only, matching the page's existing route gate):

```sql
CREATE POLICY "Head or owner can delete trials"
  ON trials FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM coaches WHERE user_id = auth.uid() AND role IN ('owner', 'head'))
  );
```

---

## 14h. SUPABASE MIGRATION — coaches.coaching_days column (Phase 26)

Backs the "which days does this coach coach" field in the new owner-only Coach Management flow (`SettingsPage.tsx`'s `CoachesTab`, and the `create-coach` Edge Function in section 14i). Stores lowercase full day names, same convention as `academy_settings.training_days`.

```sql
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS coaching_days TEXT[] DEFAULT '{}';
```

No RLS changes needed — this rides along on whatever UPDATE/INSERT policy `coaches` already has (the `create-coach` Edge Function inserts using the service_role key, which bypasses RLS entirely).

---

## 14i. SUPABASE EDGE FUNCTION — create-coach (Phase 26)

Owner-only coach account creation now creates a real Supabase Auth login (not just a `coaches` roster row) via a new Edge Function, since creating auth users requires the `service_role` key, which must never be shipped to the frontend. Code lives at `supabase/functions/create-coach/index.ts` in this repo. Deploy it with the Supabase CLI:

```
supabase functions deploy create-coach
```

No manual secrets to configure — `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically into every Edge Function's environment by Supabase.

The function: (1) verifies the caller is authenticated and looks up their own `coaches.role` using the service-role client — rejecting with 403 if it isn't `'owner'` (never trust a client-supplied role flag for this check); (2) creates the auth user via `admin.auth.admin.createUser({ email, password, email_confirm: true })`; (3) inserts the new `coaches` row (`user_id`, `name`, `role`, `login_email`, `per_session_rate`, `coaching_days`, `is_active: true`); (4) if the `coaches` insert fails, rolls back by deleting the just-created auth user, so a failed call never leaves an orphaned login with no roster row.

The frontend calls it via `supabase.functions.invoke('create-coach', { body: {...} })` from `SettingsPage.tsx`'s `handleAdd` — replacing the old direct `supabase.from('coaches').insert(...)` path, which only ever created a roster row with no real login (the coach's Supabase Auth account had to be created manually in the dashboard beforehand). Editing/deactivating/deleting an *existing* coach row is unaffected and still goes through direct table calls (owner-only, RLS-gated) — only *creating* a coach now requires the Edge Function, since only creation needs `auth.admin.createUser`.

---

## 15. PRODUCTION LAUNCH — 2026-06-19

**Status: LIVE — real student data only from this point forward.**

- All 19 build phases complete and verified.
- Sample/seed data cleared from database (students, attendance, payments, trials, events, event_availability, student_reports).
- Backup CSVs exported from Supabase before deletion.
- Coaches table intact: Sahil (owner), Sandeep Rawat (head), Jay (assistant), Priya (assistant).
- Financial tables untouched: expenses, emergency_fund_transactions, financial_notes, coach_attendance.
- Academy settings untouched: academy name, tagline, logo, training days config preserved.
- Storage buckets (student-photos, student-reports) may contain orphaned sample files — harmless, no DB rows reference them.
