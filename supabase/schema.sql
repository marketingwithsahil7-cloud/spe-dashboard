-- ============================================================
-- Soccer Pro Elite — Supabase Schema
-- Paste this ENTIRE file into Supabase SQL Editor and run once
-- ============================================================

-- ============================================================
-- TABLE 1: students
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  photo_url        TEXT,
  batch            TEXT NOT NULL CHECK (batch IN ('5-6 PM', '6-7 PM', 'Both')),
  parent_name      TEXT,
  parent_phone     TEXT,
  billing_cycle_day INTEGER CHECK (billing_cycle_day >= 1 AND billing_cycle_day <= 31),
  monthly_fee      INTEGER DEFAULT 2000,
  status           TEXT DEFAULT 'active' CHECK (status IN ('active', 'trial', 'closed')),
  join_date        DATE DEFAULT CURRENT_DATE,
  academy_id       UUID DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 2: attendance
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  batch      TEXT NOT NULL,
  present    BOOLEAN DEFAULT FALSE,
  marked_by  UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, date, batch)
);

-- ============================================================
-- TABLE 3: payments
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID REFERENCES students(id) ON DELETE CASCADE,
  amount      INTEGER NOT NULL,
  paid_date   DATE DEFAULT CURRENT_DATE,
  for_cycle   TEXT,
  mode        TEXT CHECK (mode IN ('cash', 'upi', 'online')),
  note        TEXT,
  recorded_by UUID,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 4: trials
-- ============================================================
CREATE TABLE IF NOT EXISTS trials (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  photo_url      TEXT,
  parent_name    TEXT,
  parent_phone   TEXT,
  trial_date     DATE DEFAULT CURRENT_DATE,
  status         TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'closed', 'not_closed', 'no_response')),
  reason         TEXT,
  follow_up_date DATE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 5: events
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  type       TEXT CHECK (type IN ('tournament', 'friendly')),
  date       DATE,
  location   TEXT,
  details    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 6: event_availability
