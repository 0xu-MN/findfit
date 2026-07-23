// 계좌 1원 인증 — PortOne 계좌인증 또는 오픈뱅킹 API 연동처 미정이라
// mock으로 동작(콘솔에 입금자명 코드 출력, 실제 송금 없음).
// TODO: PORTONE_ACCOUNT_VERIFY_KEY(또는 오픈뱅킹 키) 발급되면 아래 mock
// 분기를 실제 1원 송금 API 호출로 교체.
export async function sendVerificationDeposit(bankName: string, accountNumber: string): Promise<void> {
  if (!process.env.PORTONE_ACCOUNT_VERIFY_KEY) {
    console.log(`[계좌인증 mock] ${bankName} ${accountNumber}로 1원 송금 — 입금자명 코드 확인 필요`)
    return
  }

  // TODO: PORTONE_ACCOUNT_VERIFY_KEY 발급되면 교체
  // const res = await fetch('https://api.portone.io/account-verifications', { ... })
  console.log(`[계좌인증 mock — 키 있지만 실연동 미구현] ${bankName} ${accountNumber}`)
}

export function generateDepositCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000))
}
