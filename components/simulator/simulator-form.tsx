"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Calculator, TrendingDown, Calendar, DollarSign, Mail, FileText, Users, CheckCircle2, AlertCircle, TrendingUp, Info, Zap, Shield, Sparkles, ChevronDown, ChevronUp, Battery, BatteryCharging, Gauge, Target, Award, ArrowRight, CircleDot } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend, Tooltip, Line, LineChart, ReferenceLine } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'

const AREA_REDUCTION_CSV_URL = 'https://docs.google.com/spreadsheets/d/1CutW05rwWNn2IDKPa7QK9q5m_A59lu1lwO1hJ-4GCHU/export?format=csv&gid=184100076'
const POWER_PRICE_CSV_URL = 'https://docs.google.com/spreadsheets/d/1tPQZyeBHEE2Fh2nY5MBBMjUIF30YQTYxi3n2o36Ikyo/export?format=csv&gid=0'

const PRODUCT_PRICE_PER_UNIT = 3500000
const INSTALLATION_COST_PER_UNIT = 200000
const WARRANTY_YEARS = 15
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
  noChange: { rate: 0, name: '現状維持', shortName: '0%', color: '#6b7280', bgColor: 'bg-slate-50', borderColor: 'border-slate-300', textColor: 'text-slate-700', gradientFrom: 'from-slate-400', gradientTo: 'to-slate-600' },
  standard: { rate: 0.03, name: '標準シナリオ', shortName: '3%', color: '#10b981', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-400', textColor: 'text-emerald-700', gradientFrom: 'from-emerald-400', gradientTo: 'to-teal-600' },
  worst: { rate: 0.05, name: '悪化シナリオ', shortName: '5%', color: '#f59e0b', bgColor: 'bg-amber-50', borderColor: 'border-amber-400', textColor: 'text-amber-700', gradientFrom: 'from-amber-400', gradientTo: 'to-orange-600' },
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
  paybackStandard: number
  roi15Years: number
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

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
}

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

const pulseAnimation = {
  scale: [1, 1.02, 1],
  transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
}

