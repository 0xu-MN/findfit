// FindFit DB 타입 — 마이그레이션 001~008 실제 스키마 반영
//
// ⚠️ 두 세대의 스키마가 공존한다:
//   - 레거시(v1, migration 001): requests / evaluations / reports / builder_profiles / evaluator_profiles /
//     cash_transactions / notifications — 현재 앱 코드 대부분은 사용하지 않음(과거 호환 위해 타입만 보존)
//   - 현행(v2/v3, migration 002~008): projects / reviewer_profiles / review_questions / review_answers /
//     project_matches / credit_transactions / distributions / ai_reports / question_templates
//   실제 화면/피드/리뷰/리포트 흐름은 현행 테이블을 사용한다.

export type UserRole = 'builder' | 'evaluator' | 'admin'
// users.status (migration 009)
export type UserStatus = 'active' | 'suspended' | 'withdrawn'
export type EvaluatorGrade = 'general' | 'expert' | 'domain'
export type RequestStage = 'psf' | 'pmf'
export type RequestStatus = 'pending' | 'active' | 'completed' | 'cancelled'
export type Recommendation = 'continue' | 'pivot' | 'stop'
export type CashTransactionType = 'charge' | 'spend' | 'expire' | 'reward'
export type RequestCategory = 'saas' | 'commerce' | 'health' | 'edu' | 'fintech' | 'other'

// 1=매우실망 2=약간실망 3=실망안함 4=해당없음
export type SeanEllisScore = 1 | 2 | 3 | 4

/* ── 현행(v2/v3) 공용 리터럴 타입 ─────────────────────────────── */

// projects.project_type
export type ProjectType = 'light' | 'standard' | 'deep'
// projects.psf_pmf_type / question_templates.psf_pmf_type
export type PsfPmfType = 'psf' | 'pmf'
// projects.status — 피드 노출은 'active'. pending_review/rejected는 검수
// 기능 자체는 구현되어 있으나 이번 라운드는 강제 적용하지 않음(계획 참고).
export type ProjectStatus = 'draft' | 'pending_review' | 'active' | 'rejected' | 'completed' | 'cancelled'
// projects.access_method (migration 008)
export type AccessMethod = 'web_link' | 'app_download' | 'physical_shipping'
// project_matches.status
export type MatchStatus = 'pending' | 'accepted' | 'completed' | 'dropped'
// project_matches.shipping_status (migration 008)
export type ShippingStatus = 'not_required' | 'pending' | 'shipped' | 'delivered'
// review_questions.question_type
export type ReviewQuestionType =
  | 'multiple_choice'
  | 'short_answer'
  | 'likert'
  | 'likert_5'
  | 'ab_test'
  | 'keyword'
  | 'yes_no'
  | 'sean_ellis'