-- ============================================================
CREATE TABLE IF NOT EXISTS event_availability (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID REFERENCES events(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  status     TEXT DEFAULT 'no_response' CHECK (status IN ('available', 'not_available', 'maybe', 'no_response'))
);

-- ============================================================
-- TABLE 7: coaches
-- Note: user_id references auth.users conceptually but
-- FK constraint omitted as auth.users may not exist in all envs
-- ============================================================
CREATE TABLE IF NOT EXISTS coaches (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID, -- references auth.users(id)
  name             TEXT NOT NULL,
  role             TEXT CHECK (role IN ('head', 'assistant')),
  per_session_rate INTEGER DEFAULT 500,
  phone            TEXT,
  login_email      TEXT,
  academy_id       UUID DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 8: coach_attendance
-- ============================================================
CREATE TABLE IF NOT EXISTS coach_attendance (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id            UUID REFERENCES coaches(id) ON DELETE CASCADE,
  date                DATE NOT NULL,
  batch               TEXT,
  session             TEXT,
  marked_by           UUID,
  confirmed_by_coach  BOOLEAN DEFAULT FALSE,
  disputed            BOOLEAN DEFAULT FALSE,
  verified            BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FUNCTION: get_fee_status
-- Returns next_due_date, days_overdue, fee_status for a student
-- ============================================================
CREATE OR REPLACE FUNCTION get_fee_status(p_student_id UUID)
RETURNS TABLE(
  next_due_date DATE,
  days_overdue  INT,
  fee_status    TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_billing_cycle_day INTEGER;
  v_last_paid_date    DATE;
  v_next_due          DATE;
  v_today             DATE := CURRENT_DATE;
  v_this_month_due    DATE;
  v_days_over         INT;
BEGIN
  -- Fetch billing cycle day
  SELECT billing_cycle_day INTO v_billing_cycle_day
  FROM students
  WHERE id = p_student_id;

  -- Fetch last payment date
  SELECT MAX(paid_date) INTO v_last_paid_date
  FROM payments
  WHERE student_id = p_student_id;

  -- Build this month's due date, clamping to last day if overflow
  v_this_month_due := DATE_TRUNC('month', v_today)::DATE + (v_billing_cycle_day - 1);
  -- Handle months with fewer days (e.g., billing_cycle_day=31 in Feb)
  IF v_this_month_due > (DATE_TRUNC('month', v_today) + INTERVAL '1 month - 1 day')::DATE THEN
    v_this_month_due := (DATE_TRUNC('month', v_today) + INTERVAL '1 month - 1 day')::DATE;
  END IF;

  -- Determine next_due_date
  IF v_last_paid_date IS NULL THEN
    -- No payments yet: due date is this month's cycle day (or past)
    v_next_due := v_this_month_due;
  ELSIF v_last_paid_date >= v_this_month_due THEN
    -- Paid this cycle, push to next month
    v_next_due := (DATE_TRUNC('month', v_today) + INTERVAL '1 month')::DATE + (v_billing_cycle_day - 1);
    IF v_next_due > (DATE_TRUNC('month', v_today) + INTERVAL '2 months - 1 day')::DATE THEN
      v_next_due := (DATE_TRUNC('month', v_today) + INTERVAL '2 months - 1 day')::DATE;
    END IF;
  ELSE
    -- Not paid this cycle, due is this month's date
    v_next_due := v_this_month_due;
  END IF;

  v_days_over := GREATEST(0, v_today - v_next_due);

  next_due_date := v_next_due;
  days_overdue  := v_days_over;
  fee_status    := CASE
    WHEN v_days_over > 0                      THEN 'overdue'
    WHEN v_days_over = 0 AND v_today = v_next_due THEN 'due_today'
    WHEN v_next_due - v_today <= 3            THEN 'due_soon'
    ELSE 'paid'
  END;

  RETURN NEXT;
END;
$$;

-- ============================================================
-- FUNCTION: get_dashboard_stats
-- Returns aggregated academy stats
-- ============================================================
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE(
  total_active     INT,
  today_attendance INT,
  monthly_revenue  BIGINT,
  pending_fees     BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INT FROM students WHERE status = 'active'),
    (SELECT COUNT(*)::INT FROM attendance WHERE date = CURRENT_DATE AND present = TRUE),
    (SELECT COALESCE(SUM(amount), 0)::BIGINT FROM payments
     WHERE DATE_TRUNC('month', paid_date) = DATE_TRUNC('month', CURRENT_DATE)),
    (SELECT COALESCE(SUM(s.monthly_fee), 0)::BIGINT FROM students s
     WHERE s.status = 'active'
       AND NOT EXISTS (
         SELECT 1 FROM payments p
         WHERE p.student_id = s.id
           AND DATE_TRUNC('month', p.paid_date) = DATE_TRUNC('month', CURRENT_DATE)
       ));
END;
$$;

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE students           ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance         ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE trials             ENABLE ROW LEVEL SECURITY;
ALTER TABLE events             ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches            ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_attendance   ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- All authenticated users: SELECT all tables
CREATE POLICY "Authenticated users can read students"
  ON students FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Authenticated users can read attendance"
  ON attendance FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Authenticated users can read payments"
  ON payments FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Authenticated users can read trials"
  ON trials FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Authenticated users can read events"
  ON events FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Authenticated users can read event_availability"
  ON event_availability FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Authenticated users can read coaches"
  ON coaches FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Authenticated users can read coach_attendance"
  ON coach_attendance FOR SELECT TO authenticated USING (TRUE);

-- Attendance: authenticated INSERT
CREATE POLICY "Authenticated users can mark attendance"
  ON attendance FOR INSERT TO authenticated WITH CHECK (TRUE);

CREATE POLICY "Authenticated users can update attendance"
  ON attendance FOR UPDATE TO authenticated USING (TRUE);

-- Students: authenticated INSERT/UPDATE
CREATE POLICY "Authenticated users can insert students"
  ON students FOR INSERT TO authenticated WITH CHECK (TRUE);

CREATE POLICY "Authenticated users can update students"
  ON students FOR UPDATE TO authenticated USING (TRUE);

-- Trials: authenticated INSERT/UPDATE
CREATE POLICY "Authenticated users can insert trials"
  ON trials FOR INSERT TO authenticated WITH CHECK (TRUE);

CREATE POLICY "Authenticated users can update trials"
  ON trials FOR UPDATE TO authenticated USING (TRUE);

-- Events: authenticated INSERT/UPDATE
CREATE POLICY "Authenticated users can insert events"
  ON events FOR INSERT TO authenticated WITH CHECK (TRUE);

CREATE POLICY "Authenticated users can update events"
  ON events FOR UPDATE TO authenticated USING (TRUE);

-- Event availability: authenticated INSERT/UPDATE
CREATE POLICY "Authenticated users can insert event_availability"
  ON event_availability FOR INSERT TO authenticated WITH CHECK (TRUE);

CREATE POLICY "Authenticated users can update event_availability"
  ON event_availability FOR UPDATE TO authenticated USING (TRUE);

-- Payments: only head coaches can INSERT/UPDATE/DELETE
-- (checks coaches table for role='head' matching auth.uid())
CREATE POLICY "Head coaches can insert payments"
  ON payments FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coaches
      WHERE user_id = auth.uid() AND role = 'head'
    )
  );

CREATE POLICY "Head coaches can update payments"
  ON payments FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coaches
      WHERE user_id = auth.uid() AND role = 'head'
    )
  );

