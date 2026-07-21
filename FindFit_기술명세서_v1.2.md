# FindFit 기술 명세서 v1.3

> 기획서 v3.4 기반 — 개발 바로 진행 가능한 수준의 상세 명세

| 항목 | 내용 |
|------|------|
| 기술 스택 | Next.js 14 App Router + TypeScript + Supabase + Claude API + Gemini API + PortOne |
| 참조 기획서 | FindFit 서비스 기획서 v3.4 |
| 작성일 | 2026 |
| **변경 이력** | **v1.1 — Feature Flag 시스템 추가 / 베타 비활성화 기능 명세 / pytrends 대체 처리 / EXP 분기 수정** |
| **변경 이력** | **v1.2 — Reviewer 5개 화면 기술 명세 / Admin 운영 4개 화면 기술 명세 / project_matches 지원 플로우 스키마 / Admin 인증 미들웨어** |
| **변경 이력** | **v1.3 — 기술 스택 결정문서 v1.0 전체 통합 / Zustand 스토어 3개 명세 / LLM 아키텍처 상세 / AWS Neptune + Bedrock KB 계획 / 단계별 로드맵 / 전체 환경변수 목록 / purchase_intent 컬럼 마이그레이션 / 리텐션 ⑤⑥⑦ 구현 명세** |

---

## 1. 시스템 아키텍처

### 1.1 전체 스택

| 레이어 | 기술 | 역할 |
|--------|------|------|
| 프론트엔드 | Next.js 14 App Router + TypeScript | 웹 + PWA |
| 백엔드 | Supabase (PostgreSQL + Auth + Storage + Edge Functions) | DB / 인증 / 서버리스 |
| AI — 베타 | Gemini 2.0 Flash (Google AI Studio) | 리포트 생성 (무료 쿼터) |
| AI — 성장 | Claude Sonnet (Anthropic) | Agent 대화 + 고품질 리포트 |
| 결제 수취 | PortOne + KG이니시스 | Creator 결제 |
| 지급대행 | PortOne 파트너 정산 | Reviewer 사례금 지급 |
| 푸시 알림 | Firebase Cloud Messaging | 매칭 / 완료 / 리마인더 |
| 이메일 | Resend | 알림 이메일 |
| 배포 | Vercel + GitHub Actions | CI/CD |

### 1.2 환경 변수 목록

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
AI_ENGINE=gemini                  # "gemini" | "claude"
GEMINI_API_KEY=                   # Google AI Studio
ANTHROPIC_API_KEY=                # console.anthropic.com

# PortOne
NEXT_PUBLIC_PORTONE_STORE_ID=
NEXT_PUBLIC_PORTONE_CHANNEL_KEY=
PORTONE_API_SECRET=

# FCM
FIREBASE_SERVICE_ACCOUNT=

# Resend
RESEND_API_KEY=

# MCP / 외부 API
NAVER_CLIENT_ID=                  # 네이버 데이터랩
NAVER_CLIENT_SECRET=

# ────────────────────────────────────────────────────────────
# [v1.1 추가] 외부 API — 발급 필요 / 베타에서는 ENABLE_* = false
# ────────────────────────────────────────────────────────────
META_ACCESS_TOKEN=                # Meta Ad Library API 토큰 (발급 후 입력)
GOOGLE_TRENDS_API_URL=            # Google Trends Python 마이크로서비스 URL (출시 시)

# ────────────────────────────────────────────────────────────
# [v1.1 추가] Feature Flags — 베타: false, 정식출시: true
# 이 파일 하나만 바꾸면 베타 ↔ 출시 전환 완료
# ────────────────────────────────────────────────────────────
ENABLE_GOOGLE_TRENDS=false        # pytrends 마이크로서비스 연동 여부
ENABLE_META_ADS=false             # Meta Ad Library API 활성화 여부
ENABLE_VOLUME_DISCOUNT=false      # Standard 볼륨 디스카운트 (30명/50명/100명)
ENABLE_AUTO_DISTRIBUTE=false      # 72시간 자동 균등 배분 Cron
ENABLE_EXP_SYSTEM=false           # EXP / 레벨 시스템 전체
ENABLE_ROLE_SWITCH=false          # Creator ↔ Reviewer 역할 전환
ENABLE_FCM_PUSH=false             # Firebase 푸시 알림 (이메일로 대체)
ENABLE_CLAUDE_REPORT=false        # Claude 리포트 엔진 활성화 (베타: Gemini 고정)

# ────────────────────────────────────────────────────────────
# [v1.2 추가] Admin 운영 화면 인증
# ────────────────────────────────────────────────────────────
ADMIN_SECRET_KEY=                 # /admin 접근 인증 키 (베타: 쿠키 기반 / 출시: Supabase Auth로 교체)
```

---

### 1.3 [v1.1 신규] Feature Flag 시스템

> 기획서/기술서는 정식 출시 기준으로 그대로 유지한다.
> 베타 기간에는 ENABLE_* 환경변수로 기능을 잠그고, 출시 시 true로 바꾸면 즉시 활성화된다.

```typescript
// lib/features/flags.ts
// ─────────────────────────────────────────────────
// 모든 Feature Flag를 한 곳에서 관리
// 사용법: import { FEATURES } from '@/lib/features/flags'
//         if (FEATURES.googleTrends) { ... }
// ─────────────────────────────────────────────────

export const FEATURES = {
  // 시장 데이터 API
  googleTrends:    process.env.ENABLE_GOOGLE_TRENDS === 'true',
  metaAds:         process.env.ENABLE_META_ADS === 'true',

  // 수익 / 결제
  volumeDiscount:  process.env.ENABLE_VOLUME_DISCOUNT === 'true',
  autoDistribute:  process.env.ENABLE_AUTO_DISTRIBUTE === 'true',

  // 성장 기능
  expSystem:       process.env.ENABLE_EXP_SYSTEM === 'true',
  roleSwitch:      process.env.ENABLE_ROLE_SWITCH === 'true',
  fcmPush:         process.env.ENABLE_FCM_PUSH === 'true',
  claudeReport:    process.env.ENABLE_CLAUDE_REPORT === 'true',
} as const

export type FeatureKey = keyof typeof FEATURES

// 베타/출시 전환 체크리스트 (출시 전 하나씩 true로 변경)
// ┌──────────────────────┬──────────┬────────────────────────────────────┐
// │ Flag                 │ 베타     │ 출시 전 해야 할 일                  │
// ├──────────────────────┼──────────┼────────────────────────────────────┤
// │ ENABLE_GOOGLE_TRENDS │ false    │ FastAPI 마이크로서비스 배포          │
// │ ENABLE_META_ADS      │ false    │ Meta 앱 심사 통과 + 토큰 발급       │
// │ ENABLE_VOLUME_DISCOUNT│ false   │ 기획서에 가격 정책 공식 추가        │
// │ ENABLE_AUTO_DISTRIBUTE│ false   │ PortOne 파트너정산 셋업             │
// │ ENABLE_EXP_SYSTEM    │ false    │ EXP 획득 기준 기획 확정             │
// │ ENABLE_ROLE_SWITCH   │ false    │ DB role 컬럼 → 배열 마이그레이션    │
// │ ENABLE_FCM_PUSH      │ false    │ Firebase 프로젝트 생성 + SW 등록    │
// │ ENABLE_CLAUDE_REPORT │ false    │ Anthropic 청구 설정 + 비용 검토     │
// └──────────────────────┴──────────┴────────────────────────────────────┘
```

---

## 2. 데이터베이스 스키마

### 2.1 users

```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  role        TEXT CHECK (role IN ('creator', 'reviewer')) NOT NULL,
  name        TEXT,
  phone       TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

> **[v1.1 보완] role 컬럼 정책**
>
> 베타에서는 `ENABLE_ROLE_SWITCH=false` — 가입 시 선택한 단일 역할로 고정.
> Creator로 가입한 사람이 Reviewer도 하고 싶은 경우, 별도 계정으로 가입하게 안내한다.
> UI에서 역할 전환 버튼을 `FEATURES.roleSwitch`로 조건부 렌더링해 숨긴다.
>
> 정식 출시 마이그레이션 (ENABLE_ROLE_SWITCH=true 전환 시 실행):
> ```sql
> -- 출시 시 실행 — 기존 데이터 안전하게 이전
> ALTER TABLE users ADD COLUMN roles TEXT[] DEFAULT '{}';
> UPDATE users SET roles = ARRAY[role];
> -- 이후 role 컬럼은 deprecated, roles 배열로 통합
> ```

### 2.2 creator_profiles

