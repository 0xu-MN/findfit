export type UserRole = 'builder' | 'evaluator' | 'admin'
export type EvaluatorGrade = 'general' | 'expert' | 'domain'
export type RequestStage = 'psf' | 'pmf'
export type RequestStatus = 'pending' | 'active' | 'completed' | 'cancelled'
export type Recommendation = 'continue' | 'pivot' | 'stop'
export type CashTransactionType = 'charge' | 'spend' | 'expire' | 'reward'
export type RequestCategory = 'saas' | 'commerce' | 'health' | 'edu' | 'fintech' | 'other'

// 1=매우실망 2=약간실망 3=실망안함 4=해당없음
export type SeanEllisScore = 1 | 2 | 3 | 4

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: UserRole | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          role?: UserRole | null
          created_at?: string
        }
        Update: {
          role?: UserRole | null
        }
      }
      builder_profiles: {
        Row: {
          id: string
          user_id: string
          company_name: string | null
          cash_balance: number
          total_requests: number
        }
        Insert: {
          user_id: string
          company_name?: string | null
          cash_balance?: number
          total_requests?: number
        }
        Update: {
          company_name?: string | null
          cash_balance?: number
          total_requests?: number
        }
      }
      evaluator_profiles: {
        Row: {
          id: string
          user_id: string
          grade: EvaluatorGrade
          domains: string[]
          review_count: number
          quality_score: number
          credit_balance: number
        }
        Insert: {
          user_id: string
          grade?: EvaluatorGrade
          domains?: string[]
          review_count?: number
          quality_score?: number
          credit_balance?: number
        }
        Update: {
          grade?: EvaluatorGrade
          domains?: string[]
          review_count?: number
          quality_score?: number
          credit_balance?: number
        }
      }
      requests: {
        Row: {
          id: string
          builder_id: string
          title: string
          description: string | null
          stage: RequestStage
          category: RequestCategory[]
          target_count: number
          evaluator_grade: EvaluatorGrade
          status: RequestStatus
          cash_spent: number
          deep_report: boolean
          deadline_hours: 72 | 48
          landing_url: string | null
          created_at: string
        }
        Insert: {
          builder_id: string
          title: string
          description?: string | null
          stage: RequestStage
          category: RequestCategory[]
          target_count: number
          evaluator_grade: EvaluatorGrade
          cash_spent: number
          deep_report?: boolean
          deadline_hours?: 72 | 48
          landing_url?: string | null
        }
        Update: {
          status?: RequestStatus
        }
      }
      evaluations: {
        Row: {
          id: string
          request_id: string
          evaluator_id: string
          answers: Record<string, unknown>
          sean_ellis_score: SeanEllisScore
          quality_score: number | null
          submitted_at: string
        }
        Insert: {
          request_id: string
          evaluator_id: string
          answers: Record<string, unknown>
          sean_ellis_score: SeanEllisScore
          quality_score?: number | null
        }
        Update: {
          quality_score?: number | null
        }
      }
      reports: {
        Row: {
          id: string
          request_id: string
          psf_score: number
          pmf_score: number
          sean_ellis_40_passed: boolean
          summary: string
          recommendation: Recommendation
          insights: Record<string, unknown>
          superhuman_segment: Record<string, unknown>
          created_at: string
        }
        Insert: {
          request_id: string
          psf_score: number
          pmf_score: number
          sean_ellis_40_passed: boolean
          summary: string
          recommendation: Recommendation
          insights: Record<string, unknown>
          superhuman_segment: Record<string, unknown>
        }
        Update: never
      }
      cash_transactions: {
        Row: {
          id: string
          user_id: string
          type: CashTransactionType
          amount: number
          created_at: string
        }
        Insert: {
          user_id: string
          type: CashTransactionType
          amount: number
        }
        Update: never
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          message: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          user_id: string
          type: string
          message: string
          is_read?: boolean
        }
        Update: {
          is_read?: boolean
        }
      }
    }
  }
}