CREATE POLICY "Head coaches can delete payments"
  ON payments FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coaches
      WHERE user_id = auth.uid() AND role = 'head'
    )
  );

-- Coach attendance: anyone can INSERT, only head can UPDATE verified
CREATE POLICY "Authenticated users can insert coach_attendance"
  ON coach_attendance FOR INSERT TO authenticated WITH CHECK (TRUE);

CREATE POLICY "Head coaches can update coach_attendance verified"
  ON coach_attendance FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coaches
      WHERE user_id = auth.uid() AND role = 'head'
    )
  );

-- ============================================================
-- SAMPLE DATA — 4 Coaches
-- ============================================================
INSERT INTO coaches (id, name, role, per_session_rate, phone, login_email) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Sahil Khan',  'head',      600, '+919876543210', 'sahil@spe.com'),
  ('c1000000-0000-0000-0000-000000000002', 'Amit Sharma', 'head',      600, '+919876543211', 'amit@spe.com'),
  ('c1000000-0000-0000-0000-000000000003', 'Ravi Verma',  'assistant', 400, '+919876543212', 'ravi@spe.com'),
  ('c1000000-0000-0000-0000-000000000004', 'Priya Singh', 'assistant', 400, '+919876543213', 'priya@spe.com');

-- ============================================================
-- SAMPLE DATA — 20 Students
-- ============================================================
INSERT INTO students (id, name, batch, parent_name, parent_phone, billing_cycle_day, monthly_fee, status, join_date) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Arjun Mehta',       '5-6 PM', 'Rakesh Mehta',   '+919811001001', 1,  2000, 'active', CURRENT_DATE - INTERVAL '5 months'),
  ('a1000000-0000-0000-0000-000000000002', 'Dev Patel',         '5-6 PM', 'Suresh Patel',   '+919811001002', 5,  2500, 'active', CURRENT_DATE - INTERVAL '4 months'),
  ('a1000000-0000-0000-0000-000000000003', 'Kabir Joshi',       '5-6 PM', 'Anand Joshi',    '+919811001003', 10, 2000, 'active', CURRENT_DATE - INTERVAL '6 months'),
  ('a1000000-0000-0000-0000-000000000004', 'Rohan Gupta',       '5-6 PM', 'Vijay Gupta',    '+919811001004', 15, 1500, 'active', CURRENT_DATE - INTERVAL '3 months'),
  ('a1000000-0000-0000-0000-000000000005', 'Ishaan Tyagi',      '5-6 PM', 'Deepak Tyagi',   '+919811001005', 20, 2000, 'active', CURRENT_DATE - INTERVAL '2 months'),
  ('a1000000-0000-0000-0000-000000000006', 'Veer Malhotra',     '5-6 PM', 'Manoj Malhotra', '+919811001006', 25, 2500, 'active', CURRENT_DATE - INTERVAL '5 months'),
  ('a1000000-0000-0000-0000-000000000007', 'Siddharth Nair',    '5-6 PM', 'Pradeep Nair',   '+919811001007', 1,  2000, 'active', CURRENT_DATE - INTERVAL '1 month'),
  ('a1000000-0000-0000-0000-000000000008', 'Aarav Kapoor',      '5-6 PM', 'Rohit Kapoor',   '+919811001008', 5,  1500, 'active', CURRENT_DATE - INTERVAL '4 months'),
  ('a1000000-0000-0000-0000-000000000009', 'Yash Agarwal',      '5-6 PM', 'Sanjay Agarwal', '+919811001009', 10, 2000, 'active', CURRENT_DATE - INTERVAL '3 months'),
  ('a1000000-0000-0000-0000-000000000010', 'Nikhil Bansal',     '5-6 PM', 'Alok Bansal',    '+919811001010', 15, 2500, 'active', CURRENT_DATE - INTERVAL '6 months'),
  ('a1000000-0000-0000-0000-000000000011', 'Vivaan Choudhary',  '6-7 PM', 'Mohan Choudhary','+919811001011', 20, 2000, 'active', CURRENT_DATE - INTERVAL '5 months'),
  ('a1000000-0000-0000-0000-000000000012', 'Rehan Sheikh',      '6-7 PM', 'Imran Sheikh',   '+919811001012', 25, 2000, 'active', CURRENT_DATE - INTERVAL '2 months'),
  ('a1000000-0000-0000-0000-000000000013', 'Aryan Mishra',      '6-7 PM', 'Kiran Mishra',   '+919811001013', 1,  1500, 'active', CURRENT_DATE - INTERVAL '4 months'),
  ('a1000000-0000-0000-0000-000000000014', 'Dhruv Saxena',      '6-7 PM', 'Anil Saxena',    '+919811001014', 5,  2000, 'active', CURRENT_DATE - INTERVAL '6 months'),
  ('a1000000-0000-0000-0000-000000000015', 'Parth Pandey',      '6-7 PM', 'Ramesh Pandey',  '+919811001015', 10, 2500, 'active', CURRENT_DATE - INTERVAL '3 months'),
  ('a1000000-0000-0000-0000-000000000016', 'Kian Oberoi',       '6-7 PM', 'Raj Oberoi',     '+919811001016', 15, 2000, 'active', CURRENT_DATE - INTERVAL '1 month'),
  ('a1000000-0000-0000-0000-000000000017', 'Zubin Mistry',      '6-7 PM', 'Feroze Mistry',  '+919811001017', 20, 2000, 'active', CURRENT_DATE - INTERVAL '5 months'),
  ('a1000000-0000-0000-0000-000000000018', 'Sameer Qureshi',    '6-7 PM', 'Naveen Qureshi', '+919811001018', 25, 1500, 'active', CURRENT_DATE - INTERVAL '2 months'),
  ('a1000000-0000-0000-0000-000000000019', 'Tanveer Ansari',    '6-7 PM', 'Salim Ansari',   '+919811001019', 1,  2000, 'trial',  CURRENT_DATE - INTERVAL '5 days'),
  ('a1000000-0000-0000-0000-000000000020', 'Laksh Verma',       '5-6 PM', 'Sunil Verma',    '+919811001020', 5,  2000, 'trial',  CURRENT_DATE - INTERVAL '3 days');

