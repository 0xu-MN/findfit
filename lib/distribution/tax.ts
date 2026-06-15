const TAX_THRESHOLD = 50000
const WITHHOLDING_RATE = 0.033 // 사업소득 3.3% (소득세 3% + 지방소득세 0.3%)

export function calcSettlement(amount: number): { withholding_tax: number; net_amount: number } {
  if (amount <= TAX_THRESHOLD) {
    return { withholding_tax: 0, net_amount: amount }
  }
  const tax = Math.floor(amount * WITHHOLDING_RATE)
  return { withholding_tax: tax, net_amount: amount - tax }
}
