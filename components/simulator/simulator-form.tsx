"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calculator, TrendingDown, Calendar, DollarSign, Mail, FileText, Users, CheckCircle2, AlertCircle, TrendingUp, Info, Zap, Shield, Sparkles, Battery, ChevronDown, ChevronUp } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend, Tooltip, Line, LineChart, ReferenceLine } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'

const AREA_REDUCTION_CSV_URL = 'https://docs.google.com/spreadsheets/d/1CutW05rwWNn2IDKPa7QK9q5m_A59lu1lwO1hJ-4GCHU/export?format=csv&gid=184100076'
const POWER_PRICE_CSV_URL = 'https://docs.google.com/spreadsheets/d/1tPQZyeBHEE2Fh2nY5MBBMjUIF30YQTYxi3n2o36Ikyo/export?format=csv&gid=0'

// 蓄電池仕様（4台対応）
const BATTERY_SPEC = {
  pricePerUnit: 3500000,
  capacity: 10,
  effectiveCapacity: 7,
  maxUnits: 4,
  depreciationYears: 6,
}

const INSTALLATION_COST = {
  basePerUnit: 200000,
  discounts: { 1: 1.0, 2: 0.9, 3: 0.85, 4: 0.8 }
}

const WARRANTY_YEARS = 15

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
  noChange: { rate: 0, name: '現状維持', shortName: '0%', color: '#9ca3af', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', textColor: 'text-gray-700' },
  standard: { rate: 0.03, name: '標準シナリオ', shortName: '3%', color: '#7CB342', bgColor: 'bg-primary/5', borderColor: 'border-primary', textColor: 'text-primary' },
  worst: { rate: 0.05, name: '悪化シナリオ', shortName: '5%', color: '#f97316', bgColor: 'bg-orange-50', borderColor: 'border-orange-500', textColor: 'text-orange-600' },
}

type ScenarioKey = keyof typeof PRICE_SCENARIOS
type TaxIncentivePattern = 'immediate' | 'tax_credit' | 'depreciation'

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
  totalProductPrice: number
  totalInstallationCost: number
  totalInvestment: number
  taxBenefit: number
  actualInvestment: number
  monthlyReduction: number
  annualReduction: number
  reductionRate: number
  paybackYears: number
  paybackNoChange: number
  paybackStandard: number
  paybackWorst: number
  netProfit15Years: number
  roi15Years: number
  capacityNote: string
  isRecommended: boolean
}

interface TaxPatternComparison {
  pattern: TaxIncentivePattern
  name: string
  description: string
  taxBenefit: number
  actualInvestment: number
  paybackYears: number
  netProfit15Years: number
  notes: string[]
}

interface SimulationResult {
  area: string
  baselineMonthlyCost: number
  reductionRate: number
  avgMonthlySavings: number
  annualSavings: number
  monthlyData: MonthlyData[]
  longTermData: LongTermData[]
  
  // 複数台対応
  recommendedUnits: 1 | 2 | 3 | 4
  recommendedAnalysis: MultiUnitAnalysis
  multiUnitAnalyses: MultiUnitAnalysis[]
  
  // 税制パターン比較
  taxPattern: TaxIncentivePattern
  taxPatternComparisons: TaxPatternComparison[]
  
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
  
  hasCapacityWarning: boolean
  capacityWarningMessage: string
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export function SimulatorForm() {
  const [area, setArea] = useState<string>('')
  const [monthlyCost, setMonthlyCost] = useState<string>('')
  const [businessType, setBusinessType] = useState<'individual' | 'soloProprietor' | 'corporate'>('corporate')
  const [taxCondition, setTaxCondition] = useState<string>('corporateSmall800')
  const [taxPattern, setTaxPattern] = useState<TaxIncentivePattern>('immediate')
  const [taxCreditRate, setTaxCreditRate] = useState<0.07 | 0.10>(0.10)
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedScenario, setSelectedScenario] = useState<ScenarioKey>('standard')
  const [showMultiUnitComparison, setShowMultiUnitComparison] = useState(false)
  const [showTaxComparison, setShowTaxComparison] = useState(false)

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

  const getTaxPatternName = (): string => {
    if (taxPattern === 'immediate') return '即時償却'
    if (taxPattern === 'tax_credit') return '税額控除'
    return '通常減価償却'
  }

