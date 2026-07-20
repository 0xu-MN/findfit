# Creator→Reviewer→Report 파이프라인 & Supabase 연동 — 인수인계 문서

> 작성 시점 커밋: `861aebb` (이 문서 자체는 포함 안 됨, 다음 커밋에 포함)
> 대상 독자: 이 프로젝트를 처음 넘겨받는 개발자. 랜딩페이지 이후 "로그인해서 실제로 쓰는 앱" 부분을 처음부터 다시 설명한다는 가정으로 작성했다.

---

## 1. 이 작업이 왜 필요했는가

작업 시작 시점에 `app/builder`(크리에이터)·`app/evaluator`(리뷰어)·`app/admin`(관리자) 밑에는 이미 상당량의 화면이 만들어져 있었다 (v3.3 MVP, 7개 커밋). 그런데 실제로 눌러보면 아무것도 동작하지 않았다. 원인은 하나: **크리에이터가 프로젝트를 등록해도 그 데이터가 Supabase `projects` 테이블에 저장되지 않고 브라우저 `localStorage`에만 남아 있었다.** 그래서:

- 리뷰어 피드(`/evaluator/available`)는 진짜 Supabase를 조회하는데, 애초에 아무것도 안 들어가 있으니 항상 텅 비어 있었다.
- AI 리포트 생성 API는 실제로 Gemini를 호출하긴 했지만, 완료 시 자동 실행되지 않고 mock 데이터로 수동 호출만 가능했으며 결과를 DB에 저장하지도 않았다.

이 문서가 다루는 작업은 크게 두 단계다.

1. **파이프라인 실연결** (커밋 `fd60418`) — 크리에이터 등록부터 리포트 발급까지 한 줄기 흐름을 실제 Supabase 데이터로 끝까지 연결
2. **유저 관리 + 프라이버시/RLS 강화** (커밋 `90f586a`, `861aebb`) — 위 작업 중 발견한 심각한 보안 구멍(RLS 전무)을 막고, 관리자용 유저/프로젝트 관리 화면을 신설

---

## 2. 핵심 비즈니스 로직 요약

FindFit은 **"크리에이터 1명이 프로젝트를 등록하면, 몇 명이 될지 모르는 리뷰어들이 각자 독립적으로 참여해 평가하고, 그 결과가 크리에이터에게 집계된 리포트로 돌아가는" 팬아웃-집계 구조**다. 리뷰어끼리는 서로의 답변을 볼 수 없고, 크리에이터도 개별 리뷰어의 원본 답변이 아니라 AI가 집계한 리포트만 받는다.

- **Light 타입**: 4,900원 정액, 질문 최대 5개, 사례금 없음, 5일
- **Standard 타입**: 리뷰어당 1,800원, 질문 최대 9개(PSF 단계면 고정 4문항 자동 포함, PMF 단계면 Sean Ellis 문항 자동 포함), 5~10일
- **Deep 타입은 폐기됨** — 예전엔 존재했으나 Standard로 통합되었다. `RequestFormData.projectType`도 `'light'|'standard'`만 허용. `components/builder/new-request/Step4Deep.tsx`는 죽은 코드로 남아있으니 지우거나 재활용 여부를 결정할 것.
- **제품 접근 방식(access_method)**: 프로젝트 타입과 별개 축으로, 리뷰어가 제품을 어떻게 체험하는지 — `web_link`(링크) / `app_download`(앱스토어·플레이스토어 링크) / `physical_shipping`(실물 배송, PortOne 없이 관리자·크리에이터 수동 상태 변경으로 처리)

### 전체 흐름 (화면 기준)