```sql
CREATE TABLE creator_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  exp_points      INT DEFAULT 0,
  level           TEXT DEFAULT 'seed',   -- seed | sprout | builder | launcher
  credit_balance  INT DEFAULT 0,
  credit_expires_at TIMESTAMPTZ,
  total_projects  INT DEFAULT 0,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

> **[v1.1 보완] EXP / 레벨 컬럼 정책**
>
> 컬럼은 DB에 유지한다 (나중에 마이그레이션 없이 그대로 사용).
> 베타에서는 `ENABLE_EXP_SYSTEM=false` — 모든 Creator의 level = 'seed' 고정.
> exp-calculator Edge Function은 배포하되 flag 체크로 실제 계산 비활성화.
> 리포트 엔진 분기도 level이 아닌 AI_ENGINE 환경변수로 제어 (섹션 8.1 참조).

### 2.3 reviewer_profiles

```sql
CREATE TABLE reviewer_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES users(id) ON DELETE CASCADE,
  exp_points          INT DEFAULT 0,
  level               TEXT DEFAULT 'piece',  -- piece | connector | fitter | master_fit
  domain_tags         TEXT[],
  career_years        INT,
  job_title           TEXT,
  portone_partner_id  TEXT,
  bank_name           TEXT,
  account_number      TEXT,        -- pgcrypto 암호화 저장
  account_holder      TEXT,
  is_account_verified BOOLEAN DEFAULT FALSE,
  is_nda_agreed       BOOLEAN DEFAULT FALSE,
  nda_agreed_at       TIMESTAMPTZ
);
```

### 2.4 projects

```sql
CREATE TABLE projects (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id            UUID REFERENCES users(id),
  title                 TEXT NOT NULL,
  one_liner             TEXT,
  category              TEXT,
  stage                 TEXT,  -- idea | prototype | beta | launched
  psf_pmf_type          TEXT,  -- psf | pmf  (자동 판별)
  problem               TEXT,
  solution              TEXT,
  target_description    TEXT,
  target_jobs           TEXT[],
  target_age_range      TEXT,
  resource_url          TEXT,
  project_type          TEXT NOT NULL,  -- light | standard
  target_count          INT NOT NULL,
  completed_count       INT DEFAULT 0,
  status                TEXT DEFAULT 'draft',
  -- draft | active | reviewing | completed | cancelled
  incentive_exists      BOOLEAN DEFAULT FALSE,
  incentive_budget      INT DEFAULT 0,
  distribution_method   TEXT DEFAULT 'equal',
  platform_fee          INT,
  incentive_commission  INT,
  portone_payment_key   TEXT,
  distribution_deadline TIMESTAMPTZ,

  -- Agent 탐색 결과 (STEP 0에서 넘어온 경우)
  agent_session_id      TEXT,        -- Agent 대화 세션 ID
  agent_references      JSONB,       -- 탐색된 타사 레퍼런스 캐시
  entry_path            TEXT,        -- 'agent_explore' | 'direct' | 'agent_panel'

  created_at            TIMESTAMPTZ DEFAULT NOW(),
  completed_at          TIMESTAMPTZ
);
```

### 2.5 agent_sessions

```sql
CREATE TABLE agent_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  messages    JSONB NOT NULL DEFAULT '[]',
  -- [{role: 'user'|'assistant', content: '...', timestamp: '...'}]
  context     JSONB,
  -- {category, keywords, references: [{name, target, price, pros, cons}]}
  status      TEXT DEFAULT 'active',  -- active | converted | abandoned
  converted_project_id UUID REFERENCES projects(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.6 review_questions

```sql
CREATE TABLE review_questions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID REFERENCES projects(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  -- multiple_choice | short_answer | likert_5 | sean_ellis
  options       JSONB,
  is_required   BOOLEAN DEFAULT FALSE,  -- true: 잠금 블록 (삭제/수정 불가)
  source        TEXT DEFAULT 'manual',  -- manual | ai_suggested | template
  order_index   INT DEFAULT 0
);
```

### 2.7 question_templates

```sql
CREATE TABLE question_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_type  TEXT NOT NULL,   -- light | standard | deep
  psf_pmf_type  TEXT NOT NULL,   -- psf | pmf
  is_required   BOOLEAN DEFAULT FALSE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  options       JSONB,
  order_index   INT DEFAULT 0,
  meta          JSONB            -- {phase: 'pre'|'task'|'post', editable_by_creator: bool}
);
```

### 2.8 project_matches

```sql
CREATE TABLE project_matches (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID REFERENCES projects(id),
  reviewer_id  UUID REFERENCES users(id),
  nickname     TEXT NOT NULL,     -- Reviewer_A, Reviewer_B... (플랫폼 표시명)

  -- [v1.2 추가] Reviewer 지원 시 수집하는 정보 (Auth 없이도 운영 가능)
  applicant_email   TEXT,         -- 수락 알림 수신용 이메일 (운영자만 볼 수 있음)
  applicant_domain  TEXT[],       -- 도메인 태그 (헬스케어, 커머스, B2B 등)
  applicant_intro   TEXT,         -- 한 줄 소개 (선택 — 운영자 매칭 참고용)

  -- [v1.2 수정] status 기본값 'pending'으로 변경 (기존: 'invited')
  -- 흐름: pending(지원) → accepted(수락) → completed(제출) | dropped(거절/이탈)
  status       TEXT DEFAULT 'pending',
  -- pending    : Reviewer가 지원 완료 — 운영자 검토 대기
  -- accepted   : 운영자가 수락 — 평가 링크 이메일 발송됨
  -- completed  : Reviewer가 평가 제출 완료
  -- dropped    : 운영자 거절 또는 기한 내 미제출

  applied_at   TIMESTAMPTZ DEFAULT NOW(),   -- 지원 시각 (구 invited_at)
  accepted_at  TIMESTAMPTZ,                 -- 운영자 수락 시각
  completed_at TIMESTAMPTZ
);
```

### 2.9 reviews

```sql
CREATE TABLE reviews (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id       UUID REFERENCES project_matches(id),
  project_id     UUID REFERENCES projects(id),
  reviewer_id    UUID REFERENCES users(id),
  answers        JSONB NOT NULL,    -- {question_id: answer}
  sean_ellis_ans TEXT,
  quality_score  FLOAT,
  is_passed      BOOLEAN,
  submitted_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.10 ai_reports

```sql
CREATE TABLE ai_reports (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID REFERENCES projects(id) UNIQUE,
  report_type      TEXT NOT NULL,    -- light | standard
  ai_engine_used   TEXT NOT NULL,    -- gemini | claude
  psf_score        FLOAT,
  sean_ellis_pct   FLOAT,
  recommendation   TEXT,             -- continue | pivot | stop
  report_data      JSONB NOT NULL,   -- 타입별 상세 데이터
  is_unlocked      BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.11 distributions

```sql
CREATE TABLE distributions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID REFERENCES projects(id),
  reviewer_id         UUID REFERENCES users(id),
  nickname            TEXT NOT NULL,
  amount              INT NOT NULL,
  withholding_tax     INT DEFAULT 0,   -- 3.3% (5만원 초과 시)
  net_amount          INT,
  status              TEXT DEFAULT 'pending',
  -- pending | processing | completed | failed | pending_registration
  portone_transfer_id TEXT,
  paid_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.12 project_references (신규 — 타사 레퍼런스 통합 관리)

```sql
-- Agent 자동 수집 + Creator 직접 추가를 하나의 테이블에서 관리
CREATE TABLE project_references (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
  source      TEXT NOT NULL CHECK (source IN ('agent', 'creator')),
  -- agent: FindFit이 웹 검색으로 자동으로 찾아준 것
  -- creator: Creator가 STEP 1에서 URL을 직접 입력한 것
  name        TEXT NOT NULL,
  target      TEXT,
  price       TEXT,
  pros        TEXT,
  cons        TEXT,
  url         TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_project_references_project_id ON project_references(project_id);
CREATE INDEX idx_project_references_source ON project_references(source);
```

---

## 3. API 라우트 구조

### 3.1 디렉토리

```
app/
├── (auth)/
│   ├── login/page.tsx
│   └── signup/page.tsx
├── (creator)/
│   ├── dashboard/page.tsx
│   ├── projects/
│   │   ├── new/
│   │   │   ├── page.tsx           # STEP 0 모달 + 6단계 위자드
│   │   │   └── step/[step]/page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       ├── distribution/page.tsx
│   │       └── report/page.tsx
├── (reviewer)/
│   ├── available/page.tsx              # [v1.2] 프로젝트 피드 — 참여 가능 의뢰 목록 (기존 있음, 채워야 함)
│   ├── projects/[id]/page.tsx          # [v1.2 신규] 프로젝트 상세 + 지원하기 폼
│   ├── review/[matchId]/page.tsx       # [v1.2 신규] 평가 폼 3단계 (기존 쉘 있음, 구현 필요)
│   ├── reviews/page.tsx                # [v1.2] 내 참여 현황 — 상태 배지 4종 (기존 있음)
│   ├── wallet/page.tsx                 # [v1.2] 사례금 정산 (기존 있음)
│   └── account-setup/page.tsx
├── (admin)/                            # [v1.2 신규] Admin 운영 화면 전체
│   ├── login/page.tsx                  # ADMIN_SECRET_KEY 입력 → 쿠키 세팅
│   ├── page.tsx                        # Admin 대시보드 — 오늘 할 일 요약
│   ├── applications/page.tsx           # Reviewer 신청 목록 + 수락/거절
│   ├── projects/page.tsx               # 프로젝트 현황 목록
│   └── distributions/page.tsx          # 정산 처리 — 지급 완료 처리 버튼
└── api/
    ├── agent/
    │   ├── chat/route.ts              # Agent 대화 (Claude API 호출)
    │   ├── trends/route.ts            # 트렌드 조회 (네이버 데이터랩)
    │   ├── references/route.ts        # 타사 레퍼런스 (MCP 웹 검색)
    │   └── sessions/[id]/route.ts     # Agent 세션 관리
    ├── projects/
    │   ├── route.ts                   # GET list / POST create
    │   └── [id]/
    │       ├── route.ts
    │       ├── matches/route.ts
    │       ├── questions/
    │       │   ├── route.ts
    │       │   └── suggest/route.ts  # AI 질문 자동 추천
    │       ├── distribution/route.ts
    │       └── distribute/route.ts
    ├── reviews/[matchId]/route.ts
    ├── ai-report/
    │   ├── [projectId]/route.ts
    │   └── [projectId]/unlock/route.ts
    ├── portone/
    │   ├── webhook/route.ts
    │   ├── payment/route.ts
    │   └── transfer/route.ts
    └── users/
        ├── profile/route.ts
        └── reviewer/register/route.ts
```

---

## 4. STEP 0 플로우 — 상세 구현

### 4.1 STEP 0 모달 컴포넌트

```typescript
// components/projects/Step0Modal.tsx

type EntryPath = 'agent_explore' | 'direct'

interface Step0ModalProps {
  isOpen: boolean
  onSelect: (path: EntryPath) => void
  onClose: () => void
}

export function Step0Modal({ isOpen, onSelect, onClose }: Step0ModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2>어떻게 시작할까요?</h2>
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => onSelect('agent_explore')}>
          <span>🔍</span>
          <h3>아이템 탐색부터 시작</h3>
          <p>트렌드 보고 아이템 찾기</p>
        </button>
        <button onClick={() => onSelect('direct')}>
          <span>✅</span>
          <h3>아이템 있어요</h3>
          <p>바로 등록하기</p>
        </button>
      </div>
    </Modal>
  )
}
```

### 4.2 경로별 라우팅 로직

```typescript
// app/(creator)/projects/new/page.tsx

export default function NewProjectPage() {
  const [showStep0, setShowStep0] = useState(true)
  const router = useRouter()

  const handleStep0Select = async (path: EntryPath) => {
    if (path === 'agent_explore') {
      // Agent 화면으로 이동 + 탐색 모드 자동 시작 플래그
      router.push('/dashboard?agent=explore&from=new_project')
    } else {
      // 바로 STEP 1으로
      setShowStep0(false)
    }
  }

  return (
    <>
      <Step0Modal
        isOpen={showStep0}
        onSelect={handleStep0Select}
        onClose={() => router.back()}
      />
      {!showStep0 && <ProjectWizard />}
    </>
  )
}
```

### 4.3 Agent에서 STEP 1으로 이동 시 데이터 전달

```typescript
// Agent 대화 마지막에 프로젝트 등록 버튼 렌더링
// Agent는 세션에 수집된 컨텍스트를 DB에 저장 후 project_id 예약

// app/api/agent/sessions/[id]/convert/route.ts
export async function POST(req: Request, { params }) {
  const session = await getAgentSession(params.id)

  // 세션 컨텍스트에서 카테고리/키워드/레퍼런스 추출
  const context = session.context as AgentContext
  // {category, keywords, references: [...]}

  // projects 테이블에 draft 상태로 미리 생성
  const { data: project } = await supabase.from('projects').insert({
    creator_id: session.user_id,
    category: context.category,
    agent_session_id: params.id,
    agent_references: context.references,
    entry_path: 'agent_explore',
    status: 'draft'
  }).select().single()

  // Agent 세션 상태 업데이트
  await supabase.from('agent_sessions')
    .update({ status: 'converted', converted_project_id: project.id })
    .eq('id', params.id)

  return Response.json({ project_id: project.id })
}
```

### 4.4 STEP 1 자동 채움 로직

```typescript
// app/(creator)/projects/new/step/1/page.tsx

export default function Step1Page() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project_id')

  // Agent에서 넘어온 경우 기존 draft 프로젝트 불러오기
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectId ? getProject(projectId) : null,
    enabled: !!projectId
  })

  return (
    <ProjectForm
      // Agent 탐색 결과로 자동 채워짐
      defaultValues={{
        category: project?.category ?? '',
        title: '',           // Creator가 직접 입력
        one_liner: '',       // Creator가 직접 입력
        // agent_references는 STEP 1 우측 패널에 표시
      }}
      agentReferences={project?.agent_references}
    />
  )
}
```

---

## 5. Agent API — 상세 구현

### 5.1 Agent 아키텍처 개요

```
사용자 입력 (텍스트 or 토스트 선택)
        ↓
Phase 판단 로직 (현재 어느 단계인지)
        ↓
┌───────────────────────────────┐
│ Phase 1: 분야/단계 파악       │
│ → 토스트 선택지 반환          │
├───────────────────────────────┤
│ Phase 2: 시장 데이터 수집     │
│ → 4개 API 병렬 호출           │
│   · 네이버 데이터랩           │
│   · Google Trends (pytrends)  │
│   · 메타 광고 라이브러리      │
│   · 웹 검색 MCP               │
├───────────────────────────────┤
│ Phase 3: 결과 + 심화 질문     │
│ → 데이터 요약 + 토스트 선택지 │
├───────────────────────────────┤
│ Phase 4: 타사 레퍼런스 + CTA  │
│ → 카드 3개 + 등록하기 버튼    │
└───────────────────────────────┘
```

### 5.2 토스트 선택지 데이터 구조

```typescript
// types/agent.ts

interface ToastOption {
  id: string
  label: string
  emoji?: string
  value: string
}

interface AgentMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  toast_options?: ToastOption[]  // 선택지가 있으면 토스트 UI로 렌더링
  toast_type?: 'single' | 'multi'  // 단일 선택 / 복수 선택
  show_project_cta?: boolean  // 등록 버튼 표시 여부
  market_data?: MarketData    // Phase 2 데이터
  references?: Reference[]    // Phase 4 타사 레퍼런스
}

interface MarketData {
  naver_trend: { keyword: string; change_pct: number; period: string }
  google_trend: { interest: number; related_queries: string[] } | null  // [v1.1] null 허용
  meta_ads_count: number
  niche_gap: string  // "경쟁 적음 / 보통 / 치열"
}

interface Reference {
  name: string
  target: string
  price: string
  pros: string
  cons: string
  url?: string
}
```

### 5.3 Phase별 질문 흐름 상수

```typescript
// lib/agent/phases.ts

export const PHASE_1_CATEGORY = {
  question: '어떤 분야에 관심 있으세요?',
  toast_type: 'single',
  options: [
    { id: 'app',      label: '앱 / 소프트웨어',   value: 'app',      emoji: '📱' },
    { id: 'commerce', label: '커머스 / 이커머스',  value: 'commerce', emoji: '🛍️' },
    { id: 'health',   label: '헬스 / 웰니스',     value: 'health',   emoji: '💊' },
    { id: 'edu',      label: '교육 / 에듀테크',   value: 'edu',      emoji: '📚' },
    { id: 'food',     label: '푸드 / F&B',        value: 'food',     emoji: '🍽️' },
    { id: 'fintech',  label: '핀테크 / 금융',     value: 'fintech',  emoji: '💳' },
    { id: 'other',    label: '기타 (직접 입력)',   value: 'other',    emoji: '✏️' },
  ]
}

