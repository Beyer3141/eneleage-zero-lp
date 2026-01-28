"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Calculator, TrendingDown, Calendar, DollarSign, Mail, FileText, Users, CheckCircle2, AlertCircle, TrendingUp, Info, Zap, Shield, Sparkles, ChevronDown, ChevronUp, Battery, BatteryCharging, Gauge, Target, Award, ArrowRight, CircleDot, PartyPopper, Rocket } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend, Tooltip, Line, LineChart, ReferenceLine } from 'recharts'
import { motion, AnimatePresence, useSpring, useTransform, useInView } from 'framer-motion'

const AREA_REDUCTION_CSV_URL = 'https://docs.google.com/spreadsheets/d/1CutW05rwWNn2IDKPa7QK9q5m_A59lu1lwO1hJ-4GCHU/export?format=csv&gid=184100076'
const POWER_PRICE_CSV_URL = 'https://docs.google.com/spreadsheets/d/1tPQZyeBHEE2Fh2nY5MBBMjUIF30YQTYxi3n2o36Ikyo/export?format=csv&gid=0'

const PRODUCT_PRICE_PER_UNIT = 3500000
const INSTALLATION_COST_PER_UNIT = 200000
const WARRANTY_YEARS = 16
const DEPRECIATION_YEARS = 6

const INSTALLATION_DISCOUNTS = {
  1: 1.0,
  2: 0.9,
  3: 0.85,
  4: 0.8
} as const

const BATTERY_SPEC = {
  capacity: 10.294,
  cyclesPerDay: 4,
  dailyCapacity: 41.176
} as const

const TAX_RATES = {
  individual: 0,
  soloProprietor: {
    5: 0.05,
    10: 0.10,
    20: 0.20,
    23: 0.23,
    33: 0.33,
    40: 0.40,
    45: 0.45,
  },
  corporateSmall800: 0.15,
  corporateSmall800Plus: 0.232,
  corporateLarge: 0.232,
}

const PRICE_SCENARIOS = {
  noChange: { rate: 0, name: '現状維持', shortName: '0%', color: '#64748b', bgColor: 'bg-slate-50', borderColor: 'border-slate-200', textColor: 'text-slate-700', lightBg: 'bg-slate-100' },
  standard: { rate: 0.03, name: '標準シナリオ', shortName: '3%', color: '#10b981', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', textColor: 'text-emerald-700', lightBg: 'bg-emerald-100' },
  worst: { rate: 0.05, name: '悪化シナリオ', shortName: '5%', color: '#f59e0b', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', textColor: 'text-amber-700', lightBg: 'bg-amber-100' },
}

type ScenarioKey = keyof typeof PRICE_SCENARIOS
type TaxIncentivePattern = 'immediate' | 'tax_credit' | 'depreciation'
type InputMode = 'cost' | 'usage'

interface AreaData {
  area: string
  reductionRate: number
  priceColumn: string
}

interface MonthlyData {
  month: string
  currentCost: number
  reducedCost: number
}

interface LongTermData {
  year: number
  costNoChange: number
  costStandard: number
  costWorst: number
  costReducedNoChange: number
  costReducedStandard: number
  costReducedWorst: number
}

interface PaybackData {
  year: number
  investment: number
  cumulativeSavingsNoChange: number
  cumulativeSavingsStandard: number
  cumulativeSavingsWorst: number
}

interface MultiUnitAnalysis {
  units: 1 | 2 | 3 | 4
  productPrice: number
  installationCost: number
  totalInvestment: number
  taxSavings: number
  actualInvestment: number
  annualReduction: number
  coverageRate: number
  paybackNoChange: number
  paybackStandard: number
  paybackWorst: number
  roi16YearsNoChange: number
  roi16YearsStandard: number
  roi16YearsWorst: number
}

interface SimulationResult {
  area: string
  baselineMonthlyCost: number
  reductionRate: number
  avgMonthlySavings: number
  annualSavings: number
  monthlyData: MonthlyData[]
  longTermData: LongTermData[]
  recommendedUnits: 1 | 2 | 3 | 4
  recommendedReason: string
  multiUnitAnalyses: MultiUnitAnalysis[]
  productPrice: number
  taxRate: number
  taxSavings: number
  actualInvestment: number
  paybackNoChange: number
  paybackStandard: number
  paybackWorst: number
  paybackData: PaybackData[]
  total20YearsNoChange: number
  total20YearsStandard: number
  total20YearsWorst: number
  estimatedDailyUsage: number
  highTimeUsage: number
}

// カウントアップアニメーションコンポーネント
function AnimatedNumber({ value, prefix = '', suffix = '', duration = 1.5, decimals = 0 }: { 
  value: number
  prefix?: string
  suffix?: string
  duration?: number
  decimals?: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })
  const spring = useSpring(0, { duration: duration * 1000 })
  const display = useTransform(spring, (current) => {
    if (decimals > 0) {
      return `${prefix}${current.toFixed(decimals)}${suffix}`
    }
    return `${prefix}${Math.round(current).toLocaleString()}${suffix}`
  })

  useEffect(() => {
    if (isInView) {
      spring.set(value)
    }
  }, [isInView, spring, value])

  return <motion.span ref={ref}>{display}</motion.span>
}

// プログレスリングコンポーネント
function ProgressRing({ progress, size = 80, strokeWidth = 8, color = '#10b981' }: {
  progress: number
  size?: number
  strokeWidth?: number
  color?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-black" style={{ color }}>{Math.round(progress)}%</span>
      </div>
    </div>
  )
}

// 紙吹雪コンポーネント
function Confetti({ isActive }: { isActive: boolean }) {
  const colors = ['#10b981', '#06b6d4', '#f59e0b', '#ec4899', '#8b5cf6']
  
  if (!isActive) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-sm"
          style={{
            backgroundColor: colors[i % colors.length],
            left: `${Math.random() * 100}%`,
            top: -20,
          }}
          initial={{ y: -20, rotate: 0, opacity: 1 }}
          animate={{
            y: window.innerHeight + 20,
            rotate: Math.random() * 720 - 360,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 2.5 + Math.random() * 2,
            delay: Math.random() * 0.5,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  )
}

// 3Dカードコンポーネント
function Card3D({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = (y - centerY) / 10
    const rotateY = (centerX - x) / 10
    setRotateX(rotateX)
    setRotateY(rotateY)
  }

  const handleMouseLeave = () => {
    setRotateX(0)
    setRotateY(0)
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: 'preserve-3d',
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transition: 'transform 0.1s ease-out',
      }}
    >
      {children}
    </motion.div>
  )
}

// フローティングパーティクル背景
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-emerald-400/20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

// ローディングスケルトン
function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-64 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-3xl" />
      <div className="grid md:grid-cols-2 gap-6">
        <div className="h-40 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-2xl" />
        <div className="h-40 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-2xl" />
      </div>
    </div>
  )
}