```
[크리에이터]                          [리뷰어]                         [관리자]
/builder/new-request (6단계 마법사)
  └ 제출 → projects insert(status='active')
            review_questions insert
                                    /evaluator/available (피드)
                                      └ 지원 → project_matches(pending)
                                                                      /admin/applications
                                                                        └ 승인 → project_matches(accepted)
                                                                                 + 배송형이면 shipping_status='pending'
                                    (배송형만) 배송지 입력 → 수령 확인
                                    /evaluator/review/[id]
                                      └ 답변 제출 → review_answers insert
                                                   project_matches.status='completed'
                                                   increment_completed_count() RPC
                                                   ── completed_count == target_count 도달 시 ──
                                                   AI 리포트 자동 생성 트리거
/builder/reports/[id]
  └ ai_reports 조회/렌더링
```

---

## 3. DB 스키마 — 마이그레이션 001~009

`supabase/migrations/`에 9개 파일이 있고, **파일명 숫자 순서 = 실행 순서 = 실제 의존관계 순서**로 정리되어 있다 (커밋 `5e3ff5a`에서 재정렬함 — 예전엔 `007_missing_tables.sql`이 `projects` 테이블 자체를 늦게 만들면서 그보다 앞선 003~006이 이미 `projects(id)`를 참조하고 있어, 숫자 순서대로 실행하면 중간에 "relation projects does not exist" 에러로 멈추는 상태였다).

| 파일 | 내용 |
|---|---|
| `001_initial_schema.sql` | `users` + 레거시 v1 테이블(`requests`/`evaluations`/`reports`/`builder_profiles`/`evaluator_profiles` 등, 현재 앱 코드는 안 씀) + RLS |
| `002_core_tables.sql` | **현재 앱이 실제로 쓰는 핵심 테이블**: `projects`, `reviewer_profiles`, `review_questions`, `project_matches`, `credit_transactions` |
| `003_question_templates.sql` | `question_templates` (질문 카탈로그, 시드 데이터 포함) |
| `004_ai_reports.sql` | `ai_reports` |
| `005_distributions.sql` | `distributions`, `reviewer_profiles`에 PortOne 계좌 컬럼 추가 |
| `006_v2_additions.sql` | `review_questions.source`, `distributions` 세금 컬럼, `increment_completed_count()` RPC(최초 버전) |
| `007_review_answers.sql` | `review_answers` |
| `008_report_verdict_and_access.sql` | `ai_reports`에 PSF 서브스코어 3종 + `verdict` 컬럼, `projects`에 `access_method`/`access_info`, `project_matches`에 배송 관련 컬럼(`shipping_status`/`shipping_address`/`received_confirmed_at`) |
| `009_privacy_and_moderation.sql` | **RLS 전면 적용** + 컬럼 제한 뷰 2개 + 닉네임 원자적 시퀀스 RPC + `users.status` |

### 3-1. 핵심 테이블 관계 (현재 사용 중인 것만)

```
users (id, email, role, status)
  ├─ reviewer_profiles (user_id) — 계좌/PortOne 정보 등 리뷰어 프로필
  └─ projects (creator_id) — 크리에이터가 등록한 프로젝트
        ├─ review_questions (project_id) — 이 프로젝트의 질문 목록(고정+커스텀)
        ├─ project_matches (project_id, reviewer_id) — 리뷰어 지원/매칭 상태
        │     └─ review_answers (project_id, reviewer_id, question_id) — 리뷰어별 답변
        ├─ ai_reports (project_id, UNIQUE) — 집계된 AI 리포트
        └─ distributions (project_id, reviewer_id) — 사례금 정산 내역
```

### 3-2. 이번에 새로 생긴 함수(RPC) 2개

- **`assign_reviewer_nickname(p_project_id UUID) → TEXT`** (009) — 프로젝트별 `nickname_seq` 컬럼을 원자적으로 `+1` 하고, 스프레드시트 컬럼 방식(A, B, …, Z, AA, AB…)으로 닉네임을 만들어 반환한다. `SECURITY DEFINER`로 정의되어 있어 RLS를 우회한다 — 리뷰어가 자기 소유가 아닌 `projects` row(`nickname_seq`)를 원자적으로 갱신해야 하기 때문. 예전엔 `count % 26`으로 닉네임을 만들어서 26명 넘으면 겹치는 버그 + 동시 요청 시 레이스 컨디션이 있었다.
- **`increment_completed_count(project_id UUID) → void`** (006에서 최초 생성, 009에서 `SECURITY DEFINER`로 재정의) — 리뷰 제출 시 `projects.completed_count`를 `+1`. 마찬가지로 리뷰어가 자기 소유가 아닌 프로젝트 row를 갱신해야 해서 `SECURITY DEFINER` 필요.