export const PHASE_1_STAGE = {
  question: '지금 어느 단계에 있으세요?',
  toast_type: 'single',
  options: [
    { id: 'idea',      label: '아이디어만 있어요',  value: 'idea',      emoji: '💡' },
    { id: 'research',  label: '시장 조사 중이에요', value: 'research',  emoji: '🔍' },
    { id: 'building',  label: '만들고 있어요',      value: 'building',  emoji: '🔨' },
    { id: 'launched',  label: '이미 출시했어요',    value: 'launched',  emoji: '🚀' },
  ]
}

// Phase 3 심화 질문 — 카테고리별로 다르게
export const PHASE_3_QUESTIONS: Record<string, object> = {
  health: {
    question: '어떤 타겟을 생각하고 계세요?',
    toast_type: 'single',
    options: [
      { id: 'senior',  label: '시니어 (60대+)',     value: 'senior',  emoji: '👴' },
      { id: 'young',   label: '2030 직장인',        value: 'young',   emoji: '💼' },
      { id: 'family',  label: '가족 단위',          value: 'family',  emoji: '👨‍👩‍👧' },
      { id: 'athlete', label: '운동하는 사람',      value: 'athlete', emoji: '🏋️' },
      { id: 'custom',  label: '직접 입력할게요',    value: 'custom',  emoji: '✏️' },
    ]
  },
  app: {
    question: '어떤 문제를 해결하려 하세요?',
    toast_type: 'multi',
    options: [
      { id: 'time',    label: '시간 절약',   value: 'time',    emoji: '⏱️' },
      { id: 'money',   label: '비용 절감',   value: 'money',   emoji: '💰' },
      { id: 'connect', label: '연결/소통',   value: 'connect', emoji: '🤝' },
      { id: 'manage',  label: '관리/정리',   value: 'manage',  emoji: '📋' },
    ]
  }
  // ... 카테고리별 추가
}
```

### 5.4 메인 Agent 대화 API

```typescript
// app/api/agent/chat/route.ts
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: Request) {
  const { session_id, message, selected_option, user_id } = await req.json()
  // selected_option: 토스트에서 선택한 값 (텍스트 입력과 구분)

  const session = await getOrCreateSession(session_id, user_id)
  const context = session.context as AgentContext

  // 현재 Phase 판단
  const currentPhase = determinePhase(context, session.messages.length)

  let response: AgentMessage

  if (currentPhase === 1 && !context.category) {
    // Phase 1-1: 카테고리 선택 요청
    response = {
      role: 'assistant',
      content: '어떤 분야에 관심 있으세요?',
      toast_options: PHASE_1_CATEGORY.options,
      toast_type: 'single',
      timestamp: new Date().toISOString()
    }
  } else if (currentPhase === 1 && !context.stage) {
    // Phase 1-2: 단계 선택 요청
    const category = selected_option || message
    await updateContext(session.id, { category })
    response = {
      role: 'assistant',
      content: `${category} 분야군요! 지금 어느 단계에 있으세요?`,
      toast_options: PHASE_1_STAGE.options,
      toast_type: 'single',
      timestamp: new Date().toISOString()
    }
  } else if (currentPhase === 2) {
    // Phase 2: 시장 데이터 수집 (4개 API 병렬)
    const stage = selected_option || message
    await updateContext(session.id, { stage })

    // 로딩 메시지 먼저 반환 (스트리밍)
    const marketData = await collectMarketData(context.category, context.keywords)

    response = {
      role: 'assistant',
      content: buildMarketSummary(marketData, context.category),
      market_data: marketData,
      toast_options: await generatePhase3Options(context.category, marketData),
      toast_type: 'single',
      timestamp: new Date().toISOString()
    }
  } else if (currentPhase === 3) {
    // Phase 3: 심화 질문 + 방향 선택
    const direction = selected_option || message
    await updateContext(session.id, { direction })

    // 타사 레퍼런스 조회
    const references = await collectReferences(context.category, direction)

    response = {
      role: 'assistant',
      content: buildReferencesSummary(references, direction),
      references,
      show_project_cta: true,  // 등록하기 버튼 표시
      timestamp: new Date().toISOString()
    }
  } else {
    // 자유 대화 (Claude API)
    response = await callClaudeForFreeChat(session, message, context)
  }

  // 세션 업데이트
  await saveMessage(session.id, { role: 'user', content: message || selected_option })
  await saveMessage(session.id, response)

  return Response.json(response)
}

function determinePhase(context: AgentContext, messageCount: number): number {
  if (!context.category || !context.stage) return 1
  if (!context.market_data) return 2
  if (!context.direction) return 3
  return 4  // 자유 대화
}
```

### 5.5 시장 데이터 수집 — 4개 API 병렬 호출

```typescript
// lib/agent/marketData.ts
import { FEATURES } from '@/lib/features/flags'

export async function collectMarketData(
  category: string,
  keywords: string[]
): Promise<MarketData> {
  // 4개 API 동시 호출
  const [naverResult, googleResult, metaResult, webResult] = await Promise.allSettled([
    fetchNaverTrend(category, keywords),
    fetchGoogleTrend(keywords),      // [v1.1] FEATURES.googleTrends flag로 제어
    fetchMetaAdsCount(category),     // [v1.1] FEATURES.metaAds flag로 제어
    fetchWebReferences(category, keywords)
  ])

  return {
    naver_trend: naverResult.status === 'fulfilled' ? naverResult.value : null,
    google_trend: googleResult.status === 'fulfilled' ? googleResult.value : null,
    meta_ads_count: metaResult.status === 'fulfilled' ? metaResult.value : 0,
    web_references: webResult.status === 'fulfilled' ? webResult.value : [],
    niche_gap: evaluateNicheGap(naverResult, metaResult)
  }
}

// 1. 네이버 데이터랩 — 베타 핵심 데이터 소스 (항상 활성)
async function fetchNaverTrend(category: string, keywords: string[]) {
  const res = await fetch('https://openapi.naver.com/v1/datalab/search', {
    method: 'POST',
    headers: {
      'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID!,
      'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET!,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      startDate: getMonthsAgo(3),
      endDate: getToday(),
      timeUnit: 'month',
      keywordGroups: keywords.map(kw => ({ groupName: kw, keywords: [kw] }))
    })
  })
  const data = await res.json()
  const latest = data.results?.[0]?.data?.slice(-1)[0]?.ratio ?? 0
  const prev = data.results?.[0]?.data?.slice(-4, -3)[0]?.ratio ?? 0
  const change_pct = prev > 0 ? Math.round(((latest - prev) / prev) * 100) : 0
  return { keyword: keywords[0], change_pct, period: '최근 3개월' }
}

// 2. Google Trends — [v1.1] FEATURES.googleTrends = false이면 즉시 skip
async function fetchGoogleTrend(keywords: string[]): Promise<GoogleTrendResult | null> {
  if (!FEATURES.googleTrends) {
    // 베타: graceful skip. Agent 메시지에서 이 섹션은 표시 생략
    return null
  }
  // 출시: GOOGLE_TRENDS_API_URL에 배포된 Python FastAPI 마이크로서비스 호출
  // (Supabase Edge Function은 Deno 런타임 — pytrends 실행 불가)
  const res = await fetch(`${process.env.GOOGLE_TRENDS_API_URL}/trends`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keywords })
  })
  return res.json()
}

// 3. 메타 광고 라이브러리 — [v1.1] FEATURES.metaAds = false이면 즉시 skip
async function fetchMetaAdsCount(category: string): Promise<number> {
  if (!FEATURES.metaAds || !process.env.META_ACCESS_TOKEN) {
    // 베타: 토큰 없거나 flag 꺼져 있으면 skip
    // niche_gap 평가는 네이버 데이터만으로 계산
    return 0
  }

  const categoryKeywords: Record<string, string> = {
    health: '건강기능식품 구독',
    app: '앱 서비스',
    commerce: '온라인 쇼핑',
    // ...
  }
  const searchTerm = categoryKeywords[category] ?? category

  const res = await fetch(
    `https://graph.facebook.com/v18.0/ads_archive?` +
    `access_token=${process.env.META_ACCESS_TOKEN}` +
    `&ad_reached_countries=['KR']` +
    `&search_terms=${encodeURIComponent(searchTerm)}` +
    `&ad_type=ALL` +
    `&fields=id,ad_creative_body,page_name` +
    `&limit=100`
  )
  const data = await res.json()
  return data.data?.length ?? 0
}

// 4. 웹 검색 MCP (타사 레퍼런스) — 항상 활성
async function fetchWebReferences(category: string, keywords: string[]) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    messages: [{
      role: 'user',
      content: `"${keywords.join(' ')}" 관련 국내외 서비스를 검색해서
      [{name, target, price, pros, cons, url}] JSON으로만 반환하세요 (최대 3개)`
    }]
  })
  const text = response.content.find(c => c.type === 'text')?.text ?? '[]'
  return JSON.parse(text.replace(/```json|```/g, '').trim())
}

// 틈새 시장 평가
function evaluateNicheGap(naverResult: any, metaResult: any): string {
  const adCount = metaResult.status === 'fulfilled' ? metaResult.value : 0
  // [v1.1] metaAds 비활성화 시 adCount = 0이므로 네이버 트렌드 기반으로만 평가
  if (adCount < 10)  return '경쟁 매우 적음 🟢'
  if (adCount < 50)  return '경쟁 적음 🟡'
  if (adCount < 100) return '경쟁 보통 🟠'
  return '경쟁 치열 🔴'
}
```

### 5.6 Google Trends 마이크로서비스 명세 (정식 출시용)

> **[v1.1 중요]** Supabase Edge Functions는 Deno(TypeScript) 런타임이다.
> pytrends는 Python 라이브러리이므로 Supabase Edge Function에서 직접 실행 불가.
> 베타에서는 `ENABLE_GOOGLE_TRENDS=false`로 비활성화하고,
> 정식 출시 전 별도 Python 마이크로서비스를 배포한 후 `GOOGLE_TRENDS_API_URL`을 설정한다.

```python
# [출시용] 별도 Python 마이크로서비스 — Vercel/Railway/Render에 FastAPI로 배포
# 파일: google-trends-service/main.py

from fastapi import FastAPI
from pydantic import BaseModel
from pytrends.request import TrendReq
import pandas as pd

app = FastAPI()

class TrendsRequest(BaseModel):
    keywords: list[str]

@app.post("/trends")
def get_trends(req: TrendsRequest):
    pytrends = TrendReq(hl='ko', tz=540)  # 한국 시간대
    pytrends.build_payload(
        kw_list=req.keywords[:5],
        timeframe='today 3-m',
        geo='KR'
    )
    interest_over_time = pytrends.interest_over_time()
    related_queries = pytrends.related_queries()

    return {
        'interest': interest_over_time.to_dict() if not interest_over_time.empty else {},
        'related_queries': {
            kw: related_queries.get(kw, {}).get('top', pd.DataFrame()).to_dict()
            for kw in req.keywords
        }
    }

# 배포 후 GOOGLE_TRENDS_API_URL=https://your-service.railway.app 설정
# ENABLE_GOOGLE_TRENDS=true로 변경 시 즉시 활성화
```

### 5.7 시장 데이터 요약 메시지 생성

```typescript
// lib/agent/messageBuilder.ts

function buildMarketSummary(data: MarketData, category: string): string {
  const parts: string[] = []

  if (data.naver_trend) {
    const sign = data.naver_trend.change_pct >= 0 ? '+' : ''
    parts.push(`📈 네이버 검색 트렌드: ${sign}${data.naver_trend.change_pct}% (${data.naver_trend.period})`)
  }

  // [v1.1] google_trend가 null이면 표시 생략 (베타 graceful skip)
  if (data.google_trend) {
    parts.push(`🌍 구글 트렌드: 한국 내 관심도 확인됨`)
  }

  // [v1.1] meta_ads_count가 0이고 metaAds flag 꺼진 경우 표시 생략
  if (FEATURES.metaAds && data.meta_ads_count !== undefined) {
    parts.push(`📣 메타 광고 집행 중인 업체: ${data.meta_ads_count}개`)
  }

  parts.push(`\n🔍 시장 경쟁 수준: ${data.niche_gap}`)

  return `${category} 분야 시장 데이터예요 📊\n\n${parts.join('\n')}\n\n어떤 방향으로 가고 싶으세요?`
}