// review_questions.source
export type ReviewQuestionSource = 'manual' | 'ai_suggested'
// ai_reports.report_type
export type ReportType = 'light' | 'standard' | 'deep'
// ai_reports.ai_engine_used
export type AiEngine = 'gemini' | 'claude'
// ai_reports.verdict (migration 008)
export type Verdict = 'GO' | 'CAUTION' | 'RECONSIDER'
// access_info JSONB 형태
export type AccessInfo = {
  url?: string
  appStoreUrl?: string
  playStoreUrl?: string
}

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: string
  }
  public: {
    Tables: {
      /* ── users (auth.users 연동) ─────────────────────────── */
      users: {
        Row: {
          id: string
          email: string
          role: UserRole | null
          status: UserStatus
          created_at: string
        }
        Insert: {
          id: string
          email: string
          role?: UserRole | null
          status?: UserStatus
          created_at?: string
        }
        Update: {
          role?: UserRole | null
          // status: DB에서 authenticated 롤의 UPDATE 권한이 REVOKE되어 있어
          // (본인 스스로 정지 해제 불가) 브라우저 클라이언트로는 실제로 안
          // 먹는다 — 타입만 허용해두고, 실질 차단은 DB 권한이 담당한다.
          // 서비스 롤(관리자 API)에서만 의미 있게 사용된다.
          status?: UserStatus
        }

        Relationships: []
      }

      /* ── 현행: projects (migration 007 + 008) ─────────────── */
      projects: {
        Row: {
          id: string
          creator_id: string | null
          title: string
          one_liner: string | null
          categories: string[]
          stage: string | null
          project_type: ProjectType
          psf_pmf_type: PsfPmfType
          status: ProjectStatus
          problem: string | null
          solution: string | null
          alternative_limit: string | null
          target_age_range: string | null
          target_jobs: string[] | null
          landing_url: string | null
          target_count: number
          completed_count: number
          deadline: string | null
          incentive_exists: boolean
          incentive_budget: number | null
          distribution_method: string | null
          creator_level: string | null
          access_method: AccessMethod
          access_info: AccessInfo
          nickname_seq: number
          created_at: string
          extra_data: Record<string, unknown> | null
        }
        Insert: {
          id?: string
          creator_id?: string | null
          title: string
          one_liner?: string | null
          categories?: string[]
          stage?: string | null
          project_type?: ProjectType
          psf_pmf_type?: PsfPmfType
          status?: ProjectStatus
          problem?: string | null
          solution?: string | null
          alternative_limit?: string | null
          target_age_range?: string | null
          target_jobs?: string[] | null
          landing_url?: string | null
          target_count?: number
          completed_count?: number
          deadline?: string | null
          incentive_exists?: boolean
          incentive_budget?: number | null
          distribution_method?: string | null
          creator_level?: string | null
          access_method?: AccessMethod
          access_info?: AccessInfo
          nickname_seq?: number
          created_at?: string
          extra_data?: Record<string, unknown> | null
        }
        Update: Partial<Database['public']['Tables']['projects']['Insert']>
      
        Relationships: []
      }

      /* ── 현행: review_questions (migration 007 + 005) ─────── */
      review_questions: {
        Row: {
          id: string
          project_id: string | null
          question_text: string
          question_type: ReviewQuestionType
          question_key: string | null
          options: string[] | null
          is_required: boolean
          source: ReviewQuestionSource
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          project_id?: string | null
          question_text: string
          question_type?: ReviewQuestionType
          question_key?: string | null
          options?: string[] | null
          is_required?: boolean
          source?: ReviewQuestionSource
          order_index?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['review_questions']['Insert']>
      
        Relationships: []
      }

      /* ── 현행: review_answers (migration 006) ─────────────── */
      review_answers: {
        Row: {
          id: string
          project_id: string | null
          reviewer_id: string | null
          question_id: string | null
          answer_text: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id?: string | null
          reviewer_id?: string | null
          question_id?: string | null
          answer_text: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['review_answers']['Insert']>
      
        Relationships: []
      }

      /* ── 현행: project_matches (migration 007 + 008) ──────── */
      project_matches: {
        Row: {
          id: string
          project_id: string | null
          reviewer_id: string | null
          nickname: string | null
          status: MatchStatus
          accepted_at: string | null
          submitted_at: string | null
          shipping_status: ShippingStatus
          shipping_address: string | null
          received_confirmed_at: string | null
          applicant_email: string | null
          applicant_domain: string[] | null
          applicant_intro: string | null
          applied_at: string | null
        }
        Insert: {
          id?: string
          project_id?: string | null
          reviewer_id?: string | null
          nickname?: string | null
          status?: MatchStatus
          accepted_at?: string | null
          submitted_at?: string | null
          shipping_status?: ShippingStatus
          shipping_address?: string | null
          received_confirmed_at?: string | null
          applicant_email?: string | null
          applicant_domain?: string[] | null
          applicant_intro?: string | null
          applied_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['project_matches']['Insert']>
      
        Relationships: []
      }

      /* ── 현행: reviewer_profiles (migration 007 + 004) ────── */
      reviewer_profiles: {
        Row: {
          id: string
          user_id: string
          domain_tags: string[]
          level: string
          portone_partner_id: string | null
          bank_name: string | null
          account_number: string | null
          account_holder: string | null
          is_account_verified: boolean
        }
        Insert: {
          id?: string
          user_id: string
          domain_tags?: string[]
          level?: string
          portone_partner_id?: string | null
          bank_name?: string | null
          account_number?: string | null
          account_holder?: string | null
          is_account_verified?: boolean
        }
        Update: Partial<Database['public']['Tables']['reviewer_profiles']['Insert']>
      
        Relationships: []
      }

      /* ── 현행: credit_transactions (migration 007) ────────── */
      credit_transactions: {
        Row: {
          id: string
          user_id: string | null
          source: string
          amount: number
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          source: string
          amount: number
          expires_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['credit_transactions']['Insert']>
      
        Relationships: []
      }

      /* ── 현행: ai_reports (migration 003 + 008) ───────────── */
      ai_reports: {
        Row: {
          id: string
          project_id: string | null
          report_type: ReportType
          ai_engine_used: AiEngine
          psf_score: number | null
          sean_ellis_pct: number | null
          recommendation: Recommendation | null
          report_data: Record<string, unknown>
          pdf_url: string | null
          is_unlocked: boolean
          problem_exists_pct: number | null
          solution_acceptance_pct: number | null
          purchase_intent_pct: number | null
          verdict: Verdict | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id?: string | null
          report_type: ReportType
          ai_engine_used: AiEngine
          psf_score?: number | null
          sean_ellis_pct?: number | null
          recommendation?: Recommendation | null
          report_data: Record<string, unknown>
          pdf_url?: string | null
          is_unlocked?: boolean
          problem_exists_pct?: number | null
          solution_acceptance_pct?: number | null
          purchase_intent_pct?: number | null
          verdict?: Verdict | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['ai_reports']['Insert']>
      
        Relationships: []
      }

      /* ── 현행: distributions (migration 004 + 005 + 006) ──── */
      distributions: {
        Row: {
          id: string
          project_id: string | null
          reviewer_id: string | null
          nickname: string
          amount: number
          status: string
          portone_transfer_id: string | null
          paid_at: string | null
          withholding_tax: number
          net_amount: number | null
          distribution_method: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id?: string | null
          reviewer_id?: string | null
          nickname: string
          amount: number
          status?: string
          portone_transfer_id?: string | null
          paid_at?: string | null
          withholding_tax?: number
          net_amount?: number | null
          distribution_method?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['distributions']['Insert']>
      
        Relationships: []
      }

      /* ── 현행: question_templates (migration 002) ─────────── */
      question_templates: {
        Row: {
          id: string
          project_type: ProjectType
          psf_pmf_type: PsfPmfType
          is_required: boolean
          question_text: string
          question_type: ReviewQuestionType
          options: string[] | null
          order_index: number
          meta: Record<string, unknown> | null
        }
        Insert: {
          id?: string
          project_type: ProjectType
          psf_pmf_type: PsfPmfType
          is_required?: boolean
          question_text: string
          question_type: ReviewQuestionType
          options?: string[] | null
          order_index?: number
          meta?: Record<string, unknown> | null
        }
        Update: Partial<Database['public']['Tables']['question_templates']['Insert']>
      
        Relationships: []
      }

      /* ══ 레거시(v1, migration 001) — 타입 보존용 ══════════════ */
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
      
        Relationships: []
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
      
        Relationships: []
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
      
        Relationships: []
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
      
        Relationships: []
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
      
        Relationships: []
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
      
        Relationships: []
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

        Relationships: []
      }
    }
    Views: {
      /* ── projects_public (migration 009) — creator_id 제외 ─────── */
      projects_public: {
        Row: {
          id: string
          title: string
          one_liner: string | null
          categories: string[]
          stage: string | null
          project_type: ProjectType
          psf_pmf_type: PsfPmfType
          status: ProjectStatus
          problem: string | null
          solution: string | null
          alternative_limit: string | null
          target_age_range: string | null
          target_jobs: string[] | null
          landing_url: string | null
          target_count: number
          completed_count: number
          deadline: string | null
          incentive_exists: boolean
          incentive_budget: number | null
          distribution_method: string | null
          creator_level: string | null
          access_method: AccessMethod
          access_info: AccessInfo
          created_at: string
        }
        Relationships: []
      }
      /* ── project_matches_for_creator (migration 009) — reviewer_id/이메일 제외 ─── */
      project_matches_for_creator: {
        Row: {
          id: string
          project_id: string | null
          nickname: string | null
          status: MatchStatus
          accepted_at: string | null
          submitted_at: string | null
          shipping_status: ShippingStatus
          shipping_address: string | null
          received_confirmed_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      increment_completed_count: {
        Args: { project_id: string }
        Returns: void
      }
      assign_reviewer_nickname: {
        Args: { p_project_id: string }
        Returns: string
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