### 3-3. 컬럼 제한 뷰 2개 (프라이버시의 핵심 장치)

RLS는 **행(row) 단위**로만 막을 수 있고 **컬럼 단위**로는 못 막는다. 그런데 "리뷰어는 프로젝트를 봐야 하지만 그 프로젝트를 등록한 크리에이터가 누구인지는 몰라야 한다"는 요구사항은 컬럼 단위 제한이 필요하다. 그래서 뷰를 만들어 해결했다:

- **`projects_public`** — `projects`에서 `creator_id`만 뺀 나머지 전부. 리뷰어 쪽 화면·API는 전부 `projects` 원본이 아니라 이 뷰를 조회한다.
- **`project_matches_for_creator`** — `project_matches`에서 `reviewer_id`/`applicant_email`/`applicant_domain`/`applicant_intro`/`applied_at`을 뺀 나머지(`nickname`/`status`/배송 정보 등). 뷰 정의 자체에 `WHERE p.creator_id = auth.uid()`가 박혀 있어서, 이 뷰는 "내가 만든 프로젝트의 매칭"만 보여준다.

이 뷰들은 테이블 소유자(postgres) 권한으로 실행되어 RLS를 우회하는 방식으로 동작한다 — Supabase의 표준 패턴이다. `GRANT SELECT ... TO authenticated, anon` 되어 있다.

---

## 4. RLS(Row Level Security) — 무엇이 문제였고 어떻게 고쳤는가

### 4-1. 발견한 문제

파이프라인을 다 연결하고 나서 점검해보니, **002~008에서 만든 테이블 전부에 RLS가 꺼져 있었다.** `users`를 제외하면 `projects`/`review_questions`/`review_answers`/`project_matches`/`reviewer_profiles`/`credit_transactions`/`ai_reports`/`distributions`/`question_templates` 전부. 즉 `anon` 키(모든 클라이언트가 갖고 있는 공개 키)만 있으면 앱 UI를 거치지 않고 Supabase REST API를 직접 호출해서:

- 아무 프로젝트의 `creator_id`(누가 등록했는지)
- 다른 리뷰어의 원본 답변, 이메일, 지원 시 작성한 자기소개
- `reviewer_profiles`의 계좌번호/예금주명(!)

전부 읽을 수 있는 상태였다. 화면에 안 보이는 건 "그 화면이 그 컬럼을 안 골라서(select)"일 뿐 DB 차원의 차단이 전혀 아니었다.

### 4-2. 적용한 정책 (마이그레이션 009)

| 테이블 | 정책 |
|---|---|
| `projects` | 소유자(`creator_id = auth.uid()`)만 원본 테이블 전체 접근. 리뷰어는 `projects_public` 뷰로만. |
| `review_questions` | 프로젝트 소유자 또는 그 프로젝트에 매칭된 리뷰어만 조회 (질문 텍스트엔 PII 없어서 컬럼 제한 불필요) |
| `review_answers` | **본인 답변만** (`reviewer_id = auth.uid()`). 크리에이터/타 리뷰어용 정책 자체가 없음 — 집계 리포트로만 결과를 접함 |
| `project_matches` | 리뷰어는 자기 매칭 row만. 크리에이터는 `project_matches_for_creator` 뷰로만 |
| `reviewer_profiles` | 본인만 (계좌 등 금융 PII 포함) |
| `credit_transactions` | 본인 내역만 SELECT |
| `ai_reports` | 해당 프로젝트 크리에이터만 SELECT. INSERT/UPDATE 정책은 아예 없음 — 생성은 무조건 서비스 롤로만 |
| `distributions` | 본인(리뷰어) 정산 내역만 |
| `question_templates` | 민감정보 없는 공개 카탈로그라 로그인 유저 전체 SELECT 허용 |
| `users` | (001에서 이미 있었음) 본인만 select/update. **009에서 `status` 컬럼의 UPDATE 권한만 `authenticated` 롤에서 REVOKE** — 본인이 스스로 정지를 풀 수 없게 |