function buildReferencesSummary(references: Reference[], direction: string): string {
  if (references.length === 0) {
    return `"${direction}" 방향으로 비슷한 서비스가 거의 없어요!\n공백 시장일 가능성이 높아요 🎯\n\n이 방향으로 실제 사람들의 반응을 확인해볼까요?`
  }

  const refList = references.map(r =>
    `• ${r.name}: ${r.target} | 강점: ${r.pros} | 약점: ${r.cons}`
  ).join('\n')

  return `"${direction}" 방향의 비슷한 서비스예요\n\n${refList}\n\n이 경쟁사들과 차별화할 수 있는 방향으로 실제 반응을 확인해볼까요?`
}
```

### 5.8 프론트엔드 토스트 UI 컴포넌트

```typescript
// components/agent/AgentMessage.tsx

export function AgentMessage({ message }: { message: AgentMessage }) {
  return (
    <div className="agent-message">
      {/* 텍스트 메시지 */}
      <p>{message.content}</p>

      {/* 시장 데이터 카드 */}
      {message.market_data && (
        <MarketDataCard data={message.market_data} />
      )}

      {/* 토스트 선택지 */}
      {message.toast_options && (
        <ToastOptions
          options={message.toast_options}
          type={message.toast_type}
          onSelect={(value) => sendToAgent(value)}
        />
      )}

      {/* 타사 레퍼런스 카드 */}
      {message.references && message.references.length > 0 && (
        <ReferenceCards references={message.references} />
      )}

      {/* 프로젝트 등록 CTA */}
      {message.show_project_cta && (
        <button
          className="cta-button"
          onClick={() => router.push('/projects/new?from=agent')}
        >
          지금 검증 등록하기 →
        </button>
      )}
    </div>
  )
}

// 토스트 선택지 컴포넌트
function ToastOptions({ options, type, onSelect }) {
  const [selected, setSelected] = useState<string[]>([])

  return (
    <div className="toast-options">
      {options.map(opt => (
        <button
          key={opt.id}
          className={`toast-option ${selected.includes(opt.id) ? 'selected' : ''}`}
          onClick={() => {
            if (type === 'single') {
              onSelect(opt.value)
            } else {
              setSelected(prev =>
                prev.includes(opt.id)
                  ? prev.filter(id => id !== opt.id)
                  : [...prev, opt.id]
              )
            }
          }}
        >
          {opt.emoji && <span>{opt.emoji}</span>}
          {opt.label}
        </button>
      ))}
      {type === 'multi' && selected.length > 0 && (
        <button
          className="confirm-button"
          onClick={() => onSelect(selected.join(','))}
        >
          선택 완료
        </button>
      )}
    </div>
  )
}
```

### 5.9 Agent 세션 컨텍스트 구조

```typescript
interface AgentContext {
  category?: string          // Phase 1에서 선택
  stage?: string             // Phase 1에서 선택
  keywords?: string[]        // category에서 자동 생성
  market_data?: MarketData   // Phase 2에서 수집
  direction?: string         // Phase 3에서 선택
  references?: Reference[]   // Phase 4에서 수집
  converted?: boolean        // 프로젝트 등록으로 전환됐는지
}

// 카테고리 → 검색 키워드 매핑
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  health:   ['건강기능식품', '건강식품 구독', '비타민 구독'],
  app:      ['앱 서비스', 'SaaS', '모바일 앱'],
  commerce: ['온라인 쇼핑', '이커머스', '정기배송'],
  edu:      ['온라인 교육', '에듀테크', '학습 앱'],
  food:     ['밀키트', '음식 배달', '식품 구독'],
  fintech:  ['금융 앱', '핀테크', '투자 플랫폼'],
}
```

---

## 6. 프로젝트 등록 — STEP별 상세

### 6.1 STEP 1 — 기본 정보

```typescript
// 입력 필드
interface Step1Data {
  title: string           // 서비스/제품명 (최대 30자)
  one_liner: string       // 한 줄 소개 (최대 60자)
  category: string        // 앱 | 게임 | 웹서비스 | SaaS | 커머스 | 헬스 | 에듀 | 핀테크 | 푸드 | 부동산 | 기타
  stage: 'idea' | 'prototype' | 'beta' | 'launched'
  resource_url?: string          // 랜딩/소개 URL (선택)
  creator_references?: string[]  // Creator가 직접 추가한 타사 레퍼런스 URL (선택)
  project_type: 'light' | 'standard'
}

// psf_pmf_type 자동 판별
function getPsfPmfType(stage: string): 'psf' | 'pmf' {
  return (stage === 'idea' || stage === 'prototype') ? 'psf' : 'pmf'
}

// Light + 베타/출시후 선택 시 비권장 안내
// "실제로 운영 중인 서비스라면 더 꼼꼼하게 확인하는 Standard를 추천해요"
```

### 6.1.1 타사 레퍼런스 — 두 가지 수집 방식

```typescript
// 방식 1: FindFit이 자동으로 찾아줌 (Agent에서 이미 수집된 것)
// → agent_references JSONB 컬럼에 저장되어 있음
// → STEP 1 우측 패널에 카드로 미리 표시
// → Creator는 아무 것도 안 해도 됨

// 방식 2: Creator가 직접 URL 추가 (선택)
// → STEP 1 하단 "참고할 경쟁사가 있으면 URL을 추가해주세요" 입력 필드
// → 입력된 URL을 AI가 분석해서 요약

// URL 분석 API
// POST /api/projects/[id]/references/analyze
export async function POST(req: Request, { params }) {
  const { url } = await req.json()

  // 1. URL 페이지 내용 가져오기
  const pageContent = await fetchPageContent(url)

  // 2. Claude로 분석
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `아래 서비스 페이지를 분석해서 JSON으로만 반환하세요:
      {
        "name": "서비스명",
        "target": "주요 타겟 한 줄",
        "price": "가격대 (확인 안되면 '미확인')",
        "pros": "주요 강점 한 줄",
        "cons": "예상 약점 한 줄",
        "url": "${url}"
      }
      
      페이지 내용: ${pageContent.substring(0, 3000)}`
    }]
  })

  const analyzed = JSON.parse(response.content[0].text)
  return Response.json({ reference: analyzed })
}