-- ============================================================
-- SAMPLE DATA — Attendance (last 7 days, ~80% rate)
-- ============================================================
DO $$
DECLARE
  v_student RECORD;
  v_day     INT;
  v_date    DATE;
  v_present BOOLEAN;
BEGIN
  FOR v_student IN SELECT id, batch FROM students WHERE status = 'active' LOOP
    FOR v_day IN 0..6 LOOP
      v_date := CURRENT_DATE - v_day;
      -- ~80% attendance: present if random > 0.2
      v_present := (random() > 0.2);
      INSERT INTO attendance (student_id, date, batch, present)
      VALUES (v_student.id, v_date, v_student.batch, v_present)
      ON CONFLICT (student_id, date, batch) DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$;

-- ============================================================
-- SAMPLE DATA — Payments (last 2 months, some overdue)
-- Students 1-14 paid last month, students 1-10 paid this month
-- Students 15-18 are overdue (test overdue logic)
-- ============================================================

-- Last month payments for students 1-14
INSERT INTO payments (student_id, amount, paid_date, for_cycle, mode) VALUES
  ('a1000000-0000-0000-0000-000000000001', 2000, DATE_TRUNC('month', CURRENT_DATE)::DATE - INTERVAL '1 month' + INTERVAL '2 days', 'May 2025', 'upi'),
  ('a1000000-0000-0000-0000-000000000002', 2500, DATE_TRUNC('month', CURRENT_DATE)::DATE - INTERVAL '1 month' + INTERVAL '3 days', 'May 2025', 'cash'),
  ('a1000000-0000-0000-0000-000000000003', 2000, DATE_TRUNC('month', CURRENT_DATE)::DATE - INTERVAL '1 month' + INTERVAL '1 days', 'May 2025', 'upi'),
  ('a1000000-0000-0000-0000-000000000004', 1500, DATE_TRUNC('month', CURRENT_DATE)::DATE - INTERVAL '1 month' + INTERVAL '4 days', 'May 2025', 'online'),
  ('a1000000-0000-0000-0000-000000000005', 2000, DATE_TRUNC('month', CURRENT_DATE)::DATE - INTERVAL '1 month' + INTERVAL '2 days', 'May 2025', 'cash'),
  ('a1000000-0000-0000-0000-000000000006', 2500, DATE_TRUNC('month', CURRENT_DATE)::DATE - INTERVAL '1 month' + INTERVAL '5 days', 'May 2025', 'upi'),
  ('a1000000-0000-0000-0000-000000000007', 2000, DATE_TRUNC('month', CURRENT_DATE)::DATE - INTERVAL '1 month' + INTERVAL '1 days', 'May 2025', 'upi'),
  ('a1000000-0000-0000-0000-000000000008', 1500, DATE_TRUNC('month', CURRENT_DATE)::DATE - INTERVAL '1 month' + INTERVAL '3 days', 'May 2025', 'cash'),
  ('a1000000-0000-0000-0000-000000000009', 2000, DATE_TRUNC('month', CURRENT_DATE)::DATE - INTERVAL '1 month' + INTERVAL '2 days', 'May 2025', 'online'),
  ('a1000000-0000-0000-0000-000000000010', 2500, DATE_TRUNC('month', CURRENT_DATE)::DATE - INTERVAL '1 month' + INTERVAL '1 days', 'May 2025', 'upi'),
  ('a1000000-0000-0000-0000-000000000011', 2000, DATE_TRUNC('month', CURRENT_DATE)::DATE - INTERVAL '1 month' + INTERVAL '4 days', 'May 2025', 'cash'),
  ('a1000000-0000-0000-0000-000000000012', 2000, DATE_TRUNC('month', CURRENT_DATE)::DATE - INTERVAL '1 month' + INTERVAL '2 days', 'May 2025', 'upi'),
  ('a1000000-0000-0000-0000-000000000013', 1500, DATE_TRUNC('month', CURRENT_DATE)::DATE - INTERVAL '1 month' + INTERVAL '3 days', 'May 2025', 'online'),
  ('a1000000-0000-0000-0000-000000000014', 2000, DATE_TRUNC('month', CURRENT_DATE)::DATE - INTERVAL '1 month' + INTERVAL '1 days', 'May 2025', 'cash');

