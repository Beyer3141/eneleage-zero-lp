"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calculator, TrendingDown, Calendar, DollarSign, Mail, FileText, Users, CheckCircle2, AlertCircle, TrendingUp, Info, Zap, Shield, Sparkles } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend, Tooltip, Line, LineChart, ReferenceLine } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'

const AREA_REDUCTION_CSV_URL = 'https://docs.google.com/spreadsheets/d/1CutW05rwWNn2IDKPa7QK9q5m_A59lu1lwO1hJ-4GCHU/export?format=csv&gid=184100076'
const POWER_PRICE_CSV_URL = 'https://docs.google.com/spreadsheets/d/1tPQZyeBHEE2Fh2nY5MBBMjUIF30YQTYxi3n2o36Ikyo/export?format=csv&gid=0'

const PRODUCT_PRICE = 3500000
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

interface SimulationResult {
  area: string
  baselineMonthlyCost: number
  reductionRate: number
  avgMonthlySavings: number
  annualSavings: number
  monthlyData: MonthlyData[]
  longTermData: LongTermData[]
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
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedScenario, setSelectedScenario] = useState<ScenarioKey>('standard')

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
        
        const currentMonthCost = baselineCost
        const reducedMonthCost = Math.round(baselineCost * variationRate * (1 - selectedAreaData.reductionRate / 100))
        
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

      const longTermData: LongTermData[] = []
      const maxYears = 25

      for (let year = 0; year <= maxYears; year++) {
        const costNoChange = baselineCost * 12 * Math.pow(1 + PRICE_SCENARIOS.noChange.rate, year)
        const costStandard = baselineCost * 12 * Math.pow(1 + PRICE_SCENARIOS.standard.rate, year)
        const costWorst = baselineCost * 12 * Math.pow(1 + PRICE_SCENARIOS.worst.rate, year)
        
        const costReducedNoChange = totalReducedCost * Math.pow(1 + PRICE_SCENARIOS.noChange.rate, year)
        const costReducedStandard = totalReducedCost * Math.pow(1 + PRICE_SCENARIOS.standard.rate, year)
        const costReducedWorst = totalReducedCost * Math.pow(1 + PRICE_SCENARIOS.worst.rate, year)

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

      const taxRate = getTaxRate()
      const taxSavings = Math.round(PRODUCT_PRICE * taxRate)
      const actualInvestment = PRODUCT_PRICE - taxSavings

      const paybackData: PaybackData[] = []
      let cumulativeNoChange = 0
      let cumulativeStandard = 0
      let cumulativeWorst = 0
      let cumulativeReducedNoChange = 0
      let cumulativeReducedStandard = 0
      let cumulativeReducedWorst = 0

      for (let year = 0; year <= maxYears; year++) {
        const yearCostNoChange = baselineCost * 12 * Math.pow(1 + PRICE_SCENARIOS.noChange.rate, year)
        const yearCostStandard = baselineCost * 12 * Math.pow(1 + PRICE_SCENARIOS.standard.rate, year)
        const yearCostWorst = baselineCost * 12 * Math.pow(1 + PRICE_SCENARIOS.worst.rate, year)
        
        const yearCostReducedNoChange = totalReducedCost * Math.pow(1 + PRICE_SCENARIOS.noChange.rate, year)
        const yearCostReducedStandard = totalReducedCost * Math.pow(1 + PRICE_SCENARIOS.standard.rate, year)
        const yearCostReducedWorst = totalReducedCost * Math.pow(1 + PRICE_SCENARIOS.worst.rate, year)

        cumulativeNoChange += yearCostNoChange
        cumulativeStandard += yearCostStandard
        cumulativeWorst += yearCostWorst
        cumulativeReducedNoChange += yearCostReducedNoChange
        cumulativeReducedStandard += yearCostReducedStandard
        cumulativeReducedWorst += yearCostReducedWorst

        paybackData.push({
          year,
          investment: actualInvestment,
          cumulativeSavingsNoChange: Math.round(cumulativeNoChange - cumulativeReducedNoChange),
          cumulativeSavingsStandard: Math.round(cumulativeStandard - cumulativeReducedStandard),
          cumulativeSavingsWorst: Math.round(cumulativeWorst - cumulativeReducedWorst),
        })
      }

      const findPaybackYear = (cumulativeSavingsKey: 'cumulativeSavingsNoChange' | 'cumulativeSavingsStandard' | 'cumulativeSavingsWorst'): number => {
        for (let i = 0; i < paybackData.length; i++) {
          if (paybackData[i][cumulativeSavingsKey] >= actualInvestment) {
            if (i === 0) return 0
            const prevSavings = paybackData[i - 1][cumulativeSavingsKey]
            const currSavings = paybackData[i][cumulativeSavingsKey]
            const fraction = (actualInvestment - prevSavings) / (currSavings - prevSavings)
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
        avgMonthlySavings,
        annualSavings,
        monthlyData,
        longTermData,
        productPrice: PRODUCT_PRICE,
        taxRate: taxRate * 100,
        taxSavings,
        actualInvestment,
        paybackNoChange,
        paybackStandard,
        paybackWorst,
        paybackData,
        total20YearsNoChange,
        total20YearsStandard,
        total20YearsWorst,
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
    <div className="space-y-6 md:space-y-16">
      {/* 入力フォーム */}
      <motion.div 
        {...fadeInUp}
        className="bg-white border border-gray-100 rounded-2xl md:rounded-3xl p-4 md:p-10 shadow-2xl shadow-gray-200/50 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/5 to-emerald-500/5 rounded-full blur-3xl -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-blue-500/5 to-purple-500/5 rounded-full blur-3xl -ml-40 -mb-40" />
        
        <div className="relative z-10">
          <div className="text-center mb-6 md:mb-10">
            <div className="inline-flex items-center gap-1.5 md:gap-2 bg-gradient-to-r from-primary/10 to-emerald-500/10 rounded-full px-3 md:px-5 py-1.5 md:py-2 mb-2 md:mb-4">
              <Sparkles className="w-3 md:w-4 h-3 md:h-4 text-primary" />
              <span className="text-xs md:text-sm font-bold text-primary">無料診断</span>
            </div>
            <h2 className="text-lg md:text-4xl font-black text-gray-900 mb-2 md:mb-4 leading-tight">
              電気代削減額を診断
            </h2>
            <p className="text-sm md:text-lg text-gray-600">
              エリアと月額電気代を入力
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-8">
            <div className="grid md:grid-cols-2 gap-3 md:gap-6">
              <div>
                <label htmlFor="area" className="block text-xs md:text-sm font-bold text-gray-900 mb-2 md:mb-3">
                  お住まいのエリア
                </label>
                <select
                  id="area"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full px-3 md:px-5 py-2.5 md:py-4 rounded-xl md:rounded-2xl border-2 border-gray-200 bg-white text-gray-900 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm md:text-base font-medium shadow-sm hover:shadow-md"
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
              </div>

              <div>
                <label htmlFor="cost" className="block text-xs md:text-sm font-bold text-gray-900 mb-2 md:mb-3">
                  月額電気代（円）
                </label>
                <div className="relative">
                  <input
                    id="cost"
                    type="number"
                    min="0"
                    step="1"
                    value={monthlyCost}
                    onChange={(e) => setMonthlyCost(e.target.value)}
                    className="w-full px-3 md:px-5 py-2.5 md:py-4 rounded-xl md:rounded-2xl border-2 border-gray-200 bg-white text-gray-900 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm md:text-base font-medium shadow-sm hover:shadow-md"
                    placeholder="例: 15000"
                    required
                  />
                  <span className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm md:text-base">
                    円
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs md:text-sm font-bold text-gray-900 mb-2 md:mb-4">
                事業形態
              </label>
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                {(['individual', 'soloProprietor', 'corporate'] as const).map((type) => (
                  <motion.button
                    key={type}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setBusinessType(type)
                      if (type === 'individual') setTaxCondition('0')
                      else if (type === 'soloProprietor') setTaxCondition('20')
                      else setTaxCondition('corporateSmall800')
                    }}
                    className={`px-2 md:px-4 py-2.5 md:py-4 rounded-xl md:rounded-2xl border-2 font-bold transition-all text-xs md:text-base shadow-sm ${
                      businessType === type
                        ? 'border-primary bg-gradient-to-br from-primary to-emerald-600 text-white shadow-lg shadow-primary/30'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-primary/50 hover:bg-primary/5 hover:shadow-md'
                    }`}
                  >
                    {type === 'individual' ? '個人' : type === 'soloProprietor' ? '個人事業主' : '法人'}
                  </motion.button>
                ))}
              </div>
            </div>

            {businessType === 'individual' && (
              <motion.div {...fadeInUp} className="p-3 md:p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl md:rounded-2xl border border-gray-200">
                <p className="text-xs md:text-sm text-gray-600 flex items-center gap-2">
                  <Info className="w-3 md:w-4 h-3 md:h-4 text-gray-400 shrink-0" />
                  <span>個人の場合、一括損金計上はできないため節税効果はありません。</span>
                </p>
              </motion.div>
            )}

            {businessType === 'soloProprietor' && (
              <motion.div {...fadeInUp}>
                <label className="block text-xs md:text-sm font-bold text-gray-900 mb-2 md:mb-3">
                  所得税率（課税所得に応じて選択）
                </label>
                <select
                  value={taxCondition}
                  onChange={(e) => setTaxCondition(e.target.value)}
                  className="w-full px-3 md:px-5 py-2.5 md:py-4 rounded-xl md:rounded-2xl border-2 border-gray-200 bg-white text-gray-900 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm md:text-base font-medium shadow-sm hover:shadow-md"
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
              <motion.div {...fadeInUp}>
                <label className="block text-xs md:text-sm font-bold text-gray-900 mb-2 md:mb-3">
                  法人規模・所得区分
                </label>
                <select
                  value={taxCondition}
                  onChange={(e) => setTaxCondition(e.target.value)}
                  className="w-full px-3 md:px-5 py-2.5 md:py-4 rounded-xl md:rounded-2xl border-2 border-gray-200 bg-white text-gray-900 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm md:text-base font-medium shadow-sm hover:shadow-md"
                >
                  <option value="corporateSmall800">中小法人（資本金1億円以下・所得800万円以下）税率15%</option>
                  <option value="corporateSmall800Plus">中小法人（資本金1億円以下・所得800万円超）税率23.2%</option>
                </select>
              </motion.div>
            )}

            {error && (
              <motion.div {...fadeInUp} className="p-3 md:p-5 rounded-xl md:rounded-2xl bg-red-50 border-2 border-red-200 text-red-600 text-xs md:text-sm font-medium">
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={loading || !area || !monthlyCost}
              className="w-full h-12 md:h-18 text-base md:text-xl font-black bg-gradient-to-r from-primary via-emerald-600 to-emerald-500 hover:shadow-2xl hover:shadow-primary/40 transition-all disabled:opacity-50 relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center">
                {loading ? (
                  <>
                    <div className="w-4 md:w-6 h-4 md:h-6 border-3 border-white border-t-transparent rounded-full animate-spin mr-2 md:mr-3" />
                    <span className="text-sm md:text-xl">計算中...</span>
                  </>
                ) : (
                  <>
                    <Calculator className="mr-2 md:mr-3 w-4 md:w-6 h-4 md:h-6" />
                    <span className="text-sm md:text-xl">削減額を計算する</span>
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </form>
        </div>
      </motion.div>

      {/* 結果表示 */}
      {result && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-6 md:space-y-16"
        >
          {/* 月別電気代グラフ */}
          <motion.div {...fadeInUp} className="bg-white rounded-2xl md:rounded-3xl border border-gray-100 p-4 md:p-10 shadow-2xl shadow-gray-200/50">
            <div className="mb-6 md:mb-10">
              <h3 className="text-xl md:text-4xl font-black text-gray-900 mb-2 md:mb-4 leading-tight">
                {result.area}エリアの年間電気代推移
              </h3>
              <p className="text-xs md:text-lg text-gray-600">
                スポット電力価格の変動を反映
              </p>
            </div>

            <div className="h-64 md:h-96 bg-gradient-to-br from-gray-50 to-white rounded-xl md:rounded-2xl p-3 md:p-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.monthlyData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="colorReduced" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7CB342" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7CB342" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280", fontSize: 10, fontWeight: 600 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280", fontSize: 10, fontWeight: 600 }}
                    tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                      padding: '8px 12px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [`¥${value.toLocaleString()}`, '']}
                    labelStyle={{ fontWeight: 700, fontSize: '11px' }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '16px', fontSize: '11px' }}
                    iconType="circle"
                  />
                  <Area
                    type="monotone"
                    dataKey="currentCost"
                    name="従来"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fill="url(#colorCurrent)"
                    dot={{ fill: "#ef4444", strokeWidth: 1, r: 3, stroke: "#fff" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="reducedCost"
                    name="削減後"
                    stroke="#7CB342"
                    strokeWidth={2}
                    fill="url(#colorReduced)"
                    dot={{ fill: "#7CB342", strokeWidth: 1, r: 3, stroke: "#fff" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 md:mt-8 text-xs text-gray-500 text-center font-medium">
              ※ JEPXスポット市場価格に基づく月別変動を反映
            </div>
          </motion.div>

          {/* 削減効果サマリー */}
          <motion.div 
            {...fadeInUp}
            className="bg-gradient-to-br from-primary via-emerald-600 to-emerald-500 rounded-2xl md:rounded-3xl p-6 md:p-12 shadow-2xl text-white overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-white/10 rounded-full blur-3xl -mr-32 md:-mr-48 -mt-32 md:-mt-48" />
            <div className="absolute bottom-0 left-0 w-48 md:w-80 h-48 md:h-80 bg-white/10 rounded-full blur-3xl -ml-24 md:-ml-40 -mb-24 md:-mb-40" />
            
            <div className="relative z-10">
              <div className="text-center mb-8 md:mb-12">
                <div className="inline-flex items-center gap-1.5 md:gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 md:px-6 py-2 md:py-3 mb-3 md:mb-6">
                  <TrendingDown className="w-4 md:w-5 h-4 md:h-5" />
                  <span className="text-xs md:text-sm font-bold">年間削減効果</span>
                </div>
                <h2 className="text-3xl md:text-6xl font-black mb-2 md:mb-4">
                  削減率 {result.reductionRate}%
                </h2>
                <p className="text-sm md:text-xl text-white/90 font-medium">
                  AI-EMSによるスポット価格最適化
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-12">
                <motion.div 
                  whileHover={{ scale: 1.03 }}
                  className="bg-white/15 backdrop-blur-sm rounded-2xl md:rounded-3xl p-5 md:p-8 border-2 border-white/30 shadow-xl"
                >
                  <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                    <div className="w-10 md:w-14 h-10 md:h-14 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center">
                      <Calendar className="w-5 md:w-7 h-5 md:h-7" />
                    </div>
                    <span className="text-xs md:text-sm font-bold text-white/90">平均月間削減額</span>
                  </div>
                  <p className="text-3xl md:text-6xl font-black mb-2 md:mb-3">
                    ¥{result.avgMonthlySavings.toLocaleString()}
                  </p>
                  <p className="text-xs text-white/70 font-medium">
                    年間平均の月額削減額
                  </p>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.03 }}
                  className="bg-white/15 backdrop-blur-sm rounded-2xl md:rounded-3xl p-5 md:p-8 border-2 border-white/30 shadow-xl"
                >
                  <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                    <div className="w-10 md:w-14 h-10 md:h-14 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center">
                      <DollarSign className="w-5 md:w-7 h-5 md:h-7" />
                    </div>
                    <span className="text-xs md:text-sm font-bold text-white/90">年間削減額</span>
                  </div>
                  <p className="text-3xl md:text-6xl font-black mb-2 md:mb-3">
                    ¥{result.annualSavings.toLocaleString()}
                  </p>
                  <p className="text-xs text-white/70 font-medium">
                    12ヶ月分の合計削減額
                  </p>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white text-primary hover:bg-white/95 border-0 h-12 md:h-16 font-black shadow-2xl text-sm md:text-base"
                  asChild
                >
                  <a
                    href="https://docs.google.com/forms/d/e/1FAIpQLSdVRVxurB8AOO9KT1-Mv5kmM3A_VawLS-gB6mfW2Ia4LO-DuQ/viewform?usp=header"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Mail className="mr-1.5 md:mr-2 w-4 md:w-5 h-4 md:h-5" />
                    無料相談
                  </a>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white text-primary hover:bg-white/95 border-0 h-12 md:h-16 font-black shadow-2xl text-sm md:text-base"
                  asChild
                >
                  <a
                    href="https://docs.google.com/forms/d/e/1FAIpQLSdVRVxurB8AOO9KT1-Mv5kmM3A_VawLS-gB6mfW2Ia4LO-DuQ/viewform?usp=header"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileText className="mr-1.5 md:mr-2 w-4 md:w-5 h-4 md:h-5" />
                    資料請求
                  </a>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white text-primary hover:bg-white/95 border-0 h-12 md:h-16 font-black shadow-2xl text-sm md:text-base"
                  asChild
                >
                  <a href="#agency">
                    <Users className="mr-1.5 md:mr-2 w-4 md:w-5 h-4 md:h-5" />
                    代理店募集
                  </a>
                </Button>
              </div>
            </div>
          </motion.div>

          {/* シナリオセクション */}
          <motion.div {...fadeInUp} className="bg-white rounded-2xl md:rounded-3xl border border-gray-100 p-4 md:p-10 shadow-2xl shadow-gray-200/50">
            <div className="mb-6 md:mb-10">
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <div className="w-10 md:w-14 h-10 md:h-14 bg-gradient-to-br from-primary to-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
                  <TrendingUp className="w-5 md:w-7 h-5 md:h-7 text-white" />
                </div>
                <h3 className="text-lg md:text-4xl font-black text-gray-900 leading-tight">
                  電気代上昇シナリオ別シミュレーション
                </h3>
              </div>
              <p className="text-xs md:text-lg text-gray-600 font-medium">
                過去データと将来予測に基づく3つのシナリオ
              </p>
            </div>

            {/* シナリオ選択タブ */}
            <div className="mb-6 md:mb-10">
              <p className="text-xs md:text-sm font-bold text-gray-900 mb-3 md:mb-4">シナリオを選択</p>
              <div className="grid grid-cols-3 gap-2 md:gap-3 p-1.5 md:p-2 bg-gray-100 rounded-xl md:rounded-2xl">
                {(Object.keys(PRICE_SCENARIOS) as ScenarioKey[]).map((key) => {
                  const scenario = PRICE_SCENARIOS[key]
                  const isSelected = selectedScenario === key
                  
                  return (
                    <motion.button
                      key={key}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedScenario(key)}
                      className={`px-2 md:px-4 py-2.5 md:py-4 rounded-lg md:rounded-xl font-bold transition-all text-xs md:text-base ${
                        isSelected
                          ? 'bg-white shadow-lg scale-105 ' + scenario.textColor
                          : 'bg-transparent text-gray-600 hover:bg-white/50'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2">
                        <div className="w-2.5 md:w-3 h-2.5 md:h-3 rounded-full" style={{ backgroundColor: scenario.color }} />
                        <span className="hidden md:inline">{scenario.name}</span>
                        <span className="md:hidden">{scenario.shortName}</span>
                        <span className="text-xs opacity-75 md:hidden">上昇</span>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* シナリオ説明カード - モバイル最適化 */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedScenario}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={`${PRICE_SCENARIOS[selectedScenario].bgColor} border-2 ${PRICE_SCENARIOS[selectedScenario].borderColor} rounded-2xl md:rounded-3xl p-4 md:p-8 mb-6 md:mb-10 relative overflow-hidden`}
              >
                <div className="absolute top-0 right-0 w-32 md:w-64 h-32 md:h-64 opacity-10 rounded-full blur-3xl -mr-16 md:-mr-32 -mt-16 md:-mt-32" 
                     style={{ backgroundColor: PRICE_SCENARIOS[selectedScenario].color }} />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                    <div className="w-8 md:w-12 h-8 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg" 
                         style={{ backgroundColor: PRICE_SCENARIOS[selectedScenario].color }}>
                      <TrendingUp className="w-4 md:w-6 h-4 md:h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 text-base md:text-2xl">{PRICE_SCENARIOS[selectedScenario].name}</h4>
                      <p className="text-xs md:text-sm text-gray-600 font-medium">年{PRICE_SCENARIOS[selectedScenario].rate * 100}%上昇を想定</p>
                    </div>
                  </div>

                  {selectedScenario === 'noChange' && (
                    <div className="space-y-3 md:space-y-4">
                      <p className="text-xs md:text-base text-gray-700 leading-relaxed font-medium">
                        最も保守的な予測。電気料金が今後横ばいで推移すると仮定したケース。
                      </p>
                      <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-5 border border-gray-200">
                        <div className="flex items-start gap-2">
                          <Info className="w-4 md:w-5 h-4 md:h-5 text-gray-400 mt-0.5 shrink-0" />
                          <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                            過去10年のデータでは電気代は上昇傾向にあるため、この想定は楽観的である可能性があります。
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedScenario === 'standard' && (
                    <div className="space-y-3 md:space-y-4">
                      <p className="text-xs md:text-base text-gray-700 leading-relaxed font-medium">
                        過去10年間（2014-2024年）の実績データに基づく最も現実的な予測。
                      </p>
                      <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-5 border border-primary/30">
                        <p className="text-xs md:text-sm font-bold text-gray-900 mb-2 md:mb-3">主な上昇要因：</p>
                        <ul className="text-xs md:text-sm text-gray-700 space-y-1.5 md:space-y-2">
                          <li className="flex items-start gap-2">
                            <span className="text-primary font-bold mt-0.5">•</span>
                            <span>再エネ賦課金の段階的増加</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary font-bold mt-0.5">•</span>
                            <span>発電所の維持・更新コスト</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary font-bold mt-0.5">•</span>
                            <span>送配電網の強靭化投資</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {selectedScenario === 'worst' && (
                    <div className="space-y-3 md:space-y-4">
                      <p className="text-xs md:text-base text-gray-700 leading-relaxed font-medium">
                        地政学リスクやエネルギー安全保障の観点から、電気料金が急速に上昇するシナリオ。
                      </p>
                      <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-5 border border-orange-300">
                        <p className="text-xs md:text-sm font-bold text-gray-900 mb-2 md:mb-3">想定される悪化要因：</p>
                        <ul className="text-xs md:text-sm text-gray-700 space-y-1.5 md:space-y-2">
                          <li className="flex items-start gap-2">
                            <span className="text-orange-500 font-bold mt-0.5">•</span>
                            <span>円安の長期化（1ドル=150円超）</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-orange-500 font-bold mt-0.5">•</span>
                            <span>LNG・石炭の輸入コスト増</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-orange-500 font-bold mt-0.5">•</span>
                            <span>原発再稼働遅延</span>
                          </li>
                        </ul>
                        <p className="text-xs md:text-sm text-orange-600 font-bold mt-3 md:mt-4 p-2 md:p-3 bg-orange-50 rounded-xl">
                          ※ 2022年は前年比+15%を記録
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* 長期予測グラフ - モバイル最適化 */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl md:rounded-3xl p-4 md:p-8 mb-6 md:mb-10 border border-gray-100">
              <h4 className="font-black text-gray-900 text-base md:text-2xl mb-4 md:mb-6">長期電気代推移予測（20年間）</h4>
              <div className="h-64 md:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={result.longTermData.slice(0, 21)} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="year"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6b7280", fontSize: 10, fontWeight: 600 }}
                      label={{ value: '経過年数', position: 'insideBottom', offset: -5, fill: '#6b7280', fontWeight: 700, fontSize: 11 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6b7280", fontSize: 10, fontWeight: 600 }}
                      tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                        padding: '8px 12px',
                        fontSize: '11px',
                      }}
                      formatter={(value: number) => `¥${value.toLocaleString()}`}
                      labelStyle={{ fontWeight: 700, fontSize: '10px' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '10px' }} />
                    
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
                      stroke="#3b82f6"
                      strokeWidth={4}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 md:mt-8 text-xs text-gray-500 text-center font-medium">
                ※ ENELEAGE導入後も電気代は上昇しますが、削減率{result.reductionRate}%は維持
              </div>
            </div>

            {/* 投資回収グラフ - モバイル最適化 */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl md:rounded-3xl p-4 md:p-8 mb-6 md:mb-10 border border-gray-100">
              <h4 className="font-black text-gray-900 text-base md:text-2xl mb-2">投資回収期間グラフ</h4>
              <p className="text-xs md:text-sm text-gray-600 mb-4 md:mb-6 font-medium">
                {getBusinessTypeName()}（{getTaxConditionName()}）の場合
              </p>
              <div className="h-64 md:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={result.paybackData} margin={{ top: 20, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="year"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6b7280", fontSize: 10, fontWeight: 600 }}
                      label={{ value: '経過年数', position: 'insideBottom', offset: -5, fill: '#6b7280', fontWeight: 700, fontSize: 11 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6b7280", fontSize: 10, fontWeight: 600 }}
                      tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                        padding: '8px 12px',
                        fontSize: '11px',
                      }}
                      formatter={(value: number) => `¥${value.toLocaleString()}`}
                      labelStyle={{ fontWeight: 700, fontSize: '10px' }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '16px' }}
                      content={(props) => {
                        const { payload } = props
                        return (
                          <div className="flex flex-wrap justify-center gap-3 md:gap-6 pt-4">
                            {payload?.map((entry, index) => (
                              <div key={index} className="flex items-center gap-1.5 md:gap-2">
                                <div 
                                  className="w-3 md:w-4 h-3 md:h-4 rounded-full" 
                                  style={{ 
                                    backgroundColor: entry.color,
                                    ...(entry.value === '実質投資額' ? { 
                                      border: `2px solid ${entry.color}`, 
                                      backgroundColor: 'transparent' 
                                    } : {})
                                  }}
                                />
                                <span className="text-xs md:text-sm text-gray-700 font-semibold">{entry.value}</span>
                              </div>
                            ))}
                            <div className="flex items-center gap-1.5 md:gap-2">
                              <div className="w-6 md:w-8 h-0.5 border-t-2 border-dashed border-orange-500" />
                              <span className="text-xs md:text-sm text-gray-700 font-semibold">15年保証</span>
                            </div>
                          </div>
                        )
                      }}
                    />
                    
                    <ReferenceLine 
                      x={WARRANTY_YEARS} 
                      stroke="#f97316" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                    
                    <Line
                      type="monotone"
                      dataKey="investment"
                      name="実質投資額"
                      stroke="#ef4444"
                      strokeWidth={3}
                      dot={false}
                      strokeDasharray="10 5"
                    />
                    
                    <Line
                      type="monotone"
                      dataKey={`cumulativeSavings${selectedScenario === 'noChange' ? 'NoChange' : selectedScenario === 'standard' ? 'Standard' : 'Worst'}`}
                      name="累積削減額"
                      stroke={PRICE_SCENARIOS[selectedScenario].color}
                      strokeWidth={4}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-4 md:mt-8 text-xs text-gray-500 text-center font-medium">
                ※ 累積削減額が実質投資額を超えた時点で投資回収完了
              </div>
            </div>

            {/* シナリオ別結果カード - モバイル最適化 */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedScenario}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className={`${PRICE_SCENARIOS[selectedScenario].bgColor} border-2 ${PRICE_SCENARIOS[selectedScenario].borderColor} rounded-2xl md:rounded-3xl p-4 md:p-8 relative overflow-hidden`}
              >
                <div className="absolute top-0 right-0 w-48 md:w-96 h-48 md:h-96 opacity-10 rounded-full blur-3xl -mr-24 md:-mr-48 -mt-24 md:-mt-48" 
                     style={{ backgroundColor: PRICE_SCENARIOS[selectedScenario].color }} />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 md:gap-3 mb-6 md:mb-8">
                    <div className="w-4 md:w-5 h-4 md:h-5 rounded-full shadow-lg" style={{ backgroundColor: PRICE_SCENARIOS[selectedScenario].color }} />
                    <h5 className="font-black text-gray-900 text-base md:text-2xl">
                      {PRICE_SCENARIOS[selectedScenario].name}の結果
                    </h5>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 md:gap-8">
                    <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg">
                      <p className="text-xs md:text-sm text-gray-500 mb-2 md:mb-3 font-semibold">20年累積削減額</p>
                      <p className="text-3xl md:text-5xl font-black mb-2" style={{ color: PRICE_SCENARIOS[selectedScenario].color }}>
                        ¥{Math.round((getScenarioData(selectedScenario)?.total20 || 0) / 10000)}万円
                      </p>
                    </div>
                    
                    <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg">
                      <p className="text-xs md:text-sm text-gray-500 mb-2 md:mb-3 font-semibold">投資回収期間</p>
                      <p className="text-3xl md:text-5xl font-black mb-3 md:mb-4">
                        {(getScenarioData(selectedScenario)?.payback || 0) < 999 ? (
                          <span className={(getScenarioData(selectedScenario)?.withinWarranty) ? 'text-emerald-600' : 'text-orange-600'}>
                            {getScenarioData(selectedScenario)?.payback}年
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xl md:text-2xl">回収困難</span>
                        )}
                      </p>
                      {(getScenarioData(selectedScenario)?.payback || 0) < 999 && (
                        (getScenarioData(selectedScenario)?.withinWarranty) ? (
                          <div className="flex items-center gap-2 p-3 md:p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl md:rounded-2xl">
                            <CheckCircle2 className="w-5 md:w-6 h-5 md:h-6 text-emerald-600 shrink-0" />
                            <span className="text-xs md:text-sm font-bold text-emerald-700">15年保証内で回収完了！</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-3 md:p-4 bg-orange-50 border-2 border-orange-200 rounded-xl md:rounded-2xl">
                            <AlertCircle className="w-5 md:w-6 h-5 md:h-6 text-orange-600 shrink-0" />
                            <span className="text-xs md:text-sm font-bold text-orange-700">保証期間を超過</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* 費用内訳 - モバイル最適化 */}
            <div className="mt-6 md:mt-10 bg-gradient-to-br from-gray-50 to-white rounded-2xl md:rounded-3xl p-5 md:p-8 border border-gray-100">
              <h4 className="font-black text-gray-900 text-base md:text-2xl mb-5 md:mb-8">費用内訳</h4>
              <div className="space-y-3 md:space-y-5">
                <div className="flex justify-between items-center text-sm md:text-lg">
                  <span className="text-gray-600 font-semibold">製品定価</span>
                  <span className="font-black text-gray-900 text-base md:text-xl">¥{result.productPrice.toLocaleString()}</span>
                </div>
                {businessType !== 'individual' && (
                  <>
                    <div className="flex justify-between items-center text-sm md:text-lg">
                      <span className="text-gray-600 font-semibold">税率</span>
                      <span className="font-black text-gray-900">{result.taxRate}%</span>
                    </div>
                    <div className="flex justify-between items-center text-sm md:text-lg pt-3 md:pt-4 border-t-2 border-gray-200">
                      <span className="text-gray-600 font-semibold">一括損金による節税額</span>
                      <span className="font-black text-primary text-base md:text-xl">-¥{result.taxSavings.toLocaleString()}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center text-base md:text-xl font-black pt-4 md:pt-5 border-t-4 border-gray-300">
                  <span className="text-gray-900">実質投資額</span>
                  <span className="text-primary text-xl md:text-3xl">¥{result.actualInvestment.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </motion.div>

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
                className="bg-gradient-to-r from-primary via-emerald-600 to-emerald-500 text-white hover:shadow-2xl hover:shadow-primary/40 h-14 md:h-18 px-8 md:px-12 text-base md:text-xl font-black"
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