const glowAnimation = {
  boxShadow: [
    "0 0 20px rgba(16, 185, 129, 0.2)",
    "0 0 40px rgba(16, 185, 129, 0.4)",
    "0 0 20px rgba(16, 185, 129, 0.2)"
  ],
  transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
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

  const RETAIL_PRICE_PER_KWH = 30

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

      // 台数別分析（カバー率ベース）
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
        
        const payback15 = unitAnnualSavings > 0 ? actualInvestment / unitAnnualSavings : 999
        const total15Years = unitAnnualSavings * WARRANTY_YEARS
        const netProfit15Years = total15Years - actualInvestment
        const roi15Years = actualInvestment > 0 ? (netProfit15Years / actualInvestment) * 100 : 0

        multiUnitAnalyses.push({
          units: units as 1 | 2 | 3 | 4,
          productPrice,
          installationCost,
          totalInvestment,
          taxSavings,
          actualInvestment,
          annualReduction: unitAnnualSavings,
          coverageRate,
          paybackStandard: payback15,
          roi15Years,
        })
      }

      // 推奨台数の決定ロジック
      let recommendedUnits: 1 | 2 | 3 | 4 = 1
      let recommendedReason = ''

      // カバー率80%以上かつROI最大のものを推奨
      const viableOptions = multiUnitAnalyses.filter(a => a.coverageRate >= 0.8 && a.paybackStandard <= WARRANTY_YEARS)
      
      if (viableOptions.length > 0) {
        const best = viableOptions.reduce((best, current) => 
          current.roi15Years > best.roi15Years ? current : best
        )
        recommendedUnits = best.units
        recommendedReason = `カバー率${Math.round(best.coverageRate * 100)}%で高効率使用、${WARRANTY_YEARS}年保証内の${best.paybackStandard.toFixed(1)}年で投資回収、ROI ${Math.round(best.roi15Years)}%を実現`
      } else {
        // カバー率80%未満でも最もROIが高いものを推奨
        const best = multiUnitAnalyses.reduce((best, current) =>
          current.roi15Years > best.roi15Years ? current : best
        )
        recommendedUnits = best.units
        if (best.coverageRate < 0.8) {
          recommendedReason = `現在の電力使用量では${best.units}台でカバー率${Math.round(best.coverageRate * 100)}%。投資効率を最大化`
        } else {
          recommendedReason = `ROI ${Math.round(best.roi15Years)}%で最も投資効率が高い構成`
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

  return (
    <div className="space-y-8 md:space-y-20">
      {/* 入力フォーム - 先端的デザイン */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        {/* 背景グラデーション */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl md:rounded-[2.5rem]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent rounded-3xl md:rounded-[2.5rem]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent rounded-3xl md:rounded-[2.5rem]" />
        
        {/* グリッドパターン */}
        <div className="absolute inset-0 opacity-[0.03] rounded-3xl md:rounded-[2.5rem] overflow-hidden">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative z-10 p-6 md:p-12">
          {/* ヘッダー */}
          <div className="text-center mb-8 md:mb-12">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 backdrop-blur-sm border border-emerald-500/30 rounded-full px-4 md:px-6 py-2 md:py-2.5 mb-4 md:mb-6"
            >
              <motion.div animate={pulseAnimation}>
                <Zap className="w-4 md:w-5 h-4 md:h-5 text-emerald-400" />
              </motion.div>
              <span className="text-xs md:text-sm font-bold text-emerald-400 tracking-wide">AI診断シミュレーター</span>
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl md:text-5xl font-black text-white mb-3 md:mb-5 leading-tight tracking-tight"
            >
              電気代削減額を
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">無料診断</span>
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm md:text-lg text-slate-400"
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
              <label className="block text-xs md:text-sm font-bold text-slate-300 mb-3 md:mb-4 flex items-center gap-2">
                <CircleDot className="w-4 h-4 text-emerald-400" />
                お住まいのエリア
              </label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-4 md:px-6 py-3.5 md:py-5 rounded-xl md:rounded-2xl bg-slate-800/50 border border-slate-700 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm md:text-base font-medium backdrop-blur-sm"
                required
              >
                <option value="" className="bg-slate-800">選択してください</option>
                <option value="北海道" className="bg-slate-800">北海道</option>
                <option value="東北" className="bg-slate-800">東北</option>
                <option value="東京" className="bg-slate-800">東京</option>
                <option value="中部" className="bg-slate-800">中部</option>
                <option value="北陸" className="bg-slate-800">北陸</option>
                <option value="関西" className="bg-slate-800">関西</option>
                <option value="中国" className="bg-slate-800">中国</option>
                <option value="四国" className="bg-slate-800">四国</option>
                <option value="九州" className="bg-slate-800">九州</option>
              </select>
            </motion.div>

            {/* 入力モード切替 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 }}
            >
              <label className="block text-xs md:text-sm font-bold text-slate-300 mb-3 md:mb-4 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-emerald-400" />
                入力方法を選択
              </label>
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-800/50 rounded-xl border border-slate-700">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setInputMode('cost')}
                  className={`px-4 py-3 rounded-lg font-bold transition-all text-sm ${
                    inputMode === 'cost'
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/25'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  💴 電気代から
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setInputMode('usage')}
                  className={`px-4 py-3 rounded-lg font-bold transition-all text-sm ${
                    inputMode === 'usage'
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/25'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ⚡ 使用量から
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
                    <label className="block text-xs md:text-sm font-bold text-slate-300 mb-3 md:mb-4 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      月額電気代（円）
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={monthlyCost}
                        onChange={(e) => setMonthlyCost(e.target.value)}
                        className="w-full px-4 md:px-6 py-3.5 md:py-5 rounded-xl md:rounded-2xl bg-slate-800/50 border border-slate-700 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm md:text-base font-medium backdrop-blur-sm pr-12"
                        placeholder="例: 80000"
                        required
                      />
                      <span className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm md:text-base">
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
                    <label className="block text-xs md:text-sm font-bold text-slate-300 mb-3 md:mb-4 flex items-center gap-2">
                      <BatteryCharging className="w-4 h-4 text-emerald-400" />
                      月間使用量（kWh）
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={monthlyUsage}
                        onChange={(e) => setMonthlyUsage(e.target.value)}
                        className="w-full px-4 md:px-6 py-3.5 md:py-5 rounded-xl md:rounded-2xl bg-slate-800/50 border border-slate-700 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm md:text-base font-medium backdrop-blur-sm pr-16"
                        placeholder="例: 2500"
                        required
                      />
                      <span className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm md:text-base">
                        kWh
                      </span>
                    </div>
                    {monthlyUsage && (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-2 text-xs text-slate-500"
                      >
                        推定電気代: 約 ¥{(parseFloat(monthlyUsage) * RETAIL_PRICE_PER_KWH).toLocaleString()} /月
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
              <label className="block text-xs md:text-sm font-bold text-slate-300 mb-3 md:mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                事業形態
              </label>
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                {(['individual', 'soloProprietor', 'corporate'] as const).map((type) => (
                  <motion.button
                    key={type}
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setBusinessType(type)
                      if (type === 'individual') setTaxCondition('0')
                      else if (type === 'soloProprietor') setTaxCondition('20')
                      else setTaxCondition('corporateSmall800')
                    }}
                    className={`px-3 md:px-4 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold transition-all text-xs md:text-sm ${
                      businessType === type
                        ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/25'
                        : 'bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
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
                className="p-4 bg-slate-800/30 rounded-xl border border-slate-700"
              >
                <p className="text-xs md:text-sm text-slate-400 flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-500 shrink-0" />
                  個人の場合、一括損金計上はできないため節税効果はありません。
                </p>
              </motion.div>
            )}

            {businessType === 'soloProprietor' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <label className="block text-xs md:text-sm font-bold text-slate-300 mb-3">
                  所得税率（課税所得に応じて選択）
                </label>
                <select
                  value={taxCondition}
                  onChange={(e) => setTaxCondition(e.target.value)}
                  className="w-full px-4 md:px-6 py-3.5 md:py-5 rounded-xl md:rounded-2xl bg-slate-800/50 border border-slate-700 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm md:text-base font-medium"
                >
                  <option value="5" className="bg-slate-800">5% （課税所得195万円以下）</option>
                  <option value="10" className="bg-slate-800">10% （195万円超〜330万円以下）</option>
                  <option value="20" className="bg-slate-800">20% （330万円超〜695万円以下）</option>
                  <option value="23" className="bg-slate-800">23% （695万円超〜900万円以下）</option>
                  <option value="33" className="bg-slate-800">33% （900万円超〜1,800万円以下）</option>
                  <option value="40" className="bg-slate-800">40% （1,800万円超〜4,000万円以下）</option>
                  <option value="45" className="bg-slate-800">45% （4,000万円超）</option>
                </select>
              </motion.div>
            )}

            {businessType === 'corporate' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <label className="block text-xs md:text-sm font-bold text-slate-300 mb-3">
                  法人規模・所得区分
                </label>
                <select
                  value={taxCondition}
                  onChange={(e) => setTaxCondition(e.target.value)}
                  className="w-full px-4 md:px-6 py-3.5 md:py-5 rounded-xl md:rounded-2xl bg-slate-800/50 border border-slate-700 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm md:text-base font-medium"
                >
                  <option value="corporateSmall800" className="bg-slate-800">中小法人（資本金1億円以下・所得800万円以下）税率15%</option>
                  <option value="corporateSmall800Plus" className="bg-slate-800">中小法人（資本金1億円以下・所得800万円超）税率23.2%</option>
                </select>
              </motion.div>
            )}

            {businessType !== 'individual' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <label className="block text-xs md:text-sm font-bold text-slate-300 mb-3 md:mb-4">
                  税制優遇の選択
                </label>
                <div className="grid grid-cols-3 gap-2 md:gap-3">
                  {[
                    { key: 'immediate', label: '即時償却' },
                    { key: 'tax_credit', label: '税額控除' },
                    { key: 'depreciation', label: '通常償却' }
                  ].map(({ key, label }) => (
                    <motion.button
                      key={key}
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setTaxPattern(key as TaxIncentivePattern)}
                      className={`px-3 md:px-4 py-3 md:py-4 rounded-xl font-bold transition-all text-xs md:text-sm ${
                        taxPattern === key
                          ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/25'
                          : 'bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {label}
                    </motion.button>
                  ))}
                </div>
                
                {taxPattern === 'tax_credit' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4"
                  >
                    <label className="block text-xs font-bold text-slate-400 mb-2">税額控除率</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[0.07, 0.10].map((rate) => (
                        <motion.button
                          key={rate}
                          type="button"
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setTaxCreditRate(rate as 0.07 | 0.10)}
                          className={`px-4 py-2.5 rounded-lg font-semibold text-sm ${
                            taxCreditRate === rate
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-800 border border-slate-700 text-slate-400'
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
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium"
              >
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
                className="w-full h-14 md:h-18 text-base md:text-xl font-black bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500 bg-[length:200%_100%] hover:bg-[position:100%_0] transition-all duration-500 disabled:opacity-50 rounded-xl md:rounded-2xl shadow-2xl shadow-emerald-500/25 border-0"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    <span>AIが分析中...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-3">
                    <Sparkles className="w-5 h-5" />
                    <span>削減効果をシミュレーション</span>
                    <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>
            </motion.div>
          </form>
        </div>
      </motion.div>

      {/* 結果表示 */}
      {result && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="space-y-8 md:space-y-16"
        >
          {/* メインサマリー - ダイナミックカード */}
          <motion.div 
            {...fadeInUp}
            className="relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl md:rounded-[2.5rem]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent rounded-3xl md:rounded-[2.5rem]" />
            
            {/* 動くパーティクル風装飾 */}
            <motion.div 
              animate={{ 
                x: [0, 100, 0],
                y: [0, -50, 0],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"
            />
            <motion.div 
              animate={{ 
                x: [0, -80, 0],
                y: [0, 80, 0],
                opacity: [0.2, 0.5, 0.2]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-10 left-10 w-48 h-48 bg-cyan-400/20 rounded-full blur-3xl"
            />

            <div className="relative z-10 p-6 md:p-14">
              <div className="text-center mb-8 md:mb-14">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-5 md:px-8 py-2.5 md:py-3 mb-5 md:mb-8"
                >
                  <motion.div animate={pulseAnimation}>
                    <TrendingDown className="w-5 md:w-6 h-5 md:h-6 text-white" />
                  </motion.div>
                  <span className="text-sm md:text-base font-bold text-white">{result.area}エリア診断結果</span>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <p className="text-white/80 text-sm md:text-lg mb-2">年間削減効果</p>
                  <h2 className="text-5xl md:text-8xl font-black text-white mb-2 tracking-tight">
                    {result.reductionRate}<span className="text-3xl md:text-5xl">%</span>
                  </h2>
                  <p className="text-white/70 text-xs md:text-base">AI-EMSによるJEPXスポット価格最適化</p>
                </motion.div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-12">
                <motion.div 
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="bg-white/10 backdrop-blur-md rounded-2xl md:rounded-3xl p-5 md:p-8 border border-white/20"
                >
                  <div className="flex items-center gap-3 mb-4 md:mb-6">
                    <div className="w-12 md:w-16 h-12 md:h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                      <Calendar className="w-6 md:w-8 h-6 md:h-8 text-white" />
                    </div>
                    <span className="text-sm md:text-base font-bold text-white/80">月間削減額</span>
                  </div>
                  <p className="text-4xl md:text-6xl font-black text-white">
                    ¥{result.avgMonthlySavings.toLocaleString()}
                  </p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="bg-white/10 backdrop-blur-md rounded-2xl md:rounded-3xl p-5 md:p-8 border border-white/20"
                >
                  <div className="flex items-center gap-3 mb-4 md:mb-6">
                    <div className="w-12 md:w-16 h-12 md:h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                      <DollarSign className="w-6 md:w-8 h-6 md:h-8 text-white" />
                    </div>
                    <span className="text-sm md:text-base font-bold text-white/80">年間削減額</span>
                  </div>
                  <p className="text-4xl md:text-6xl font-black text-white">
                    ¥{result.annualSavings.toLocaleString()}
                  </p>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
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
                  >
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full bg-white text-emerald-600 hover:bg-white/90 border-0 h-13 md:h-16 font-black shadow-xl text-sm md:text-base rounded-xl"
                      asChild
                    >
                      <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}>
                        <Icon className="mr-2 w-4 md:w-5 h-4 md:h-5" />
                        {label}
                      </a>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* 推奨台数セクション - 先端的デザイン */}
          <motion.div 
            {...fadeInUp}
            className="relative overflow-hidden bg-slate-900 rounded-3xl md:rounded-[2.5rem] p-6 md:p-12"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent" />
            <div className="absolute inset-0 opacity-[0.02]" style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '60px 60px'
            }} />

            <div className="relative z-10">
              <div className="text-center mb-8 md:mb-12">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-full px-5 md:px-6 py-2.5 mb-5"
                >
                  <Target className="w-4 md:w-5 h-4 md:h-5 text-emerald-400" />
                  <span className="text-xs md:text-sm font-bold text-emerald-400">最適構成診断</span>
                </motion.div>
                
                <h3 className="text-3xl md:text-6xl font-black text-white mb-3 md:mb-4">
                  推奨: <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">{result.recommendedUnits}台</span>構成
                </h3>
                
                <motion.button
                  onClick={() => setShowRecommendationDetail(!showRecommendationDetail)}
                  className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors text-sm"
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
                      className="mt-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700 text-left max-w-2xl mx-auto"
                    >
                      <p className="text-slate-300 text-sm leading-relaxed">
                        {result.recommendedReason}
                      </p>
                      <div className="mt-3 pt-3 border-t border-slate-700 grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-xs text-slate-500">推定日間使用量</p>
                          <p className="text-emerald-400 font-bold">{result.estimatedDailyUsage.toFixed(1)} kWh</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">高価格帯使用量</p>
                          <p className="text-emerald-400 font-bold">{result.highTimeUsage.toFixed(1)} kWh</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">蓄電池容量</p>
                          <p className="text-emerald-400 font-bold">{(BATTERY_SPEC.dailyCapacity * result.recommendedUnits).toFixed(1)} kWh</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="grid md:grid-cols-4 gap-3 md:gap-4">
                {result.multiUnitAnalyses.map((analysis, i) => {
                  const isRecommended = analysis.units === result.recommendedUnits
                  return (
                    <motion.div
                      key={analysis.units}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ y: -8, scale: 1.02 }}
                      className={`relative rounded-2xl md:rounded-3xl p-5 md:p-6 transition-all ${
                        isRecommended
                          ? 'bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-2xl shadow-emerald-500/30'
                          : 'bg-slate-800/50 border border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      {isRecommended && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-3 -right-3 bg-yellow-400 text-yellow-900 rounded-full p-2"
                        >
                          <Award className="w-4 h-4" />
                        </motion.div>
                      )}
                      
                      <div className="text-center mb-4">
                        <div className="flex justify-center gap-1 mb-2">
                          {[...Array(analysis.units)].map((_, j) => (
                            <Battery key={j} className={`w-5 h-5 ${isRecommended ? 'text-white' : 'text-emerald-400'}`} />
                          ))}
                        </div>
                        <p className={`text-3xl md:text-4xl font-black ${isRecommended ? 'text-white' : 'text-white'}`}>
                          {analysis.units}台
                        </p>
                      </div>
                      
                      <div className="space-y-2 text-xs md:text-sm">
                        <div className={`flex justify-between ${isRecommended ? 'text-white/90' : 'text-slate-400'}`}>
                          <span>カバー率</span>
                          <span className={`font-bold ${isRecommended ? 'text-white' : 'text-emerald-400'}`}>
                            {(analysis.coverageRate * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className={`flex justify-between ${isRecommended ? 'text-white/90' : 'text-slate-400'}`}>
                          <span>年間削減</span>
                          <span className={`font-bold ${isRecommended ? 'text-white' : 'text-white'}`}>
                            ¥{(analysis.annualReduction / 10000).toFixed(0)}万
                          </span>
                        </div>
                        <div className={`flex justify-between ${isRecommended ? 'text-white/90' : 'text-slate-400'}`}>
                          <span>回収期間</span>
                          <span className={`font-bold ${isRecommended ? 'text-white' : analysis.paybackStandard <= WARRANTY_YEARS ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {analysis.paybackStandard.toFixed(1)}年
                          </span>
                        </div>
                        <div className={`flex justify-between ${isRecommended ? 'text-white/90' : 'text-slate-400'}`}>
                          <span>{WARRANTY_YEARS}年ROI</span>
                          <span className={`font-bold ${isRecommended ? 'text-white' : 'text-cyan-400'}`}>
                            {analysis.roi15Years.toFixed(0)}%
                          </span>
                        </div>
                        <div className={`pt-2 border-t ${isRecommended ? 'border-white/30' : 'border-slate-700'}`}>
                          <div className={`flex justify-between ${isRecommended ? 'text-white/70' : 'text-slate-500'}`}>
                            <span className="text-xs">実質投資</span>
                            <span className="text-xs font-bold">¥{(analysis.actualInvestment / 10000).toFixed(0)}万</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>

          {/* 月別グラフ */}
          <motion.div 
            {...fadeInUp} 
            className="bg-white rounded-3xl md:rounded-[2.5rem] border border-slate-200 p-6 md:p-12 shadow-xl"
          >
            <div className="mb-6 md:mb-10">
              <h3 className="text-2xl md:text-4xl font-black text-slate-900 mb-2 md:mb-3">
                {result.area}エリアの年間電気代推移
              </h3>
              <p className="text-sm md:text-base text-slate-500">
                JEPXスポット価格の月別変動を反映したシミュレーション
              </p>
            </div>

            <div className="h-64 md:h-96 bg-gradient-to-br from-slate-50 to-white rounded-2xl p-4 md:p-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="colorReduced" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
                    tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      fontSize: '13px',
                      color: '#fff',
                    }}
                    formatter={(value: number) => [`¥${value.toLocaleString()}`, '']}
                    labelStyle={{ fontWeight: 700, marginBottom: 4 }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} iconType="circle" />
                  <Area
                    type="monotone"
                    dataKey="currentCost"
                    name="従来"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    fill="url(#colorCurrent)"
                    dot={{ fill: "#ef4444", strokeWidth: 2, r: 4, stroke: "#fff" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="reducedCost"
                    name="ENELEAGE導入後"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#colorReduced)"
                    dot={{ fill: "#10b981", strokeWidth: 2, r: 4, stroke: "#fff" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* シナリオ選択セクション */}
          <motion.div 
            {...fadeInUp} 
            className="bg-white rounded-3xl md:rounded-[2.5rem] border border-slate-200 p-6 md:p-12 shadow-xl"
          >
            <div className="mb-6 md:mb-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl md:text-4xl font-black text-slate-900">
                  電気代上昇シナリオ分析
                </h3>
              </div>
              <p className="text-sm md:text-base text-slate-500">
                過去データに基づく3つのシナリオで将来を予測
              </p>
            </div>

            {/* シナリオタブ */}
            <div className="mb-8">
              <div className="grid grid-cols-3 gap-2 md:gap-3 p-1.5 bg-slate-100 rounded-2xl">
                {(Object.keys(PRICE_SCENARIOS) as ScenarioKey[]).map((key) => {
                  const scenario = PRICE_SCENARIOS[key]
                  const isSelected = selectedScenario === key
                  
                  return (
                    <motion.button
                      key={key}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedScenario(key)}
                      className={`relative px-3 md:px-6 py-3 md:py-4 rounded-xl font-bold transition-all text-xs md:text-sm ${
                        isSelected
                          ? 'bg-white shadow-lg text-slate-900'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2">
                        <div 
                          className="w-3 h-3 rounded-full shadow-sm" 
                          style={{ backgroundColor: scenario.color }} 
                        />
                        <span className="hidden md:inline">{scenario.name}</span>
                        <span className="md:hidden text-xs">年{scenario.shortName}上昇</span>
                      </div>
                      {isSelected && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-white rounded-xl shadow-lg -z-10"
                        />
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* 長期予測グラフ */}
            <div className="bg-slate-50 rounded-2xl p-4 md:p-8 mb-8">
              <h4 className="font-bold text-slate-700 text-base md:text-xl mb-4 md:mb-6">20年間の電気代推移予測</h4>
              <div className="h-64 md:h-80">
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
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        fontSize: '12px',
                        color: '#fff',
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
            <div className="bg-slate-50 rounded-2xl p-4 md:p-8 mb-8">
              <h4 className="font-bold text-slate-700 text-base md:text-xl mb-2">投資回収シミュレーション</h4>
              <p className="text-xs md:text-sm text-slate-500 mb-4 md:mb-6">
                {getBusinessTypeName()} / {getTaxConditionName()}
              </p>
              <div className="h-64 md:h-80">
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
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        fontSize: '12px',
                        color: '#fff',
                      }}
                      formatter={(value: number) => `¥${value.toLocaleString()}`}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '16px' }}
                      content={() => (
                        <div className="flex flex-wrap justify-center gap-4 pt-4 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-0.5 bg-red-500" style={{ borderTop: '2px dashed #ef4444' }} />
                            <span className="text-slate-600 font-medium">実質投資額</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-1 rounded" style={{ backgroundColor: PRICE_SCENARIOS[selectedScenario].color }} />
                            <span className="text-slate-600 font-medium">累積削減額</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-0.5 border-t-2 border-dashed border-amber-500" />
                            <span className="text-slate-600 font-medium">{WARRANTY_YEARS}年保証</span>
                          </div>
                        </div>
                      )}
                    />
                    
                    <ReferenceLine 
                      x={WARRANTY_YEARS} 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                    
                    <Line
                      type="monotone"
                      dataKey="investment"
                      name="実質投資額"
                      stroke="#ef4444"
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
                className={`${PRICE_SCENARIOS[selectedScenario].bgColor} border-2 ${PRICE_SCENARIOS[selectedScenario].borderColor} rounded-2xl p-5 md:p-8`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div 
                    className="w-5 h-5 rounded-full shadow-lg" 
                    style={{ backgroundColor: PRICE_SCENARIOS[selectedScenario].color }}
                  />
                  <h5 className={`font-black text-lg md:text-2xl ${PRICE_SCENARIOS[selectedScenario].textColor}`}>
                    {PRICE_SCENARIOS[selectedScenario].name}の結果
                  </h5>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                  <div className="bg-white rounded-xl p-5 shadow-sm">
                    <p className="text-xs md:text-sm text-slate-500 mb-2 font-semibold">20年累積削減額</p>
                    <p 
                      className="text-3xl md:text-5xl font-black"
                      style={{ color: PRICE_SCENARIOS[selectedScenario].color }}
                    >
                      ¥{Math.round((getScenarioData(selectedScenario)?.total20 || 0) / 10000)}万
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-xl p-5 shadow-sm">
                    <p className="text-xs md:text-sm text-slate-500 mb-2 font-semibold">投資回収期間</p>
                    <p className="text-3xl md:text-5xl font-black mb-3">
                      {(getScenarioData(selectedScenario)?.payback || 0) < 999 ? (
                        <span className={(getScenarioData(selectedScenario)?.withinWarranty) ? 'text-emerald-600' : 'text-amber-600'}>
                          {getScenarioData(selectedScenario)?.payback}年
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xl">回収困難</span>
                      )}
                    </p>
                    {(getScenarioData(selectedScenario)?.payback || 0) < 999 && (
                      (getScenarioData(selectedScenario)?.withinWarranty) ? (
                        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <span className="text-xs md:text-sm font-bold text-emerald-700">{WARRANTY_YEARS}年保証内で回収完了！</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                          <span className="text-xs md:text-sm font-bold text-amber-700">保証期間を超過</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* 費用内訳 */}
            <div className="mt-8 bg-slate-50 rounded-2xl p-5 md:p-8">
              <h4 className="font-black text-slate-900 text-base md:text-xl mb-5">費用内訳（{result.recommendedUnits}台構成）</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-600 font-medium">製品定価</span>
                  <span className="font-black text-slate-900 text-lg">¥{result.productPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-600 font-medium">工事費</span>
                  <span className="font-black text-slate-900 text-lg">¥{(INSTALLATION_COST_PER_UNIT * result.recommendedUnits * INSTALLATION_DISCOUNTS[result.recommendedUnits]).toLocaleString()}</span>
                </div>
                {businessType !== 'individual' && (
                  <>
                    <div className="flex justify-between items-center py-2 border-t border-slate-200">
                      <span className="text-slate-600 font-medium">税率</span>
                      <span className="font-bold text-slate-700">{result.taxRate}%</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-slate-600 font-medium">節税効果</span>
                      <span className="font-black text-emerald-600 text-lg">-¥{result.taxSavings.toLocaleString()}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center py-4 border-t-2 border-slate-300">
                  <span className="text-slate-900 font-black text-lg">実質投資額</span>
                  <span className="font-black text-emerald-600 text-2xl md:text-3xl">¥{result.actualInvestment.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 電気代上昇のメリット訴求 */}
          <motion.div 
            {...fadeInUp}
            className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 rounded-3xl md:rounded-[2.5rem] p-6 md:p-12"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent" />
            
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row items-start gap-6 md:gap-10">
                <motion.div 
                  animate={pulseAnimation}
                  className="w-16 md:w-24 h-16 md:h-24 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/30 shrink-0"
                >
                  <TrendingUp className="w-8 md:w-12 h-8 md:h-12 text-white" />
                </motion.div>
                
                <div className="flex-1">
                  <h4 className="text-2xl md:text-4xl font-black text-white mb-4 md:mb-6 leading-tight">
                    💡 電気代高騰時代こそ
                    <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent"> ENELEAGE</span>
                  </h4>
                  
                  <p className="text-slate-300 mb-6 md:mb-8 text-sm md:text-lg leading-relaxed">
                    電気代が上昇するほど、削減効果が拡大。導入が早いほど、長期的な経済メリットが大きくなります。
                  </p>
                  
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 md:p-8 border border-white/10">
                    <p className="text-white/80 font-bold mb-4 text-sm md:text-base">【標準シナリオ（年3%上昇）の削減額推移】</p>
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
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * i }}
                          className="bg-white/10 rounded-xl p-4 text-center"
                        >
                          <p className="text-white/60 text-xs mb-1">{item.year}</p>
                          <p className="text-white font-black text-lg md:text-xl">
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
            {...fadeInUp}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-3xl p-6 md:p-10"
          >
            <div className="flex flex-col md:flex-row items-start gap-5 md:gap-8">
              <div className="w-14 md:w-18 h-14 md:h-18 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
                <Shield className="w-7 md:w-9 h-7 md:h-9 text-white" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-xl md:text-2xl mb-3">自治体補助金でさらにお得に</h4>
                <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                  各自治体の蓄電池導入補助金を活用することで、初期投資をさらに削減可能です。
                  補助金額は数十万円〜100万円以上になる場合もあり、投資回収期間の大幅短縮が期待できます。
                </p>
                <p className="text-slate-500 text-xs mt-3">
                  ※ 補助金の詳細はお住まいの自治体にお問い合わせください
                </p>
              </div>
            </div>
          </motion.div>

          {/* 代理店募集 */}
          <motion.div 
            {...fadeInUp} 
            id="agency" 
            className="bg-white rounded-3xl md:rounded-[2.5rem] border border-slate-200 p-6 md:p-14 shadow-xl"
          >
            <div className="text-center mb-10 md:mb-16">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-full px-5 py-2.5 mb-5"
              >
                <Users className="w-4 h-4 text-emerald-600" />
                <span className="text-xs md:text-sm font-bold text-emerald-600">販売代理店募集</span>
              </motion.div>
              
              <h3 className="text-2xl md:text-5xl font-black text-slate-900 mb-4 leading-tight">
                一緒に日本の電気代削減を推進しませんか
              </h3>
              <p className="text-sm md:text-lg text-slate-500 max-w-2xl mx-auto">
                ENELEAGE Zeroの販売代理店を募集しています。充実したサポート体制であなたのビジネスを支援します。
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 md:gap-6 mb-10 md:mb-14">
              {[
                { num: '1', title: '高収益モデル', desc: '魅力的なマージン設定で安定した収益を実現' },
                { num: '2', title: '充実サポート', desc: '営業ツール・研修・技術サポート完備' },
                { num: '3', title: '成長市場', desc: '電力自由化で拡大する蓄電池市場' }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="text-center p-6 md:p-10 bg-slate-50 rounded-2xl md:rounded-3xl border border-slate-200 hover:border-emerald-300 hover:shadow-xl transition-all"
                >
                  <div className="w-14 md:w-20 h-14 md:h-20 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-5 md:mb-8 shadow-xl shadow-emerald-500/25">
                    <span className="text-2xl md:text-4xl font-black text-white">{item.num}</span>
                  </div>
                  <h4 className="font-black text-slate-900 text-lg md:text-xl mb-3">{item.title}</h4>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="text-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500 bg-[length:200%_100%] hover:bg-[position:100%_0] text-white h-14 md:h-18 px-10 md:px-14 text-base md:text-xl font-black rounded-2xl shadow-2xl shadow-emerald-500/25 transition-all duration-500"
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
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}