// 두 가지 합산 — 최종 레퍼런스 세트 구성
async function buildFinalReferences(projectId: string): Promise<Reference[]> {
  const project = await getProject(projectId)

  // Agent가 자동으로 찾은 것
  const agentRefs: Reference[] = project.agent_references ?? []

  // Creator가 직접 추가한 것 (DB에서 조회)
  const { data: creatorRefs } = await supabase
    .from('project_references')
    .select('*')
    .eq('project_id', projectId)
    .eq('source', 'creator')

  // 중복 제거 후 합산 (name 기준)
  const allRefs = [...agentRefs, ...(creatorRefs ?? [])]
  const unique = allRefs.filter((ref, idx, self) =>
    idx === self.findIndex(r => r.name === ref.name)
  )

  return unique
}
```

### 6.1.2 project_references 테이블 (신규)

```sql
CREATE TABLE project_references (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
  source      TEXT NOT NULL,   -- 'agent' | 'creator'
  name        TEXT NOT NULL,
  target      TEXT,
  price       TEXT,
  pros        TEXT,
  cons        TEXT,
  url         TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

STEP 1 저장 시 처리:
```typescript
// Agent 자동 수집 → project_references에 source='agent'로 저장
// Creator 직접 추가 → URL 분석 후 source='creator'로 저장
// 두 소스 모두 같은 테이블에서 관리
```

### 6.2 STEP 2 — 문제/솔루션

```typescript
interface Step2Data {
  problem: string         // Pain Point (최대 200자)
  current_solution: string // 현재 대안 (최대 200자)
  differentiation: string  // 차별점 (최대 200자)
}
```

### 6.3 STEP 3 — 타겟 고객

```typescript
interface Step3Data {
  target_description: string  // 주요 타겟 설명
  target_jobs: string[]       // 직군 태그 (복수 선택)
  target_age_range: string    // 연령대
}
```

### 6.4 STEP 4 — 검증 질문

```typescript
// 질문 세트 자동 로딩
async function loadQuestionSet(projectType: string, psfPmfType: string) {
  const maxQ = { light: 5, standard: 9 }[projectType]

  // 필수 질문 (잠금 블록)
  const required = await supabase
    .from('question_templates')
    .select('*')
    .eq('project_type', projectType)
    .eq('psf_pmf_type', psfPmfType)
    .eq('is_required', true)
    .order('order_index')

  return {
    required: required.data,
    remainingSlots: maxQ - required.data.length
  }
}

// AI 질문 자동 추천
// POST /api/projects/[id]/questions/suggest
// → Step 1~3 데이터 + 기존 질문 기반으로 추천 질문 생성
```

### 6.5 STEP 5 — 자료 첨부

```typescript
interface Step5Data {
  resource_url?: string    // 랜딩페이지 URL
  demo_video_url?: string  // 데모 영상 URL
  images?: File[]          // 이미지 파일 (Supabase Storage)
}
```

### 6.6 STEP 6 — 평가단/비용 확인

```typescript
interface Step6Data {
  target_count: number     // 모집 인원 (최소 5명)
  incentive_exists: boolean
  incentive_budget?: number  // 사례금 총 예산
}

// 비용 계산
function calculateCost(projectType: string, targetCount: number, incentiveBudget: number) {
  const LIGHT_FEE = 4900
  const STANDARD_FEE_PER_PERSON = 1800
  const COMMISSION_RATE = 0.15

  const platformFee = projectType === 'light'
    ? LIGHT_FEE
    : Math.floor(STANDARD_FEE_PER_PERSON * targetCount * getVolumeDiscount(targetCount))

  const commission = Math.floor(incentiveBudget * COMMISSION_RATE)
  const total = platformFee + incentiveBudget + commission

  return { platformFee, commission, total }
}

// [v1.1 수정] 볼륨 디스카운트 — Feature Flag로 제어
// 베타: ENABLE_VOLUME_DISCOUNT=false → 항상 1.0 (할인 없음, 1,800원/명 고정)
// 출시: ENABLE_VOLUME_DISCOUNT=true → 인원 구간별 할인 적용
function getVolumeDiscount(count: number): number {
  if (!FEATURES.volumeDiscount) {
    return 1.0  // 베타: 할인 없음
  }
  // 출시: 볼륨 디스카운트 적용
  if (count >= 100) return 0.75
  if (count >= 50)  return 0.85
  if (count >= 30)  return 0.90
  return 1.0
}
```

---

## 7. 결제 — PortOne 연동

### 7.1 결제 수취 (Creator → FindFit)

```typescript
// components/payment/PortOnePayment.tsx
import * as PortOne from '@portone/browser-sdk/v2'

async function requestPayment(project: Project, totalAmount: number) {
  const response = await PortOne.requestPayment({
    storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID!,
    channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY!,
    paymentId: `findfit_${project.id}_${Date.now()}`,
    orderName: `FindFit 의뢰: ${project.title}`,
    totalAmount,
    currency: 'KRW',
    payMethod: 'CARD'
  })

  // 서버 검증
  await verifyPayment(response.paymentId)

  // 프로젝트 status active로 변경
  await supabase.from('projects')
    .update({ status: 'active', portone_payment_key: response.paymentId })
    .eq('id', project.id)
}
```

### 7.2 Reviewer 정산 (수동 → 자동)

```typescript
// MVP: 수동 계좌이체
// 배분 확정 시 distributions 레코드 생성 + 수동 처리 알림

// lib/distribution/tax.ts
const TAX_THRESHOLD = 50000
const WITHHOLDING_RATE = 0.033  // 소득세 3% + 지방소득세 0.3%

export function calcSettlement(amount: number) {
  if (amount <= TAX_THRESHOLD) {
    return { withholding_tax: 0, net_amount: amount }
  }
  const tax = Math.floor(amount * WITHHOLDING_RATE)
  return { withholding_tax: tax, net_amount: amount - tax }
}
```

---

## 8. AI 리포트 파이프라인

### 8.1 AI 추상화 레이어

```typescript
// lib/ai/index.ts
import { FEATURES } from '@/lib/features/flags'

export async function generateReport(
  reviews: Review[],
  project: Project,
  creatorLevel: string
) {
  // [v1.1 수정] 엔진 선택 로직
  // 베타: ENABLE_EXP_SYSTEM=false → AI_ENGINE 환경변수로 고정 (기본값 gemini)
  // 출시: ENABLE_EXP_SYSTEM=true → creator level에 따라 분기
  let engine: 'claude' | 'gemini'

  if (FEATURES.expSystem && FEATURES.claudeReport) {
    // 출시: Builder 이상 Creator는 Claude, 나머지는 Gemini
    engine = ['builder', 'launcher'].includes(creatorLevel) ? 'claude' : 'gemini'
  } else {
    // 베타: AI_ENGINE 환경변수 고정 (기본값 gemini)
    engine = (process.env.AI_ENGINE as 'claude' | 'gemini') ?? 'gemini'
  }

  const prompt = buildReportPrompt(reviews, project)

  const result = engine === 'claude'
    ? await callClaude(prompt)
    : await callGemini(prompt)

  return { ...result, ai_engine_used: engine }
}
```

### 8.2 프롬프트 — 타입별 분기

```typescript
// lib/ai/prompt.ts
export function buildReportPrompt(reviews: Review[], project: Project): string {
  if (project.project_type === 'light') return buildLightPrompt(reviews, project)
  return buildStandardPrompt(reviews, project)
}

function buildLightPrompt(reviews: Review[], project: Project): string {
  return `당신은 빠른 의사결정을 돕는 분석가입니다.
[${reviews.length}건의 응답]
${JSON.stringify(reviews.map(r => r.answers))}

아래 JSON 형식으로만 반환하세요:
{
  "positive_pct": 0~100,
  "negative_pct": 0~100,
  "top_opinions": ["의견1", "의견2", "의견3"],
  "one_line_conclusion": "한 줄 결론"
}`
}

function buildStandardPrompt(reviews: Review[], project: Project): string {
  return `당신은 PSF/PMF 검증 전문가입니다.
[프로젝트] ${project.title} / ${project.psf_pmf_type?.toUpperCase()} 모드
[문제] ${project.problem}  [솔루션] ${project.solution}
[타겟] ${project.target_description}
[${reviews.length}건의 응답]
${JSON.stringify(reviews.map(r => r.answers))}

아래 JSON 형식으로만 반환하세요:
{
  "psf_score": 0~100,
  "sean_ellis_pct": 0~100,
  "recommendation": "continue" | "pivot" | "stop",
  "problem_exists_pct": 0~100,
  "solution_acceptance_pct": 0~100,
  "key_insights": ["인사이트1", "인사이트2", "인사이트3"],
  "pattern_analysis": "패턴 분석 텍스트",
  "benchmark_comment": "동일 카테고리 평균 대비 코멘트",
  "action_plan": ["액션1", "액션2", "액션3"],
  "pivot_scenarios": ["시나리오1", "시나리오2"],
  "competitor_positioning": "타사 대비 포지셔닝 분석"
}`
}
```

### 8.3 Edge Function — 리포트 생성 트리거

```typescript
// supabase/functions/generate-ai-report/index.ts
import { FEATURES } from '../_shared/flags.ts'

Deno.serve(async (req) => {
  const { project_id } = await req.json()

  const project = await getProject(project_id)
  const reviews = await getPassedReviews(project_id)
  const creator = await getCreatorProfile(project.creator_id)

  const result = await generateReport(reviews, project, creator.level)

  // [v1.1 수정] is_unlocked 판별 — EXP 시스템 활성화 여부에 따라 분기
  // 베타: ENABLE_EXP_SYSTEM=false → 모두 false (9,900원 결제 후 unlock)
  // 출시: builder/launcher는 자동 unlock
  const isAutoUnlocked = FEATURES.expSystem
    ? ['builder', 'launcher'].includes(creator.level)
    : false

  await supabase.from('ai_reports').insert({
    project_id,
    report_type: project.project_type,
    ai_engine_used: result.ai_engine_used,
    psf_score: result.psf_score ?? null,
    sean_ellis_pct: result.sean_ellis_pct ?? null,
    recommendation: result.recommendation ?? null,
    report_data: result,
    is_unlocked: isAutoUnlocked
  })

  // 프로젝트 status reviewing으로 변경 + 배분 마감 72시간 설정
  await supabase.from('projects').update({
    status: 'reviewing',
    distribution_deadline: new Date(Date.now() + 72 * 60 * 60 * 1000)
  }).eq('id', project_id)

  // [v1.1] 알림 — 이메일 우선, FCM은 flag로 제어
  await sendNotification(project.creator_id, 'AI_REPORT_READY', { project_id })
})
```

---

## 9. Supabase Edge Functions 목록

| 함수명 | 트리거 | 역할 | 베타 상태 |
|--------|--------|------|-----------|
| generate-ai-report | DB Webhook: completed_count = target_count | AI 리포트 생성 | ✅ 활성 |
| auto-distribute | Cron: 매 1시간 | 72시간 자동 균등 배분 | ⛔ Cron 미등록 (수동 대체) |
| quality-screening | DB Trigger: reviews.insert | 응답 품질 자동 체크 | ✅ 활성 |
| exp-calculator | DB Trigger: distributions.completed | EXP 계산 + 레벨 업데이트 | ⛔ flag 체크로 비활성 |
| send-push | DB Trigger: 상태 변경 | FCM 푸시 발송 | ⛔ flag 체크로 비활성 |
| send-email | DB Trigger: 주요 이벤트 | Resend 이메일 발송 | ✅ 활성 |

### 9.1 auto-distribute

```typescript
// supabase/functions/auto-distribute/index.ts
import { FEATURES } from '../_shared/flags.ts'

Deno.serve(async () => {
  // [v1.1] 베타: ENABLE_AUTO_DISTRIBUTE=false → 즉시 종료
  // supabase/config.toml에서 Cron 자체를 미등록 (방법 A)
  // 또는 아래 flag 체크로 비활성화 (방법 B)
  if (!FEATURES.autoDistribute) {
    console.log('[auto-distribute] disabled in beta — manual distribution only')
    return new Response(JSON.stringify({ status: 'disabled' }), { status: 200 })
  }

  // 출시: 실제 자동 배분 로직
  const now = new Date()

  // 72시간 경과 + 배분 미완료 프로젝트
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('status', 'reviewing')
    .is('distribution_method', null)
    .lt('distribution_deadline', now.toISOString())

  for (const project of projects ?? []) {
    const reviewers = await getCompletedReviewers(project.id)
    const equalAmount = Math.floor(project.incentive_budget / reviewers.length)
    const remainder = project.incentive_budget - equalAmount * reviewers.length

    const allocations = reviewers.map((r, i) => ({
      reviewer_id: r.id,
      nickname: r.nickname,
      amount: i === 0 ? equalAmount + remainder : equalAmount
    }))

    await executeDistribution(project, 'equal', allocations)
    await sendNotification(project.creator_id, 'AUTO_DISTRIBUTION_COMPLETED', { project_id: project.id })
  }
})
```

> **[v1.1] config.toml Cron 설정 — 베타에서는 주석 처리**
>
> ```toml
> # supabase/config.toml
>
> [functions.auto-distribute]
> # 베타: Cron 미등록 (주석 처리 유지)
> # schedule = "0 * * * *"
> # ↑ 출시 시 주석 해제
>
> [functions.exp-calculator]
> # 베타: Cron 미등록
> # schedule = "*/30 * * * *"
> # ↑ 출시 시 주석 해제
> ```
>
> 베타에서 사례금 수동 지급은 어드민 API로 처리:
> ```
> POST /api/admin/distribute  ← 운영자가 수동으로 호출
> ```

### 9.2 exp-calculator

```typescript
// supabase/functions/exp-calculator/index.ts
import { FEATURES } from '../_shared/flags.ts'

Deno.serve(async (req) => {
  // [v1.1] 베타: ENABLE_EXP_SYSTEM=false → 아무것도 안 함
  if (!FEATURES.expSystem) {
    return new Response(JSON.stringify({ status: 'disabled' }), { status: 200 })
  }

  // 출시: EXP 계산 + 레벨 업데이트 로직
  const { userId, action } = await req.json()
  // ... EXP 계산 구현
})
```

### 9.3 [v1.1 신규] 공유 Flag 모듈 (Edge Function용)

```typescript
// supabase/functions/_shared/flags.ts
// Edge Function 내부에서 사용하는 Feature Flag
// Next.js의 lib/features/flags.ts와 동일한 구조

export const FEATURES = {
  googleTrends:    Deno.env.get('ENABLE_GOOGLE_TRENDS') === 'true',
  metaAds:         Deno.env.get('ENABLE_META_ADS') === 'true',
  volumeDiscount:  Deno.env.get('ENABLE_VOLUME_DISCOUNT') === 'true',
  autoDistribute:  Deno.env.get('ENABLE_AUTO_DISTRIBUTE') === 'true',
  expSystem:       Deno.env.get('ENABLE_EXP_SYSTEM') === 'true',
  roleSwitch:      Deno.env.get('ENABLE_ROLE_SWITCH') === 'true',
  fcmPush:         Deno.env.get('ENABLE_FCM_PUSH') === 'true',
  claudeReport:    Deno.env.get('ENABLE_CLAUDE_REPORT') === 'true',
} as const
```

---

## 10. 알림 시스템

> **[v1.1 수정]** 베타에서는 Resend 이메일만 사용. FCM 푸시는 `ENABLE_FCM_PUSH=true` 전환 시 활성화.

### 10.1 통합 알림 함수

```typescript
// lib/notifications/send.ts
import { FEATURES } from '@/lib/features/flags'

export async function sendNotification(
  userId: string,
  type: NotificationType,
  data: Record<string, string>
) {
  // 항상: Resend 이메일 발송
  await sendEmail(userId, type, data)

  // [v1.1] 출시: ENABLE_FCM_PUSH=true일 때만 FCM 푸시 추가
  if (FEATURES.fcmPush) {
    await sendPushNotification(userId, type, data)
  }
}
```

### 10.2 알림 유형 목록

| 유형 | 트리거 | 메시지 | 베타 채널 |
|------|--------|--------|-----------|
| AI_REPORT_READY | 리포트 생성 완료 | "PSF 스코어가 나왔어요! 리포트를 확인하세요" | 이메일 |
| DISTRIBUTION_REMINDER_1 | 24시간 경과 | "배분을 입력해주세요. 48시간 후 자동 처리됩니다" | 이메일 |
| DISTRIBUTION_REMINDER_2 | 48시간 경과 | "마지막 알림: 24시간 후 균등 자동 배분됩니다" | 이메일 |
| AUTO_DISTRIBUTION_COMPLETED | 72시간 경과 | "균등 배분이 자동 처리됐습니다" | 이메일 |
| REVIEW_INVITATION | Reviewer 매칭 | "새로운 의뢰가 도착했어요!" | 이메일 |
| INCENTIVE_PAID | 정산 완료 | "OOO원이 입금됐습니다" | 이메일 |
| PROJECT_COMPLETED | 전원 완료 | "모든 평가가 완료됐어요! 결과를 확인하세요" | 이메일 |

---

## 11. 개발 우선순위 체크리스트

### Week 1 (Day 1~7)

```
[ ] lib/features/flags.ts 생성 + 모든 flag false 세팅     ← [v1.1 추가, Day 1 필수]
[ ] .env.local에 ENABLE_* 변수 전체 추가                   ← [v1.1 추가, Day 1 필수]
[ ] Supabase 프로젝트 생성 + DB 스키마 마이그레이션 (섹션 2 전체)
[ ] Next.js 14 프로젝트 세팅 + 기본 Auth (Supabase Auth)
[ ] supabase/functions/_shared/flags.ts 생성               ← [v1.1 추가]
[ ] STEP 0 모달 컴포넌트 구현 (섹션 4.1)
[ ] Agent 세션 테이블 생성 + 기본 대화 API (섹션 5.1)
[ ] 네이버 데이터랩 API 연동 (섹션 5.2)
[ ] 타사 레퍼런스 조회 API (섹션 5.3)
[ ] Agent에서 STEP 1으로 데이터 전달 로직 (섹션 4.3, 4.4)
```

### Week 2 (Day 8~14)

```
[ ] STEP 1~6 위자드 전체 구현 (섹션 6)
[ ] 질문 템플릿 시드 데이터 INSERT
[ ] AI 질문 자동 추천 API
[ ] Reviewer 프로젝트 피드 (/evaluator/available) — 프로젝트 카드 목록         ← [v1.2]
[ ] Reviewer 프로젝트 상세 (/evaluator/projects/[id]) + 지원하기 폼 모달       ← [v1.2 신규]
[ ] 지원 API: POST /api/evaluator/apply → project_matches 생성 (status=pending) ← [v1.2 신규]
[ ] Reviewer 평가 폼 3단계 (/evaluator/review/[matchId])                       ← [v1.2 신규]
[ ] 평가 제출 API: POST /api/reviews/[matchId] → reviews 테이블 저장
[ ] Admin 운영 화면 4개 (/admin/login, /admin, /admin/applications, /admin/distributions) ← [v1.2 신규]
[ ] Admin API: PATCH /api/admin/applications/[id]/accept — 수락 + Resend 발송   ← [v1.2 신규]
[ ] Admin API: PATCH /api/admin/distributions/[id]/complete — 정산 완료 처리    ← [v1.2 신규]
[ ] Admin 미들웨어: ADMIN_SECRET_KEY 쿠키 인증                                  ← [v1.2 신규]
[ ] Gemini AI 리포트 파이프라인 (섹션 8) — AI_ENGINE=gemini 고정
[ ] Light/Standard 리포트 화면 (블러 + 잠금 해제)
[ ] Light 리포트 하단 Standard 업셀 블러 영역
```

### Week 3 (Day 15~21)

```
[ ] PortOne 결제 연동 (섹션 7.1)
[ ] 결제 완료 → projects.status = 'active' 처리
[ ] 배분 뷰 화면 + distribute API
[ ] /api/admin/distribute 수동 지급 API 구현            ← [v1.1 수정: auto-distribute Cron 대신]
[ ] Creator 랜딩페이지 배포
[ ] Reviewer 랜딩페이지 배포
[ ] 전체 플로우 E2E 테스트
```

### Week 4 (Day 22~30)

```
[ ] 베타 10명 온보딩
[ ] 수동 Reviewer 매칭 운영
[ ] 버그 수정 + 즉시 반영                              ← [v1.1 수정: FCM 제거]
[ ] 정식 배포 (Vercel)
[ ] 커뮤니티 공고 발송
```

> **[v1.1] Week 4 체크리스트에서 제거된 항목:**
> - ~~FCM 푸시 알림 연동~~ → Growth Phase로 이동 (이메일로 충분)
> - ~~auto-distribute Edge Function + Cron 등록~~ → 수동 지급 API로 대체

---

## 12. [v1.1 신규] 베타 → 정식 출시 전환 가이드

### 12.1 전환 체크리스트

> `.env` 파일의 값을 `false` → `true`로 바꾸는 것만으로 기능이 활성화된다.
> 각 항목은 사전 준비가 완료된 후에 전환한다.

| Flag | 전환 조건 | 사전 준비 |
|------|---------|---------|
| ENABLE_GOOGLE_TRENDS | Python 마이크로서비스 배포 완료 | Railway/Render에 FastAPI 서버 배포, GOOGLE_TRENDS_API_URL 설정 |
| ENABLE_META_ADS | Meta 앱 심사 통과 | Meta 개발자 계정 생성, 앱 심사 제출, META_ACCESS_TOKEN 발급 |
| ENABLE_VOLUME_DISCOUNT | 기획서에 가격 정책 공식 반영 | 가격 정책 문서 업데이트, 랜딩페이지 가격 표시 수정 |
| ENABLE_AUTO_DISTRIBUTE | PortOne 파트너 정산 셋업 | config.toml Cron 주석 해제, PortOne 파트너 정산 API 연동 |
| ENABLE_EXP_SYSTEM | EXP 획득 기준 기획 확정 | EXP 정책 문서화, exp-calculator 로직 구현 |
| ENABLE_ROLE_SWITCH | DB 마이그레이션 실행 완료 | role → roles 배열 마이그레이션 스크립트 실행 |
| ENABLE_FCM_PUSH | Firebase 셋업 완료 | Firebase 프로젝트 생성, Service Account JSON, SW 등록 |
| ENABLE_CLAUDE_REPORT | Anthropic 청구 설정 완료 | 비용 모니터링 설정, 크레딧 충전 |

### 12.2 Meta 광고 API 신청 가이드 (지금 시작)

```
1. developers.facebook.com 접속
2. 앱 생성 → "비즈니스" 유형 선택
3. Ad Library API 권한 요청
4. 비즈니스 인증 (사업자등록증 필요)
5. 심사 통과 후 META_ACCESS_TOKEN 발급
6. .env에 META_ACCESS_TOKEN 입력
7. ENABLE_META_ADS=true 전환
```

> ⚠️ 심사에 3~7일 소요될 수 있으므로 개발 시작과 동시에 신청 권장.

---

## 13. [v1.2 신규] Reviewer 화면 기술 명세

### 13.1 프로젝트 피드 (`/evaluator/available`)

```typescript
// app/(reviewer)/available/page.tsx

export default async function ReviewerFeedPage() {
  // status='active' 또는 'matching' 프로젝트만 표시
  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, category, project_type, survey_type, target_count, completed_count, incentive_budget, incentive_exists, created_at')
    .in('status', ['active', 'matching'])
    .order('created_at', { ascending: false })

  return <ProjectFeed projects={projects} />
}

// components/reviewer/ProjectFeedCard.tsx
interface ProjectFeedCardProps {
  project: {
    id: string
    title: string
    category: string
    project_type: 'light' | 'standard'
    survey_type?: 'survey' | 'experience'  // [v1.2] 체험형 구분
    target_count: number
    completed_count: number
    incentive_exists: boolean
    incentive_budget: number
    deadline_date: string  // projects에 추가 예정 컬럼
  }
}

// 카드에 표시할 예상 소요시간 계산
function getEstimatedTime(projectType: string, surveyType: string): string {
  if (surveyType === 'experience') return '체험 후 약 30분'
  return projectType === 'light' ? '약 20분' : '약 40분'
}
```

### 13.2 프로젝트 상세 + 지원 폼 (`/evaluator/projects/[id]`)

```typescript
// app/(reviewer)/projects/[id]/page.tsx

export default async function ReviewerProjectDetailPage({ params }) {
  const project = await supabase
    .from('projects')
    .select('*, review_questions(*)')
    .eq('id', params.id)
    .single()

  return (
    <>
      <ProjectDetail project={project} />
      <ApplyButton projectId={params.id} />
    </>
  )
}

// 지원 폼 모달 — 지원하기 클릭 시 표시
interface ApplyFormData {
  nickname: string        // 플랫폼 표시 이름 (Creator한테는 "리뷰어 A"로 보임)
  applicant_email: string // 수락 알림 수신용 이메일
  applicant_domain: string[] // 도메인 태그 (복수 선택)
  applicant_intro?: string   // 한 줄 소개 (선택)
  nda_agreed: boolean        // NDA 동의
}

// 지원 API
// POST /api/evaluator/apply
export async function POST(req: Request) {
  const { project_id, nickname, applicant_email, applicant_domain, applicant_intro } = await req.json()

  // 닉네임 자동 생성: Reviewer_A, Reviewer_B...
  const { count } = await supabase
    .from('project_matches')
    .select('*', { count: 'exact' })
    .eq('project_id', project_id)

  const autoNickname = `Reviewer_${String.fromCharCode(65 + (count ?? 0))}`

  await supabase.from('project_matches').insert({
    project_id,
    reviewer_id: null,       // Auth 없는 베타에서는 null
    nickname: autoNickname,
    applicant_email,
    applicant_domain,
    applicant_intro: applicant_intro ?? null,
    status: 'pending',
    applied_at: new Date().toISOString()
  })

  // 운영자에게 신청 알림 이메일 (선택)
  await sendNotification('admin', 'NEW_REVIEWER_APPLICATION', { project_id })

  return Response.json({ success: true })
}
```

### 13.3 평가 폼 3단계 (`/evaluator/review/[matchId]`)

```typescript
// app/(reviewer)/review/[matchId]/page.tsx

export default async function ReviewFormPage({ params }) {
  // 수락 상태인 경우만 접근 허용
  const match = await supabase
    .from('project_matches')
    .select('*, projects(*, review_questions(*))')
    .eq('id', params.matchId)
    .eq('status', 'accepted')  // accepted 상태만
    .single()

  if (!match) redirect('/evaluator/reviews')  // 비수락자 차단

  return <ReviewForm match={match} />
}

// 3단계 폼 상태 관리
type ReviewStep = 1 | 2 | 3

interface ReviewFormState {
  step: ReviewStep
  answers: Record<string, string | number>  // {question_id: answer}
  nda_confirmed: boolean
}

// Step 1: 서비스 브리프 (읽기 전용)
// Step 2: 질문 답변 (question_type별 UI 렌더링)
// Step 3: NDA 확인 + 제출

// 평가 제출 API
// POST /api/reviews/[matchId]
export async function POST(req: Request, { params }) {
  const { answers, sean_ellis_ans } = await req.json()

  const match = await getMatch(params.matchId)

  // 리뷰 저장
  await supabase.from('reviews').insert({
    match_id: params.matchId,
    project_id: match.project_id,
    reviewer_id: match.reviewer_id,
    answers,
    sean_ellis_ans: sean_ellis_ans ?? null,
    submitted_at: new Date().toISOString()
  })

  // match 상태 업데이트
  await supabase.from('project_matches')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', params.matchId)

  // completed_count +1
  await supabase.rpc('increment_completed_count', { project_id: match.project_id })

  // completed_count = target_count 되면 AI 리포트 자동 트리거
  // → generate-ai-report Edge Function이 DB Webhook으로 감지

  return Response.json({ success: true })
}
```

### 13.4 내 참여 현황 (`/evaluator/reviews`)

```typescript
// app/(reviewer)/reviews/page.tsx
// 이메일로 전달된 matchId 기반으로 내 참여 현황 조회
// Auth 없는 베타: URL 파라미터 ?email=xxx 로 조회 (임시)

// 상태 배지 매핑
const STATUS_CONFIG = {
  pending:   { label: '검토 중',    color: 'blue',   emoji: '🔵' },
  accepted:  { label: '평가 진행 중', color: 'yellow', emoji: '🟡' },
  completed: { label: '제출 완료',  color: 'green',  emoji: '🟢' },
  dropped:   { label: '미선발',     color: 'gray',   emoji: '⚪' },
}
```

### 13.5 `projects` 테이블 추가 컬럼 (v1.2)

```sql
-- [v1.2] 베타 기간에 필요한 프로젝트 기한/타입 컬럼 추가
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS survey_type TEXT DEFAULT 'survey',
  -- 'survey' | 'experience' (체험형은 베타 잠금)
  ADD COLUMN IF NOT EXISTS duration_days INT DEFAULT 5,
  -- Creator가 선택하는 기한 (Light: 3/5/7 / Standard: 5/7/10 / 체험형: 3/5/7/14)
  ADD COLUMN IF NOT EXISTS deadline_date DATE;
  -- duration_days 기반으로 active 전환 시 자동 계산
```

---

## 14. [v1.2 신규] Admin 운영 화면 기술 명세

### 14.1 Admin 인증 미들웨어

```typescript
// middleware.ts (기존 파일에 추가)
import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // /admin 경로 보호 (로그인 페이지 제외)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const adminCookie = req.cookies.get('admin_auth')?.value

    if (adminCookie !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
}

// app/(admin)/login/page.tsx
// ADMIN_SECRET_KEY 입력 → 일치 시 'admin_auth' 쿠키 7일 유지 → /admin으로 리다이렉트
```

### 14.2 Admin 대시보드 (`/admin`)

```typescript
// app/(admin)/page.tsx

export default async function AdminDashboard() {
  const [pendingApps, pendingDists, urgentProjects] = await Promise.all([
    // 검토 대기 신청 수
    supabase.from('project_matches').select('*', { count: 'exact' }).eq('status', 'pending'),
    // 정산 대기 건 수
    supabase.from('distributions').select('*', { count: 'exact' }).eq('status', 'pending'),
    // 마감 D-1 프로젝트
    supabase.from('projects')
      .select('*')
      .in('status', ['active', 'matching'])
      .eq('deadline_date', getTomorrow())
  ])

  return (
    <AdminDashboardView
      pendingApps={pendingApps.count ?? 0}
      pendingDists={pendingDists.count ?? 0}
      urgentProjects={urgentProjects.data ?? []}
    />
  )
}
```

### 14.3 Reviewer 신청 관리 API

```typescript
// POST /api/admin/applications/[id]/accept
export async function POST(req: Request, { params }) {
  // 1. 상태 변경
  await supabase.from('project_matches')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', params.id)

  // 2. match + project 정보 조회
  const match = await getMatchWithProject(params.id)

  // 3. Reviewer에게 수락 + 평가 링크 이메일 발송 (Resend)
  await resend.emails.send({
    from: 'FindFit <no-reply@findfit.kr>',
    to: match.applicant_email,
    subject: `[FindFit] "${match.project.title}" 평가 의뢰가 수락됐어요!`,
    html: buildAcceptanceEmail({
      nickname: match.nickname,
      projectTitle: match.project.title,
      reviewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/evaluator/review/${params.id}`,
      deadlineDate: match.project.deadline_date,
      incentiveAmount: match.project.incentive_budget / match.project.target_count
    })
  })

  return Response.json({ success: true })
}

