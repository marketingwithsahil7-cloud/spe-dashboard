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
| status | TEXT | 'active' \| 'trial' \| 'closed' |
| join_date | DATE | |
| academy_id | UUID | Fixed: 00000000-...-000001 |

### attendance
`student_id, date, batch, present` — UNIQUE(student_id, date, batch)

### payments
`student_id, amount, paid_date, for_cycle, mode (cash/upi/online), note`

### trials
`name, parent_phone, trial_date, status (pending/closed/not_closed/no_response), follow_up_date`

### events
`title, type (tournament/friendly), date, location, details`

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

### students_missing_report_this_month (VIEW)
Active students who have no `student_reports` row for the current calendar month. Used by dashboard reminder card.

### SQL Functions
- `get_fee_status(p_student_id UUID)` → `(next_due_date, days_overdue, fee_status)`
  - fee_status: `'overdue'` | `'due_today'` | `'due_soon'` (≤3 days) | `'paid'`
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

---

## 7. BUSINESS LOGIC

### Fee Billing
- Each student has a `billing_cycle_day` (1–31)
- Fee is due on that day each month
- Status ladder: `paid` → `due_soon` (≤3 days) → `due_today` → `overdue`
- WhatsApp reminder: `wa.me/{phone}?text={encodeURIComponent(message)}`
- Hindi reminder template: `"Namaste 🙏 {parent_name} ji, {student_name} ka is mahine ka fee ₹{amount} abhi tak pending hai. Kripya jaldi pay karein. — Soccer Pro Elite Academy"`

