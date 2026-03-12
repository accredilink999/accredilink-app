/**
 * UK PAYE Tax & National Insurance Calculator
 * Tax Year 2026/27 (6 April 2026 – 5 April 2027)
 */

// ── Tax Year 2026/27 Constants ──
export const TAX_YEAR = {
  label: '2026/27',
  personalAllowance: 12570,
  basicRateLimit: 37700,     // Band width (not cumulative)
  higherRateLimit: 125140,   // Cumulative threshold
  basicRate: 0.20,
  higherRate: 0.40,
  additionalRate: 0.45,
}

// Monthly equivalents
const MONTHLY = {
  personalAllowance: TAX_YEAR.personalAllowance / 12,  // £1,047.50
  basicRateTop: (TAX_YEAR.personalAllowance + TAX_YEAR.basicRateLimit) / 12, // £4,189.17
  higherRateTop: TAX_YEAR.higherRateLimit / 12, // £10,428.33
}

// ── NI Thresholds (Monthly) ──
const NI_THRESHOLDS = {
  primaryThreshold: 1048,   // £1,048/month
  upperEarningsLimit: 4189, // £4,189/month
  // Higher thresholds for categories H and M
  upperSecondaryThresholdH: 4189, // Apprentices under 25
  upperSecondaryThresholdM: 4189, // Under 21
}

// ── Tax Code Options ──
export const TAX_CODES = [
  { value: '1257L', label: '1257L — Standard personal allowance (£12,570)' },
  { value: '1257L-W1', label: '1257L W1/M1 — Week 1/Month 1 (non-cumulative)' },
  { value: 'BR', label: 'BR — Basic rate (20% on all earnings, no allowance)' },
  { value: 'D0', label: 'D0 — Higher rate (40% on all earnings)' },
  { value: 'D1', label: 'D1 — Additional rate (45% on all earnings)' },
  { value: '0T', label: '0T — No personal allowance' },
  { value: 'NT', label: 'NT — No tax to be deducted' },
  { value: 'K500', label: 'K500 — Negative allowance (adds £5,000 to taxable)' },
  { value: '1100L', label: '1100L — Reduced allowance (£11,000)' },
  { value: '1000L', label: '1000L — Reduced allowance (£10,000)' },
  { value: '800L', label: '800L — Reduced allowance (£8,000)' },
  { value: '500L', label: '500L — Reduced allowance (£5,000)' },
]

// ── NI Category Options ──
export const NI_CATEGORIES = [
  { value: 'A', label: 'A — Standard (most employees)', mainRate: 0.08, upperRate: 0.02 },
  { value: 'B', label: 'B — Reduced rate (married women\'s election)', mainRate: 0.0185, upperRate: 0.02 },
  { value: 'C', label: 'C — Over state pension age (no NI)', mainRate: 0, upperRate: 0 },
  { value: 'H', label: 'H — Apprentice under 25', mainRate: 0.08, upperRate: 0.02 },
  { value: 'M', label: 'M — Employee under 21', mainRate: 0.08, upperRate: 0.02 },
]

/**
 * Parse a tax code into its components.
 * e.g. '1257L' → { number: 1257, letter: 'L', allowance: 12570 }
 * e.g. 'K500' → { number: 500, letter: 'K', allowance: -5000 }
 * e.g. 'BR' → { number: 0, letter: 'BR', allowance: 0 }
 */
function parseTaxCode(code) {
  if (!code) return { number: 1257, letter: 'L', allowance: TAX_YEAR.personalAllowance }

  const upper = code.toUpperCase().replace(/\s+/g, '').replace(/-?W1$/, '').replace(/-?M1$/, '')

  // Special codes with no number
  if (upper === 'BR') return { number: 0, letter: 'BR', allowance: 0, flatRate: TAX_YEAR.basicRate }
  if (upper === 'D0') return { number: 0, letter: 'D0', allowance: 0, flatRate: TAX_YEAR.higherRate }
  if (upper === 'D1') return { number: 0, letter: 'D1', allowance: 0, flatRate: TAX_YEAR.additionalRate }
  if (upper === 'NT') return { number: 0, letter: 'NT', allowance: 0, noTax: true }
  if (upper === '0T') return { number: 0, letter: '0T', allowance: 0 }

  // K codes — negative allowance
  const kMatch = upper.match(/^K(\d+)/)
  if (kMatch) {
    const num = parseInt(kMatch[1])
    return { number: num, letter: 'K', allowance: -(num * 10) }
  }

  // Standard numeric codes (e.g. 1257L, 1100L, 500L)
  const stdMatch = upper.match(/^(\d+)([A-Z]*)$/)
  if (stdMatch) {
    const num = parseInt(stdMatch[1])
    return { number: num, letter: stdMatch[2] || 'L', allowance: num * 10 }
  }

  // Fallback
  return { number: 1257, letter: 'L', allowance: TAX_YEAR.personalAllowance }
}

/**
 * Calculate monthly PAYE income tax.
 * @param {number} monthlyGross — Gross pay for the month
 * @param {string} taxCode — e.g. '1257L', 'BR', 'K500'
 * @returns {{ tax: number, taxCode: string, breakdown: object }}
 */