  const calculateMultiUnitAnalysis = (
    units: 1 | 2 | 3 | 4,
    monthlyCost: number,
    maxReductionPerUnit: number,
    areaRate: number,
    taxRate: number,
    selectedTaxPattern: TaxIncentivePattern,
    selectedTaxCreditRate: number,
    priceRows: string[][],
    priceColumnIndex: number
  ): MultiUnitAnalysis => {
    const maxReduction = maxReductionPerUnit * units
    const reductionRate = Math.min(maxReduction / monthlyCost, areaRate)

    const productPrice = BATTERY_SPEC.pricePerUnit * units
    const installCost = INSTALLATION_COST.basePerUnit * units * INSTALLATION_COST.discounts[units]
    const totalInvestment = productPrice + installCost

    // 税制優遇計算（修正済み）
    let taxBenefit = 0
    if (businessType !== 'individual') {
      if (selectedTaxPattern === 'immediate') {
        // 即時償却: 全額損金算入（上限なし）
        taxBenefit = productPrice * taxRate
      } else if (selectedTaxPattern === 'tax_credit') {
        // 税額控除: 取得価額×率（上限なし、ただし法人税額の20%まで）
        taxBenefit = productPrice * selectedTaxCreditRate
      } else {
        // 通常減価償却: 6年間の総節税額（現在価値割引）
        const yearlyTaxSavings = (productPrice / BATTERY_SPEC.depreciationYears) * taxRate
        taxBenefit = yearlyTaxSavings * BATTERY_SPEC.depreciationYears * 0.7
      }
    }

    const actualInvestment = totalInvestment - taxBenefit
    const monthlyReduction = monthlyCost * reductionRate
    const annualReduction = monthlyReduction * 12

    // 価格シナリオ別の投資回収期間計算
    const calculatePayback = (scenario: ScenarioKey): number => {
      let cumulative = 0
      let year = 0
      while (cumulative < actualInvestment && year < 30) {
        const multiplier = Math.pow(1 + PRICE_SCENARIOS[scenario].rate, year)
        cumulative += monthlyCost * 12 * multiplier * reductionRate
        year++
      }
      return year
    }

    const paybackNoChange = calculatePayback('noChange')
    const paybackStandard = calculatePayback('standard')
    const paybackWorst = calculatePayback('worst')
    const paybackYears = paybackStandard

    const netProfit15Years = (annualReduction * 15) - actualInvestment
    const roi15Years = (netProfit15Years / actualInvestment) * 100

    let capacityNote = ''
    if (reductionRate >= areaRate * 0.95) {
      capacityNote = '最大削減効果達成'
    } else if (reductionRate >= 0.30) {
      capacityNote = '良好な削減効果'
    } else if (reductionRate >= 0.20) {
      capacityNote = '容量制約あり'
    } else {
      capacityNote = '容量大幅不足'
    }

    return {
      units,
      totalProductPrice: productPrice,
      totalInstallationCost: installCost,
      totalInvestment,
      taxBenefit,
      actualInvestment,
      monthlyReduction,
      annualReduction,
      reductionRate,
      paybackYears,
      paybackNoChange,
      paybackStandard,
      paybackWorst,
      netProfit15Years,
      roi15Years,
      capacityNote,
      isRecommended: false,
    }
  }