### Trial Flow
`pending` → coach follows up → `closed` (joined) | `not_closed` (didn't join) | `no_response`
- `closed` trials can be auto-converted to `active` student

### Coach Fraud Prevention
Mark session → peer confirms → head approves → payout calculated

---

## 8. FILE STRUCTURE

```
src/
  components/
    ui/           Button, Card, Badge, Avatar, Modal, Drawer,
                  Input, Select, Toggle, Skeleton, CustomCursor
    layout/       AppLayout, Sidebar, BottomNav, TopBar
    dashboard/    StatsCards, TrialAlertBar, ActionPanel, Charts, SoccerBall3D
    students/     StudentList, StudentCard, StudentForm, StudentProfile
    attendance/   AttendanceSheet, AttendanceToggle, AttendanceHistory
    fees/         FeeDashboard, FeeCard, PaymentForm, PaymentHistory, WhatsAppReminder
    trials/       TrialList, TrialCard, TrialForm, TrialResolve
    coaches/      CoachList, CoachAttendance, PayrollApproval
  pages/
    DashboardPage, StudentsPage, AttendancePage, FeesPage,
    TrialsPage, CoachesPage, LoginPage
  hooks/
    useAuth, useStudents, useAttendance, usePayments,
    useTrials, useCoaches, useDashboard, useLenis, useGSAP, useMediaQuery
  lib/
    supabase.ts       Supabase client init
    database.types.ts Generated types (or manual)
    utils.ts          formatCurrency, formatDate, formatPhone, etc.
    constants.ts      BATCHES, FEE_STATUS, ROLES, WA_TEMPLATE
    animations.ts     Shared GSAP presets (cardEntrance, pageLoad, stagger)
  store/
    authStore.ts      Zustand: user, role, session, loading
  types/
    index.ts          All TypeScript interfaces matching DB schema
```

---

## 9. BUILD PHASES

- [x] **Phase 0:** Scaffold + Tailwind config + CLAUDE.md + supabase/schema.sql — COMPLETE
- [x] **Phase 1:** Supabase client + Auth (login page) + AppLayout shell — COMPLETE & VERIFIED
- [x] **Phase 2:** Dashboard (StatsCards, Charts, 3D soccer ball, TrialAlertBar, GSAP page-load timeline) — COMPLETE & VERIFIED
- [x] **Phase 3:** Students module (list with GSAP stagger, add/edit form, profile, photo upload) — COMPLETE & VERIFIED
- [x] **Phase 4:** Attendance (mark sheet, batch toggle, history, spring toggle animation) — COMPLETE & VERIFIED
- [x] **Phase 5:** Fees (due dashboard with overdue pulse, record payment, WhatsApp remind) — COMPLETE & VERIFIED
- [x] **Phase 6:** Trials (add trial, resolve with convert-to-student, status filters, GSAP stagger) — COMPLETE & VERIFIED
- [x] **Phase 7:** Coach attendance + payroll approval flow — COMPLETE & VERIFIED
- [x] **Phase 8:** Tournaments/Events + player availability — COMPLETE & VERIFIED
- [x] **Phase 8.5:** BUG FIX — Page blank on tab switch — FIXED (removed AnimatePresence from AppLayout; each page owns its own motion.div entrance)
- [x] **Phase 9:** Role-Based Access Control — COMPLETE & VERIFIED
- [x] **Phase 10:** Financial System — COMPLETE & VERIFIED (2026-06-15)
  - Revenue Fund: monthly fee collection vs expenses, 6-month trend chart, category breakdown
  - Emergency Fund: ₹4,500 initial balance, deposit/withdrawal/repayment tracking, pending advance alerts
  - Notes tab: financial diary for misc entries (head coach only, RLS gated)
  - expenses table enhanced: withdrawn_by, is_cross_fund, purpose, expected_repayment_date columns
  - financial_notes table created with head-coach RLS policy
  - Bug fixed: financial_notes in Promise.all caused all data to show ₹0; moved to non-fatal separate query
  - Head coach only access (Jay / assistants cannot see); canSeeFinancials RBAC gate
- [x] **Phase 11:** UX Improvements Batch — COMPLETE & VERIFIED (2026-06-15)
  - Student attendance history view (searchable + batch filter + per-student calendar + WhatsApp share)
  - Tue/Thu/Sat schedule lock + calendar picker (MiniCalendar popup, academy-day nav arrows)
  - Smart dynamic fee reminders (5 scenarios: due_soon/due_today/1-3d/4-7d/7+d overdue, English messages)
  - WhatsApp trial messages in English (psychological copywriting, 3 scenarios by days-since-trial)
  - Toast notification system (success/error/warning/info, auto-dismiss 3s, progress bar, slide-in)
  - ConfirmDialog component (glass modal, danger/default variants, Escape key, portal)
- [x] **Phase 12:** Visual Polish — COMPLETE & VERIFIED (2026-06-15)
  - [x] Task 1: Enhanced Login Page 3D Scene (LoginScene3D.tsx, split-screen R3F canvas)
  - [x] Task 2: Dashboard 3D Upgrade (particle trail, mouse parallax, Bloom, LIVE indicator, perspective grid)
  - [x] Task 3: Page-Specific Ambient 3D (AmbientBackground component, 6 variants, all pages)
  - [x] Task 4: Instagram Reel-Style Animations — pageVariants spring, Card 3D tilt, btn-burst, slot-machine stats, LoadingScreen; SuccessOverlay (20-particle burst, SVG checkmark draw, spring circle, portal) integrated in StudentForm, PaymentForm, TrialResolve
  - [x] Task 5: Mobile Experience Upgrade — BottomNav spring/indicator, swipe on StudentCard, pull-to-refresh hook+component, ripple on Button; build verified clean
  - [x] Task 6: Full Visual Polish Pass — Page transitions (slide+spring AnimatePresence wrapping Outlet only), Card 3D tilt (±5°, useTilt hook, skip mobile), Button spring (whileHover/whileTap, motion.button), Ambient CSS page glows (PageGlow.tsx, 6 color variants), List spring entrance (StudentCard scale 0.9→1 spring 280/20, TrialList back.out(1.7) stagger 0.06, FeeDashboard data-feecard-grid stagger), Attendance toggle ripple+shake (green ripple on present, red ripple+x-shake on absent), Skeleton green shimmer intensified (0.08→0.15), Drawer/Modal iOS scroll fix (position:fixed body lock), SuccessOverlay particle burst integrated. Zero TS errors, build 1.16s.
- [x] **Phase 13:** Penalty Kick Login Animation + Owner Role — COMPLETE & VERIFIED (2026-06-16)
  - **Task 1 — PenaltyScene.tsx (rewritten 2026-06-16):** Pure CSS + GSAP penalty kick — no R3F/WebGL on login page. Root cause of WebGL Context Lost crash: multiple Canvas instances (React.lazy remount + AmbientBackground) fought over the GPU. Fix: deleted all Three.js/R3F code from login; replaced with CSS goal post (border div + repeating-linear-gradient net), ⚽ emoji ball, 8 ambient particle divs. GSAP timeline on `triggerGoal()`: windup scale pulse → ball flies up into goal (y:-195, shrinks to 0.45×) → goal post green flash → screen flash → GOAL! elastic.out text → 8-confetti radial burst → scene fade → navigate 1.60s. `PenaltySceneHandle.triggerGoal()` via `useImperativeHandle` + `forwardRef`. Works on all devices. Build: ✓ 1.29s.
  - **Task 1 — Animation ref race fix (2026-06-16):** Root cause: `animationGate.current` was set *after* `await signInWithPassword`. Supabase fires `onAuthStateChange` during that await; `setUser()` triggered a re-render where `user=truthy`, `isLoading=false`, `animationGate=false` → render-phase `<Navigate>` fired → `LoginPage` returned Navigate → `PenaltyScene` never mounted → `penaltyRef.current = null`. Fix: (1) move `animationGate.current = true` to *before* the first await so the gate is set before any async work; (2) replace render-phase early return with `useEffect` redirect so `PenaltyScene` always renders and `penaltyRef` is always populated. Animation confirmed working.
  - **Task 2 — Owner Role (Sahil):** `coaches.role` constraint updated to `('owner','head','assistant')`. `coaches.is_active BOOLEAN DEFAULT true` added. Sahil set to `role='owner'`. `authStore` gained `isOwner()` + `isHeadOrOwner()` — `isHeadCoach()` is now an alias for `isHeadOrOwner()`. `usePermissions` expanded with 7 owner-only flags: `canManageCoaches`, `canChangeRoles`, `canDeactivateCoach`, `canManageSettings`, `canUploadLogo`, `canExportData`, `canAccessDangerZone`. `useAuth` checks `is_active === false` → signOut + `authError='deactivated'`. LoginPage shows red "Access revoked" banner for deactivated coaches.
  - **Task 2 — Settings Page (`/settings`):** 3 tabs for Sahil (Academy/Coach Management/Danger Zone). Academy tab: editable name/tagline/logo upload (Supabase `academy-assets` bucket) + training days checkboxes. Coach tab: list with is_active toggle, inline edit (name/role/rate), delete (ConfirmDialog), + Add Coach form. Danger tab: export Students/Payments/Attendance as CSV download. All coaches see Settings in nav but non-owners get read-only view (profile card + academy name/tagline + app version). `academy_settings` table + `useAcademySettings` hook created. Sidebar logo area: shows `<img>` if `logo_url` set, else ShieldCheck icon. Academy name + tagline shown in sidebar. Build: ✓ 1.87s, zero TS errors.
- [x] **Phase 14:** Feature Additions — COMPLETE & VERIFIED (2026-06-16)
  - **Monthly Report PDF Download:** `jspdf` + `jspdf-autotable` installed. `src/lib/generateMonthlyReport.ts` — 5-section A4 PDF (Revenue Summary, Fee Collection Details, Expenses, Profit/Loss, Pending Fees). Dynamically imported in `FinancialsPage.tsx` via `import('../lib/generateMonthlyReport')` — keeps initial bundle clean. Green "Report" button in financials page header. Saves as `SPE_Report_<Month>_<Year>.pdf`. Build: ✓ 1.37s.
  - **Age Categories (U10/U15/Open):** SQL: `students.dob DATE` + `events.age_category TEXT` added. `src/lib/ageCategories.ts`: `getAge(dob)`, `getAgeCategory(dob)` → U10 (≤10), U15 (11–15), Open (16+). `Student` type gets `dob: string | null`; `Event` gets `age_category: string | null`; `StudentInput` gets `dob?: string | null`. `StudentForm.tsx`: Join Date + DOB side-by-side grid; live "Age X · U10" label below DOB input. `StudentCard.tsx`: ice-blue U10/U15/Open badge in badge row. `StudentList.tsx`: "All Ages / U10 / U15 / Open" filter tab row (ice-blue active style). `EventForm.tsx`: Type + Age Category side-by-side (All Ages / U10 Only / U15 Only / Open). `AvailabilityTracker.tsx`: "Message by Age Group" collapsible section — groups available students by U10/U15/Open, copy message per category + individual WA links per student. Build: ✓ 1.47s, zero TS errors.
- [x] **Phase 15:** PWA + Netlify Deploy — COMPLETE & VERIFIED (2026-06-17)
  - vite-plugin-pwa config (registerType: autoUpdate, Workbox runtime caching)
  - App icons — Node.js PNG generator (no deps), soccer ball design, 192/512/180px
  - netlify.toml + public/_redirects (SPA redirect + security headers + asset caching)
  - Manual chunk splitting: vendor-three, vendor-charts, vendor-gsap, vendor-motion, vendor-supabase, vendor-pdf
  - index.html: PWA meta, apple-mobile-web-app, dns-prefetch Supabase, preconnect Google Fonts
  - Build: ✓ 1.90s, zero TS errors, sw.js + workbox-*.js generated
- [x] **Phase 16:** Student Report Card PDF + WhatsApp Link Sharing — COMPLETE & VERIFIED (2026-06-18)
  - **DB:** `student_reports` table (id, student_id, month, year, skill_ratings JSONB, coach_remarks, pdf_url, created_by) + UNIQUE(student_id, month, year). RLS: head/owner full CRUD, assistant read-only. Storage bucket `student-reports` (public). View `students_missing_report_this_month` (active students with no report this month).
  - **PDF Generator:** `src/lib/generateReportCard.ts` — A4 portrait, pure jsPDF (no autoTable). Sections: dark header band, student info box with green left accent, attendance progress bar, skill ratings table (6 rows × custom drawn rating bars), fee status badge, coach's remarks box with green accent, overall progress summary, footer. `generateReportCard(params) → Promise<Blob>`. Dynamically imported to keep jsPDF out of initial bundle.
  - **Hook:** `src/hooks/useReports.ts` — fetches `student_reports` for a student, exposes `generateAndSave(params)` which: generates PDF blob → uploads to `student-reports/{studentId}/{year}-{MM}.pdf` → upserts DB record → returns `{ pdfUrl, whatsappUrl }`. WhatsApp message includes attendance stats, overall progress label, and public PDF link.
  - **Form:** `src/components/students/ReportCardForm.tsx` — Drawer with month/year selector (last 6 months), auto-fetched attendance stats for selected month, 6-skill star rating UI (lucide-react Star icons, ice-blue fill on hover/select), coach remarks textarea, "Generate & Share" footer button. Success state shows WhatsApp + View PDF buttons.
  - **StudentProfile.tsx:** Added `reports` tab (4th tab). `ReportsTab` sub-component shows past reports with mini star summary, skill breakdown grid, remarks preview, "Resend" WhatsApp button, "PDF" view button. Hero section gets "Report" button (head/owner only) → opens form drawer. `useReports` hook called at profile level, `generateAndSave` passed to drawer as prop.
  - **Dashboard card:** `MissingReportsCard` — shown after 25th of month when ≥1 active student lacks a report. Head/owner only. Queries `students_missing_report_this_month` view. Amber-bordered glass card with FileText icon → navigate to `/students`.
  - **`usePermissions`:** Added `canGenerateReport: headOrOwner` flag.
  - Build: ✓ 2.17s, zero TS errors. `generateReportCard` lands in its own 5.70 kB chunk (lazy-loaded alongside jsPDF's vendor-pdf bundle).

---

## 10. SAMPLE DATA

> **PRODUCTION LAUNCH — 2026-06-19**
> All sample/seed data was cleared from the database. The app is now live and ready for real student data entry.
> Backup CSVs of all seed data (students, attendance, payments, trials, events, event_availability, student_reports) were exported from Supabase before deletion.
> Coaches table was NOT cleared — Sahil (owner), Sandeep Rawat (head), Jay + Priya (assistant) remain.

~~Database contains development seed data:~~
~~- 20 students (18 active, 2 trial) — Indian names, real-looking +91 phones~~
~~- 4 coaches (Sahil = owner, Sandeep Rawat = head, Jay + Priya = assistant)~~
~~- 7 days of attendance (~80% rate)~~
~~- 2 months of payments (students 1–10 paid this month, 11–18 overdue — for testing)~~
~~- 2 trials (1 pending, 1 no_response)~~
~~- 1 upcoming friendly event~~

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

## 12. BUILD LOG

### Phases 0–8.5 (summary)
- **Phase 0:** Vite + React + TS scaffold, Tailwind design system, supabase/schema.sql (8 tables + 2 SQL functions + 20 seed students).
- **Phase 1:** Supabase client, Zustand auth store, login page (GSAP entrance + shake), AppLayout shell, all UI primitives (Button/Card/Badge/Avatar/Toggle/Modal/Drawer/Input/Select/Skeleton), useLenis + useMediaQuery + CustomCursor, ProtectedRoute.
- **Phase 2:** Dashboard — useDashboard hook (5 parallel queries), StatsCards (GSAP stagger + AnimatedNumber), TrialAlertBar (GSAP marquee), ActionPanel, Recharts BarChart + PieChart, SoccerBall3D (R3F + Bloom).
- **Phase 3:** Students — useStudents CRUD hook, StudentList (search/filter/sort), StudentCard (GSAP hover), StudentForm drawer (photo upload, billing slider), StudentProfile (Overview/Attendance/Payments tabs).
- **Phase 4:** Attendance — useAttendance hook (optimistic upsert), AttendanceToggle (GSAP spring), AttendanceSheet (bulk mark-all), AttendanceHistory (month heatmap).
- **Phase 5:** Fees — usePayments hook, FeeDashboard (overdue/due-today/paid tabs), FeeCard (pulse ring), PaymentForm drawer, WhatsApp Hindi reminders.
- **Phase 6:** Trials — useTrials hook, TrialList (5 status tabs), TrialCard, TrialForm + TrialResolve drawers (convert-to-student flow).
- **Phase 7:** Coaches — useCoaches hook, CoachList, CoachAttendance (mark + peer confirm), PayrollApproval (anti-fraud flags, bulk verify, payout).
- **Phase 8:** Events — useEvents hook (SELECT→INSERT/UPDATE upsert fix), EventCard + EventForm + AvailabilityTracker drawers, EventsPage filters. **Phase 8.5:** Fixed blank-screen bug — removed AnimatePresence from AppLayout; each page now owns `<motion.div>` entrance.

### Phase 9 — Complete & Verified (2026-06-14)

RBAC fully enforced. `usePermissions` hook (18 semantic flags) is the single source of truth for all access decisions. `PermissionRoute` layout route wraps head-only paths (Dashboard, Students, Fees, Trials) and redirects assistants to `/attendance`. `DefaultRedirect` sends each role to their correct home on root `/` and unknown paths. Sidebar + BottomNav filter nav items by permission key — assistants see Attendance, Coaches, Events only. All 10 components that previously prop-drilled `isHeadCoach` now call `usePermissions()` directly (TrialCard, FeeCard, EventCard, EventsPage, CoachesPage, FeeDashboard, TrialList, StudentCard, StudentList, StudentProfile). `MyCoachPanel` is the assistant's personal view on the Coaches page — shows their own sessions, earnings, and a CTA to confirm attendance; hides all other coaches' financial data. `authStore` gained `authError` field that survives `logout()` so `LoginPage` can show an amber "Account not registered" banner when a Supabase Auth user has no matching coach row (the previous unsafe head-coach fallback is removed). LoginPage post-login redirect is now role-aware. Sandeep Rawat + Jay auth accounts created and `user_id` linked in DB. `tsc --noEmit` exits 0.

### Phase 10 — Complete & Verified (2026-06-15)

Financial system live: `/financials` route (head coach only), three tabs — Revenue Fund, Emergency Fund, Notes.

**DB schema:** `expenses` table (title, amount, fund_type, category, note, recorded_by, withdrawn_by, is_cross_fund, purpose, expected_repayment_date) + `emergency_fund_transactions` table (type, amount, transaction_date, coach_id, purpose, note, repaid, repaid_amount, repaid_date) + `financial_notes` table (content, author_id). All tables gated by head-coach RLS policy.

**Revenue Fund tab:** 4 stat cards (Collected, Expenses, Net Revenue, Expense Count); 6-month expense trend BarChart; month/year filter; expense list with inline edit/delete; category breakdown progress bars; Add/Edit Expense Drawer (category pills + cross-fund checkbox for Revenue; coach dropdown + purpose + repayment date for Emergency).

**Emergency Fund tab:** hero balance card (green >5000, amber 1000–5000, red <1000); Pending Repayments for `purpose='personal_advance'`; per-row inline repayment form; Transaction History with All/Deposits/Withdrawals tabs; Add Transaction Drawer.

**Notes tab:** textarea diary (Ctrl+Enter); notes list with author name + timestamp; inline delete with confirm.

**Personal Advance Alert:** amber banner (all tabs), one line per pending advance, goes red after 30 days.

**Cross-fund logic:** Revenue expense + cross-fund checkbox → auto-inserts emergency withdrawal with `purpose='academy_expense'`.

`useFinancials(month, year)` hook: 4 parallel Supabase queries; `financial_notes` as non-fatal sequential query; 6 async expense-trend queries; mutations: addExpense, updateExpense, deleteExpense, addEmergencyTransaction, markRepaid, addNote, deleteNote. Enhancement columns conditionally spread to avoid failures on older schema.

Files: `src/hooks/useFinancials.ts`, `src/components/financials/RevenueFund.tsx`, `src/components/financials/EmergencyFund.tsx`, `src/components/financials/FinancialNotes.tsx`, `src/pages/FinancialsPage.tsx`. Updated: `src/types/index.ts`, `src/App.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/layout/BottomNav.tsx`.

### Phase 11 — UX Improvements — Complete & Verified (2026-06-15)

Student Attendance Report with shareable WhatsApp summary. Tue/Thu/Sat schedule lock with MiniCalendar popup. 5-scenario smart English fee reminders (friendly → final notice). 3-scenario psychological trial follow-up messages. Toast notification system (Zustand-powered, success/error/warning/info, auto-dismiss 3s, progress bar, slide-in). ConfirmDialog component (glass modal, danger/default variants, Escape key, portal).

### Phase 12 — Visual Polish — COMPLETE & VERIFIED (2026-06-15)

- **Task 1 ✅:** `LoginScene3D.tsx` — split-screen R3F canvas on login page, floating geometry + particle field.
- **Task 2 ✅:** Dashboard 3D Upgrade — particle trail, mouse parallax, Bloom, LIVE indicator, perspective grid.
- **Task 3 ✅:** `AmbientBackground` component — 6 page variants (dashboard/students/attendance/fees/trials/coaches), all pages wrapped.
- **Task 4 ✅:** `pageVariants` spring physics, Card 3D tilt, `btn-burst` keyframe, slot-machine stat counter, `LoadingScreen.tsx`; `SuccessOverlay.tsx` — 20-particle radial burst (GSAP `fromTo`, random color/angle/size), spring-bounce circle (back.out 2.2), SVG checkmark strokeDashoffset draw, text slide-in, auto-dismiss → `onDone`; integrated into `StudentForm`, `PaymentForm`, `TrialResolve` via `showSuccess` state pattern. Renders via `createPortal` to `document.body` at z-10000.
- **Task 5 ✅:** BottomNav spring indicator, swipe gesture on StudentCard, `usePullToRefresh` hook + `PullToRefreshWrapper` component, ripple effect on Button. Build verified clean.
- **Task 6 ✅:** Full visual polish pass — `PageTransitionWrapper` in `AppLayout` (AnimatePresence wraps Outlet only, mode="wait" initial={false}, key=pathname); `useTilt` hook (±5°, skip mobile); `Button` → `motion.button` (whileHover/whileTap spring 500/28); `PageGlow.tsx` (6 CSS radial gradient variants, pointer-events-none, -z-10); StudentCard entrance upgraded to spring 280/20 scale 0.9→1; TrialList stagger → back.out(1.7) 0.06s; FeeDashboard `data-feecard-grid` individual card stagger; AttendanceToggle radial ripple (green/red) + x-shake on absent; `.skeleton` green shimmer 0.08→0.15; `Drawer`/`Modal` scroll lock rewritten (position:fixed + scrollY restore) + overscroll-contain + -webkit-overflow-scrolling:touch. Zero TS errors. Build: `✓ 1.16s`.

### Phase 13 — Penalty Kick Login + Owner Role — Complete & Verified (2026-06-16)

**Penalty kick animation:** `PenaltyScene.tsx` rewritten as pure CSS + GSAP (no R3F/WebGL on login page — multiple Canvas instances caused WebGL Context Lost crash). CSS goal post + ⚽ emoji ball + 8 ambient particles. GSAP timeline: windup → ball flies into goal → post flash → screen flash → GOAL! elastic text → confetti burst → fade → navigate at 1.60s. Exposed via `useImperativeHandle` + `forwardRef`. Race condition fixed: `animationGate.current = true` moved to before first `await` so `onAuthStateChange` cannot fire Navigate before `PenaltyScene` mounts. `useEffect`-based redirect replaces render-phase `<Navigate>`. Build: ✓ 1.29s.

**Owner role:** `coaches.role` now supports `'owner'` | `'head'` | `'assistant'`. `authStore` gained `isOwner()` + `isHeadOrOwner()`. `usePermissions` has 7 owner-only flags. Deactivated coaches see a red "Access revoked" banner on login.

**Settings page (`/settings`):** 3 tabs for owner (Academy / Coach Management / Danger Zone). Academy: name, tagline, logo upload to `academy-assets` Supabase bucket + training days checkboxes. Coach Management: is_active toggle, inline edit, delete with ConfirmDialog, Add Coach form. Danger Zone: CSV export for Students / Payments / Attendance. Non-owners see read-only profile + academy info. `useAcademySettings` hook + `academy_settings` table. Build: ✓ 1.87s.

### Phase 14 — Feature Additions + Bug Fixes — Complete & Verified (2026-06-17)

**Monthly PDF Report:** `jspdf` + `jspdf-autotable` packages added. `src/lib/generateMonthlyReport.ts` — A4 portrait, 5 sections: (1) Revenue Summary stats, (2) Fee Collection table with student names + mode + cycle, (3) Expenses table with category + fund type, (4) Profit/Loss with manual verification line, (5) Pending Fees with days overdue. Dynamically imported via `import('../lib/generateMonthlyReport')` in `FinancialsPage.tsx` — jsPDF bundle (434 kB) excluded from initial load. Green "Report" button in financials header with loading spinner. Saves as `SPE_Report_June_2026.pdf`. Build: ✓ 1.37s.

**Age Categories (U10 / U15 / Open):** DB columns `students.dob DATE` + `events.age_category TEXT` added via SQL. `src/lib/ageCategories.ts`: `getAge(dob)` + `getAgeCategory(dob)` — U10 ≤10 yrs, U15 11–15 yrs, Open 16+. `Student` type gets `dob: string | null`; `Event` gets `age_category: string | null`; `StudentInput` gets `dob?: string | null`. `StudentForm.tsx`: Join Date + DOB side-by-side grid, live "Age 12 · U15" label auto-calculates. `StudentCard.tsx`: ice-blue U10/U15/Open badge in badge row. `StudentList.tsx`: "All Ages / U10 / U15 / Open" filter tab row. `EventForm.tsx`: Type + Age Category selectors side-by-side. `AvailabilityTracker.tsx`: collapsible "Message by Age Group" section — groups available players by category, copy-message button per group + individual WA links. Build: ✓ 1.47s.

**Events INSERT RLS bug fix:** RLS `INSERT` policy on `events` table was missing `WITH CHECK (true)` — all authenticated inserts were silently rejected. Fixed by dropping and recreating the policy with `WITH CHECK (true)`. `addEvent()` in `useEvents.ts` also now defaults `age_category` to `'all'` if null. `EventForm.tsx` validates that type is selected before save.

**Drawer/Modal scroll fix — app-wide (2026-06-17):** Three-part fix applied to every form drawer and Modal.tsx: (1) **`Drawer.tsx` completely rewritten** — panel is `position:fixed` sibling of backdrop (not child) to prevent Framer Motion's `will-change:transform` from creating a containing block; scrollable body uses inline `flex:1, minHeight:0, overflowY:'auto', WebkitOverflowScrolling:'touch'` with `data-drawer-scroll="true"` attribute; pinned `footer?` prop for Cancel/Save buttons. (2) **Lenis `prevent` callback** in `useLenis.ts` — skips wheel-event interception for any element inside `[data-drawer-scroll]`, so native scroll handles it. (3) **Footer buttons extracted** from scrollable children to `footer` prop in all 6 drawer forms (`PaymentForm`, `TrialForm`, `TrialResolve`, `EventForm`, `EmergencyFund.TransactionDrawer`, `RevenueFund.ExpenseFormDrawer`) + `StudentForm`. (4) **`Modal.tsx` body div** patched with `minHeight:0` inline + `data-drawer-scroll` attribute. Key CSS insight: `flex-1` alone sets `flex-shrink:1` but `min-height:auto` (browser default) prevents shrinking below content size — `minHeight:0` overrides this and is the critical unlock. Build: ✓ 1.57s.

### Phase 15 — PWA + Netlify Deploy — Complete & Verified (2026-06-17)

**vite.config.ts:** `VitePWA` plugin added with `registerType: 'autoUpdate'`. Workbox runtime caching: `NetworkFirst` for Supabase API (5-min TTL, 10s network timeout), `CacheFirst` for Google Fonts (1-year TTL) + images (30-day TTL), `StaleWhileRevalidate` for JS/CSS static assets. Manual chunks (function form — object form causes TS2769 with this Rollup version): vendor-three (Three.js + R3F + postprocessing), vendor-charts (Recharts), vendor-gsap (GSAP), vendor-motion (Framer Motion), vendor-supabase (@supabase/supabase-js), vendor-pdf (jsPDF).

**PWA manifest:** name "Soccer Pro Elite", short_name "SPE", standalone display, portrait orientation, dark theme/bg `#0A0A0F`. Icons: 192px + 512px PNG both with `purpose: 'any'` + `purpose: 'maskable'` as separate entries (combined `any maskable` is Lighthouse-deprecated).

**App icons — `scripts/generate-icons.mjs`:** Zero-dependency Node.js PNG generator using only built-in `zlib.deflateSync` + `Buffer`. Produces valid RGBA PNG (IHDR+IDAT+IEND chunks with proper CRC32). Design: `#0A0A0F` background + `#00FF87` filled circle + classic soccer-ball pentagon pattern (5 dark circles at 72° / ballR×0.54 distance + 1 central dark circle) + top-left highlight. Generates `public/icons/icon-192.png` (2.7 kB), `icon-512.png` (9.7 kB), `apple-touch-icon.png` (2.6 kB).

**index.html:** Updated title to "Soccer Pro Elite". Added: `viewport-fit=cover`, `theme-color #0A0A0F`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style: black-translucent`, `apple-mobile-web-app-title: SPE`, `apple-touch-icon` link, `preconnect` to fonts.googleapis.com + fonts.gstatic.com, `dns-prefetch` for `%VITE_SUPABASE_URL%` (Vite env substitution in HTML).

**netlify.toml:** `command = "npm run build"`, `publish = "dist"`, Node 20. Security headers for `/*`: X-Frame-Options DENY, X-Content-Type-Options nosniff, XSS-Protection, Referrer-Policy, Permissions-Policy. Asset caching: `/assets/*` → `max-age=31536000, immutable`; `/icons/*` → `max-age=86400`; `/sw.js` + `/workbox-*.js` → `no-cache` (service worker must always revalidate).

**public/_redirects:** `/* /index.html 200` — Netlify SPA catch-all (redundant with netlify.toml but belt-and-suspenders).

**Build output:** 1.90s clean build. vendor-three 951KB / vendor-charts 360KB / vendor-pdf 430KB — all lazy-loaded so initial bundle stays lean (88KB gzip for main index.js). Service worker precaches 71 entries (3.17 MB). `tsc --noEmit` exits 0.

---

## 12.1 — Pre-Launch Fixes (2026-06-28) — COMPLETE & VERIFIED

Four production-critical fixes applied before go-live.

**Fix 1 — Join Date nullable:**
- `Student.join_date` type changed from `string` to `string | null` (DB column was already nullable; only TS types needed updating).
- `formatDate()` in `utils.ts` updated to accept `null | undefined` → returns `'—'` instead of crashing.
- `StudentForm.tsx`: default `joinDate: ''` (not today), added `joinDateUnknown: boolean` field + "Don't know exact date" checkbox — when checked, date input disables and `join_date` saves as `null`.
- `useStudents.ts` `addStudent`: `join_date` default removed; saves `null` if not provided.
- `StudentProfile.tsx` line 699: `daysSinceJoined` guarded against null → shows `'—'` if no join date.
- `StudentList.tsx` sort: `new Date(b.join_date ?? 0)` guards against null in join_date sort.

**Fix 2 — Fee Due Date Logic (critical):**
- Root cause: `paidThisMonth` set was built from `paid_date` within current calendar month — a student paying next month's fee early would erroneously appear as "paid" for the current month, and vice versa.
- Fix: payment query in both `useStudents.ts` and `StudentProfile.tsx` now uses `.eq('for_cycle', currentCycle)` (e.g. `'2026-06'`) to check if the current billing cycle is paid.
- Due-soon threshold tightened from 3 days to 2 days (per business requirement).
- Both copies of `computeFeeStatus` (`useStudents.ts` + `StudentProfile.tsx`) updated identically.

**Fix 3 — App/Scroll Stuck:**
- Lenis smooth-scroll was not paused during drawer body-lock, causing scroll position desync after drawer close (page appeared "stuck").
- `useLenis.ts`: Lenis instance exposed as `window.__lenis`.
- `Drawer.tsx`: calls `lenis.stop()` before body lock and `lenis.start()` in cleanup — smooth scroll correctly resumes after drawer closes.
- `StudentForm.tsx`: removed unused `format` import (was causing TS error after `TODAY` constant was removed).

**Fix 4 — Payment Invoice PDF + WhatsApp:**
- New `src/lib/generateInvoice.ts`: receipt-style PDF (148×210mm) using jsPDF — dark header with academy name, hero amount in grass green, student details box, payment details box, next due date, footer with coach name. Dynamically imported.
- `PaymentForm.tsx` rewritten: `onSave` return type changed to `Promise<Payment>`; after save succeeds, replaces form with a success view (checkmark, amount, date/mode summary); invoice generates in background (non-blocking) — if success: "View Invoice" + "WhatsApp" + "Done" buttons appear; if fail: just "Done".
- WhatsApp message includes student name, amount, for-month, and public PDF link.
- Storage bucket `payment-invoices` required — run SQL in section 14.
- `FeeDashboard.tsx` `handleSavePayment` updated to return `Payment` from `addPayment`.
- Build: ✓ 2.10s, zero TS errors. Pushed to GitHub: commit `0496cf9`.

**Fix 5 — Invoice PDF rendering bugs (2026-06-28) — commit `79bd55c`:**
- **Rupee symbol broken:** `₹` (U+20B9) is outside jsPDF's built-in Helvetica Latin-1 charset → glyph renders as superscript junk. Replaced all instances with `Rs.` prefix (`Rs. 13,000`). Single centered `text()` call for the hero amount fixes the "superscript 1" misalignment caused by multi-call positioning drift.
- **Emoji broken:** `⚽` and `✓` are also outside Latin-1 → render as garbage bytes (`&½` etc). Removed all emoji from PDF. PAID badge uses plain "PAID" text in a green pill. Footer is "Thank you for your payment!" — no emoji.
- **Layout rebuild:** Replaced hardcoded y positions with a calculated yPos variable. Sections: header band 44mm → amount+label 28mm → player card 41mm → payment card 34mm → next-due bar 12mm → footer at ~200mm. All verified to fit within 210mm with clear breathing gaps between sections.
- **Dual gray contrast levels:** `GR [148,163,184]` for labels on dark card backgrounds; `SGR [80,96,115]` for sub-text on white body — appropriate contrast for each surface.

**Fix 6 — Share PDF via Web Share API (2026-06-28) — commit `3c08cca`:**
- **New `src/lib/sharePdf.ts`:** `sharePdfFile(blob, fileName, title, text)` — calls `navigator.canShare({ files })` to test mobile file-share support; if available, invokes `navigator.share()` which opens the OS share sheet (WhatsApp etc. with the actual PDF attached); if not supported (desktop/old browser), falls back to `URL.createObjectURL()` + `<a download>` trigger. `AbortError` (user cancelled share sheet) returns `{ success: false, method: 'cancelled' }` — no error toast. Chunk size: 1.02 kB.
- **`PaymentForm.tsx`:** Success footer updated — "Share PDF" (primary, green, Share2 icon) replaces old "View Invoice"; "WhatsApp Link" (secondary) kept as fallback. `InvoiceResult` extended with `pdfBlob: Blob`; `buildInvoice` returns the blob alongside pdfUrl+whatsappUrl so no second Supabase download is needed. `useToast` added for share feedback. Small hint text: "Share PDF opens native share sheet on mobile".
- **`ReportCardForm.tsx`:** Same 3-button pattern (Share PDF / WhatsApp Link / View PDF / Done). `onGenerate` prop + `result` state type extended with `pdfBlob: Blob`. `handleShareReport` uses `sharePdfFile` with filename `Report_{Name}_{Month_Year}.pdf`. Toast on success/error.
- **`useReports.ts`:** `generateAndSave` return type extended to `{ pdfUrl, whatsappUrl, pdfBlob: Blob }` — blob available immediately post-generation.
- Requires HTTPS (Netlify already provides). Works on Android Chrome / iOS Safari 15+. Desktop shows download fallback.
- Build: ✓ 3.57s, zero TS errors.

---

## 13. KNOWN ISSUES

| Issue | Status |
|---|---|
| `THREE.Clock deprecated` warning from `useFrame` in `SoccerBall3D.tsx` | **Known · minor** — originates inside R3F/Three.js internals, does not affect functionality |
| `student-photos` Supabase Storage bucket | **Manual setup required** — run SQL in section 14; without it photo upload throws a storage error |
| **TypeScript build errors — `npm run build` fails** | **FIXED (2026-06-15)** — All ~50 errors resolved. Key fixes: `Relationships: []` + `Views: {}` added to Database type; removed `<Database>` generic from `createClient()` (untyped client, hooks use explicit casts); fixed Framer Motion `ease` types, unused imports, `MonthSummary` type mismatch, `countUpAnimation` removed, `cn()` array args, `SoccerBall3D` useRef arg. `npm run build` exits 0 in 1.68s. |
| **Login penalty kick animation not firing** | **FIXED (2026-06-16)** — Race condition: `animationGate.current` was set after `await signInWithPassword`, so Supabase's `onAuthStateChange` could fire first, trigger `setUser()`, cause a re-render with gate=false, and fire the render-phase `<Navigate>` before `PenaltyScene` ever mounted. Fix: gate moved before the first await; render-phase early return replaced with `useEffect`. Animation confirmed working. |
| **WebGL Context Lost on login page** | **FIXED (2026-06-16)** — Multiple R3F Canvas instances exhausted GPU WebGL context limit. `PenaltyScene.tsx` rewritten as pure CSS + GSAP — no Canvas, no Three.js. R3F remains on Dashboard only (`SoccerBall3D`). |
| **Events INSERT failing — "Failed to save event"** | **FIXED (2026-06-17)** — Two root causes: (1) RLS INSERT policy on `events` table was missing `WITH CHECK (true)` — dropped and recreated the policy with `WITH CHECK (true)` to allow authenticated inserts. (2) `age_category: null` violated DB column constraint — `addEvent()` in `useEvents.ts` now defaults to `'all'` if not provided (`age_category: data.age_category \|\| 'all'`). `EventForm.tsx` also got type validation — save is blocked with "Please select an event type" if type is empty. |
| **Drawer scroll bug — all 8 components** | **FIXED (2026-06-17)** — Affected: `Drawer.tsx`, `Modal.tsx`, `StudentForm`, `PaymentForm`, `TrialForm`, `TrialResolve`, `EventForm`, `EmergencyFund` (TransactionDrawer), `RevenueFund` (ExpenseFormDrawer). Root cause: missing `minHeight:0` on flex scroll containers + Lenis intercepting all wheel events globally. Fixed with: (1) inline `minHeight:0` + `overflowY:'auto'` on every scrollable body, (2) `data-drawer-scroll="true"` attribute on scroll containers, (3) Lenis `prevent:(el)=>!!el.closest('[data-drawer-scroll]')` constructor option to skip wheel interception inside drawers, (4) `Drawer.tsx` panel rewritten as `position:fixed` sibling of backdrop to avoid Framer Motion containing-block issue, (5) footer buttons extracted to pinned `footer` prop in all drawer forms. Build: ✓ 1.57s. |
| **Payment save failing — "Failed to save payment"** | **FIXED (2026-06-17)** — Root cause: `payments` INSERT/UPDATE/DELETE RLS policies checked `coaches.role = 'head'` but Sahil's role was upgraded to `'owner'` in Phase 13 — every save was silently rejected. Same mismatch existed on `coach_attendance` UPDATE policy. Also discovered `coaches` table had **zero** write policies — Settings page add/edit/delete coach was silently failing. Fix: all three sets of policies dropped and recreated with `role IN ('owner', 'head')` for payments/coach_attendance; owner-only INSERT/UPDATE/DELETE policies added to coaches table. SQL run in Supabase SQL Editor. |
| **Coach attendance showing Pending for owner (Sahil)** | **FIXED (2026-06-17)** — When Sahil marked any coach's attendance it went to "Pending" waiting for peer confirmation. Fix: `markCoachAttendance` in `useCoaches.ts` now calls `useAuthStore.getState().isOwner()` inside the callback — if owner, inserts with `confirmed_by_coach: true, verified: true` (instant). Added `ownerConfirmAttendance(id)` mutation (sets both fields in one UPDATE). SectionA shows green "Confirm" button on any pending record when owner is viewing. SectionB ("All Sessions" for owner) loads all coaches' records and shows single "Confirm" button on pending rows — no dispute flow for owner. Non-owner flow unchanged. Build: ✓ 1.52s. |

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

Run this SQL to enable Fix 4 (payment invoice PDF generation):

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

- All 16 build phases complete and verified.
- Sample/seed data cleared from database (students, attendance, payments, trials, events, event_availability, student_reports).
- Backup CSVs exported from Supabase before deletion.
- Coaches table intact: Sahil (owner), Sandeep Rawat (head), Jay (assistant), Priya (assistant).
- Financial tables untouched: expenses, emergency_fund_transactions, financial_notes, coach_attendance.
- Academy settings untouched: academy name, tagline, logo, training days config preserved.
- Storage buckets (student-photos, student-reports) may contain orphaned sample files — harmless, no DB rows reference them.