export function calculateMonthlyTax(monthlyGross, taxCode = '1257L') {
  const parsed = parseTaxCode(taxCode)

  // NT = no tax
  if (parsed.noTax) {
    return { tax: 0, taxCode, breakdown: { allowance: 0, basic: 0, higher: 0, additional: 0 } }
  }

  // Flat rate codes (BR, D0, D1)
  if (parsed.flatRate !== undefined) {
    const tax = round2(monthlyGross * parsed.flatRate)
    return { tax, taxCode, breakdown: { allowance: 0, flatRate: parsed.flatRate, taxableAmount: monthlyGross } }
  }

  // Standard calculation
  const monthlyAllowance = parsed.allowance / 12
  const taxable = Math.max(0, monthlyGross - monthlyAllowance)

  // For K codes, taxable can exceed gross (adds to income)
  const effectiveTaxable = parsed.letter === 'K'
    ? monthlyGross + Math.abs(parsed.allowance) / 12
    : taxable

  // Apply bands
  const monthlyBasicBand = TAX_YEAR.basicRateLimit / 12   // £3,141.67
  const monthlyHigherBand = (TAX_YEAR.higherRateLimit - TAX_YEAR.personalAllowance - TAX_YEAR.basicRateLimit) / 12

  let remaining = effectiveTaxable
  const basicTaxable = Math.min(remaining, monthlyBasicBand)
  remaining -= basicTaxable

  const higherTaxable = Math.min(remaining, monthlyHigherBand)
  remaining -= higherTaxable

  const additionalTaxable = remaining

  const basicTax = basicTaxable * TAX_YEAR.basicRate
  const higherTax = higherTaxable * TAX_YEAR.higherRate
  const additionalTax = additionalTaxable * TAX_YEAR.additionalRate

  const totalTax = round2(basicTax + higherTax + additionalTax)

  return {
    tax: Math.max(0, totalTax),
    taxCode,
    breakdown: {
      monthlyAllowance: round2(monthlyAllowance),
      taxableAmount: round2(effectiveTaxable),
      basic: round2(basicTax),
      higher: round2(higherTax),
      additional: round2(additionalTax),
    }
  }
}

/**
 * Calculate monthly employee NI contributions.
 * @param {number} monthlyGross — Gross pay for the month
 * @param {string} category — NI category letter (A, B, C, H, M)
 * @returns {{ ni: number, category: string, breakdown: object }}
 */
export function calculateMonthlyNI(monthlyGross, category = 'A') {
  const cat = NI_CATEGORIES.find(c => c.value === category) || NI_CATEGORIES[0]

  if (cat.mainRate === 0 && cat.upperRate === 0) {
    return { ni: 0, category, breakdown: { belowThreshold: monthlyGross, mainBand: 0, upperBand: 0 } }
  }

  const pt = NI_THRESHOLDS.primaryThreshold
  const uel = NI_THRESHOLDS.upperEarningsLimit

  const belowThreshold = Math.min(monthlyGross, pt)
  const mainBandEarnings = Math.max(0, Math.min(monthlyGross, uel) - pt)
  const upperBandEarnings = Math.max(0, monthlyGross - uel)

  const mainNI = mainBandEarnings * cat.mainRate
  const upperNI = upperBandEarnings * cat.upperRate
  const totalNI = round2(mainNI + upperNI)

  return {
    ni: totalNI,
    category,
    breakdown: {
      belowThreshold: round2(belowThreshold),
      mainBandEarnings: round2(mainBandEarnings),
      mainNI: round2(mainNI),
      upperBandEarnings: round2(upperBandEarnings),
      upperNI: round2(upperNI),
    }
  }
}

/**
 * Calculate full payslip from hours and rate.
 */
export function calculatePayslip({
  regularHours = 0,
  overtimeHours = 0,
  hourlyRate = 0,
  overtimeRate = null,
  taxCode = '1257L',
  niCategory = 'A',
  pensionPercent = 0,
  otherDeductions = 0,
}) {
  const otRate = overtimeRate || hourlyRate * 1.5
  const regularPay = round2(regularHours * hourlyRate)
  const overtimePay = round2(overtimeHours * otRate)
  const grossPay = round2(regularPay + overtimePay)

  const { tax, breakdown: taxBreakdown } = calculateMonthlyTax(grossPay, taxCode)
  const { ni, breakdown: niBreakdown } = calculateMonthlyNI(grossPay, niCategory)
  const pension = round2(grossPay * (pensionPercent / 100))
  const totalDeductions = round2(tax + ni + pension + otherDeductions)
  const netPay = round2(grossPay - totalDeductions)

  return {
    regularHours,
    overtimeHours,
    hourlyRate,
    overtimeRate: otRate,
    regularPay,
    overtimePay,
    grossPay,
    taxCode,
    niCategory,
    tax,
    taxBreakdown,
    ni,
    niBreakdown,
    pension,
    pensionPercent,
    otherDeductions,
    totalDeductions,
    netPay,
  }
}

function round2(n) {
  return Math.round(n * 100) / 100
}