### 4-3. RLS를 켜면서 함께 고쳐야 했던 것들

RLS를 켜는 순간, **"관리자가 다른 사람 데이터를 봐야 하는" 모든 화면이 깨진다.** 관리자는 Supabase Auth로 로그인한 사용자가 아니라 별도 쿠키(`findfit-admin-token`, `proxy.ts`에서 체크)로만 인증되기 때문에, 관리자가 브라우저에서 `anon` 키로 직접 Supabase를 조회하던 기존 코드는 RLS 정책상 아무 데이터도 못 가져온다.

해결책: **`lib/supabase/admin.ts`** — `SUPABASE_SERVICE_ROLE_KEY`로 만든 서버 전용 클라이언트(RLS 완전 우회). 이미 쿠키로 admin 인증을 통과한 API 라우트에서만 사용한다. 이걸로 전환한 곳:

- `/admin/applications`, `/admin/distributions`, `/admin/requests`, `/admin/evaluators`(유저 관리) 페이지들의 데이터 조회를 전부 **서버 API 라우트**(`app/api/admin/*`)로 옮기고, 그 안에서 `createAdminClient()` 사용
- `app/api/admin/applications/[id]/accept|reject`, `app/api/admin/distributions/[id]/complete` — 세션 클라이언트 → 관리자 클라이언트로 교체
- `app/api/ai-report/[projectId]` POST(생성) — 여러 리뷰어의 `review_answers`를 넘나들어 집계해야 해서 개별 세션 권한으로는 원천적으로 불가능 → 관리자 클라이언트로 실행 (GET은 그대로 세션 클라이언트 — 크리에이터 본인 세션이 RLS로 자연스럽게 걸러줌)
- `app/api/builder/matches/[matchId]/shipping` (신규) — 크리에이터가 리뷰어의 배송 상태(`pending→shipped→delivered`)를 바꾸는 액션. `project_matches`는 RLS상 리뷰어 본인만 UPDATE 가능하므로, 이 라우트가 서버에서 "정말 내 프로젝트의 매칭이 맞는지" 확인한 뒤 관리자 클라이언트로 대신 UPDATE한다.

**`lib/auth/requireUser.ts`** — 세션 + `users.status`(정지/탈퇴 여부) + 역할(role)을 한 곳에서 검증하는 공용 헬퍼. 지금까지 페이지마다 제각각 `auth.getUser()`만 부르고 상태/역할 체크가 아예 없던 걸 통일하려고 만들었다 (신규 페이지에서 우선 사용 권장, 기존 페이지 전체 리트로핏은 이번 범위 밖).

---

## 5. 프로젝트 등록 → DB 저장 (`submitProject.ts`)

기존엔 `components/builder/new-request/storage.ts`의 `submitRequest()`가 `localStorage`에만 저장했다. `components/builder/new-request/submitProject.ts`(신규)가 이걸 대체한다.

### 필드 매핑 (`RequestFormData` → `projects` 컬럼)

