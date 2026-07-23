export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] px-4 py-16">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        <div>
          <span className="text-xl font-black text-[#1D1C1C]">FindFit</span>
          <h1 className="text-2xl font-black text-[#1D1C1C] mt-4">개인정보처리방침</h1>
          <p className="text-[11px] font-bold text-[#999] mt-2">최종 수정일: 2026년 7월 24일</p>
        </div>

        <Section title="1. 수집하는 개인정보 항목">
          <p>
            FindFit은 회원가입·프로젝트 검증·정산을 위해 다음 정보를 수집합니다: 이메일, 닉네임, 실명(선택),
            휴대폰 번호(본인확인 및 중복가입 방지), 생년월일(연령 확인), 정산 계좌 정보(리뷰어의 경우),
            소셜 로그인 시 제공되는 프로필 정보(구글/카카오/네이버).
          </p>
        </Section>

        <Section title="2. 개인정보의 국외 이전">
          <p>
            FindFit은 AI 기반 검증 리포트 생성을 위해 아래와 같이 개인정보(또는 개인정보가 포함되지 않은
            리뷰 응답 데이터)를 국외 사업자에게 전송하며, 이는 정보통신망법 및 개인정보보호법에 따른
            국외이전에 해당합니다.
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5 mt-2">
            <li>
              <strong>Google LLC (Gemini API)</strong> — 이전 국가: 미국 등 Google 데이터센터 소재국.
              이전 항목: 리뷰 응답 텍스트, 프로젝트 설명 등 리포트 생성에 필요한 텍스트 데이터(계정 식별
              정보는 포함하지 않음). 이전 목적: PSF/PMF 검증 리포트 자동 생성.
            </li>
            <li>
              <strong>Anthropic, PBC (Claude API)</strong> — 이전 국가: 미국. 이전 항목: 리포트 데이터
              기반 AI 분석 대화(챗봇) 질의응답에 필요한 텍스트 데이터. 이전 목적: 리포트 심화 분석 및
              사용자 질의응답 처리.
            </li>
          </ul>
          <p className="mt-2">
            위 서비스들은 계약상 데이터를 자체 모델 학습에 사용하지 않도록 API 이용약관에 명시되어 있는
            사업자를 우선 사용하며, 전송 항목은 서비스 제공에 필요한 최소한으로 제한합니다.
          </p>
        </Section>

        <Section title="3. 개인정보 처리 위탁">
          <p>FindFit은 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁하고 있습니다.</p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5 mt-2">
            <li>
              <strong>SMS 발신 업체(솔라피 등)</strong> — 위탁 업무: 휴대폰 본인확인 인증번호 발송.
              위탁 항목: 휴대폰 번호.
            </li>
            <li>
              <strong>계좌 인증 업체(PortOne 등 오픈뱅킹/계좌인증 서비스)</strong> — 위탁 업무: 리뷰어
              정산 계좌의 실명 확인(1원 인증). 위탁 항목: 은행명, 계좌번호, 예금주명.
            </li>
            <li>
              <strong>Supabase Inc.</strong> — 위탁 업무: 데이터베이스·인증 인프라 운영. 위탁 항목:
              서비스 이용에 필요한 전체 계정 정보.
            </li>
          </ul>
        </Section>

        <Section title="4. 개인정보 보유 및 이용 기간">
          <p>
            회원 탈퇴 시 관계 법령에 따라 보존이 필요한 경우를 제외하고 지체 없이 파기합니다. 정산 관련
            정보는 전자상거래법 등 관계 법령에 따른 보존 기간 동안 보관될 수 있습니다.
          </p>
        </Section>

        <Section title="5. 문의처">
          <p>개인정보 처리에 관한 문의는 서비스 내 고객센터를 통해 접수해주세요.</p>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-black text-[#1D1C1C]">{title}</h2>
      <div className="text-[12px] font-medium text-[#666] leading-relaxed">{children}</div>
    </div>
  )
}