// POST /api/admin/applications/[id]/reject
export async function POST(req: Request, { params }) {
  await supabase.from('project_matches')
    .update({ status: 'dropped' })
    .eq('id', params.id)

  const match = await getMatch(params.id)

  // 거절 안내 이메일 (선택 — body에 sendEmail: true로 요청 시)
  const { sendEmail } = await req.json()
  if (sendEmail) {
    await resend.emails.send({
      from: 'FindFit <no-reply@findfit.kr>',
      to: match.applicant_email,
      subject: '[FindFit] 이번 의뢰는 아쉽게도 매칭이 어려웠어요',
      html: buildRejectionEmail({ nickname: match.nickname })
    })
  }

  return Response.json({ success: true })
}
```

### 14.4 정산 완료 처리 API

```typescript
// POST /api/admin/distributions/[id]/complete
export async function POST(req: Request, { params }) {
  const dist = await getDistribution(params.id)

  // 1. 상태 변경
  await supabase.from('distributions')
    .update({ status: 'completed', paid_at: new Date().toISOString() })
    .eq('id', params.id)

  // 2. Reviewer에게 입금 완료 이메일 (Resend)
  await resend.emails.send({
    from: 'FindFit <no-reply@findfit.kr>',
    to: dist.applicant_email,  // project_matches에서 JOIN
    subject: `[FindFit] ${dist.net_amount.toLocaleString()}원이 입금됐어요!`,
    html: buildPaymentEmail({
      nickname: dist.nickname,
      amount: dist.net_amount,
      withholdingTax: dist.withholding_tax
    })
  })

  return Response.json({ success: true })
}
```

### 14.5 Admin 화면 알림 유형 추가 (섹션 10.2 보완)

| 유형 | 트리거 | 수신자 | 베타 채널 |
|------|--------|--------|---------|
| NEW_REVIEWER_APPLICATION | Reviewer 지원 완료 | 운영자 | 이메일 |
| REVIEWER_ACCEPTED | 운영자 수락 처리 | Reviewer | 이메일 (평가 링크 포함) |
| REVIEWER_REJECTED | 운영자 거절 처리 | Reviewer | 이메일 (선택) |
| INCENTIVE_PAID | 운영자 지급 완료 처리 | Reviewer | 이메일 |
| REVIEW_DEADLINE_REMINDER | 마감 D-1 | Reviewer (accepted 상태) | 이메일 |

---

---

## 15. [v1.3 신규] Zustand 스토어 명세

> 기술 스택 결정문서 v1.0 섹션 2.1 기반

**채택 근거**: Next.js 14 App Router와 최적 호환, Redux 대비 보일러플레이트 없음, 솔로 파운더 관리 가능한 복잡도, 서버 DB(Supabase)와 다른 레이어로 충돌 없음

### 15.1 스토어 1 — 프로젝트 등록 위자드

```typescript
// store/projectWizardStore.ts
interface ProjectWizardStore {
  currentStep: number
  step1Data: Step1Data | null    // 기본 정보 (제목, 카테고리, 단계)
  step2Data: Step2Data | null    // 서비스 설명
  step3Data: Step3Data | null    // 타겟 설정
  step4Data: Step4Data | null    // 질문 구성
  step5Data: Step5Data | null    // 사례금 설정
  step6Data: Step6Data | null    // 최종 확인 + 결제
  agentSessionId: string | null  // Agent에서 넘어온 경우 세션 ID
  entryPath: 'agent' | 'direct' | 'agent_panel'
  reset: () => void
}
```

**동작 원칙**
- 위자드 중간 이탈 후 복귀: Supabase `projects` 테이블 `draft` 상태로 자동 저장 → 복귀 시 DB에서 다시 로드
- Zustand에는 현재 스텝 UI 상태만 유지 (영구 저장 X)
- Zustand persist 미들웨어 적용 여부: 추후 UX 검증 후 결정 (localStorage에 상태 저장 시 이탈 후 복귀 UX 개선 가능)

### 15.2 스토어 2 — Agent 대화 상태

```typescript
// store/agentStore.ts
interface AgentStore {
  messages: Message[]
  context: AgentContext           // 카테고리, 키워드, 레퍼런스
  isLoading: boolean
  currentPhase: 1 | 2 | 3 | 4   // Agent 4단계 진행 상태
  showProjectCTA: boolean        // "프로젝트 등록하기" CTA 표시 여부
  addMessage: (message: Message) => void
  updateContext: (partial: Partial<AgentContext>) => void
  reset: () => void
}
```

**동작 원칙**
- Zustand: 현재 대화 UI 상태 (새로고침 시 초기화)
- Supabase `agent_sessions`: 대화 히스토리 영구 저장
- 동기화 타이밍: 메시지 전송 즉시 Supabase INSERT → Zustand는 렌더링 전용

### 15.3 스토어 3 — 사용자 세션 상태

```typescript
// store/userStore.ts
interface UserStore {
  role: 'creator' | 'reviewer'
  profile: CreatorProfile | ReviewerProfile | null
  toggleRole: () => void  // ENABLE_ROLE_SWITCH=true 시에만 실제 작동
}
```

**동작 원칙**
- `toggleRole()`은 `ENABLE_ROLE_SWITCH=false` 일 때 호출 시 no-op 처리 또는 "Scale Phase에서 지원 예정" 메시지 표시
- Scale Phase 이전: UI에서 역할 전환 버튼 자체 숨김 처리

### 15.4 Zustand vs Redux vs Context API 비교

| 항목 | Redux | Context API | Zustand |
|------|-------|-------------|---------|
| 설정 복잡도 | 높음 | 낮음 | 낮음 |
| 리렌더링 최적화 | 복잡 | 어려움 | 자동 |
| FindFit 규모 적합성 | 과함 | 가능하지만 불안정 | 최적 |
| Agent 실시간 상태 | 복잡 | 성능 문제 | 문제없음 |

---

## 16. [v1.3 신규] LLM 아키텍처 상세

> 기술 스택 결정문서 v1.0 섹션 2.3 기반

### 16.1 역할 분리 원칙

| LLM | 역할 | 활성 시점 |
|-----|------|---------|
| Claude API (claude-sonnet-4-6) | Agent 대화 + 추론 전용 | MVP 상시 (항상 Claude) |
| Gemini 2.0 Flash | AI 리포트 생성 | 베타 (`AI_ENGINE=gemini`, 비용 0) |
| Claude Sonnet | AI 리포트 생성 | 정식 출시 (`ENABLE_CLAUDE_REPORT=true`) |

> **핵심 원칙**: Agent 대화는 항상 Claude API. 리포트 생성 엔진만 Feature Flag로 분기. 두 역할을 혼용하지 않는다.

### 16.2 AI 엔진 분기 구현

```typescript
// lib/features/flags.ts (기존 파일에 AI_ENGINE 환경변수 연동)
export const FEATURES = {
  claudeReport: process.env.ENABLE_CLAUDE_REPORT === 'true',
  // 베타: false (Gemini 고정)
  // 출시: true (Claude Sonnet 전환)
  // ... 기타 기존 flags 유지
} as const