| RequestFormData | projects 컬럼 | 비고 |
|---|---|---|
| `productName` | `title` | |
| `oneLineDesc` | `one_liner` | |
| `categories` | `categories` | |
| `stage` | `stage` | |
| `projectType` | `project_type` | |
| `problem` | `problem` | |
| `alternativeAndLimit` | `alternative_limit` | |
| `ourDifference` | `solution` | 1:1 컬럼명은 없지만 의미상 가장 가까움 |
| `ageGroups: string[]` | `target_age_range: TEXT` | 배열→스칼라라 `join(', ')`로 저장 (타입 손실 있음, 알아두기) |
| `jobRoles: string[]` | `target_jobs: TEXT[]` | 직접 매핑 |
| `landingUrl` | `landing_url` (+ `access_info.url`) | |
| `evaluatorCount` | `target_count` | |
| `feePerEvaluator` | `incentive_budget` + `incentive_exists` | |
| `accessMethod` | `access_method` | 신규 필드, 이번 작업에서 추가 |
| `appStoreUrl`/`playStoreUrl` | `access_info` (JSONB) | 신규 필드 |
| (고정) | `status = 'active'` | **중요**: 테이블 기본값이 `'draft'`라, 이걸 명시적으로 `'active'`로 안 하면 리뷰어 피드에 안 뜬다 |

`occupations`, `interests`, `targetContext`, `decisionFactor`, `lightQuestionStyle`, `validationGoal`, `hypothesis`, 첨부파일(Step5)은 대응 컬럼이 없어서 저장 안 함 — 나중에 `report_data`에 흘려보내거나 컬럼을 늘릴지 결정 필요.

### `review_questions` 구성

`question_templates`(카탈로그)가 아니라 **프로젝트별 인스턴스 테이블**. 제출 시 아래를 합쳐서 `order_index` 순으로 insert:
1. Standard/PSF 단계면 고정 4문항(`PSF_STANDARD_QUESTIONS`, `types.ts`에 하드코딩) 자동 선두 삽입
2. Standard/PMF 단계면 Sean Ellis 문항(`SEAN_ELLIS_QUESTION`) 자동 후미 삽입
3. 그 사이에 크리에이터가 마법사에서 만든 커스텀 문항

> **주의**: `question_templates` 테이블은 실제로 존재하고 시드 데이터도 있지만, 마법사가 화면에 보여주는 문항 텍스트는 이 테이블을 조회하는 게 아니라 `types.ts`에 하드코딩된 상수를 그대로 쓴다. 두 군데(테이블 vs 상수)의 문구가 어긋나지 않게 유지보수할 것 — 지금은 사람이 손으로 동기화해야 하는 상태다.

---

## 6. 리뷰 제출 → 완료 처리 → 리포트 자동 생성

`app/evaluator/review/[id]/page.tsx`의 `handleSubmit`:

1. **배송형 게이트**: `access_method === 'physical_shipping'`이고 `received_confirmed_at`이 없으면 질문 폼 대신 "배송지 입력 → 수령 확인" 화면을 먼저 보여준다.
2. `review_answers` insert
3. `project_matches.submitted_at` 갱신 + `status = 'completed'`
4. `increment_completed_count()` RPC 호출
5. **이 제출로 `completed_count`가 `target_count`에 도달하면**, `/api/ai-report/[id]` POST를 자동 호출 (별도 큐/크론 없이 클라이언트에서 직접 트리거)

### 리포트 생성 로직 (`lib/ai/generateReport.ts`)

1. `projects` + `review_questions` + `review_answers`를 조회 (전부 관리자 클라이언트로, 여러 리뷰어 데이터를 넘나들어야 하므로)
2. **완료율 체크**: `completed_count < target_count`면 에러 던지고 중단 (직접 API를 호출해 조기 생성을 유발하는 걸 방지)
3. 고정 문항(PSF-1, PSF-3, Sean Ellis) 응답을 텍스트 매칭으로 찾아서 집계 → `problem_exists_pct`/`solution_acceptance_pct`/`purchase_intent_pct`/`sean_ellis_pct` 계산 (전부 "긍정 응답 비율(%)" 방식)
4. Gemini(`lib/ai/gemini.ts`, API 키 없으면 mock 응답으로 자동 대체)로 정성 리포트(`key_insights`/`action_plan`/`pivot_scenarios` 등) 생성
5. `recommendation`(continue/pivot/stop) → `verdict`(GO/CAUTION/RECONSIDER)로 매핑
6. `ai_reports`에 `project_id` 기준 upsert. **`is_unlocked: true` 하드코딩** — 이번 라운드는 유료 잠금 없이 전체 공개하기로 결정했음 (사용자 확인됨). 나중에 유료화할 때 이 한 줄만 조건부로 바꾸면 됨.

