# FindFit — 전체 작업 인수인계 문서 (랜딩페이지 + 파이프라인 + Supabase)

> 대상 독자: 이 프로젝트를 처음 넘겨받는 개발자.
> 범위: 이 대화 세션에서 진행된 모든 작업 — ①랜딩페이지 대규모 개편, ②크리에이터→리뷰어→리포트 파이프라인 실연결, ③Supabase RLS/유저관리 강화. 시간순으로 정리했다.
> 관련 문서: `_docs/PIPELINE_SUPABASE_HANDOFF.md`(②③만 다룬 이전 문서, 이 문서가 그 내용을 포함해 확장한 버전) / `FindFit_기술명세서_v1.2.md`, `FindFit_기획서_v3.3.md`(원본 기획 문서, 리포지토리 루트)

---

## 목차
1. [작업 전 상태](#1-작업-전-상태)
2. [Phase A — 랜딩페이지 대규모 개편](#2-phase-a--랜딩페이지-대규모-개편)
3. [Phase B — 파이프라인 실연결 + Supabase + 프라이버시](#3-phase-b--파이프라인-실연결--supabase--프라이버시)
4. [파일 전체 목록](#4-파일-전체-목록-신규--수정)
5. [환경 설정 방법](#5-환경-설정-방법)
6. [알려진 기술부채 / 다음 작업 후보](#6-알려진-기술부채--다음-작업-후보)
7. [커밋 로그 전체](#7-커밋-로그-전체)

---

## 1. 작업 전 상태

작업 시작 시점에 이미 상당량이 만들어져 있었다 (`aec56cf` 최초 커밋 ~ `1c2c6c0`까지, v3.1~v3.3 MVP):
- `app/builder`(크리에이터)·`app/evaluator`(리뷰어)·`app/admin`(관리자) 아래 대부분의 화면
- Supabase 스키마 001~007 마이그레이션, 리뷰어 지원/관리자 승인 플로우, AI 리포트 생성 API(mock 가능), 정산 로직
- 랜딩페이지는 기본 골격만 있고 각 섹션의 스크롤 애니메이션/모션그래픽은 미완성 상태

여기서부터 두 갈래로 작업이 진행됐다 — 먼저 랜딩페이지를 다듬은 뒤(Phase A), 사용자 요청으로 로그인 이후 실사용 앱(파이프라인)으로 초점을 옮겼다(Phase B).

---

## 2. Phase A — 랜딩페이지 대규모 개편

**커밋 범위**: `2232821` ~ `296b6ae` (약 40개 커밋) + 이번 세션에서 추가된 `7d0737b`, `a68c8d3`
**변경 파일 규모**: `components/landing/` 11개 파일, 약 2,800줄 추가/556줄 삭제

### 2-1. HowItWorksSection — 지하철 노선도 스타일 스크롤 애니메이션
가장 많이 반복 작업된 섹션. 최종 형태: 스크롤에 따라 오렌지색 노선이 여러 정거장(스텝)을 지나가는 지하철 노선도 은유. 반복 수정 이력:
- 스네이크 곡선을 정원형 C커브 + 접선 연속으로 다듬음 (턴 사이 직선 구간 제거)
- 홀(정거장) 사이를 가로 셸프 구조로 재설계, 좌우 대칭 지그재그로 재구성
- 라벨을 홀의 오목한 입구/화면 방향에 맞춰 정렬, 진입·출구 라인을 화면 정중앙에 고정 후 길이 단축
- 스텝 숫자에 하단 크롭 디자인 적용, 라벨을 오렌지 라인의 실제 진행 길이에 동기화, 타이틀에 브랜드 컬러 적용
- 이전 스텝 문구가 사라지지 않고 유지되도록 수정

### 2-2. PainPointSection + ComparisonSection + PainToCompareReveal
- `ComparisonSection.tsx`(신규) — "DIY vs FindFit" 비교 섹션, 레퍼런스 이미지 스타일로 구성
- `PainToCompareReveal.tsx`(신규) — 공감(Pain) 섹션에서 비교 섹션으로 넘어가는 가로 슬라이드 전환 연출, 스크롤 시 두 섹션이 통째로 스킵되던 버그 수정
- 공감/비교 패널 상단 잘림 현상 수정, 한 화면에 다 보이도록 좌우 콘텐츠 분량 압축

### 2-3. ReviewerLanding — 리뷰어용 랜딩 (가장 큰 변경, +1,014줄)
- **히어로 섹션**: 텍스트를 우측으로 배치, 좌측에 크리에이터 히어로와 대칭되는 캡슐 그래픽(느낌표 절반) 노출
- **BenefitsSection**(혜택 섹션): 스크롤 연동 4카드 구조. 카드 01(포트폴리오)/03(시장 트렌드)/04(사례금)는 전용 "포팅된" 비주얼(`AcrylicPortfolioVisual`/`TrendDashboardVisual`/`CompensationVisual`)을 쓰고, 나머지는 공용 리퀴드 글래스 블롭 배경 + SVG 아이콘 씬을 씀. 리퀴드 글래스 이펙트의 스크롤 버벅임을 backdrop-filter 대신 사전 렌더링된 블러 레이어로 교체해서 해결
- **카드 02(선경험)**: 이번 세션에서 `IdeaFirstLookVisual.tsx`(신규, 네온 3D 전구+리뷰어 실루엣) 전용 비주얼 추가 — 01/03/04와 동일한 "전용 비주얼" 패턴에 맞춤. 사용자가 공유한 참고 HTML(`neon_idea_3d_graphic.html`)을 컴포넌트로 포팅, 원본의 문서 전역 `mousemove` 리스너는 카드 범위로 스코프된 포인터 패럴랙스로 교체
- **LiveProjectsSection**: 스크롤 연동(ScrollStack) → 논스탑 마퀴 → 최종적으로 타이머 기반 자동 로테이션 "스택" 구조로 여러 차례 재구현
- **ReviewerHowSection**: 지하철 노선도 스타일 스테퍼로 재구성

### 2-4. FeaturesSection — Core Features 애플 스타일 캐러셀
- 애플 macbook 페이지처럼 카드 크기 균일화 (기존엔 좌우 카드가 비대칭 스케일/투명도였음)
- 일시정지 버튼 가시성/좌우 대칭 개선, 브라우저 크롬(주소창+신호등 버튼) 목업으로 모션그래픽 실물감 강화
- 페이지네이션(재생 버튼+스텝 표시)이 `.snap-section`의 `overflow:clip`에 잘려 사라지던 버그 — 섹션 내부 세로 여백을 줄여서 1뷰포트 안에 다 들어오게 수정
- 캐러셀 카드 가로 폭 축소

### 2-5. TrustSection — "FINDFIT만의 차별점" 섹션
- 5개 차별점에 사용자가 제공한 실제 이미지 5장 적용 (`public/differentiators/feature-01~05-*.png`)
- 데스크톱: 큰 히어로 그래픽 + 하단 썸네일 트레이로 재구성 (스크롤에 따라 활성 카드 전환)
- 모바일: 가로 스크롤 스냅 카드

### 2-6. 사례금 모션그래픽 (`CompensationVisual.tsx`) — 가장 많이 다듬어진 개별 비주얼
골드 글래스모피즘 뱃지 → 레퍼런스 코드에 최대한 맞춰 정밀 포팅 → 4가지 디테일 보정(클립보드 끊김, 체크마크 두께, ₩ 통화기호, 뒷쪽 코인스택 스타일) → 코인 스택 형태 복원 + 배경 박스 제거 + 클릭 시 코인 짤랑 이펙트 → 사이즈 확대(위치는 유지한 채 `transform: scale()`로 전체 확대, 원본 상대 레이아웃 보존)

### 2-7. 히어로 섹션 — 크리에이터/리뷰어 캡슐 그래픽 (이번 세션)
사용자가 제공한 알약 모양 이미지(물음표+느낌표)를 반으로 나눠서:
- `components/landing/HeroSection.tsx`(크리에이터): 텍스트 위치 그대로, 우측에 이미지 왼쪽 절반(물음표)을 `clip-path`로 노출
- `components/landing/ReviewerLanding.tsx`(리뷰어 히어로): 텍스트를 우측으로 이동(`ml-auto`), 좌측에 같은 이미지 오른쪽 절반(느낌표) 노출
- 두 이미지 모두 섹션 기준 동일한 `top/left/width/transform` 값을 사용 — 페이지를 전환해도 화면상 같은 위치에서 반대쪽 절반이 보이는 것처럼 정렬됨
- 이미지 파일: `public/hero/qa-capsule.png`

### 2-8. 기타 반복 수정
- 도넛차트 위치 이탈 수정(framer-motion의 애니메이트 `transform`이 static SVG `transform` 속성을 덮어쓰는 문제 — 정적 위치와 애니메이션 회전을 별도 `<g>`로 분리해서 해결)
- Agent 패널: Phase 1~4 토스트 UI, "등록 전환 도우미"로 역할 재정의, Deep 타입 UI 제거
- `middleware.ts` → `proxy.ts`로 admin 인증 통합 (Next.js 16 호환 — 16부터 `middleware.ts` 대신 `proxy.ts` 컨벤션을 씀)

---

## 3. Phase B — 파이프라인 실연결 + Supabase + 프라이버시

여기서부터는 사용자가 "랜딩페이지 말고 로그인 이후 실사용 화면"으로 방향을 튼 이후의 작업이다. **`_docs/PIPELINE_SUPABASE_HANDOFF.md`에 이미 상세히 정리되어 있어, 아래는 그 요약이다 — 세부 SQL/코드까지 보려면 그 문서를 참고.**

### 3-1. 발견한 문제
`app/builder`·`app/evaluator`·`app/admin`에 화면은 다 있었지만, 크리에이터 등록 마법사가 제출 데이터를 **Supabase가 아니라 브라우저 localStorage에만** 저장하고 있어서 파이프라인이 처음부터 끊겨 있었다. 리뷰어 피드는 실제 Supabase를 조회했지만 그래서 늘 비어 있었고, AI 리포트 생성도 mock 데이터로만 수동 호출 가능했다.

### 3-2. 만든 것 (커밋 `fd60418`)
- `components/builder/new-request/submitProject.ts`(신규) — 마법사 데이터를 `projects`+`review_questions`에 실제로 insert
- 제품 접근 방식(`access_method`: web_link/app_download/physical_shipping) 개념 신설 — Step1BasicInfo에 선택 UI 추가
- 배송형 프로젝트용 수령 확인 게이트(리뷰 페이지), 배송 상태 관리(크리에이터 프로젝트 상세 페이지)
- `lib/ai/generateReport.ts`(신규) — 실제 `review_answers`를 집계해서 PSF 서브스코어 계산 + Gemini 호출 + `ai_reports` 저장, 리뷰 완료율 도달 시 자동 트리거
- 마이그레이션 008 — `ai_reports`에 서브스코어/verdict, `projects`에 접근방식, `project_matches`에 배송 정보 컬럼 추가
- `types/database.ts` 전면 재작성 (기존엔 마이그레이션 001 기준으로만 작성되어 실제 스키마와 완전히 어긋나 있었음)

### 3-3. 마이그레이션 순서 버그 수정 (커밋 `5e3ff5a`)
`007_missing_tables.sql`이 `projects` 테이블 자체를 늦게 만드는데, 그보다 앞선 003~006이 이미 `projects(id)`를 참조하고 있어서 숫자 순서대로 실행하면 중간에 에러가 나는 상태였다. 파일명을 실제 의존관계에 맞게 재배열 (`007` → `002_core_tables.sql`로, 나머지는 한 칸씩 밀림).

### 3-4. 유저 관리 + 프라이버시/RLS 강화 (커밋 `90f586a`)
파이프라인을 다 연결하고 점검해보니 **002~008에서 만든 테이블 전부에 RLS가 꺼져 있어서**, `anon` 키만 있으면 앱 UI를 거치지 않고 다른 사람의 데이터(어떤 크리에이터가 프로젝트를 등록했는지, 다른 리뷰어의 답변/이메일, 계좌번호 등)를 직접 읽을 수 있는 상태였다. 마이그레이션 009로:
- 테이블 9개 전체 RLS 활성화 ("본인 row만")
- 컬럼 단위로 신원을 가리는 뷰 2개 신설: `projects_public`(creator_id 제외), `project_matches_for_creator`(reviewer_id/이메일 등 제외)
- 리뷰어 닉네임을 `count % 26`(26명 넘으면 충돌 + 레이스 컨디션 버그) 대신 프로젝트별 원자적 시퀀스 RPC(`assign_reviewer_nickname`)로 교체, DB에 unique 제약 추가
- `users.status`(active/suspended/withdrawn) 신설 + 본인 스스로 정지 해제 못하게 UPDATE 권한 REVOKE
- `lib/supabase/admin.ts`(서비스 롤 클라이언트, 서버 전용) 신설 — 관리자 화면 전체와 여러 리뷰어 데이터를 넘나드는 리포트 생성 로직을 여기로 전환
- `/admin/requests`(프로젝트 검수 큐), `/admin/evaluators`(전체 유저 관리 — 검색/필터/정지/탈퇴)를 빈 스텁에서 실제 화면으로 신규 구현
- 로그인 시 정지/탈퇴 계정 차단, 역할(role) 재변경 방지 가드

### 3-5. 숨겨진 데이터 3건 노출 수정 (커밋 `861aebb`)
DB엔 저장되지만 화면엔 전혀 안 보이던 것 3건 발견 후 수정:
1. `ai_reports.verdict`(GO/CAUTION/RECONSIDER) + PSF 서브스코어 3종 — `report_data` JSONB 밖의 별도 컬럼이라 리포트 화면이 무시하고 있었음 → `VerdictBanner` 컴포넌트 추가
2. `project_matches.shipping_address` — 조회는 하는데 렌더링을 안 하고 있었음 → 크리에이터 화면에 표시
3. `projects.access_info`(제품 링크/앱스토어 링크) — 리뷰어가 볼 방법이 전혀 없었음(제품을 체험할 방법 자체가 없는 상태) → 승인된 리뷰어 화면에 링크 버튼 추가

### 3-6. Supabase 실제 연동 (원격 DB 적용 완료)
사용자가 제공한 Personal Access Token으로 CLI 연결:
```bash
npx supabase login --token <token>
npx supabase link --project-ref osdgtfghubeejevxcgoj
npx supabase db push   # 001~009 전부 원격 DB에 적용 완료
```
`.env.local` 생성 (anon key, service_role key, 관리자 비밀키 등 구성) 후 REST API로 직접 호출해서 뷰/RPC/RLS가 실제로 동작하는지 검증 완료.

---

## 4. 파일 전체 목록 (신규 / 수정)

### Phase A — 랜딩페이지
| 파일 | 상태 |
|---|---|
| `components/landing/HeroSection.tsx` | 수정 (캡슐 그래픽) |
| `components/landing/ReviewerLanding.tsx` | 대폭 수정 (히어로/혜택섹션/Live Projects/How섹션) |
| `components/landing/HowItWorksSection.tsx` | 대폭 수정 (지하철 노선도 애니메이션) |
| `components/landing/ComparisonSection.tsx` | 신규 |
| `components/landing/PainToCompareReveal.tsx` | 신규 |
| `components/landing/PainPointSection.tsx` | 수정 |
| `components/landing/FeaturesSection.tsx` | 대폭 수정 (캐러셀) |
| `components/landing/TrustSection.tsx` | 대폭 수정 (차별점 섹션) |
| `components/landing/AcrylicPortfolioVisual.tsx` | 신규 |
| `components/landing/TrendDashboardVisual.tsx` | 신규 |
| `components/landing/CompensationVisual.tsx` | 신규 |
| `components/landing/IdeaFirstLookVisual.tsx` | 신규 |
| `app/page.tsx` | 수정 |
| `public/differentiators/feature-01~05-*.png` | 신규(이미지) |
| `public/hero/qa-capsule.png` | 신규(이미지) |

### Phase B — 파이프라인/Supabase/프라이버시
| 파일 | 상태 |
|---|---|
| `supabase/migrations/008_report_verdict_and_access.sql` | 신규 |
| `supabase/migrations/009_privacy_and_moderation.sql` | 신규 |
| `supabase/migrations/002~007_*.sql` | 파일명 재정렬(내용 불변) |
| `types/database.ts` | 전면 재작성 |
| `components/builder/new-request/submitProject.ts` | 신규 |
| `components/builder/new-request/types.ts` | 수정 (accessMethod 필드) |
| `components/builder/new-request/Step1BasicInfo.tsx` | 수정 (접근방식 선택 UI) |
| `components/builder/PreviewPage.tsx`, `CompletePage.tsx` | 수정 (Supabase 연동) |
| `components/builder/ProjectListPage.tsx`, `ProjectDetailPage.tsx` | 수정 (실데이터 조회, 배송 컨트롤) |
| `app/builder/reports/[id]/page.tsx` | 수정 (ai_reports 조회, VerdictBanner) |
| `app/evaluator/review/[id]/page.tsx` | 수정 (배송 게이트, 완료 처리, 링크 노출) |
| `app/evaluator/projects/[id]/page.tsx` | 수정 (뷰 조회, 링크 노출) |
| `lib/ai/generateReport.ts` | 신규 |
| `app/api/ai-report/[projectId]/route.ts` | 수정 (서비스 롤 전환) |
| `app/api/projects/feed/route.ts`, `app/api/projects/[id]/join/route.ts`, `app/api/evaluator/apply/route.ts` | 수정 (뷰 조회, 닉네임 RPC) |
| `app/api/builder/matches/[matchId]/shipping/route.ts` | 신규 |
| `lib/supabase/admin.ts` | 신규 |
| `lib/auth/requireUser.ts` | 신규 |
| `app/admin/evaluators/page.tsx` | 스텁 → 전체 재구현 (유저 관리) |
| `app/admin/requests/page.tsx` | 스텁 → 전체 재구현 (프로젝트 검수) |
| `app/admin/applications/page.tsx`, `app/admin/distributions/page.tsx`, `app/admin/page.tsx` | 수정 (서비스 롤 전환) |
| `app/api/admin/*` (applications, distributions, requests, users) | 다수 신규 라우트 |
| `app/auth/login/page.tsx`, `app/auth/role-select/page.tsx` | 수정 (상태 차단, 역할 재변경 가드) |
| `.env.local` | 신규 (git 미포함) |
| `.gitignore` | 수정 (`supabase/.temp/` 추가) |

---

## 5. 환경 설정 방법

`.env.local`(리포지토리 루트, git에 안 올라감)에 아래가 채워져 있어야 로컬에서 정상 동작한다:

```env
NEXT_PUBLIC_SUPABASE_URL=https://osdgtfghubeejevxcgoj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabase 대시보드 Settings → API → anon key>
SUPABASE_SERVICE_ROLE_KEY=<Settings → API → service_role key, 서버 전용>
GEMINI_API_KEY=              # 없으면 mock 응답으로 자동 대체
ADMIN_SECRET_KEY=<임의 문자열>  # /admin 로그인 비밀번호
RESEND_API_KEY=              # 없으면 이메일만 안 나감
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Supabase 원격 DB는 이미 마이그레이션 001~009 전부 적용된 상태 (`npx supabase db push`로 완료). 새 마이그레이션 추가 시 같은 명령으로 반영.

---

## 6. 알려진 기술부채 / 다음 작업 후보

우선순위 순:

1. **라우트 중복** — `app/projects/[id]/report|review|distribution`(구) vs `app/builder/reports/[id]`, `app/evaluator/review/[id]`(신)가 동시에 존재. 구버전엔 `onClick` 없는 죽은 유료 잠금 버튼이 남아있음. 사용자가 "나중에 따로 정리하겠다"고 해서 이번 범위에서 제외.
2. **`app/reviewer/account-setup`(계좌 등록)이 고아 페이지** — 기능은 완성돼 있는데 내비게이션 어디서도 링크가 없어 도달 불가능.
3. **리뷰어 프로필 편집 화면 없음** — `domain_tags`/`level`(매칭 점수에 쓰임)을 리뷰어가 설정할 UI가 없음. `app/evaluator/profile/page.tsx`가 빈 스텁.
4. **리뷰어 자진 하차(drop) 불가** — 수락한 매칭을 리뷰어가 스스로 취소하는 UI 없음.
5. **빈 스텁 정리 대상**: `app/builder/requests/*`, `app/evaluator/history`, `app/admin/reports`, `app/admin/stats`, `components/builder/new-request/Step4Deep.tsx`(Deep 타입 폐기로 죽은 코드)
6. **`app/api/projects/[id]/distribute`, `lib/distribution/execute.ts`** — 브라우저용 클라이언트를 서버 API 라우트 안에서 그대로 쓰고 있어 인증 컨텍스트가 불안정 (이번 세션 이전부터 있던 문제, RLS로 더 나빠지진 않았지만 정산 플로우를 쓰려면 정리 필요).
7. **유료 잠금(paywall)** — `is_unlocked`은 이번 라운드 의도적으로 항상 `true`. 실제 결제 연동 시 `generateAndSaveReport` + 리포트 화면 lock UI를 함께 설계해야 함.
8. **question_templates 테이블과 하드코딩된 질문 상수의 이중 관리** — 마법사 화면은 `types.ts`에 하드코딩된 `PSF_STANDARD_QUESTIONS`/`SEAN_ELLIS_QUESTION`을 쓰고, DB `question_templates`는 별도로 존재. 둘이 어긋나지 않게 사람이 손으로 동기화해야 하는 상태.

---

## 7. 커밋 로그 전체

```
c5e97fd  docs: 파이프라인+Supabase 연동 작업 인수인계 문서 추가
861aebb  fix: DB엔 저장되지만 화면에 안 보이던 데이터 3건 노출
90f586a  feat: 유저 관리 + 프라이버시/익명성 강화 (RLS 전면 적용)
5e3ff5a  fix: 마이그레이션 파일 순서를 실제 테이블 의존관계에 맞게 재배열
a68c8d3  feat: 크리에이터/리뷰어 히어로에 물음표·느낌표 캡슐 그래픽 반쪽씩 배치
7d0737b  feat: 리뷰어 혜택 섹션 '선경험' 카드에 네온 3D 전구 모션그래픽 추가
fd60418  feat: 크리에이터→리뷰어→리포트 파이프라인 실데이터 연결
296b6ae  fix: 도넛차트 위치이탈 수정, 사례금 그래픽 배치 유지하며 확대, 차별점 섹션 이미지 교체
0827ea9  fix: 혜택 섹션 모션그래픽 3건 — 별 바운스/그래프 펄스 복원, 사례금 그래픽 크기 확대
176bf24  fix: 사례금 모션그래픽 — 코인 스택 형태 복원, 배경 박스 제거, 클릭 시 코인 짤랑 이펙트 추가
0edd770  fix: 사례금 모션그래픽 4가지 보정 — 클립보드 끊김, 체크마크 두께, 통화 기호, 뒷쪽 코인스택 스타일
60becb3  fix: 사례금 모션그래픽을 레퍼런스 코드에 최대한 맞춰 정밀 포팅
5174350  feat: 사례금(04번) 모션그래픽을 골드 글래스모피즘 뱃지로 교체
e5c2f0d  feat: FINDFIT만의 차별점 섹션에 5개 글래스 모션그래픽 이미지 적용
fd03ee7  fix: Core Features 캐러셀 카드 가로 폭 축소
6ae0e5e  fix: Core Features 페이지네이션이 잘려서 사라지던 문제 수정
ae0a6fa  fix: Core Features 캐러셀 카드 크기 균일화
bc6a321  fix: Core Features 일시정지 버튼 개선 + 브라우저 크롬 실물감, Live Projects 자동 로테이션
59741f4  fix: Live Projects 스크롤 고정 버그 수정 + Core Features 배경 원복
25aeb17  feat: Live Projects ScrollStack 전환 + Core Features 애플 스타일 자동 캐러셀
3def375  feat: 리뷰어 혜택 섹션 04개 카드 전용 모션그래픽 포팅
da7170e  fix: How it works 정거장 정렬 버그 + Live Projects 연속 코스플로우 + 차별점 섹션 보강
8e8e6df  feat: How it works 지하철 노선도 보정 + Live Projects 논스탑 마퀴
166856f  feat: How it works 자동 재생 지하철 노선도 전환 + FAQ 캐러셀 교체
503f93b  fix: 리뷰어 혜택 리스트 좌측 라인 제거 + How it works 레퍼런스 스타일 재구성
02449ae  perf: 리뷰어 혜택 섹션 리퀴드 글래스 스크롤 버벅임 수정
0afc680  feat: 리뷰어 혜택 섹션 리퀴드 글래스 모션그래픽 + 스크롤 성능 개선
cd860da  fix: 비교 섹션 한 화면 압축 + 좌우 콘텐츠 분량 균형
54ce925  fix: 공감/비교 패널 상단 잘림 현상 수정
6dc5364  feat: 비교 섹션 레퍼런스 이미지 스타일 재구성
feda26f  fix: 히어로 스크롤 시 공감/비교 섹션 스킵 문제 수정
56c5f75  fix: 공감 섹션 UI 원복 + 가로 슬라이드 전환으로 비교 섹션 연결
51cf631  feat: 공감 섹션 리뉴얼 + DIY vs FindFit 비교 섹션 신규 추가
46d1ee0  feat: HowItWorks 이전 스텝 문구 유지 + 숫자 크롭 비율 축소
c5ed3a5  feat: HowItWorks 라벨 동기화 + 숫자 크롭 축소 + 타이틀 브랜드컬러
b78348b  fix: HowItWorks 숫자 크롭+타이틀 오버랩, 진입/출구 단축, 셸프 확대
944d54a  fix: HowItWorks 배경 높이 정렬 + 스텝 숫자 크롭 디자인
5fc373b  fix: HowItWorks 진입/출구 길이 단축 + 스텝 폰트 확대
dc284a2  fix: HowItWorks 진입/출구 라인 화면 정중앙 고정 + 길이 단축
d998fc7  fix: HowItWorks 스네이크 좌우 대칭 지그재그 재구성
67c747c  fix: HowItWorks 셸프 길이 확대 + 라벨 재배치
5aaf3c2  fix: HowItWorks 홀 정원형 복원 + 가로 셸프 재적용
aee8734  feat: HowItWorks 스네이크 가로 셸프 구조 재설계
1874bb4  feat: HowItWorks 스네이크 연결 라인 길이 확대
93955ac  fix: HowItWorks 스네이크 턴 사이 직선 구간 제거
13f36ab  feat: HowItWorks 스네이크 곡선 접선 연속화
6400f7c  feat: HowItWorks 섹션 스크롤 애니메이션 전면 재설계
2232821  feat: How it works / 차별점 섹션 스크롤 애니메이션 재설계
1c2c6c0  docs: 기획서 v3.3 + 기술명세서 v1.2 추가
```

(1c2c6c0 이전 커밋들은 이 세션 이전에 만들어진 기존 MVP 스캐폴딩 — `aec56cf` 최초 커밋부터의 이력은 `git log`로 확인 가능)