// lib/ai/index.ts
export async function generateReport(
  project: Project,
  reviews: Review[],
  creatorLevel: string
) {
  const useClaudeReport =
    FEATURES.claudeReport || process.env.AI_ENGINE === 'claude'

  const prompt = buildReportPrompt(project, reviews, creatorLevel)

  return useClaudeReport
    ? await callClaude(prompt)      // Claude Sonnet — 고품질, 유료
    : await callGemini(prompt)      // Gemini 2.0 Flash — 베타 무료
}
```

### 16.3 Agent Phase 2 병렬 호출 — 안정성 패턴

```typescript
// Agent Phase 2: 외부 데이터 소스 병렬 호출 (안정성 우선)
const [naverResult, metaResult, webResult, similarwebResult] =
  await Promise.allSettled([
    fetchNaverTrend(keywords),              // 항상 실행 (MVP)
    FEATURES.metaAds
      ? fetchMetaAdsCount(category)         // ENABLE_META_ADS=true 시만
      : Promise.resolve(null),
    fetchWebReferences(keywords),            // 항상 실행 (MVP)
    FEATURES.similarweb
      ? fetchSimilarWeb(domain)             // ENABLE_SIMILARWEB=true 시만 (Growth Phase)
      : Promise.resolve(null),
  ])
// Promise.allSettled → 하나 실패해도 나머지로 분석 진행
// 실패/비활성 API의 섹션은 Agent 메시지에서 자동 생략
```

### 16.4 LLM 안정성 체크리스트

```
[ ] Promise.allSettled로 API 병렬 호출
    → 하나 실패해도 나머지로 분석 진행

[ ] 각 외부 API 타임아웃 설정 (3초)
    → 느린 API가 전체 요청을 블로킹하지 않도록

[ ] Fallback 메시지 처리
    → API 응답 없을 때 "분석 준비 중" 표시 (사용자에게 에러 노출 금지)

[ ] Claude API 토큰 비용 관리
    → 대화 히스토리 압축 로직 (오래된 메시지 요약 후 truncation)
    → 베타에서는 Gemini 고정으로 리포트 비용 0

[ ] 프롬프트 JSON 파싱 안정성
    → try-catch + 마크다운 코드블록 제거 (```json ... ``` → 내용만 추출)
    → 파싱 실패 시 재시도 1회, 2회 실패 시 에러 리포트 반환
```

### 16.5 Zustand + Supabase 동시 운영 체크리스트

```
[ ] Zustand는 클라이언트 메모리 상태
    → 새로고침 시 초기화 → Supabase에서 다시 로드하는 패턴 구현

[ ] 위자드 중간 저장
    → Supabase projects 테이블 draft 상태로 자동 저장
    → Zustand에는 현재 스텝 UI 상태만 유지

[ ] Agent 세션 동기화
    → Zustand: 현재 대화 UI 상태 (렌더링용)
    → Supabase agent_sessions: 영구 저장 (복구용)
    → 두 곳 동기화 타이밍: 메시지 전송 즉시 양쪽 동시 업데이트
```

---

## 17. [v1.3 신규] AWS Neptune + Amazon Bedrock KB 도입 계획

> 기술 스택 결정문서 v1.0 섹션 2.5 기반

### 17.1 Neptune이 FindFit에 필요한 이유

Neptune은 그래프 DB로, 관계형 DB와 달리 "데이터 사이의 관계와 패턴"을 조회한다.

```
Supabase(관계형 DB)가 답하는 질문:
→ "이 Creator의 프로젝트 목록이 뭔가?"

Neptune이 답하는 질문:
→ "헬스케어 카테고리에서 PSF 70점 이상 받은
   Creator들의 공통적인 타겟 설정 패턴은?"
→ "이 아이디어와 유사한 검증 케이스에서
   가장 많이 나온 피드백 패턴은?"
```

### 17.2 Neptune 연동 전후 리포트 품질 비교

```
Neptune 없는 리포트 (MVP):
"PSF 스코어 74점입니다."

Neptune 있는 리포트 (Scale Phase):
"PSF 스코어 74점입니다.
 동일 카테고리(헬스케어) 평균은 61점, 상위 20%는 78점 이상이에요.
 비슷한 구독형 서비스 검증 23건 중 성공 패턴을 보면
 타겟을 50대+로 좁히고 월 구독 대신 3개월 단위로
 설계한 경우가 많아요."
```

### 17.3 도입 조건 및 타임라인

| 조건 | 내용 |
|------|------|
| 최소 검증 케이스 | 200건 이상 |
| 예상 시점 | Scale Phase (출시 6개월 후) |
| Feature Flag | `ENABLE_NEPTUNE=false` → 조건 충족 후 `true` |
| 비용 | Neptune Serverless — 사용량 기반 과금 |
| 선행 작업 | Supabase 스키마를 그래프 이전 가능하게 설계 (지금부터) |

**지금 Neptune을 도입하지 않는 이유**
- 검증 케이스 0건 상태에서 그래프 패턴 분석 불가
- Supabase + Neptune 동기화 로직 → 솔로 파운더 운영 부담 2배
- 인프라 비용 대비 즉각적 가치 없음

### 17.4 지금 당장 해야 할 Neptune 이전 준비 (스키마 설계 시 반영)

```sql
-- ✅ reviews 테이블: reviewer domain 태그를 배열로 저장
-- → 나중에 그래프 엣지 (creator ↔ reviewer_domain)로 이전 가능
-- 예: applicant_domain TEXT[] (project_matches에 이미 존재)

-- ✅ ai_reports 테이블: psf_score, conclusion, key_insights JSON으로 저장
-- → 나중에 Neptune 노드 속성으로 이전 가능 (이미 JSONB로 설계됨)