-- This month payments for students 1-10 only (11-18 are due/overdue)
INSERT INTO payments (student_id, amount, paid_date, for_cycle, mode) VALUES
  ('a1000000-0000-0000-0000-000000000001', 2000, DATE_TRUNC('month', CURRENT_DATE)::DATE + INTERVAL '1 day',  'Jun 2025', 'upi'),
  ('a1000000-0000-0000-0000-000000000002', 2500, DATE_TRUNC('month', CURRENT_DATE)::DATE + INTERVAL '2 days', 'Jun 2025', 'cash'),
  ('a1000000-0000-0000-0000-000000000003', 2000, DATE_TRUNC('month', CURRENT_DATE)::DATE + INTERVAL '1 day',  'Jun 2025', 'upi'),
  ('a1000000-0000-0000-0000-000000000004', 1500, DATE_TRUNC('month', CURRENT_DATE)::DATE + INTERVAL '3 days', 'Jun 2025', 'online'),
  ('a1000000-0000-0000-0000-000000000005', 2000, DATE_TRUNC('month', CURRENT_DATE)::DATE + INTERVAL '1 day',  'Jun 2025', 'cash'),
  ('a1000000-0000-0000-0000-000000000006', 2500, DATE_TRUNC('month', CURRENT_DATE)::DATE + INTERVAL '2 days', 'Jun 2025', 'upi'),
  ('a1000000-0000-0000-0000-000000000007', 2000, DATE_TRUNC('month', CURRENT_DATE)::DATE + INTERVAL '1 day',  'Jun 2025', 'upi'),
  ('a1000000-0000-0000-0000-000000000008', 1500, DATE_TRUNC('month', CURRENT_DATE)::DATE + INTERVAL '2 days', 'Jun 2025', 'cash'),
  ('a1000000-0000-0000-0000-000000000009', 2000, DATE_TRUNC('month', CURRENT_DATE)::DATE + INTERVAL '1 day',  'Jun 2025', 'online'),
  ('a1000000-0000-0000-0000-000000000010', 2500, DATE_TRUNC('month', CURRENT_DATE)::DATE + INTERVAL '1 day',  'Jun 2025', 'upi');

-- ============================================================
-- SAMPLE DATA — 2 Trials
-- ============================================================
INSERT INTO trials (name, parent_name, parent_phone, trial_date, status, follow_up_date) VALUES
  ('Rahul Dubey',  'Ashok Dubey',  '+919900001001', CURRENT_DATE - INTERVAL '2 days',  'pending',     CURRENT_DATE + INTERVAL '3 days'),
  ('Mohit Tiwari', 'Girish Tiwari','+919900001002', CURRENT_DATE - INTERVAL '5 days', 'no_response', CURRENT_DATE + INTERVAL '1 day');

-- ============================================================
-- SAMPLE DATA — 1 Upcoming Event
-- ============================================================
INSERT INTO events (title, type, date, location, details) VALUES
  ('Summer Friendly — Green Warriors FC', 'friendly', CURRENT_DATE + INTERVAL '10 days',
   'Sunder Nursery Ground, Delhi',
   'Pre-season friendly match. All U-14 and U-16 batch players eligible. Match kick-off at 5:00 PM. Bring academy kit.');