  const calculateTaxPatternComparison = (
    recommendedUnits: number,
    monthlyCost: number,
    reductionRate: number,
    taxRate: number
  ): TaxPatternComparison[] => {
    const productPrice = BATTERY_SPEC.pricePerUnit * recommendedUnits
    const installCost = INSTALLATION_COST.basePerUnit * recommendedUnits * INSTALLATION_COST.discounts[recommendedUnits as 1|2|3|4]
    const totalInvestment = productPrice + installCost
    const annualReduction = monthlyCost * reductionRate * 12
    const patterns: TaxPatternComparison[] = []

    // 即時償却
    const immediateTaxBenefit = productPrice * taxRate
    const immediateInvestment = totalInvestment - immediateTaxBenefit
    patterns.push({
      pattern: 'immediate',
      name: '即時償却',
      description: '初年度に全額損金算入',
      taxBenefit: immediateTaxBenefit,
      actualInvestment: immediateInvestment,
      paybackYears: immediateInvestment / annualReduction,
      netProfit15Years: (annualReduction * 15) - immediateInvestment,
      notes: [
        '取得価額の全額を初年度に損金算入',
        '金額上限なし',
        '経営力向上計画の認定が必要',
        '適用期限: 2027年3月31日まで'
      ]
    })

    // 税額控除
    const taxCreditBenefit = productPrice * taxCreditRate
    const taxCreditInvestment = totalInvestment - taxCreditBenefit
    patterns.push({
      pattern: 'tax_credit',
      name: '税額控除',
      description: `取得価額の${taxCreditRate * 100}%を法人税額から控除`,
      taxBenefit: taxCreditBenefit,
      actualInvestment: taxCreditInvestment,
      paybackYears: taxCreditInvestment / annualReduction,
      netProfit15Years: (annualReduction * 15) - taxCreditInvestment,
      notes: [
        '取得価額に上限なし',
        '法人税額の20%が控除上限',
        '超過分は翌事業年度に繰越可能',
        '経営力向上計画の認定が必要'
      ]
    })

    // 通常減価償却
    const depreciationTaxBenefit = (productPrice / BATTERY_SPEC.depreciationYears) * taxRate * BATTERY_SPEC.depreciationYears * 0.7
    const depreciationInvestment = totalInvestment - depreciationTaxBenefit
    patterns.push({
      pattern: 'depreciation',
      name: '通常減価償却',
      description: '6年間で均等償却',
      taxBenefit: depreciationTaxBenefit,
      actualInvestment: depreciationInvestment,
      paybackYears: depreciationInvestment / annualReduction,
      netProfit15Years: (annualReduction * 15) - depreciationInvestment,
      notes: [
        '特別な申請不要',
        '6年間で均等償却',
        '毎年の節税効果は平準化',
        '長期的な税負担軽減'
      ]
    })

    return patterns
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
      const priceColumnIndex = headers.indexOf(selectedAreaData.priceColumn)
      if (priceColumnIndex === -1) {
        throw new Error('価格データの列が見つかりません')
      }

      const monthlyData: MonthlyData[] = []
      for (let i = 1; i <= 12; i++) {
        const row = priceRows[i]
        const month = row[0]
        const currentCost = parseFloat(monthlyCost)
        const reducedCost = currentCost * (1 - selectedAreaData.reductionRate)
        
        monthlyData.push({
          month,
          currentCost,
          reducedCost,
        })
      }

      const avgMonthlySavings = parseFloat(monthlyCost) * selectedAreaData.reductionRate
      const annualSavings = avgMonthlySavings * 12

      const taxRate = getTaxRate()

      // 1台あたりの月間削減可能額
      const maxReductionPerUnit = BATTERY_SPEC.effectiveCapacity * 30 * 20

      // 各台数での分析
      const multiUnitAnalyses: MultiUnitAnalysis[] = []
      for (let units = 1; units <= 4; units++) {
        const analysis = calculateMultiUnitAnalysis(
          units as 1 | 2 | 3 | 4,
          parseFloat(monthlyCost),
          maxReductionPerUnit,
          selectedAreaData.reductionRate,
          taxRate,
          taxPattern,
          taxCreditRate,
          priceRows,
          priceColumnIndex
        )
        multiUnitAnalyses.push(analysis)
      }

      // 推奨台数決定
      const recommendedAnalysis = multiUnitAnalyses.find(a => a.reductionRate >= 0.35) || multiUnitAnalyses[3]
      recommendedAnalysis.isRecommended = true

      // 容量警告
      const hasCapacityWarning = multiUnitAnalyses[3].reductionRate < 0.35
      const capacityWarningMessage = hasCapacityWarning
        ? '4台構成でも削減率が制限されます。より大規模な削減をご希望の場合、複数グループ導入または産業用蓄電池をご検討ください。'
        : ''

      // 税制パターン比較
      const taxPatternComparisons = calculateTaxPatternComparison(
        recommendedAnalysis.units,
        parseFloat(monthlyCost),
        recommendedAnalysis.reductionRate,
        taxRate
      )

      // 長期データ生成
      const longTermData: LongTermData[] = []
      for (let year = 0; year <= 20; year++) {
        const noChangeMultiplier = 1
        const standardMultiplier = Math.pow(1 + PRICE_SCENARIOS.standard.rate, year)
        const worstMultiplier = Math.pow(1 + PRICE_SCENARIOS.worst.rate, year)

        longTermData.push({
          year,
          costNoChange: parseFloat(monthlyCost) * 12 * noChangeMultiplier,
          costStandard: parseFloat(monthlyCost) * 12 * standardMultiplier,
          costWorst: parseFloat(monthlyCost) * 12 * worstMultiplier,
          costReducedNoChange: parseFloat(monthlyCost) * 12 * noChangeMultiplier * (1 - recommendedAnalysis.reductionRate),
          costReducedStandard: parseFloat(monthlyCost) * 12 * standardMultiplier * (1 - recommendedAnalysis.reductionRate),
          costReducedWorst: parseFloat(monthlyCost) * 12 * worstMultiplier * (1 - recommendedAnalysis.reductionRate),
        })
      }

      // 投資回収データ生成
      const paybackData: PaybackData[] = []
      for (let year = 0; year <= 20; year++) {
        let cumulativeNoChange = 0
        let cumulativeStandard = 0
        let cumulativeWorst = 0

        for (let y = 0; y < year; y++) {
          const noChangeSavings = parseFloat(monthlyCost) * 12 * recommendedAnalysis.reductionRate
          const standardSavings = parseFloat(monthlyCost) * 12 * Math.pow(1 + PRICE_SCENARIOS.standard.rate, y) * recommendedAnalysis.reductionRate
          const worstSavings = parseFloat(monthlyCost) * 12 * Math.pow(1 + PRICE_SCENARIOS.worst.rate, y) * recommendedAnalysis.reductionRate

          cumulativeNoChange += noChangeSavings
          cumulativeStandard += standardSavings
          cumulativeWorst += worstSavings
        }

        paybackData.push({
          year,
          investment: recommendedAnalysis.actualInvestment,
          cumulativeSavingsNoChange: cumulativeNoChange,
          cumulativeSavingsStandard: cumulativeStandard,
          cumulativeSavingsWorst: cumulativeWorst,
        })
      }

      const total20YearsNoChange = paybackData[20].cumulativeSavingsNoChange
      const total20YearsStandard = paybackData[20].cumulativeSavingsStandard
      const total20YearsWorst = paybackData[20].cumulativeSavingsWorst

      const simulationResult: SimulationResult = {
        area,
        baselineMonthlyCost: parseFloat(monthlyCost),
        reductionRate: selectedAreaData.reductionRate,
        avgMonthlySavings,
        annualSavings,
        monthlyData,
        longTermData,
        recommendedUnits: recommendedAnalysis.units,
        recommendedAnalysis,
        multiUnitAnalyses,
        taxPattern,
        taxPatternComparisons,
        productPrice: recommendedAnalysis.totalProductPrice,
        taxRate: taxRate * 100,
        taxSavings: recommendedAnalysis.taxBenefit,
        actualInvestment: recommendedAnalysis.actualInvestment,
        paybackNoChange: recommendedAnalysis.paybackNoChange,
        paybackStandard: recommendedAnalysis.paybackStandard,
        paybackWorst: recommendedAnalysis.paybackWorst,
        paybackData,
        total20YearsNoChange,
        total20YearsStandard,
        total20YearsWorst,
        hasCapacityWarning,
        capacityWarningMessage,
      }

      setResult(simulationResult)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'シミュレーションに失敗しました')
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {!result ? (
        <motion.div {...fadeInUp} className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 p-6 md:p-12 border border-gray-100">
          <div className="text-center mb-8 md:mb-14">
            <div className="inline-flex items-center gap-1.5 md:gap-2 bg-gradient-to-r from-primary/10 to-emerald-500/10 rounded-full px-4 md:px-6 py-2 md:py-3 mb-4 md:mb-6">
              <Battery className="w-4 md:w-5 h-4 md:h-5 text-primary" />
              <span className="text-xs md:text-sm font-bold text-primary">太陽光パネル不要</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-3 md:mb-4 leading-tight">
              電気代削減シミュレーター
            </h2>
            <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-medium">
              ENELEAGE Zeroで、あなたの電気代がどれだけ削減できるかシミュレーションしてみましょう
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
            <div>
              <label className="block text-gray-900 font-black text-lg md:text-xl mb-3 md:mb-4">
                設置エリア <span className="text-red-500">*</span>
              </label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-4 md:px-6 py-3 md:py-4 border-2 border-gray-200 rounded-xl md:rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-base md:text-lg font-semibold"
                required
              >
                <option value="">エリアを選択してください</option>
                <option value="北海道">北海道</option>
                <option value="東北">東北</option>
                <option value="関東">関東</option>
                <option value="中部">中部</option>
                <option value="北陸">北陸</option>
                <option value="関西">関西</option>
                <option value="中国">中国</option>
                <option value="四国">四国</option>
                <option value="九州">九州</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-900 font-black text-lg md:text-xl mb-3 md:mb-4">
                月額電気代（円）<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-4 md:left-6 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 md:w-6 h-5 md:h-6" />
                <input
                  type="number"
                  value={monthlyCost}
                  onChange={(e) => setMonthlyCost(e.target.value)}
                  placeholder="例: 200000"
                  className="w-full pl-12 md:pl-16 pr-4 md:pr-6 py-3 md:py-4 border-2 border-gray-200 rounded-xl md:rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-base md:text-lg font-semibold"
                  required
                  min="10000"
                  max="10000000"
                />
              </div>
              <p className="text-xs md:text-sm text-gray-500 mt-2">※10,000円〜10,000,000円の範囲で入力してください</p>
            </div>

            <div className="border-t-2 border-gray-100 pt-6 md:pt-8">
              <label className="block text-gray-900 font-black text-lg md:text-xl mb-3 md:mb-4">
                事業形態 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                {(['individual', 'soloProprietor', 'corporate'] as const).map((type) => (
                  <motion.button
                    key={type}
                    type="button"
                    onClick={() => setBusinessType(type)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 md:p-6 rounded-xl md:rounded-2xl border-2 transition-all ${
                      businessType === type
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Users className="w-6 md:w-8 h-6 md:h-8 mx-auto mb-2" />
                    <div className="font-bold text-base md:text-lg">
                      {type === 'individual' && '個人'}
                      {type === 'soloProprietor' && '個人事業主'}
                      {type === 'corporate' && '法人'}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {businessType === 'soloProprietor' && (
              <div>
                <label className="block text-gray-900 font-black text-lg md:text-xl mb-3 md:mb-4">所得税率</label>
                <select
                  value={taxCondition}
                  onChange={(e) => setTaxCondition(e.target.value)}
                  className="w-full px-4 md:px-6 py-3 md:py-4 border-2 border-gray-200 rounded-xl md:rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-base md:text-lg font-semibold"
                >
                  {Object.keys(TAX_RATES.soloProprietor).map(rate => (
                    <option key={rate} value={rate}>{rate}%</option>
                  ))}
                </select>
              </div>
            )}

            {businessType === 'corporate' && (
              <>
                <div>
                  <label className="block text-gray-900 font-black text-lg md:text-xl mb-3 md:mb-4">法人税条件</label>
                  <select
                    value={taxCondition}
                    onChange={(e) => setTaxCondition(e.target.value)}
                    className="w-full px-4 md:px-6 py-3 md:py-4 border-2 border-gray-200 rounded-xl md:rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-base md:text-lg font-semibold"
                  >
                    <option value="corporateSmall800">中小法人（所得800万以下）15%</option>
                    <option value="corporateSmall800Plus">中小法人（所得800万超）23.2%</option>
                    <option value="corporateLarge">大法人 23.2%</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-900 font-black text-lg md:text-xl mb-3 md:mb-4">税制優遇パターン</label>
                  <div className="space-y-2 md:space-y-3">
                    <motion.button
                      type="button"
                      onClick={() => setTaxPattern('immediate')}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`w-full p-4 md:p-6 rounded-xl md:rounded-2xl border-2 text-left transition-all ${
                        taxPattern === 'immediate'
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-bold text-base md:text-lg text-gray-900">即時償却</div>
                      <div className="text-xs md:text-sm text-gray-600 mt-1">初年度に全額損金算入（上限なし）</div>
                    </motion.button>

                    <motion.button
                      type="button"
                      onClick={() => setTaxPattern('tax_credit')}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`w-full p-4 md:p-6 rounded-xl md:rounded-2xl border-2 text-left transition-all ${
                        taxPattern === 'tax_credit'
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-bold text-base md:text-lg text-gray-900">税額控除</div>
                      <div className="text-xs md:text-sm text-gray-600 mt-1">取得価額の7-10%を法人税額から控除</div>
                    </motion.button>

                    {taxPattern === 'tax_credit' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-4 md:ml-6 space-y-2"
                      >
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={taxCreditRate === 0.10}
                            onChange={() => setTaxCreditRate(0.10)}
                            className="w-4 md:w-5 h-4 md:h-5 text-primary"
                          />
                          <span className="text-sm md:text-base text-gray-700 font-semibold">10%（資本金3,000万円以下）</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={taxCreditRate === 0.07}
                            onChange={() => setTaxCreditRate(0.07)}
                            className="w-4 md:w-5 h-4 md:h-5 text-primary"
                          />
                          <span className="text-sm md:text-base text-gray-700 font-semibold">7%（資本金3,000万円超1億円以下）</span>
                        </label>
                      </motion.div>
                    )}

                    <motion.button
                      type="button"
                      onClick={() => setTaxPattern('depreciation')}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`w-full p-4 md:p-6 rounded-xl md:rounded-2xl border-2 text-left transition-all ${
                        taxPattern === 'depreciation'
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-bold text-base md:text-lg text-gray-900">通常減価償却</div>
                      <div className="text-xs md:text-sm text-gray-600 mt-1">6年間で均等償却</div>
                    </motion.button>
                  </div>
                </div>
              </>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border-2 border-red-200 rounded-xl md:rounded-2xl p-4 md:p-6 flex items-start gap-3 md:gap-4"
              >
                <AlertCircle className="w-5 md:w-6 h-5 md:h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm md:text-base text-red-600 font-semibold">{error}</p>
              </motion.div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 md:h-16 text-base md:text-xl font-black bg-gradient-to-r from-primary via-emerald-600 to-emerald-500 hover:shadow-2xl hover:shadow-primary/40 transition-all"
            >
              {loading ? (
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-5 md:w-6 h-5 md:h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  計算中...
                </div>
              ) : (
                <div className="flex items-center gap-2 md:gap-3">
                  <Calculator className="w-5 md:w-6 h-5 md:h-6" />
                  シミュレーション実行
                </div>
              )}
            </Button>
          </form>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 md:space-y-8">
          {/* ヘッダー - モバイル最適化 */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-4xl font-black text-gray-900 mb-2">シミュレーション結果</h2>
              <p className="text-sm md:text-base text-gray-600">
                {result.area}エリア / {getBusinessTypeName()} / {getTaxConditionName()} / {getTaxPatternName()}
              </p>
            </div>
            <Button
              onClick={() => setResult(null)}
              variant="outline"
              size="lg"
              className="font-bold w-full md:w-auto"
            >
              再計算
            </Button>
          </div>

          {/* 推奨構成カード - モバイル最適化 */}
          <motion.div {...fadeInUp} className="bg-gradient-to-br from-primary/5 via-emerald-500/5 to-blue-500/5 border-2 border-primary rounded-2xl md:rounded-3xl p-6 md:p-12 shadow-xl">
            <div className="flex items-center gap-2 md:gap-3 mb-5 md:mb-6">
              <CheckCircle2 className="w-6 md:w-8 h-6 md:h-8 text-primary" />
              <h3 className="text-xl md:text-3xl font-black text-gray-900">推奨構成</h3>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
              <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg">
                <div className="text-primary text-xs md:text-sm font-bold mb-1 md:mb-2">蓄電池台数</div>
                <div className="text-2xl md:text-4xl font-black text-gray-900">{result.recommendedAnalysis.units}台</div>
                <div className="text-xs md:text-sm text-gray-600 mt-1 md:mt-2">{result.recommendedAnalysis.capacityNote}</div>
              </div>

              <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg">
                <div className="text-primary text-xs md:text-sm font-bold mb-1 md:mb-2">月額削減額</div>
                <div className="text-xl md:text-3xl font-black text-gray-900">
                  ¥{Math.round(result.recommendedAnalysis.monthlyReduction).toLocaleString()}
                </div>
                <div className="text-xs md:text-sm text-gray-600 mt-1 md:mt-2">
                  削減率 {(result.recommendedAnalysis.reductionRate * 100).toFixed(1)}%
                </div>
              </div>

              <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg">
                <div className="text-primary text-xs md:text-sm font-bold mb-1 md:mb-2">実質投資額</div>
                <div className="text-xl md:text-3xl font-black text-gray-900">
                  ¥{Math.round(result.recommendedAnalysis.actualInvestment).toLocaleString()}
                </div>
                <div className="text-xs md:text-sm text-gray-600 mt-1 md:mt-2">税制優遇後</div>
              </div>

              <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg">
                <div className="text-primary text-xs md:text-sm font-bold mb-1 md:mb-2">投資回収期間</div>
                <div className="text-xl md:text-3xl font-black text-gray-900">
                  {result.recommendedAnalysis.paybackYears.toFixed(1)}年
                </div>
                <div className="text-xs md:text-sm text-gray-600 mt-1 md:mt-2">
                  15年ROI: {result.recommendedAnalysis.roi15Years.toFixed(0)}%
                </div>
              </div>
            </div>

            {result.hasCapacityWarning && (
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl md:rounded-2xl p-4 md:p-6 flex items-start gap-3 md:gap-4">
                <AlertCircle className="w-5 md:w-6 h-5 md:h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm md:text-base text-yellow-800 font-semibold">{result.capacityWarningMessage}</p>
              </div>
            )}
          </motion.div>

          {/* シナリオ選択タブ - モバイル最適化 */}
          <motion.div {...fadeInUp} className="bg-white rounded-2xl md:rounded-3xl shadow-xl p-5 md:p-8 border border-gray-100">
            <h3 className="font-black text-gray-900 text-lg md:text-2xl mb-4 md:mb-6">電気代上昇シナリオ選択</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              {(Object.keys(PRICE_SCENARIOS) as ScenarioKey[]).map((scenario) => (
                <motion.button
                  key={scenario}
                  onClick={() => setSelectedScenario(scenario)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 md:p-6 rounded-xl md:rounded-2xl border-2 transition-all ${
                    selectedScenario === scenario
                      ? `${PRICE_SCENARIOS[scenario].borderColor} ${PRICE_SCENARIOS[scenario].bgColor}`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`text-base md:text-lg font-bold mb-2 ${
                    selectedScenario === scenario ? PRICE_SCENARIOS[scenario].textColor : 'text-gray-900'
                  }`}>
                    {PRICE_SCENARIOS[scenario].name}
                  </div>
                  <div className="text-xl md:text-3xl font-black" style={{ 
                    color: selectedScenario === scenario ? PRICE_SCENARIOS[scenario].color : '#6b7280' 
                  }}>
                    年{PRICE_SCENARIOS[scenario].shortName}上昇
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* 投資回収期間カード - モバイル最適化 */}
          <motion.div
            {...fadeInUp}
            className="bg-gradient-to-br from-gray-50 to-white rounded-2xl md:rounded-3xl p-6 md:p-10 shadow-xl border border-gray-100"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-8 mb-6 md:mb-10">
              <div>
                <h3 className="text-2xl md:text-4xl font-black text-gray-900 mb-2 md:mb-3">投資回収期間</h3>
                <p className="text-sm md:text-lg text-gray-600 font-medium">
                  {selectedScenario === 'noChange' && '電気代が現状維持の場合'}
                  {selectedScenario === 'standard' && '電気代が年3%上昇する場合'}
                  {selectedScenario === 'worst' && '電気代が年5%上昇する場合'}
                </p>
              </div>
              <div className="text-center md:text-right">
                <div className="text-4xl md:text-6xl font-black mb-1 md:mb-2" style={{ color: PRICE_SCENARIOS[selectedScenario].color }}>
                  {selectedScenario === 'noChange' && result.paybackNoChange.toFixed(1)}
                  {selectedScenario === 'standard' && result.paybackStandard.toFixed(1)}
                  {selectedScenario === 'worst' && result.paybackWorst.toFixed(1)}
                  <span className="text-2xl md:text-4xl ml-1 md:ml-2">年</span>
                </div>
                <div className="text-xs md:text-sm text-gray-500 font-semibold">で投資額を回収</div>
              </div>
            </div>

            {/* 投資回収グラフ - モバイル最適化 */}
            <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-200">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={result.paybackData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="year" 
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                    label={{ value: '年数', position: 'insideBottom', offset: -5, fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `¥${(value / 1000000).toFixed(0)}M`}
                  />
                  <Tooltip 
                    formatter={(value: number) => `¥${value.toLocaleString()}`}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <ReferenceLine 
                    y={result.actualInvestment} 
                    stroke="#ef4444" 
                    strokeDasharray="3 3" 
                    label={{ value: '投資額', fontSize: 12 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cumulativeSavingsNoChange" 
                    stroke={PRICE_SCENARIOS.noChange.color} 
                    name="現状維持" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cumulativeSavingsStandard" 
                    stroke={PRICE_SCENARIOS.standard.color} 
                    name="標準(3%)" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cumulativeSavingsWorst" 
                    stroke={PRICE_SCENARIOS.worst.color} 
                    name="悪化(5%)" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 20年間削減総額 - モバイル最適化 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mt-6 md:mt-8">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`p-4 md:p-6 rounded-xl md:rounded-2xl border-2 ${
                  selectedScenario === 'noChange' 
                    ? 'border-gray-400 bg-gray-50' 
                    : 'border-gray-200'
                }`}
              >
                <div className="text-xs md:text-sm text-gray-600 font-semibold mb-2">20年間削減総額（現状維持）</div>
                <div className="text-xl md:text-3xl font-black text-gray-900">
                  ¥{(result.total20YearsNoChange).toLocaleString()}
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`p-4 md:p-6 rounded-xl md:rounded-2xl border-2 ${
                  selectedScenario === 'standard' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-200'
                }`}
              >
                <div className="text-xs md:text-sm text-gray-600 font-semibold mb-2">20年間削減総額（標準シナリオ）</div>
                <div className="text-xl md:text-3xl font-black text-primary">
                  ¥{(result.total20YearsStandard).toLocaleString()}
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`p-4 md:p-6 rounded-xl md:rounded-2xl border-2 ${
                  selectedScenario === 'worst' 
                    ? 'border-orange-500 bg-orange-50' 
                    : 'border-gray-200'
                }`}
              >
                <div className="text-xs md:text-sm text-gray-600 font-semibold mb-2">20年間削減総額（悪化シナリオ）</div>
                <div className="text-xl md:text-3xl font-black text-orange-600">
                  ¥{(result.total20YearsWorst).toLocaleString()}
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* 長期シミュレーショングラフ - モバイル最適化 */}
          <motion.div {...fadeInUp} className="bg-white rounded-2xl md:rounded-3xl shadow-xl p-5 md:p-8 border border-gray-100">
            <h4 className="font-black text-gray-900 text-lg md:text-2xl mb-4 md:mb-6">20年間の電気代推移</h4>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={result.longTermData}>
                <defs>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorReduced" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PRICE_SCENARIOS[selectedScenario].color} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={PRICE_SCENARIOS[selectedScenario].color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="year" 
                  stroke="#6b7280"
                  tick={{ fontSize: 12 }}
                  label={{ value: '年数', position: 'insideBottom', offset: -5, fontSize: 12 }}
                />
                <YAxis 
                  stroke="#6b7280"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `¥${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip 
                  formatter={(value: number) => `¥${value.toLocaleString()}`}
                  contentStyle={{ fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey={selectedScenario === 'noChange' ? 'costNoChange' : selectedScenario === 'standard' ? 'costStandard' : 'costWorst'}
                  stroke="#ef4444"
                  fillOpacity={1}
                  fill="url(#colorCurrent)"
                  name="削減前"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey={selectedScenario === 'noChange' ? 'costReducedNoChange' : selectedScenario === 'standard' ? 'costReducedStandard' : 'costReducedWorst'}
                  stroke={PRICE_SCENARIOS[selectedScenario].color}
                  fillOpacity={1}
                  fill="url(#colorReduced)"
                  name="削減後"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* 費用内訳 - モバイル最適化 */}
          <motion.div {...fadeInUp} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl md:rounded-3xl p-5 md:p-8 border border-gray-100">
            <h4 className="font-black text-gray-900 text-base md:text-2xl mb-5 md:mb-8">費用内訳</h4>
            <div className="space-y-3 md:space-y-5">
              <div className="flex justify-between items-center text-sm md:text-lg">
                <span className="text-gray-600 font-semibold">製品定価（{result.recommendedUnits}台）</span>
                <span className="font-black text-gray-900 text-base md:text-xl">¥{result.productPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm md:text-lg">
                <span className="text-gray-600 font-semibold">工事費</span>
                <span className="font-black text-gray-900">¥{Math.round(result.recommendedAnalysis.totalInstallationCost).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm md:text-lg pt-3 md:pt-4 border-t-2 border-gray-200">
                <span className="text-gray-600 font-semibold">総投資額</span>
                <span className="font-black text-gray-900">¥{Math.round(result.recommendedAnalysis.totalInvestment).toLocaleString()}</span>
              </div>
              {businessType !== 'individual' && (
                <>
                  <div className="flex justify-between items-center text-sm md:text-lg">
                    <span className="text-gray-600 font-semibold">{getTaxPatternName()}による節税額</span>
                    <span className="font-black text-primary text-base md:text-xl">-¥{result.taxSavings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-base md:text-xl font-black pt-4 md:pt-5 border-t-4 border-gray-300">
                    <span className="text-gray-900">実質投資額</span>
                    <span className="text-primary text-xl md:text-3xl">¥{result.actualInvestment.toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* 台数別比較 - モバイル最適化 */}
          <motion.div {...fadeInUp} className="bg-white rounded-2xl md:rounded-3xl shadow-xl p-5 md:p-8 border border-gray-100">
            <button
              onClick={() => setShowMultiUnitComparison(!showMultiUnitComparison)}
              className="w-full flex items-center justify-between mb-4 md:mb-6"
            >
              <h4 className="font-black text-gray-900 text-lg md:text-2xl">台数別詳細比較</h4>
              {showMultiUnitComparison ? <ChevronUp className="w-5 md:w-6 h-5 md:h-6" /> : <ChevronDown className="w-5 md:w-6 h-5 md:h-6" />}
            </button>

            <AnimatePresence>
              {showMultiUnitComparison && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-x-auto"
                >
                  <table className="w-full text-xs md:text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left p-2 md:p-4 font-bold text-gray-900">台数</th>
                        <th className="text-right p-2 md:p-4 font-bold text-gray-900">製品価格</th>
                        <th className="text-right p-2 md:p-4 font-bold text-gray-900">実質投資</th>
                        <th className="text-right p-2 md:p-4 font-bold text-gray-900">月額削減</th>
                        <th className="text-right p-2 md:p-4 font-bold text-gray-900">削減率</th>
                        <th className="text-right p-2 md:p-4 font-bold text-gray-900">回収期間</th>
                        <th className="text-right p-2 md:p-4 font-bold text-gray-900">15年利益</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.multiUnitAnalyses.map((analysis) => (
                        <tr
                          key={analysis.units}
                          className={`border-b border-gray-100 ${
                            analysis.isRecommended ? 'bg-primary/5' : ''
                          }`}
                        >
                          <td className="p-2 md:p-4 font-bold">
                            {analysis.units}台
                            {analysis.isRecommended && <span className="ml-1 md:ml-2 text-primary text-xs md:text-sm">★推奨</span>}
                          </td>
                          <td className="text-right p-2 md:p-4">¥{analysis.totalProductPrice.toLocaleString()}</td>
                          <td className="text-right p-2 md:p-4">¥{Math.round(analysis.actualInvestment).toLocaleString()}</td>
                          <td className="text-right p-2 md:p-4 font-bold text-primary">¥{Math.round(analysis.monthlyReduction).toLocaleString()}</td>
                          <td className="text-right p-2 md:p-4">{(analysis.reductionRate * 100).toFixed(1)}%</td>
                          <td className="text-right p-2 md:p-4">{analysis.paybackYears.toFixed(1)}年</td>
                          <td className="text-right p-2 md:p-4 font-bold">¥{Math.round(analysis.netProfit15Years).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* 税制パターン比較 - モバイル最適化 */}
          {businessType !== 'individual' && (
            <motion.div {...fadeInUp} className="bg-white rounded-2xl md:rounded-3xl shadow-xl p-5 md:p-8 border border-gray-100">
              <button
                onClick={() => setShowTaxComparison(!showTaxComparison)}
                className="w-full flex items-center justify-between mb-4 md:mb-6"
              >
                <h4 className="font-black text-gray-900 text-lg md:text-2xl">税制優遇パターン比較</h4>
                {showTaxComparison ? <ChevronUp className="w-5 md:w-6 h-5 md:h-6" /> : <ChevronDown className="w-5 md:w-6 h-5 md:h-6" />}
              </button>

              <AnimatePresence>
                {showTaxComparison && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
                  >
                    {result.taxPatternComparisons.map((pattern) => (
                      <div
                        key={pattern.pattern}
                        className={`p-4 md:p-6 rounded-xl md:rounded-2xl border-2 ${
                          pattern.pattern === result.taxPattern
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200'
                        }`}
                      >
                        <h5 className="text-base md:text-xl font-black text-gray-900 mb-2">{pattern.name}</h5>
                        <p className="text-xs md:text-sm text-gray-600 mb-4">{pattern.description}</p>

                        <div className="space-y-3">
                          <div>
                            <div className="text-xs text-gray-500">税制メリット</div>
                            <div className="text-base md:text-lg font-bold text-primary">¥{Math.round(pattern.taxBenefit).toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">実質投資額</div>
                            <div className="text-base md:text-lg font-bold">¥{Math.round(pattern.actualInvestment).toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">投資回収期間</div>
                            <div className="text-base md:text-lg font-bold">{pattern.paybackYears.toFixed(1)}年</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">15年純利益</div>
                            <div className="text-lg md:text-xl font-black text-primary">¥{Math.round(pattern.netProfit15Years).toLocaleString()}</div>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="text-xs text-gray-600 space-y-1">
                            {pattern.notes.map((note, i) => (
                              <div key={i}>• {note}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* セールスポイント - モバイル最適化 */}
          <motion.div 
            {...fadeInUp}
            className="bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 border-2 border-primary/30 rounded-2xl md:rounded-3xl p-5 md:p-12 overflow-hidden relative shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-48 md:w-96 h-48 md:h-96 bg-primary/5 rounded-full blur-3xl -mr-24 md:-mr-48 -mt-24 md:-mt-48" />
            <div className="absolute bottom-0 left-0 w-40 md:w-80 h-40 md:h-80 bg-emerald-500/5 rounded-full blur-3xl -ml-20 md:-ml-40 -mb-20 md:-mb-40" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-start gap-4 md:gap-8">
              <div className="w-12 md:w-20 h-12 md:h-20 bg-gradient-to-br from-primary via-emerald-600 to-emerald-500 rounded-2xl md:rounded-3xl flex items-center justify-center shrink-0 shadow-2xl shadow-primary/30">
                <TrendingUp className="w-6 md:w-10 h-6 md:h-10 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-black text-gray-900 text-xl md:text-4xl mb-3 md:mb-6 leading-tight">
                  💡 電気代高騰時代こそENELEAGE
                </h4>
                <p className="text-gray-700 mb-5 md:mb-8 text-sm md:text-xl leading-relaxed font-medium">
                  電気代が上昇するほど、ENELEAGE導入の削減効果が大きくなります！
                </p>
                <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-2xl border border-gray-100">
                  <p className="font-black text-gray-900 mb-4 md:mb-6 text-sm md:text-xl">【例】標準シナリオ（年3%上昇）の場合：</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    {[
                      { year: '1年後', amount: result.avgMonthlySavings, increase: null },
                      { year: '5年後', amount: Math.round(result.avgMonthlySavings * 1.46), increase: 46 },
                      { year: '10年後', amount: Math.round(result.avgMonthlySavings * 2.12), increase: 112 },
                      { year: '15年後', amount: Math.round(result.avgMonthlySavings * 2.84), increase: 184 },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ scale: 1.05 }}
                        className={`flex justify-between items-center p-3 md:p-5 rounded-xl md:rounded-2xl ${
                          i === 0 ? 'bg-gray-50' : 'bg-gradient-to-br from-primary/5 to-emerald-500/5 border-2 border-primary/20'
                        }`}
                      >
                        <span className="text-gray-600 text-xs md:text-sm font-bold">{item.year}の削減額:</span>
                        <div className="text-right">
                          <span className={`font-black ${i === 0 ? 'text-gray-900' : 'text-primary'} text-sm md:text-lg`}>
                            ¥{item.amount.toLocaleString()}
                          </span>
                          {item.increase && (
                            <span className="text-xs text-primary font-bold ml-1">
                              (+{item.increase}%)
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-5 md:mt-8 p-4 md:p-6 bg-gradient-to-r from-primary/10 via-emerald-500/10 to-blue-500/10 rounded-xl md:rounded-2xl border-2 border-primary/30">
                    <p className="text-primary font-black text-center text-sm md:text-xl">
                      🚀 導入が早いほど、長期的な削減効果が大きくなります！
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 補助金の備考 - モバイル最適化 */}
          <motion.div 
            {...fadeInUp}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-2xl md:rounded-3xl p-5 md:p-10 shadow-xl"
          >
            <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
              <div className="w-12 md:w-16 h-12 md:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
                <Shield className="w-6 md:w-8 h-6 md:h-8 text-white" />
              </div>
              <div>
                <h4 className="font-black text-gray-900 text-lg md:text-3xl mb-3 md:mb-4">自治体補助金でさらにお得に</h4>
                <p className="text-gray-700 leading-relaxed mb-3 md:mb-5 text-xs md:text-lg font-medium">
                  各自治体が提供する蓄電池導入補助金を活用することで、初期投資をさらに削減できます。
                  補助金額は自治体によって異なりますが、数十万円〜100万円以上の補助が受けられる場合もあり、
                  投資回収期間をさらに短縮することが可能です。
                </p>
                <p className="text-xs text-gray-500 font-semibold">
                  ※ 補助金の詳細はお住まいの自治体にお問い合わせください
                </p>
              </div>
            </div>
          </motion.div>

          {/* 代理店募集 - モバイル最適化 */}
          <motion.div {...fadeInUp} id="agency" className="bg-white border border-gray-100 rounded-2xl md:rounded-3xl p-6 md:p-12 shadow-2xl shadow-gray-200/50">
            <div className="text-center mb-8 md:mb-14">
              <div className="inline-flex items-center gap-1.5 md:gap-2 bg-gradient-to-r from-primary/10 to-emerald-500/10 rounded-full px-4 md:px-6 py-2 md:py-3 mb-4 md:mb-6">
                <Users className="w-4 md:w-5 h-4 md:h-5 text-primary" />
                <span className="text-xs md:text-sm font-bold text-primary">販売代理店募集</span>
              </div>
              <h3 className="text-2xl md:text-5xl font-black text-gray-900 mb-4 md:mb-6 leading-tight">
                一緒に日本の電気代削減を推進しませんか
              </h3>
              <p className="text-sm md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
                ENELEAGE Zeroの販売代理店を募集しています。<br />
                充実したサポート体制で、あなたのビジネスを支援します。
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-14">
              {[
                { num: '1', title: '高収益モデル', desc: '魅力的なマージン設定で安定した収益を実現' },
                { num: '2', title: '充実サポート', desc: '営業ツール提供・研修・技術サポート完備' },
                { num: '3', title: '成長市場', desc: '電力自由化で拡大する蓄電池市場' }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="text-center p-6 md:p-10 bg-gradient-to-br from-gray-50 to-white rounded-2xl md:rounded-3xl border border-gray-200 transition-all shadow-lg hover:shadow-2xl"
                >
                  <div className="w-14 md:w-20 h-14 md:h-20 bg-gradient-to-br from-primary to-emerald-600 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-5 md:mb-8 shadow-xl shadow-primary/30">
                    <span className="text-2xl md:text-4xl font-black text-white">{item.num}</span>
                  </div>
                  <h4 className="font-black text-gray-900 text-base md:text-xl mb-3 md:mb-4">{item.title}</h4>
                  <p className="text-xs md:text-sm text-gray-600 leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="text-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary via-emerald-600 to-emerald-500 text-white hover:shadow-2xl hover:shadow-primary/40 h-14 md:h-18 px-8 md:px-12 text-base md:text-xl font-black w-full md:w-auto"
                asChild
              >
                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLSdVRVxurB8AOO9KT1-Mv5kmM3A_VawLS-gB6mfW2Ia4LO-DuQ/viewform?usp=header"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  代理店応募フォームへ
                </a>
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}