### ⚠️ 리포트 렌더링 시 주의할 점 (한 번 버그였던 부분)

`ai_reports`는 데이터가 두 군데로 나뉘어 저장된다 — ①Gemini가 생성한 원본 JSON은 `report_data`(JSONB) 컬럼에, ②우리가 직접 계산한 PSF 서브스코어/verdict는 **별도의 최상위 컬럼**(`verdict`, `problem_exists_pct` 등)에. `app/builder/reports/[id]/page.tsx`가 원래 `report_data`만 읽어오도록 되어 있어서, verdict/서브스코어가 DB엔 저장되는데 화면엔 전혀 안 보이는 버그가 있었다 (커밋 `861aebb`에서 수정, `VerdictBanner` 컴포넌트 추가). **비슷한 컬럼을 새로 추가할 때 이 패턴을 잊지 말 것 — `report_data`와 최상위 컬럼은 별개로 화면에 연결해줘야 한다.**

---

## 7. 프라이버시 설계에서 나온 부가 기능들

이 작업이 "유저 관리를 신경 써달라"는 요청에서 출발해서, 아래 것들도 함께 만들어졌다.

- **닉네임 충돌 방지**: `assign_reviewer_nickname()` RPC(§3-2) + `project_matches(project_id, nickname)` UNIQUE 제약(DB 최종 방어선)
- **유저 상태 관리**: `users.status`(`active`/`suspended`/`withdrawn`), `/admin/evaluators`(전체 유저 관리 화면으로 재구성 — 검색/역할·상태 필터/정지·재활성·탈퇴 버튼), 로그인 시 정지/탈퇴 계정 차단
- **프로젝트 검수 큐**: `/admin/requests` 신규 — 승인/반려 API·화면 전부 완성되어 있으나, **강제 게이트는 이번엔 켜지 않았다.** 지금도 크리에이터가 제출하면 즉시 `status='active'`로 노출된다. 나중에 검수를 의무화하려면 `submitProject.ts`의 `status: 'active'` 한 줄을 `'pending_review'`로 바꾸기만 하면 됨 — 화면/API는 이미 준비되어 있어 즉시 작동한다.
- **역할 재변경 방지**: `/auth/role-select`를 이미 역할이 있는 유저가 재방문해도 임의로 못 바꾸게 가드 추가.

---

## 8. 환경변수 (`.env.local`)

리포지토리에 이 파일이 없어서 새로 만들었다 (당연히 git엔 안 올라감, `.gitignore`의 `.env*`).