-- ✅ creator_id → category → psf_score → reviewer_domain 관계 명확히 보존
-- → ETL 비용 최소화를 위해 외래 키 관계 정확히 유지
```

### 17.5 Amazon Bedrock Knowledge Base

- **역할**: FindFit 누적 검증 리포트를 AI가 참조 자료로 활용
- **효과**: "건강기능식품 구독 서비스를 검증한 이전 케이스 7건을 분석해보면..." 수준의 인사이트 가능
- **품질 변화**: "AI 생성 분석" → "실제 데이터 기반 분석"
- **도입 조건**: `ENABLE_NEPTUNE=true` 전환 이후
- **Feature Flag**: `ENABLE_BEDROCK=false`
- **환경변수**: `AWS_BEDROCK_KB_ID` (Knowledge Base ID)

---

## 18. [v1.3 신규] 기술 스택 단계별 로드맵

> 기술 스택 결정문서 v1.0 섹션 5 기반. 개발 섹션 11(체크리스트)의 기술적 맥락.

### 18.1 MVP (0~1개월)

```
✅ 확정 스택
→ Next.js 14 App Router + TypeScript
→ Zustand (스토어 3개 — 섹션 15)
→ Supabase (PostgreSQL + Auth + Edge Functions Deno)
→ Claude API claude-sonnet-4-6 (Agent 대화 전용, 항상 Claude)
→ Gemini 2.0 Flash (AI_ENGINE=gemini, 리포트 생성, 베타 무료)
→ 네이버 데이터랩 API (국내 검색 트렌드)
→ 웹 검색 MCP (타사 레퍼런스 자동 수집)
→ PortOne (결제)
→ Resend (이메일 알림)

❌ 이 단계에서 제외
→ Neptune, SimilarWeb, Google Trends
→ DynamoDB, MongoDB, DocumentDB
→ FCM, 자동 배분, EXP 시스템, 역할 전환, 크레딧 시스템
```

### 18.2 Growth Phase (1~6개월, 케이스 100건+)

```
추가 활성화 (환경변수 전환)
→ ENABLE_META_ADS=true     (Meta Ad Library API)
→ ENABLE_GOOGLE_TRENDS=true (FastAPI 마이크로서비스 배포 후)
→ ENABLE_AUTO_DISTRIBUTE=true (PortOne 파트너정산 셋업 후)
→ ENABLE_FCM_PUSH=true     (Firebase 셋업 후)
→ ENABLE_EXP_SYSTEM=true   (EXP 정책 기획 확정 후)
→ ENABLE_CLAUDE_REPORT=true + AI_ENGINE=claude (비용 모니터링 후)
→ 리텐션 전략 ③ (트렌드 알림 + 월간 브리핑 개발)
```

### 18.3 Scale Phase (6~12개월, 케이스 200건+)

```
추가 활성화 (환경변수 전환)
→ ENABLE_NEPTUNE=true       (케이스 200건+ 달성 후)
→ ENABLE_BEDROCK=true       (Neptune 연동 완료 후)
→ ENABLE_SIMILARWEB=true    (수익 정당화 후)
→ ENABLE_VOLUME_DISCOUNT=true
→ ENABLE_ROLE_SWITCH=true   (DB 마이그레이션: role → roles 배열)
→ 리텐션 전략 ② (역할 전환 활성화)
```

### 18.4 도입하지 않는 기술과 이유

| 기술 | 미도입 이유 |
|------|-----------|
| MongoDB / DocumentDB | Supabase JSONB로 충분. 이중 DB 관리 부담. |
| DynamoDB | Supabase가 동일 역할. 트래픽 폭발 시 재검토. |
| Firebase | Supabase로 통합. 분산 불필요. |
| Redux | 과도한 보일러플레이트. Zustand로 충분. |
| GraphQL | REST API로 충분한 규모. |

---

## 19. [v1.3 신규] 전체 환경변수 완전 목록

> 기술 스택 결정문서 v1.0 섹션 4 기반. 기존 섹션 12.1 목록을 포함한 완전 목록.

```env
# ===== AI 엔진 =====
AI_ENGINE=gemini                    # 베타: gemini / 출시: claude
ENABLE_CLAUDE_REPORT=false          # 베타: false / 출시: true

# ===== Agent 데이터 소스 =====
ENABLE_GOOGLE_TRENDS=false          # Python 마이크로서비스 배포 완료 후
GOOGLE_TRENDS_API_URL=              # FastAPI 서비스 URL (Railway/Render)
ENABLE_META_ADS=false               # Meta 앱 심사 통과 후
META_ACCESS_TOKEN=                  # Meta 발급 토큰
ENABLE_SIMILARWEB=false             # 수익 정당화 후 (Growth Phase)
SIMILARWEB_API_KEY=                 # SimilarWeb API 키

# ===== 수익 기능 =====
ENABLE_VOLUME_DISCOUNT=false        # 베타: false / 출시: 정책 확정 후
ENABLE_AUTO_DISTRIBUTE=false        # 베타: 수동 이체 / 출시: PortOne 파트너정산

# ===== 성장 기능 =====
ENABLE_EXP_SYSTEM=false             # 베타: false / 출시: EXP 정책 확정 후
ENABLE_ROLE_SWITCH=false            # Scale Phase (6~12개월) 이후 (DB 마이그레이션 필수)
ENABLE_FCM_PUSH=false               # 베타: 이메일만 / 출시: Firebase 셋업 후
ENABLE_CREDIT_SYSTEM=false          # 베타: 직접 결제 / 출시: 크레딧 정책 확정 후

# ===== 인프라 (Scale Phase) =====
ENABLE_NEPTUNE=false                # 케이스 200건+ 달성 후
AWS_NEPTUNE_ENDPOINT=               # Neptune Serverless 클러스터 엔드포인트
ENABLE_BEDROCK=false                # Neptune 연동 완료 후
AWS_BEDROCK_KB_ID=                  # Bedrock Knowledge Base ID
```

**기존 섹션 12.1에서 누락된 항목 요약**

| Flag | 누락 이유 | 단계 |
|------|---------|------|
| `AI_ENGINE` | 신규 추가 | MVP (기본값: gemini) |
| `ENABLE_SIMILARWEB` | 신규 추가 | Growth Phase |
| `ENABLE_CREDIT_SYSTEM` | 신규 추가 | 출시 후 |
| `ENABLE_NEPTUNE` | 신규 추가 | Scale Phase |
| `ENABLE_BEDROCK` | 신규 추가 | Scale Phase |

---

## 20. [v1.3 신규] MVP 리텐션 전략 기술 구현 명세

> 기획서 v3.4 섹션 18 기반. 전략 ⑤⑥⑦ 즉시 구현 명세.

### 20.1 DB 스키마 추가 — purchase_intent 컬럼

```sql
-- [v1.3 마이그레이션] reviews 테이블에 Reviewer 구매 의향 컬럼 추가
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS purchase_intent BOOLEAN DEFAULT NULL;
  -- NULL: 미응답 (선택 항목)
  -- TRUE: 구매/구독 의향 있음
  -- FALSE: 구매/구독 의향 없음

-- 평가 폼 Step 2에 추가할 질문:
-- "이 서비스를 실제로 구매하거나 구독하시겠습니까?" (선택 응답)
-- 응답 시 purchase_intent = true/false 저장

-- ⚠️ 주의: 외부 방문자 신호는 별도 테이블 (v1.1에서 설계)
-- public_intents 테이블은 이 컬럼과 절대 합산하지 않음
-- (신뢰도 오염 방지 — 기획서 v3.4 섹션 18.3 참조)
```

### 20.2 전략 ⑤ — 의뢰 진행 알림 구현

기존 알림 인프라(섹션 10.2)에 Creator 대상 트리거 2개 추가:

```typescript
// 트리거 1: Admin이 Reviewer 수락 처리 후 (api/admin/applications/[id]/accept에 추가)
await sendNotification(project.creator_id, 'PROJECT_REVIEWER_ACCEPTED', {
  projectTitle: project.title,
  reviewerNickname: match.nickname,
  acceptedCount: currentAcceptedCount.toString(),
  targetCount: project.target_count.toString()
})

// 트리거 2: Reviewer가 평가 제출 완료 후 (api/reviews/[matchId] POST에 추가)
await sendNotification(project.creator_id, 'PROJECT_REVIEW_SUBMITTED', {
  projectTitle: project.title,
  completedCount: newCompletedCount.toString(),
  targetCount: project.target_count.toString()
})
// 전원 완료 시 PROJECT_COMPLETED 알림은 기존 섹션 10.2에 이미 있음
```

**섹션 10.2 알림 유형 보완 (v1.3 추가)**

| 유형 | 트리거 | 수신자 | 채널 |
|------|--------|--------|------|
| PROJECT_REVIEWER_ACCEPTED | Admin 수락 처리 완료 | Creator | 이메일 |
| PROJECT_REVIEW_SUBMITTED | 개별 Reviewer 제출 | Creator | 이메일 |

### 20.3 전략 ⑥ — 30일 체크인 Edge Function

```typescript
// supabase/functions/retention-checkin/index.ts
// Cron: 매일 UTC 00:00 (KST 09:00)

Deno.serve(async () => {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // 마지막 프로젝트 생성일이 30일 초과인 Creator 목록
  const { data: creatorStats } = await supabase
    .rpc('get_inactive_creators_30d', {
      cutoff_date: thirtyDaysAgo.toISOString()
    })
  // RPC 함수: projects 테이블에서 creator_id별 MAX(created_at) 집계 후 cutoff 이전 필터

  for (const creator of creatorStats ?? []) {
    await sendNotification(creator.creator_id, 'RETENTION_CHECKIN_30D', {
      daysSince: '30',
      lastProjectTitle: creator.last_project_title
    })
  }

  return new Response(JSON.stringify({
    processed: creatorStats?.length ?? 0
  }))
})
```

```toml
# supabase/config.toml 추가
[functions.retention-checkin]
schedule = "0 0 * * *"    # 매일 UTC 00:00 (KST 09:00)
```

**알림 유형 추가**

| 유형 | 트리거 | 수신자 | 채널 |
|------|--------|--------|------|
| RETENTION_CHECKIN_30D | 마지막 프로젝트 30일 경과 | Creator | 이메일 |

### 20.4 전략 ⑦ — 검증 점수 누적 표시

```typescript
// app/(creator)/dashboard/page.tsx (서버 컴포넌트)

// 집계 쿼리 — ai_reports 테이블 기반
const { data: reportStats } = await supabase
  .from('ai_reports')
  .select('psf_score, project_id, created_at')
  .eq('creator_id', userId)
  .order('created_at', { ascending: true })

const stats = reportStats ?? []

const verificationStats = {
  totalCount: stats.length,
  avgScore: stats.length > 0
    ? Math.round(stats.reduce((sum, r) => sum + (r.psf_score ?? 0), 0) / stats.length)
    : null,
  highestScore: stats.length > 0
    ? Math.max(...stats.map(r => r.psf_score ?? 0))
    : null,
  latestScore: stats.length > 0
    ? stats[stats.length - 1].psf_score
    : null,
}

// 대시보드 표시 예시
// ┌─────────────────────────────────────┐
// │ 검증 횟수: 3회                       │
// │ 평균 PSF 스코어: 71점                │
// │ 최고 점수: 82점   최근: 74점          │
// └─────────────────────────────────────┘
```

### 20.5 전략별 구현 공수 요약

| 전략 | 구현 항목 | 예상 공수 | 권장 시점 |
|------|---------|---------|---------|
| ⑤ 의뢰 진행 알림 | 알림 유형 2개 + 기존 API에 트리거 추가 | 반나절 | Week 2 |
| ⑥ 30일 체크인 | Edge Function 1개 + Cron 등록 + 이메일 템플릿 1개 | 하루 | Week 3 |
| ⑦ 검증 점수 | 대시보드 집계 쿼리 + UI 컴포넌트 | 반나절 | Week 2 |
| DB 마이그레이션 | reviews.purchase_intent 컬럼 추가 | 10분 | Week 1 |

**총 예상 공수: 2일 이내**

---

*© 2026 FindFit | CONFIDENTIAL*

---
<!-- v1.1 변경 사항: Feature Flag 시스템 추가 / pytrends 대체 처리 / EXP 분기 수정 / 볼륨 디스카운트 flag 제어 / auto-distribute Cron 주석 처리 / FCM 베타 제외 / 알림 통합 함수 추가 / 베타→출시 전환 가이드 추가 -->
<!-- v1.2 변경 사항: Reviewer 5개 화면 기술 명세 (섹션 13) / Admin 운영 4개 화면 기술 명세 (섹션 14) / project_matches 지원 플로우 스키마 / Admin 인증 미들웨어 -->
<!-- v1.3 변경 사항: 기술 스택 결정문서 v1.0 전체 통합 / Zustand 스토어 3개 상세 명세 (섹션 15) / LLM 아키텍처 상세 — Claude Agent + Gemini/Claude 리포트 분기 (섹션 16) / AWS Neptune + Bedrock KB 도입 계획 (섹션 17) / 기술 스택 단계별 로드맵 MVP→Growth→Scale (섹션 18) / 전체 환경변수 완전 목록 (섹션 19) / reviews.purchase_intent 컬럼 마이그레이션 (섹션 20.1) / 리텐션 전략 ⑤⑥⑦ 기술 구현 명세 (섹션 20.2~20.5) -->
