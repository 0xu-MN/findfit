// 솔라피(SOLAPI) SMS 발송 — 키 발급 전이라 mock으로 동작(콘솔에 코드 출력).
// TODO: SOLAPI_API_KEY 발급되면 아래 mock 분기를 실제 SOLAPI SDK/REST 호출로 교체.
export async function sendVerificationSms(phone: string, code: string): Promise<void> {
  if (!process.env.SOLAPI_API_KEY) {
    console.log(`[SMS mock] ${phone}로 인증코드 발송: ${code}`)
    return
  }

  // TODO: SOLAPI_API_KEY 발급되면 교체
  // const res = await fetch('https://api.solapi.com/messages/v4/send', {
  //   method: 'POST',
  //   headers: { Authorization: `HMAC-SHA256 ...`, 'content-type': 'application/json' },
  //   body: JSON.stringify({
  //     message: { to: phone, from: process.env.SOLAPI_SENDER_NUMBER, text: `[FindFit] 인증번호는 ${code}입니다.` },
  //   }),
  // })
  // if (!res.ok) throw new Error('SMS 발송에 실패했습니다')
  console.log(`[SMS mock — SOLAPI_API_KEY 있지만 실연동 미구현] ${phone}: ${code}`)
}

export function generateVerificationCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}