```env
NEXT_PUBLIC_SUPABASE_URL=https://osdgtfghubeejevxcgoj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabase 대시보드 Settings → API → anon key>

# 서버 전용 — 절대 NEXT_PUBLIC_ 접두사 붙이지 말 것 (RLS 우회 키, 브라우저 노출 시 심각한 보안 사고)
SUPABASE_SERVICE_ROLE_KEY=<Supabase 대시보드 Settings → API → service_role key>

GEMINI_API_KEY=              # 없으면 lib/ai/gemini.ts가 mock 응답으로 자동 대체
ADMIN_SECRET_KEY=findfit-admin-dev-local   # /admin 로그인 비밀번호, 임의 문자열
RESEND_API_KEY=              # 없으면 리뷰어 승인/정산 이메일만 안 나감, 나머지 정상
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Supabase 원격 DB에 적용한 작업 (CLI로 완료됨)

```bash
npx supabase login --token <personal-access-token>
npx supabase link --project-ref osdgtfghubeejevxcgoj
npx supabase db push   # 001~009 마이그레이션 전부 원격에 적용됨
```

이미 실행 완료된 상태이므로, 새 마이그레이션을 추가할 때만 `supabase db push`를 다시 실행하면 된다. `supabase/.temp/`는 CLI 로컬 캐시라 `.gitignore`에 추가해뒀다(커밋 안 됨).

---

## 9. 알려진 제약 / 다음 작업 후보 (기술 부채)

우선순위 순으로 정리. 자세한 근거는 커밋 `861aebb` 직전에 진행한 전수 조사 결과 참고.

1. **라우트 중복** — `app/projects/[id]/report|review|distribution`(구) vs `app/builder/reports/[id]`, `app/evaluator/review/[id]`(신) 두 세트가 동시에 존재. 구 버전(`app/projects/[id]/report/page.tsx`)엔 `onClick`도 없는 죽은 유료 잠금 버튼이 남아 있음. 정리 필요(사용자가 "나중에 따로 알려주겠다"며 이번 범위에서 제외함).
2. **`app/reviewer/account-setup`(계좌 등록)이 고아 페이지** — 기능은 완성돼 있는데 어디서도 링크가 없어 도달 불가능. 내비게이션에 연결 필요.
3. **리뷰어 프로필 편집 화면 없음** — `domain_tags`/`level`(매칭 점수에 쓰임)을 리뷰어가 직접 설정할 방법이 없다. `app/evaluator/profile/page.tsx`가 빈 스텁.
4. **리뷰어 자진 하차(drop) 불가** — 수락한 매칭을 리뷰어가 스스로 취소하는 UI 없음, 관리자 거절로만 `dropped` 상태가 됨.
5. **빈 스텁 정리 대상**: `app/builder/requests/*`(→`projects`로 대체됨), `app/evaluator/history`(→`reviews`로 대체됨), `app/admin/reports`, `app/admin/stats`, `components/builder/new-request/Step4Deep.tsx`(Deep 타입 폐기로 죽은 코드)
6. **RLS를 켜면서 미처 다 손보지 못한 라우트**: `app/api/projects/[id]/distribute`, `lib/distribution/execute.ts` — 이 둘은 브라우저용 클라이언트(`lib/supabase/client`)를 서버 API 라우트 안에서 그대로 쓰고 있어서 애초에 인증 컨텍스트가 불안정했다(이번 세션 이전부터 있던 문제). RLS 활성화로 상황이 더 나빠지진 않았지만, 정산/배분 플로우를 실제로 쓰려면 이 파일들을 관리자 클라이언트 패턴으로 정리해야 한다.
7. **유료 잠금(paywall)** — `is_unlocked` 컬럼은 있지만 이번 라운드는 의도적으로 항상 `true`. 실제 결제 연동 시 `generateAndSaveReport`의 하드코딩 + 리포트 화면의 blur/lock UI를 함께 설계해야 함(구버전 라우트의 죽은 버튼 참고해서 만들지 말 것).
8. **`increment_completed_count`/`assign_reviewer_nickname`은 `SECURITY DEFINER`** — 이런 함수는 내부에서 실행하는 SQL이 고정되어 있어야 안전하다(파라미터가 SQL을 조립하는 데 안 쓰이는지 항상 확인). 앞으로 비슷한 RPC를 추가할 때 이 패턴을 참고하되, 반드시 `SET search_path = public`을 같이 넣을 것(스키마 하이재킹 방지).

---

## 10. 요약 커밋 로그

```
fd60418  feat: 크리에이터→리뷰어→리포트 파이프라인 실데이터 연결
5e3ff5a  fix: 마이그레이션 파일 순서를 실제 테이블 의존관계에 맞게 재배열
90f586a  feat: 유저 관리 + 프라이버시/익명성 강화 (RLS 전면 적용)
861aebb  fix: DB엔 저장되지만 화면에 안 보이던 데이터 3건 노출
```
