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
`student_id, amount, paid_date, for_cycle, mode (cash/upi/online), note`
- `for_cycle` (e.g. `'2026-06'`) is the source of truth for fee-status computation — NOT `paid_date`'s calendar month.

### trials
`name, parent_phone, trial_date, status (pending/closed/not_closed/no_response), follow_up_date`

### events
`title, type (tournament/friendly), date, location, details, age_category (all/u10/u15/open, default 'all')`

### event_availability
`event_id, student_id, status (available/not_available/maybe/no_response)`

### coaches
`user_id (auth.users ref, no FK), name, role (owner/head/assistant), per_session_rate, login_email, is_active (bool, default true)`

### academy_settings
`academy_name, tagline, logo_url, training_days (text[]), academy_id (unique)`
- Storage bucket: `academy-assets` (public) — logos stored at `logos/main-logo.<ext>`

### coach_attendance
`coach_id, date, batch, session, confirmed_by_coach, disputed, verified`

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
| Full academy ops (students, fees, trials, payroll, financials, events) | ✓ | ✓ | ✗ |
| Mark attendance | ✓ | ✓ | ✓ |
| View coaches / Events | ✓ | ✓ | ✓ |
| Settings page | ✓ (admin tabs) | ✓ (read-only) | ✓ (read-only) |
| Add/edit/remove coaches | ✓ | ✗ | ✗ |
| Change coach roles | ✓ | ✗ | ✗ |
| Deactivate coach login | ✓ | ✗ | ✗ |
| Upload academy logo | ✓ | ✗ | ✗ |
| Edit academy name/settings | ✓ | ✗ | ✗ |
| Export CSV (danger zone) | ✓ | ✗ | ✗ |

`is_active = false` on a coaches row → login blocked (deactivated banner shown on login).

`usePermissions` hook is the single source of truth (18+ semantic flags incl. `canManageCoaches`, `canChangeRoles`, `canDeactivateCoach`, `canManageSettings`, `canUploadLogo`, `canExportData`, `canAccessDangerZone`, `canGenerateReport`). `PermissionRoute` layout route wraps head-only paths and redirects assistants to `/attendance`. `DefaultRedirect` sends each role to their correct home.

---

## 7. BUSINESS LOGIC

### Fee Billing
- Each student has a `billing_cycle_day` (1–31)
- Fee is due on that day each month
- Status ladder: `paid` → `due_soon` (≤2 days) → `due_today` → `overdue`
- Fee status is computed from whether a payment exists with `for_cycle = currentCycle` — never from `paid_date`'s calendar month (paying early/late must not corrupt status).
- Flexible-fee students (`fee_is_fixed = false`): PaymentForm leaves amount blank instead of pre-filling `monthly_fee`; fee-status tracking is otherwise identical.
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
    layout/       AppLayout, Sidebar, BottomNav, TopBar
    dashboard/    StatsCards, TrialAlertBar, ActionPanel, Charts, SoccerBall3D
    students/     StudentList, StudentCard, StudentForm, StudentProfile, ReportCardForm
    attendance/   AttendanceSheet, AttendanceToggle, AttendanceHistory
    fees/         FeeDashboard, FeeCard, PaymentForm, PaymentHistory, WhatsAppReminder
    trials/       TrialList, TrialCard, TrialForm, TrialResolve
    coaches/      CoachList, CoachAttendance, PayrollApproval
    financials/   RevenueFund, EmergencyFund, FinancialNotes
  pages/
    DashboardPage, StudentsPage, AttendancePage, FeesPage,
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
- **A render-phase `if (condition) { setState(...) }` guard is not a substitute for `useEffect`.** `PaymentForm`'s old reset-on-open logic re-ran on *every* render as long as `amount === ''` — harmless for fixed-fee students (amount becomes non-empty immediately) but for flexible-fee students (amount starts and can stay `''`) it silently wiped `note`/`paidDate`/`mode` back to defaults the moment the coach touched any other field first. Reset-on-open logic belongs in a `useEffect` keyed on a *stable* identity (`student?.id`, not the whole object) so it only fires when the drawer actually opens for a new student, not on every unrelated re-render.

---

## 13. KNOWN ISSUES

| Issue | Status |
|---|---|
| `THREE.Clock deprecated` warning from `useFrame` in `SoccerBall3D.tsx` | **Known · minor** — originates inside R3F/Three.js internals, does not affect functionality |
| `student-photos` Supabase Storage bucket | **Manual setup required if not already run** — SQL in section 14; without it photo upload throws a storage error |

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

## 15. PRODUCTION LAUNCH — 2026-06-19

**Status: LIVE — real student data only from this point forward.**

- All 19 build phases complete and verified.
- Sample/seed data cleared from database (students, attendance, payments, trials, events, event_availability, student_reports).
- Backup CSVs exported from Supabase before deletion.
- Coaches table intact: Sahil (owner), Sandeep Rawat (head), Jay (assistant), Priya (assistant).
- Financial tables untouched: expenses, emergency_fund_transactions, financial_notes, coach_attendance.
- Academy settings untouched: academy name, tagline, logo, training days config preserved.
- Storage buckets (student-photos, student-reports) may contain orphaned sample files — harmless, no DB rows reference them.
