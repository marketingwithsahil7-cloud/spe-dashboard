// ─── Enums ────────────────────────────────────────────────────────────────────

export type BatchType = '5-6 PM' | '6-7 PM' | 'Both'
export type StudentStatus = 'active' | 'trial' | 'closed'
export type PaymentMode = 'cash' | 'upi' | 'online'
export type TrialStatus = 'pending' | 'closed' | 'not_closed' | 'no_response'
export type EventType = 'tournament' | 'friendly'
export type AvailabilityStatus = 'available' | 'not_available' | 'maybe' | 'no_response'
export type CoachRole = 'owner' | 'head' | 'assistant'
export type FeeStatus = 'paid' | 'due_soon' | 'due_today' | 'overdue'
export type FundType = 'revenue' | 'emergency'
export type ExpenseCategory = 'jerseys' | 'equipment' | 'maintenance' | 'personal' | 'other'
export type EmergencyTxType = 'deposit' | 'withdrawal' | 'repayment'

// ─── Table Types ──────────────────────────────────────────────────────────────

export interface Student {
  id: string
  name: string
  photo_url: string | null
  batch: BatchType
  parent_name: string | null
  parent_phone: string | null
  billing_cycle_day: number | null
  monthly_fee: number
  status: StudentStatus
  join_date: string
  dob: string | null
  academy_id: string
  created_at: string
}

export interface Attendance {
  id: string
  student_id: string
  date: string
  batch: string
  present: boolean
  marked_by: string | null
  created_at: string
}

export interface Payment {
  id: string
  student_id: string
  amount: number
  paid_date: string
  for_cycle: string | null
  mode: PaymentMode | null
  note: string | null
  recorded_by: string | null
  created_at: string
}

export interface Trial {
  id: string
  name: string
  photo_url: string | null
  parent_name: string | null
  parent_phone: string | null
  trial_date: string
  status: TrialStatus
  reason: string | null
  follow_up_date: string | null
  created_at: string
}

export interface Event {
  id: string
  title: string
  type: EventType | null
  date: string | null
  location: string | null
  details: string | null
  age_category: string | null
  created_at: string
}

export interface EventAvailability {
  id: string
  event_id: string
  student_id: string
  status: AvailabilityStatus
}

export interface Coach {
  id: string
  user_id: string | null
  name: string
  role: CoachRole | null
  per_session_rate: number
  phone: string | null
  login_email: string | null
  is_active: boolean
  academy_id: string
  created_at: string
}

export interface AcademySettings {
  id: string
  academy_name: string
  tagline: string
  logo_url: string | null
  training_days: string[]
  academy_id: string
  updated_at: string
}

export interface CoachAttendance {
  id: string
  coach_id: string
  date: string
  batch: string | null
  session: string | null
  marked_by: string | null
  confirmed_by_coach: boolean
  disputed: boolean
  verified: boolean
  created_at: string
}

export interface Expense {
  id: string
  title: string
  amount: number
  expense_date: string
  fund_type: FundType
  category: ExpenseCategory
  note: string | null
  withdrawn_by: string | null
  is_cross_fund: boolean
  expected_repayment_date: string | null
  purpose: string | null
  recorded_by: string | null
  academy_id: string
  created_at: string
}

export interface EmergencyFundTransaction {
  id: string
  type: EmergencyTxType
  amount: number
  transaction_date: string
  coach_id: string | null
  purpose: string | null
  note: string | null
  repaid: boolean
  repaid_date: string | null
  repaid_amount: number | null
  recorded_by: string | null
  academy_id: string
  created_at: string
}

export interface FinancialNote {
  id: string
  content: string
  author_id: string | null
  academy_id: string
  created_at: string
}

// ─── Computed / Function Types ─────────────────────────────────────────────────

export interface FeeStatusResult {
  next_due_date: string
  days_overdue: number
  fee_status: FeeStatus
}

export interface DashboardStats {
  total_active: number
  today_attendance: number
  monthly_revenue: number
  pending_fees: number
}

// ─── Database Type (for Supabase client) ──────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      students: {
        Row: Student
        Insert: Omit<Student, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Student, 'id'>>
        Relationships: []
      }
      attendance: {
        Row: Attendance
        Insert: Omit<Attendance, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Attendance, 'id'>>
        Relationships: []
      }
      payments: {
        Row: Payment
        Insert: Omit<Payment, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Payment, 'id'>>
        Relationships: []
      }
      trials: {
        Row: Trial
        Insert: Omit<Trial, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Trial, 'id'>>
        Relationships: []
      }
      events: {
        Row: Event
        Insert: Omit<Event, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Event, 'id'>>
        Relationships: []
      }
      event_availability: {
        Row: EventAvailability
        Insert: Omit<EventAvailability, 'id'> & { id?: string }
        Update: Partial<Omit<EventAvailability, 'id'>>
        Relationships: []
      }
      coaches: {
        Row: Coach
        Insert: Omit<Coach, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Coach, 'id'>>
        Relationships: []
      }
      coach_attendance: {
        Row: CoachAttendance
        Insert: Omit<CoachAttendance, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<CoachAttendance, 'id'>>
        Relationships: []
      }
      expenses: {
        Row: Expense
        Insert: Omit<Expense, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Expense, 'id'>>
        Relationships: []
      }
      emergency_fund_transactions: {
        Row: EmergencyFundTransaction
        Insert: Omit<EmergencyFundTransaction, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<EmergencyFundTransaction, 'id'>>
        Relationships: []
      }
      financial_notes: {
        Row: FinancialNote
        Insert: Omit<FinancialNote, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<FinancialNote, 'id'>>
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      get_fee_status: {
        Args: { p_student_id: string }
        Returns: FeeStatusResult[]
      }
      get_dashboard_stats: {
        Args: Record<string, never>
        Returns: DashboardStats[]
      }
    }
  }
}