export function SimulatorForm() {
  const [area, setArea] = useState<string>('')
  const [inputMode, setInputMode] = useState<InputMode>('cost')
  const [monthlyCost, setMonthlyCost] = useState<string>('')
  const [monthlyUsage, setMonthlyUsage] = useState<string>('')
  const [businessType, setBusinessType] = useState<'individual' | 'soloProprietor' | 'corporate'>('corporate')
  const [taxCondition, setTaxCondition] = useState<string>('corporateSmall800')
  const [taxPattern, setTaxPattern] = useState<TaxIncentivePattern>('immediate')
  const [taxCreditRate, setTaxCreditRate] = useState<0.07 | 0.10>(0.10)
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedScenario, setSelectedScenario] = useState<ScenarioKey>('standard')
  const [showRecommendationDetail, setShowRecommendationDetail] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const RETAIL_PRICE_PER_KWH = 30
  const resultRef = useRef<HTMLDivElement>(null)

  // 使用量から電気代を自動計算
  useEffect(() => {
    if (inputMode === 'usage' && monthlyUsage) {
      const usage = parseFloat(monthlyUsage)
      if (!isNaN(usage)) {
        const estimatedCost = Math.round(usage * RETAIL_PRICE_PER_KWH)
        setMonthlyCost(estimatedCost.toString())
      }
    }
  }, [monthlyUsage, inputMode])

  const parseCSV = (csvText: string): string[][] => {
    const lines = csvText.trim().split('\n')
    return lines.map(line => {
      const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/
      return line.split(regex).map(cell => cell.trim().replace(/^"|"$/g, ''))
    })
  }

  const getTaxRate = (): number => {
    if (businessType === 'individual') return TAX_RATES.individual
    if (businessType === 'soloProprietor') {
      const rate = parseInt(taxCondition)
      return TAX_RATES.soloProprietor[rate as keyof typeof TAX_RATES.soloProprietor] || 0
    }
    if (businessType === 'corporate') {
      if (taxCondition === 'corporateSmall800') return TAX_RATES.corporateSmall800
      if (taxCondition === 'corporateSmall800Plus') return TAX_RATES.corporateSmall800Plus
      if (taxCondition === 'corporateLarge') return TAX_RATES.corporateLarge
    }
    return 0
  }

  const getBusinessTypeName = (): string => {
    if (businessType === 'individual') return '個人'
    if (businessType === 'soloProprietor') return '個人事業主'
    if (businessType === 'corporate') return '法人'
    return ''
  }

  const getTaxConditionName = (): string => {
    if (businessType === 'individual') return '一括償却なし'
    if (businessType === 'soloProprietor') return `所得税率 ${taxCondition}%`
    if (businessType === 'corporate') {
      if (taxCondition === 'corporateSmall800') return '中小法人（所得800万以下）税率15%'
      if (taxCondition === 'corporateSmall800Plus') return '中小法人（所得800万超）税率23.2%'
      if (taxCondition === 'corporateLarge') return '大法人 税率23.2%'
    }
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const areaResponse = await fetch(AREA_REDUCTION_CSV_URL)
      const areaCsvText = await areaResponse.text()
      const areaRows = parseCSV(areaCsvText).slice(1)
      
      const areaDataList: AreaData[] = areaRows.map(row => ({
        area: row[0],
        reductionRate: parseFloat(row[1]),
        priceColumn: row[2],
      }))

      const selectedAreaData = areaDataList.find(d => d.area === area)
      if (!selectedAreaData) {
        throw new Error('選択されたエリアのデータが見つかりません')
      }

      const priceResponse = await fetch(POWER_PRICE_CSV_URL)
      const priceCsvText = await priceResponse.text()
      const priceRows = parseCSV(priceCsvText)
      
      const headers = priceRows[0]
      const priceColumnIndex = headers.findIndex(h => h === selectedAreaData.priceColumn)
      
      if (priceColumnIndex === -1) {
        throw new Error('価格データのカラムが見つかりません')
      }

      const monthlyPrices: { [key: number]: number[] } = {}
      
      for (let i = 1; i < priceRows.length; i++) {
        const row = priceRows[i]
        const dateStr = row[0]
        const price = parseFloat(row[priceColumnIndex])
        
        if (dateStr && !isNaN(price)) {
          const dateParts = dateStr.split('/')
          if (dateParts.length >= 2) {
            const month = parseInt(dateParts[1])
            if (month >= 1 && month <= 12) {
              if (!monthlyPrices[month]) {
                monthlyPrices[month] = []
              }
              monthlyPrices[month].push(price)
            }
          }
        }
      }

      const monthlyAvgPrices: { [key: number]: number } = {}
      let totalAvgPrice = 0
      let monthCount = 0
      
      for (let month = 1; month <= 12; month++) {
        if (monthlyPrices[month] && monthlyPrices[month].length > 0) {
          const prices = monthlyPrices[month]
          const avg = prices.reduce((a, b) => a + b, 0) / prices.length
          monthlyAvgPrices[month] = avg
          totalAvgPrice += avg
          monthCount++
        }
      }
      
      const overallAvgPrice = monthCount > 0 ? totalAvgPrice / monthCount : 1

      const baselineCost = parseFloat(monthlyCost)
      const monthlyData: MonthlyData[] = []
      let totalCurrentCost = 0
      let totalReducedCost = 0

      const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

      for (let month = 1; month <= 12; month++) {
        const monthAvgPrice = monthlyAvgPrices[month] || overallAvgPrice
        const variationRate = monthAvgPrice / overallAvgPrice
        
        const currentMonthCost = Math.round(baselineCost * variationRate)
        const reducedMonthCost = Math.round(currentMonthCost * (1 - selectedAreaData.reductionRate / 100))
        
        monthlyData.push({
          month: monthNames[month - 1],
          currentCost: currentMonthCost,
          reducedCost: reducedMonthCost,
        })
        
        totalCurrentCost += currentMonthCost
        totalReducedCost += reducedMonthCost
      }

      const annualSavings = totalCurrentCost - totalReducedCost
      const avgMonthlySavings = Math.round(annualSavings / 12)

      const taxRate = getTaxRate()

      // 使用量推定（小売単価ベース）
      const VARIABLE_COST_RATIO = 0.75
      const variableCost = baselineCost * VARIABLE_COST_RATIO
      const estimatedDailyUsage = variableCost / RETAIL_PRICE_PER_KWH / 30
      const HIGH_TIME_RATIO = 0.7
      const highTimeUsage = estimatedDailyUsage * HIGH_TIME_RATIO

      // 台数別分析（カバー率ベース）- ROI計算も電気代上昇を考慮
      const multiUnitAnalyses: MultiUnitAnalysis[] = []

      for (let units = 1; units <= 4; units++) {
        const productPrice = PRODUCT_PRICE_PER_UNIT * units
        const installationCost = INSTALLATION_COST_PER_UNIT * units * INSTALLATION_DISCOUNTS[units as 1 | 2 | 3 | 4]
        const totalInvestment = productPrice + installationCost

        let taxSavings = 0
        if (businessType !== 'individual') {
          if (taxPattern === 'immediate') {
            taxSavings = productPrice * taxRate
          } else if (taxPattern === 'tax_credit') {
            taxSavings = productPrice * taxCreditRate
          } else {
            const yearlyTaxSavings = (productPrice / DEPRECIATION_YEARS) * taxRate
            taxSavings = yearlyTaxSavings * DEPRECIATION_YEARS
          }
        }

        const actualInvestment = totalInvestment - taxSavings

        // カバー率計算
        const unitCapacity = BATTERY_SPEC.dailyCapacity * units
        const coverageRate = Math.min(unitCapacity / highTimeUsage, 1.0)

        // 実効削減率 = CSV削減率 × カバー率
        const maxReductionRate = selectedAreaData.reductionRate / 100
        const effectiveReductionRate = maxReductionRate * coverageRate
        const unitAnnualSavings = Math.round(totalCurrentCost * effectiveReductionRate)
        
        // 各シナリオの回収期間を累積計算で算出
        const calculatePaybackYear = (annualRate: number): number => {
          let cumulativeSavings = 0
          const unitReducedAnnualCost = totalCurrentCost - unitAnnualSavings
          
          for (let year = 1; year <= 30; year++) {
            const yearCostBefore = totalCurrentCost * Math.pow(1 + annualRate, year - 1)
            const yearCostAfter = unitReducedAnnualCost * Math.pow(1 + annualRate, year - 1)
            const yearSavings = yearCostBefore - yearCostAfter
            cumulativeSavings += yearSavings
            
            if (cumulativeSavings >= actualInvestment) {
              const prevCumulative = cumulativeSavings - yearSavings
              const fraction = (actualInvestment - prevCumulative) / yearSavings
              return parseFloat((year - 1 + fraction).toFixed(1))
            }
          }
          return 999
        }

        // シナリオ別ROI計算（電気代上昇を考慮した累積削減額）
        const calculateRoi = (annualRate: number): number => {
          let cumulativeSavings = 0
          const unitReducedAnnualCost = totalCurrentCost - unitAnnualSavings
          
          for (let year = 1; year <= WARRANTY_YEARS; year++) {
            const yearCostBefore = totalCurrentCost * Math.pow(1 + annualRate, year - 1)
            const yearCostAfter = unitReducedAnnualCost * Math.pow(1 + annualRate, year - 1)
            const yearSavings = yearCostBefore - yearCostAfter
            cumulativeSavings += yearSavings
          }
          
          const netProfit = cumulativeSavings - actualInvestment
          return actualInvestment > 0 ? (netProfit / actualInvestment) * 100 : 0
        }

        const paybackNoChange = calculatePaybackYear(PRICE_SCENARIOS.noChange.rate)
        const paybackStandard = calculatePaybackYear(PRICE_SCENARIOS.standard.rate)
        const paybackWorst = calculatePaybackYear(PRICE_SCENARIOS.worst.rate)

        const roi16YearsNoChange = calculateRoi(PRICE_SCENARIOS.noChange.rate)
        const roi16YearsStandard = calculateRoi(PRICE_SCENARIOS.standard.rate)
        const roi16YearsWorst = calculateRoi(PRICE_SCENARIOS.worst.rate)

        multiUnitAnalyses.push({
          units: units as 1 | 2 | 3 | 4,
          productPrice,
          installationCost,
          totalInvestment,
          taxSavings,
          actualInvestment,
          annualReduction: unitAnnualSavings,
          coverageRate,
          paybackNoChange,
          paybackStandard,
          paybackWorst,
          roi16YearsNoChange,
          roi16YearsStandard,
          roi16YearsWorst,
        })
      }

      // 推奨台数の決定ロジック（標準シナリオベース）
      let recommendedUnits: 1 | 2 | 3 | 4 = 1
      let recommendedReason = ''

      const viableOptions = multiUnitAnalyses.filter(a => a.coverageRate >= 0.8 && a.paybackStandard <= WARRANTY_YEARS)
      
      if (viableOptions.length > 0) {
        const best = viableOptions.reduce((best, current) => 
          current.roi16YearsStandard > best.roi16YearsStandard ? current : best
        )
        recommendedUnits = best.units
        recommendedReason = `カバー率${Math.round(best.coverageRate * 100)}%で高効率使用、${WARRANTY_YEARS}年保証内の${best.paybackStandard.toFixed(1)}年で投資回収（標準シナリオ）、ROI ${Math.round(best.roi16YearsStandard)}%を実現`
      } else {
        const best = multiUnitAnalyses.reduce((best, current) =>
          current.roi16YearsStandard > best.roi16YearsStandard ? current : best
        )
        recommendedUnits = best.units
        if (best.coverageRate < 0.8) {
          recommendedReason = `現在の電力使用量では${best.units}台でカバー率${Math.round(best.coverageRate * 100)}%。投資効率を最大化`
        } else {
          recommendedReason = `ROI ${Math.round(best.roi16YearsStandard)}%で最も投資効率が高い構成`
        }
      }

      const recommendedAnalysis = multiUnitAnalyses.find(a => a.units === recommendedUnits)!

      const longTermData: LongTermData[] = []
      const maxYears = 25
      
      const recommendedAnnualCost = totalCurrentCost - recommendedAnalysis.annualReduction

      for (let year = 0; year <= maxYears; year++) {
        const costNoChange = totalCurrentCost * Math.pow(1 + PRICE_SCENARIOS.noChange.rate, year)
        const costStandard = totalCurrentCost * Math.pow(1 + PRICE_SCENARIOS.standard.rate, year)
        const costWorst = totalCurrentCost * Math.pow(1 + PRICE_SCENARIOS.worst.rate, year)
        
        const costReducedNoChange = recommendedAnnualCost * Math.pow(1 + PRICE_SCENARIOS.noChange.rate, year)
        const costReducedStandard = recommendedAnnualCost * Math.pow(1 + PRICE_SCENARIOS.standard.rate, year)
        const costReducedWorst = recommendedAnnualCost * Math.pow(1 + PRICE_SCENARIOS.worst.rate, year)

        longTermData.push({
          year,
          costNoChange: Math.round(costNoChange),
          costStandard: Math.round(costStandard),
          costWorst: Math.round(costWorst),
          costReducedNoChange: Math.round(costReducedNoChange),
          costReducedStandard: Math.round(costReducedStandard),
          costReducedWorst: Math.round(costReducedWorst),
        })
      }

      const paybackData: PaybackData[] = []
      let cumulativeNoChange = 0
      let cumulativeStandard = 0
      let cumulativeWorst = 0
      let cumulativeReducedNoChange = 0
      let cumulativeReducedStandard = 0
      let cumulativeReducedWorst = 0

      for (let year = 0; year <= maxYears; year++) {
        const yearCostNoChange = totalCurrentCost * Math.pow(1 + PRICE_SCENARIOS.noChange.rate, year)
        const yearCostStandard = totalCurrentCost * Math.pow(1 + PRICE_SCENARIOS.standard.rate, year)
        const yearCostWorst = totalCurrentCost * Math.pow(1 + PRICE_SCENARIOS.worst.rate, year)
        
        const yearCostReducedNoChange = recommendedAnnualCost * Math.pow(1 + PRICE_SCENARIOS.noChange.rate, year)
        const yearCostReducedStandard = recommendedAnnualCost * Math.pow(1 + PRICE_SCENARIOS.standard.rate, year)
        const yearCostReducedWorst = recommendedAnnualCost * Math.pow(1 + PRICE_SCENARIOS.worst.rate, year)

        cumulativeNoChange += yearCostNoChange
        cumulativeStandard += yearCostStandard
        cumulativeWorst += yearCostWorst
        cumulativeReducedNoChange += yearCostReducedNoChange
        cumulativeReducedStandard += yearCostReducedStandard
        cumulativeReducedWorst += yearCostReducedWorst

        paybackData.push({
          year,
          investment: recommendedAnalysis.actualInvestment,
          cumulativeSavingsNoChange: Math.round(cumulativeNoChange - cumulativeReducedNoChange),
          cumulativeSavingsStandard: Math.round(cumulativeStandard - cumulativeReducedStandard),
          cumulativeSavingsWorst: Math.round(cumulativeWorst - cumulativeReducedWorst),
        })
      }

      const findPaybackYear = (cumulativeSavingsKey: 'cumulativeSavingsNoChange' | 'cumulativeSavingsStandard' | 'cumulativeSavingsWorst'): number => {
        for (let i = 0; i < paybackData.length; i++) {
          if (paybackData[i][cumulativeSavingsKey] >= recommendedAnalysis.actualInvestment) {
            if (i === 0) return 0
            const prevSavings = paybackData[i - 1][cumulativeSavingsKey]
            const currSavings = paybackData[i][cumulativeSavingsKey]
            const fraction = (recommendedAnalysis.actualInvestment - prevSavings) / (currSavings - prevSavings)
            return parseFloat((i - 1 + fraction).toFixed(1))
          }
        }
        return 999
      }

      const paybackNoChange = findPaybackYear('cumulativeSavingsNoChange')
      const paybackStandard = findPaybackYear('cumulativeSavingsStandard')
      const paybackWorst = findPaybackYear('cumulativeSavingsWorst')

      const data20Years = paybackData[20]
      const total20YearsNoChange = data20Years.cumulativeSavingsNoChange
      const total20YearsStandard = data20Years.cumulativeSavingsStandard
      const total20YearsWorst = data20Years.cumulativeSavingsWorst

      setResult({
        area: selectedAreaData.area,
        baselineMonthlyCost: baselineCost,
        reductionRate: selectedAreaData.reductionRate,
        avgMonthlySavings: Math.round(recommendedAnalysis.annualReduction / 12),
        annualSavings: recommendedAnalysis.annualReduction,
        monthlyData,
        longTermData,
        recommendedUnits,
        recommendedReason,
        multiUnitAnalyses,
        productPrice: recommendedAnalysis.productPrice,
        taxRate: taxRate * 100,
        taxSavings: recommendedAnalysis.taxSavings,
        actualInvestment: recommendedAnalysis.actualInvestment,
        paybackNoChange,
        paybackStandard,
        paybackWorst,
        paybackData,
        total20YearsNoChange,
        total20YearsStandard,
        total20YearsWorst,
        estimatedDailyUsage,
        highTimeUsage,
      })

      // 結果表示時に紙吹雪
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)

      // 結果にスクロール
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)

    } catch (err) {
      console.error('計算エラー:', err)
      setError(err instanceof Error ? err.message : '計算に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const getScenarioData = (scenario: ScenarioKey) => {
    if (!result) return null
    
    const paybackKey = scenario === 'noChange' ? result.paybackNoChange : 
                       scenario === 'standard' ? result.paybackStandard : 
                       result.paybackWorst
    
    const total20Key = scenario === 'noChange' ? result.total20YearsNoChange : 
                       scenario === 'standard' ? result.total20YearsStandard : 
                       result.total20YearsWorst
    
    return {
      payback: paybackKey,
      total20: total20Key,
      withinWarranty: paybackKey <= WARRANTY_YEARS
    }
  }

  const getCurrentRoi = (analysis: MultiUnitAnalysis) => {
    if (selectedScenario === 'noChange') return analysis.roi16YearsNoChange
    if (selectedScenario === 'standard') return analysis.roi16YearsStandard
    return analysis.roi16YearsWorst
  }

  return (
    <div className="space-y-8 md:space-y-16">
      <Confetti isActive={showConfetti} />
      
      {/* 入力フォーム - 白ベースデザイン */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative bg-white rounded-3xl md:rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
      >
        <FloatingParticles />
        
        {/* 上部のグラデーションアクセント */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400" />

        <div className="relative z-10 p-6 md:p-12">
          {/* ヘッダー */}
          <div className="text-center mb-8 md:mb-12">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-200 rounded-full px-4 md:px-6 py-2 md:py-2.5 mb-4 md:mb-6"
            >
              <motion.div 
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Zap className="w-4 md:w-5 h-4 md:h-5 text-emerald-500" />
              </motion.div>
              <span className="text-xs md:text-sm font-bold text-emerald-600 tracking-wide">AI診断シミュレーター</span>
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl md:text-5xl font-black text-slate-800 mb-3 md:mb-5 leading-tight tracking-tight"
            >
              電気代削減額を
              <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent"> 無料診断</span>
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm md:text-lg text-slate-500"
            >
              JEPXスポット価格データに基づく精密シミュレーション
            </motion.p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
            {/* エリア選択 */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <CircleDot className="w-4 h-4 text-emerald-500" />
                お住まいのエリア
              </label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-800 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 outline-none transition-all text-base font-medium"
                required
              >
                <option value="">選択してください</option>
                <option value="北海道">北海道</option>
                <option value="東北">東北</option>
                <option value="東京">東京</option>
                <option value="中部">中部</option>
                <option value="北陸">北陸</option>
                <option value="関西">関西</option>
                <option value="中国">中国</option>
                <option value="四国">四国</option>
                <option value="九州">九州</option>
              </select>
            </motion.div>

            {/* 入力モード切替 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 }}
            >
              <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-emerald-500" />
                入力方法を選択
              </label>
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setInputMode('cost')}
                  className={`px-4 py-3.5 rounded-xl font-bold transition-all text-sm ${
                    inputMode === 'cost'
                      ? 'bg-white text-emerald-600 shadow-lg shadow-emerald-100'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  💴 電気代から入力
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setInputMode('usage')}
                  className={`px-4 py-3.5 rounded-xl font-bold transition-all text-sm ${
                    inputMode === 'usage'
                      ? 'bg-white text-emerald-600 shadow-lg shadow-emerald-100'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  ⚡ 使用量から入力
                </motion.button>
              </div>
            </motion.div>

            {/* 電気代/使用量入力 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <AnimatePresence mode="wait">
                {inputMode === 'cost' ? (
                  <motion.div
                    key="cost"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      月額電気代（円）
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={monthlyCost}
                        onChange={(e) => setMonthlyCost(e.target.value)}
                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-800 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 outline-none transition-all text-lg font-bold pr-14"
                        placeholder="例: 80000"
                        required
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                        円
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="usage"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                      <BatteryCharging className="w-4 h-4 text-emerald-500" />
                      月間使用量（kWh）
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={monthlyUsage}
                        onChange={(e) => setMonthlyUsage(e.target.value)}
                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-800 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 outline-none transition-all text-lg font-bold pr-20"
                        placeholder="例: 2500"
                        required
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                        kWh
                      </span>
                    </div>
                    {monthlyUsage && (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-3 text-sm text-slate-500 bg-slate-50 rounded-xl px-4 py-2"
                      >
                        💡 推定電気代: 約 <span className="font-bold text-emerald-600">¥{(parseFloat(monthlyUsage) * RETAIL_PRICE_PER_KWH).toLocaleString()}</span> /月
                      </motion.p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* 事業形態 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" />
                事業形態
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['individual', 'soloProprietor', 'corporate'] as const).map((type) => (
                  <motion.button
                    key={type}
                    type="button"
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setBusinessType(type)
                      if (type === 'individual') setTaxCondition('0')
                      else if (type === 'soloProprietor') setTaxCondition('20')
                      else setTaxCondition('corporateSmall800')
                    }}
                    className={`px-4 py-4 rounded-2xl font-bold transition-all text-sm ${
                      businessType === type
                        ? 'bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-200'
                        : 'bg-slate-100 border-2 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {type === 'individual' ? '個人' : type === 'soloProprietor' ? '個人事業主' : '法人'}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {businessType === 'individual' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-amber-50 rounded-2xl border border-amber-200"
              >
                <p className="text-sm text-amber-700 flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0" />
                  個人の場合、一括損金計上はできないため節税効果はありません。
                </p>
              </motion.div>
            )}

            {businessType === 'soloProprietor' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  所得税率（課税所得に応じて選択）
                </label>
                <select
                  value={taxCondition}
                  onChange={(e) => setTaxCondition(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-800 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 outline-none transition-all text-base font-medium"
                >
                  <option value="5">5% （課税所得195万円以下）</option>
                  <option value="10">10% （195万円超〜330万円以下）</option>
                  <option value="20">20% （330万円超〜695万円以下）</option>
                  <option value="23">23% （695万円超〜900万円以下）</option>
                  <option value="33">33% （900万円超〜1,800万円以下）</option>
                  <option value="40">40% （1,800万円超〜4,000万円以下）</option>
                  <option value="45">45% （4,000万円超）</option>
                </select>
              </motion.div>
            )}

            {businessType === 'corporate' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  法人規模・所得区分
                </label>
                <select
                  value={taxCondition}
                  onChange={(e) => setTaxCondition(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-800 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 outline-none transition-all text-base font-medium"
                >
                  <option value="corporateSmall800">中小法人（資本金1億円以下・所得800万円以下）税率15%</option>
                  <option value="corporateSmall800Plus">中小法人（資本金1億円以下・所得800万円超）税率23.2%</option>
                </select>
              </motion.div>
            )}

            {businessType !== 'individual' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  税制優遇の選択
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'immediate', label: '即時償却', icon: '⚡' },
                    { key: 'tax_credit', label: '税額控除', icon: '💰' },
                    { key: 'depreciation', label: '通常償却', icon: '📊' }
                  ].map(({ key, label, icon }) => (
                    <motion.button
                      key={key}
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setTaxPattern(key as TaxIncentivePattern)}
                      className={`px-3 py-3 rounded-xl font-bold transition-all text-sm ${
                        taxPattern === key
                          ? 'bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-200'
                          : 'bg-slate-100 border-2 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className="mr-1">{icon}</span> {label}
                    </motion.button>
                  ))}
                </div>
                
                {taxPattern === 'tax_credit' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4"
                  >
                    <label className="block text-xs font-bold text-slate-500 mb-2">税額控除率</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[0.07, 0.10].map((rate) => (
                        <motion.button
                          key={rate}
                          type="button"
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setTaxCreditRate(rate as 0.07 | 0.10)}
                          className={`px-4 py-3 rounded-xl font-bold text-sm ${
                            taxCreditRate === rate
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-100 border-2 border-slate-200 text-slate-600'
                          }`}
                        >
                          {rate * 100}%
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium flex items-center gap-2"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Button
                type="submit"
                size="lg"
                disabled={loading || !area || !monthlyCost}
                className="w-full h-16 md:h-20 text-lg md:text-xl font-black bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500 bg-[length:200%_100%] hover:bg-[position:100%_0] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl shadow-2xl shadow-emerald-200 border-0 text-white"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-6 h-6 border-3 border-white border-t-transparent rounded-full"
                    />
                    <span>AIが分析中...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-3">
                    <Sparkles className="w-6 h-6" />
                    <span>削減効果をシミュレーション</span>
                    <ArrowRight className="w-6 h-6" />
                  </span>
                )}
              </Button>
            </motion.div>
          </form>
        </div>
      </motion.div>

      {/* ローディング表示 */}
      {loading && <LoadingSkeleton />}

      {/* 結果表示 */}
      {result && (
        <motion.div 
          ref={resultRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="space-y-8 md:space-y-12"
        >
          {/* メインサマリー */}
          <Card3D className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl md:rounded-[2.5rem] shadow-2xl shadow-emerald-200">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent" />
            
            <motion.div 
              className="absolute top-10 right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 4, repeat: Infinity }}
            />

            <div className="relative z-10 p-6 md:p-14">
              <div className="text-center mb-8 md:mb-12">
                <motion.div 
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 mb-6"
                >
                  <PartyPopper className="w-5 h-5 text-white" />
                  <span className="text-sm font-bold text-white">{result.area}エリア診断完了！</span>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <p className="text-white/80 text-base mb-2">年間削減効果</p>
                  <h2 className="text-6xl md:text-9xl font-black text-white mb-2 tracking-tight">
                    <AnimatedNumber value={result.reductionRate} suffix="%" duration={2} decimals={0} />
                  </h2>
                  <p className="text-white/70 text-sm">AI-EMSによるJEPXスポット価格最適化</p>
                </motion.div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-8">
                <motion.div 
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white/15 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/20"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                      <Calendar className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-base font-bold text-white/80">月間削減額</span>
                  </div>
                  <p className="text-4xl md:text-5xl font-black text-white">
                    ¥<AnimatedNumber value={result.avgMonthlySavings} duration={2} />
                  </p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white/15 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/20"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                      <DollarSign className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-base font-bold text-white/80">年間削減額</span>
                  </div>
                  <p className="text-4xl md:text-5xl font-black text-white">
                    ¥<AnimatedNumber value={result.annualSavings} duration={2} />
                  </p>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { icon: Mail, label: '無料相談', href: 'https://docs.google.com/forms/d/e/1FAIpQLSdVRVxurB8AOO9KT1-Mv5kmM3A_VawLS-gB6mfW2Ia4LO-DuQ/viewform?usp=header' },
                  { icon: FileText, label: '資料請求', href: 'https://docs.google.com/forms/d/e/1FAIpQLSdVRVxurB8AOO9KT1-Mv5kmM3A_VawLS-gB6mfW2Ia4LO-DuQ/viewform?usp=header' },
                  { icon: Users, label: '代理店募集', href: '#agency' }
                ].map(({ icon: Icon, label, href }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                    whileHover={{ scale: 1.03, y: -3 }}
                  >
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full bg-white text-emerald-600 hover:bg-emerald-50 border-0 h-14 font-black shadow-xl text-base rounded-2xl"
                      asChild
                    >
                      <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}>
                        <Icon className="mr-2 w-5 h-5" />
                        {label}
                      </a>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          </Card3D>

          {/* 推奨台数セクション */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-xl shadow-slate-100 border border-slate-100 p-6 md:p-12"
          >
            <div className="text-center mb-8 md:mb-12">
              <motion.div 
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 200 }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-200 rounded-full px-5 py-2.5 mb-5"
              >
                <Target className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-bold text-emerald-600">最適構成診断</span>
              </motion.div>
              
              <h3 className="text-3xl md:text-5xl font-black text-slate-800 mb-3">
                推奨: <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">{result.recommendedUnits}台</span>構成
              </h3>
              
              <motion.button
                onClick={() => setShowRecommendationDetail(!showRecommendationDetail)}
                className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-500 transition-colors text-sm font-medium"
              >
                <Info className="w-4 h-4" />
                なぜこの台数？
                <ChevronDown className={`w-4 h-4 transition-transform ${showRecommendationDetail ? 'rotate-180' : ''}`} />
              </motion.button>
              
              <AnimatePresence>
                {showRecommendationDetail && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-5 bg-slate-50 rounded-2xl border border-slate-200 text-left max-w-2xl mx-auto"
                  >
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {result.recommendedReason}
                    </p>
                    <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">推定日間使用量</p>
                        <p className="text-emerald-600 font-bold">{result.estimatedDailyUsage.toFixed(1)} kWh</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">高価格帯使用量</p>
                        <p className="text-emerald-600 font-bold">{result.highTimeUsage.toFixed(1)} kWh</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">蓄電池容量</p>
                        <p className="text-emerald-600 font-bold">{(BATTERY_SPEC.dailyCapacity * result.recommendedUnits).toFixed(1)} kWh</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* シナリオ選択タブ */}
            <div className="mb-8">
              <p className="text-xs text-slate-400 text-center mb-3">電気代上昇シナリオを選択して比較</p>
              <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-2xl max-w-md mx-auto">
                {(Object.keys(PRICE_SCENARIOS) as ScenarioKey[]).map((key) => {
                  const scenario = PRICE_SCENARIOS[key]
                  const isSelected = selectedScenario === key
                  
                  return (
                    <motion.button
                      key={key}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedScenario(key)}
                      className={`relative px-3 py-3 rounded-xl font-bold transition-all text-xs ${
                        isSelected
                          ? 'bg-white shadow-md text-slate-800'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <div 
                          className="w-2.5 h-2.5 rounded-full" 
                          style={{ backgroundColor: scenario.color }} 
                        />
                        <span>年{scenario.shortName}上昇</span>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* 台数比較カード */}
            <div className="grid md:grid-cols-4 gap-4">
              {result.multiUnitAnalyses.map((analysis, i) => {
                const isRecommended = analysis.units === result.recommendedUnits
                const currentPayback = selectedScenario === 'noChange' ? analysis.paybackNoChange :
                                      selectedScenario === 'standard' ? analysis.paybackStandard :
                                      analysis.paybackWorst
                const currentRoi = getCurrentRoi(analysis)
                
                return (
                  <motion.div
                    key={analysis.units}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ y: -8 }}
                    className={`relative rounded-3xl p-5 transition-all ${
                      isRecommended
                        ? 'bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-xl shadow-emerald-200'
                        : 'bg-slate-50 border-2 border-slate-200 hover:border-emerald-200 hover:shadow-lg'
                    }`}
                  >
                    {isRecommended && (
                      <motion.div 
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="absolute -top-3 -right-3 bg-yellow-400 text-yellow-900 rounded-full p-2 shadow-lg"
                      >
                        <Award className="w-4 h-4" />
                      </motion.div>
                    )}
                    
                    <div className="text-center mb-4">
                      <div className="flex justify-center mb-3">
                        <ProgressRing 
                          progress={analysis.coverageRate * 100} 
                          size={70}
                          color={isRecommended ? '#fff' : '#10b981'}
                        />
                      </div>
                      <p className={`text-3xl font-black ${isRecommended ? 'text-white' : 'text-slate-800'}`}>
                        {analysis.units}台
                      </p>
                      <p className={`text-xs ${isRecommended ? 'text-white/70' : 'text-slate-400'}`}>
                        カバー率
                      </p>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className={`flex justify-between ${isRecommended ? 'text-white/90' : 'text-slate-500'}`}>
                        <span>年間削減</span>
                        <span className={`font-bold ${isRecommended ? 'text-white' : 'text-slate-800'}`}>
                          ¥{(analysis.annualReduction / 10000).toFixed(0)}万
                        </span>
                      </div>
                      <div className={`flex justify-between ${isRecommended ? 'text-white/90' : 'text-slate-500'}`}>
                        <span>回収期間</span>
                        <span className={`font-bold ${isRecommended ? 'text-white' : currentPayback <= WARRANTY_YEARS ? 'text-emerald-600' : 'text-amber-500'}`}>
                          {currentPayback < 999 ? `${currentPayback.toFixed(1)}年` : '−'}
                        </span>
                      </div>
                      <div className={`flex justify-between ${isRecommended ? 'text-white/90' : 'text-slate-500'}`}>
                        <span>{WARRANTY_YEARS}年ROI</span>
                        <span className={`font-bold ${isRecommended ? 'text-white' : 'text-cyan-600'}`}>
                          {currentRoi.toFixed(0)}%
                        </span>
                      </div>
                      <div className={`pt-2 border-t ${isRecommended ? 'border-white/30' : 'border-slate-200'}`}>
                        <div className={`flex justify-between ${isRecommended ? 'text-white/70' : 'text-slate-400'}`}>
                          <span className="text-xs">実質投資</span>
                          <span className="text-xs font-bold">¥{(analysis.actualInvestment / 10000).toFixed(0)}万</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* 月別グラフ */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-xl shadow-slate-100 border border-slate-100 p-6 md:p-12"
          >
            <div className="mb-8">
              <h3 className="text-2xl md:text-3xl font-black text-slate-800 mb-2">
                📊 {result.area}エリアの年間電気代推移
              </h3>
              <p className="text-sm text-slate-500">
                JEPXスポット価格の月別変動を反映
              </p>
            </div>

            <div className="h-72 md:h-96 bg-gradient-to-br from-slate-50 to-white rounded-2xl p-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorReduced" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12, fontWeight: 600 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12, fontWeight: 600 }}
                    tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                      padding: '12px 16px',
                      fontSize: '13px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    }}
                    formatter={(value: number) => [`¥${value.toLocaleString()}`, '']}
                    labelStyle={{ fontWeight: 700, marginBottom: 4, color: '#334155' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }} iconType="circle" />
                  <Area
                    type="monotone"
                    dataKey="currentCost"
                    name="従来"
                    stroke="#ef4444"
                    strokeWidth={3}
                    fill="url(#colorCurrent)"
                    dot={{ fill: "#ef4444", strokeWidth: 2, r: 4, stroke: "#fff" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="reducedCost"
                    name="ENELEAGE導入後"
                    stroke="#10b981"
                    strokeWidth={3}
                    fill="url(#colorReduced)"
                    dot={{ fill: "#10b981", strokeWidth: 2, r: 4, stroke: "#fff" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* シナリオ分析セクション */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-xl shadow-slate-100 border border-slate-100 p-6 md:p-12"
          >
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl md:text-3xl font-black text-slate-800">
                  電気代上昇シナリオ分析
                </h3>
              </div>
              <p className="text-sm text-slate-500">
                過去データに基づく3つのシナリオで将来を予測
              </p>
            </div>

            {/* シナリオタブ */}
            <div className="mb-8">
              <div className="grid grid-cols-3 gap-3 p-2 bg-slate-100 rounded-2xl">
                {(Object.keys(PRICE_SCENARIOS) as ScenarioKey[]).map((key) => {
                  const scenario = PRICE_SCENARIOS[key]
                  const isSelected = selectedScenario === key
                  
                  return (
                    <motion.button
                      key={key}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedScenario(key)}
                      className={`relative px-4 py-4 rounded-xl font-bold transition-all text-sm ${
                        isSelected
                          ? 'bg-white shadow-lg text-slate-800'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row items-center justify-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full shadow-sm" 
                          style={{ backgroundColor: scenario.color }} 
                        />
                        <span className="hidden md:inline">{scenario.name}</span>
                        <span className="md:hidden text-xs">年{scenario.shortName}上昇</span>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* 長期予測グラフ */}
            <div className="bg-slate-50 rounded-2xl p-4 md:p-8 mb-6">
              <h4 className="font-bold text-slate-700 text-base md:text-lg mb-4">📈 20年間の電気代推移予測</h4>
              <div className="h-64 md:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={result.longTermData.slice(0, 21)} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="year"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
                      tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        fontSize: '12px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                      }}
                      formatter={(value: number) => `¥${value.toLocaleString()}`}
                    />
                    <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '11px' }} />
                    
                    <Line
                      type="monotone"
                      dataKey={`cost${selectedScenario === 'noChange' ? 'NoChange' : selectedScenario === 'standard' ? 'Standard' : 'Worst'}`}
                      name="削減前"
                      stroke={PRICE_SCENARIOS[selectedScenario].color}
                      strokeWidth={3}
                      dot={false}
                    />
                    
                    <Line
                      type="monotone"
                      dataKey={`costReduced${selectedScenario === 'noChange' ? 'NoChange' : selectedScenario === 'standard' ? 'Standard' : 'Worst'}`}
                      name="ENELEAGE導入後"
                      stroke="#0ea5e9"
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 投資回収グラフ */}
            <div className="bg-slate-50 rounded-2xl p-4 md:p-8 mb-6">
              <h4 className="font-bold text-slate-700 text-base md:text-lg mb-2">💰 投資回収シミュレーション</h4>
              <p className="text-xs text-slate-500 mb-4">
                {getBusinessTypeName()} / {getTaxConditionName()}
              </p>
              <div className="h-64 md:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={result.paybackData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="year"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
                      tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        fontSize: '12px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                      }}
                      formatter={(value: number) => `¥${value.toLocaleString()}`}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '16px' }}
                      content={() => (
                        <div className="flex flex-wrap justify-center gap-4 pt-4 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-0.5 bg-red-400" style={{ borderTop: '2px dashed #f87171' }} />
                            <span className="text-slate-600 font-medium">実質投資額</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-1 rounded" style={{ backgroundColor: PRICE_SCENARIOS[selectedScenario].color }} />
                            <span className="text-slate-600 font-medium">累積削減額</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-0.5 border-t-2 border-dashed border-amber-400" />
                            <span className="text-slate-600 font-medium">{WARRANTY_YEARS}年保証</span>
                          </div>
                        </div>
                      )}
                    />
                    
                    <ReferenceLine 
                      x={WARRANTY_YEARS} 
                      stroke="#fbbf24" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                    
                    <Line
                      type="monotone"
                      dataKey="investment"
                      name="実質投資額"
                      stroke="#f87171"
                      strokeWidth={2}
                      dot={false}
                      strokeDasharray="8 4"
                    />
                    
                    <Line
                      type="monotone"
                      dataKey={`cumulativeSavings${selectedScenario === 'noChange' ? 'NoChange' : selectedScenario === 'standard' ? 'Standard' : 'Worst'}`}
                      name="累積削減額"
                      stroke={PRICE_SCENARIOS[selectedScenario].color}
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* シナリオ結果カード */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedScenario}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`${PRICE_SCENARIOS[selectedScenario].bgColor} border-2 ${PRICE_SCENARIOS[selectedScenario].borderColor} rounded-3xl p-6 md:p-8`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div 
                    className="w-6 h-6 rounded-full shadow-md" 
                    style={{ backgroundColor: PRICE_SCENARIOS[selectedScenario].color }}
                  />
                  <h5 className={`font-black text-xl md:text-2xl ${PRICE_SCENARIOS[selectedScenario].textColor}`}>
                    {PRICE_SCENARIOS[selectedScenario].name}の結果
                  </h5>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <p className="text-sm text-slate-500 mb-2 font-semibold">20年累積削減額</p>
                    <p 
                      className="text-4xl md:text-5xl font-black"
                      style={{ color: PRICE_SCENARIOS[selectedScenario].color }}
                    >
                      ¥<AnimatedNumber 
                        value={Math.round((getScenarioData(selectedScenario)?.total20 || 0) / 10000)} 
                        suffix="万"
                        duration={1}
                      />
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <p className="text-sm text-slate-500 mb-2 font-semibold">投資回収期間</p>
                    <p className="text-4xl md:text-5xl font-black mb-3">
                      {(getScenarioData(selectedScenario)?.payback || 0) < 999 ? (
                        <span className={(getScenarioData(selectedScenario)?.withinWarranty) ? 'text-emerald-600' : 'text-amber-500'}>
                          {getScenarioData(selectedScenario)?.payback}年
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xl">回収困難</span>
                      )}
                    </p>
                    {(getScenarioData(selectedScenario)?.payback || 0) < 999 && (
                      (getScenarioData(selectedScenario)?.withinWarranty) ? (
                        <motion.div 
                          initial={{ scale: 0.9 }}
                          animate={{ scale: 1 }}
                          className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl"
                        >
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <span className="text-sm font-bold text-emerald-700">{WARRANTY_YEARS}年保証内で回収完了！</span>
                        </motion.div>
                      ) : (
                        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                          <span className="text-sm font-bold text-amber-600">保証期間を超過</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* 費用内訳 */}
            <div className="mt-8 bg-slate-50 rounded-2xl p-6 md:p-8">
              <h4 className="font-black text-slate-800 text-lg mb-5">🧾 費用内訳（{result.recommendedUnits}台構成）</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-3 border-b border-slate-200">
                  <span className="text-slate-600 font-medium">製品定価</span>
                  <span className="font-black text-slate-800 text-lg">¥{result.productPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-200">
                  <span className="text-slate-600 font-medium">工事費</span>
                  <span className="font-black text-slate-800 text-lg">¥{(INSTALLATION_COST_PER_UNIT * result.recommendedUnits * INSTALLATION_DISCOUNTS[result.recommendedUnits]).toLocaleString()}</span>
                </div>
                {businessType !== 'individual' && (
                  <>
                    <div className="flex justify-between items-center py-3 border-b border-slate-200">
                      <span className="text-slate-600 font-medium">税率</span>
                      <span className="font-bold text-slate-700">{result.taxRate}%</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-slate-200">
                      <span className="text-slate-600 font-medium">節税効果</span>
                      <span className="font-black text-emerald-600 text-lg">-¥{result.taxSavings.toLocaleString()}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center py-4 bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-xl px-4 -mx-2">
                  <span className="text-slate-800 font-black text-lg">実質投資額</span>
                  <span className="font-black text-emerald-600 text-2xl md:text-3xl">¥{result.actualInvestment.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 電気代上昇のメリット訴求 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-emerald-900 rounded-3xl md:rounded-[2.5rem] p-6 md:p-12"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent" />
            
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row items-start gap-6 md:gap-10">
                <motion.div 
                  animate={{ 
                    scale: [1, 1.05, 1],
                    rotate: [0, 5, 0]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-16 md:w-20 h-16 md:h-20 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/30 shrink-0"
                >
                  <Rocket className="w-8 md:w-10 h-8 md:h-10 text-white" />
                </motion.div>
                
                <div className="flex-1">
                  <h4 className="text-2xl md:text-4xl font-black text-white mb-4 leading-tight">
                    💡 電気代高騰時代こそ
                    <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent"> ENELEAGE</span>
                  </h4>
                  
                  <p className="text-slate-300 mb-6 text-sm md:text-base leading-relaxed">
                    電気代が上昇するほど、削減効果が拡大。導入が早いほど、長期的な経済メリットが大きくなります。
                  </p>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 md:p-6 border border-white/10">
                    <p className="text-white/80 font-bold mb-4 text-sm">【標準シナリオ（年3%上昇）の削減額推移】</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { year: '1年後', amount: result.avgMonthlySavings, growth: null },
                        { year: '5年後', amount: Math.round(result.avgMonthlySavings * 1.16), growth: '+16%' },
                        { year: '10年後', amount: Math.round(result.avgMonthlySavings * 1.34), growth: '+34%' },
                        { year: '15年後', amount: Math.round(result.avgMonthlySavings * 1.56), growth: '+56%' },
                      ].map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.1 * i }}
                          className="bg-white/10 rounded-xl p-4 text-center"
                        >
                          <p className="text-white/60 text-xs mb-1">{item.year}</p>
                          <p className="text-white font-black text-lg">
                            ¥{item.amount.toLocaleString()}
                          </p>
                          {item.growth && (
                            <p className="text-emerald-400 text-xs font-bold mt-1">{item.growth}</p>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 補助金案内 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-3xl p-6 md:p-10"
          >
            <div className="flex flex-col md:flex-row items-start gap-5 md:gap-8">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 shrink-0">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h4 className="font-black text-slate-800 text-xl md:text-2xl mb-3">🎁 自治体補助金でさらにお得に</h4>
                <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                  各自治体の蓄電池導入補助金を活用することで、初期投資をさらに削減可能です。
                  補助金額は数十万円〜100万円以上になる場合もあり、投資回収期間の大幅短縮が期待できます。
                </p>
                <p className="text-slate-400 text-xs mt-3">
                  ※ 補助金の詳細はお住まいの自治体にお問い合わせください
                </p>
              </div>
            </div>
          </motion.div>

          {/* 代理店募集 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            id="agency" 
            className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-xl shadow-slate-100 border border-slate-100 p-6 md:p-14"
          >
            <div className="text-center mb-10 md:mb-14">
              <motion.div 
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-200 rounded-full px-5 py-2.5 mb-5"
              >
                <Users className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-bold text-emerald-600">販売代理店募集</span>
              </motion.div>
              
              <h3 className="text-2xl md:text-4xl font-black text-slate-800 mb-4 leading-tight">
                一緒に日本の電気代削減を推進しませんか
              </h3>
              <p className="text-sm md:text-base text-slate-500 max-w-2xl mx-auto">
                ENELEAGE Zeroの販売代理店を募集しています。充実したサポート体制であなたのビジネスを支援します。
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 md:gap-6 mb-10 md:mb-12">
              {[
                { num: '1', title: '高収益モデル', desc: '魅力的なマージン設定で安定した収益を実現', emoji: '💰' },
                { num: '2', title: '充実サポート', desc: '営業ツール・研修・技術サポート完備', emoji: '🤝' },
                { num: '3', title: '成長市場', desc: '電力自由化で拡大する蓄電池市場', emoji: '📈' }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -8 }}
                  className="text-center p-6 md:p-8 bg-slate-50 rounded-3xl border-2 border-slate-200 hover:border-emerald-200 hover:shadow-xl transition-all"
                >
                  <div className="text-4xl mb-4">{item.emoji}</div>
                  <h4 className="font-black text-slate-800 text-lg mb-2">{item.title}</h4>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="text-center">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500 bg-[length:200%_100%] hover:bg-[position:100%_0] text-white h-14 md:h-16 px-10 md:px-14 text-base md:text-lg font-black rounded-2xl shadow-2xl shadow-emerald-200 transition-all duration-500"
                  asChild
                >
                  <a
                    href="https://docs.google.com/forms/d/e/1FAIpQLSdVRVxurB8AOO9KT1-Mv5kmM3A_VawLS-gB6mfW2Ia4LO-DuQ/viewform?usp=header"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    代理店応募フォームへ
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </a>
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}