"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calculator, TrendingDown, Calendar, DollarSign, Mail, FileText, Users, CheckCircle2, AlertCircle, TrendingUp, Info, Zap, Shield, Timer } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend, Tooltip, Line, LineChart, ReferenceLine } from 'recharts'
import { motion } from 'framer-motion'

const AREA_REDUCTION_CSV_URL = 'https://docs.google.com/spreadsheets/d/1CutW05rwWNn2IDKPa7QK9q5m_A59lu1lwO1hJ-4GCHU/export?format=csv&gid=184100076'
const POWER_PRICE_CSV_URL = 'https://docs.google.com/spreadsheets/d/1tPQZyeBHEE2Fh2nY5MBBMjUIF30YQTYxi3n2o36Ikyo/export?format=csv&gid=0'

const PRODUCT_PRICE = 3500000
const WARRANTY_YEARS = 15

// 税率設定
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

// 電気代上昇シナリオ
const PRICE_SCENARIOS = {
  noChange: { rate: 0, name: '現状維持', color: '#9ca3af', description: '電気代据え置き' },
  standard: { rate: 0.03, name: '標準シナリオ', color: '#7CB342', description: '年3%上昇' },
  worst: { rate: 0.05, name: '悪化シナリオ', color: '#f97316', description: '年5%上昇' },
}

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

      // 長期予測データ（25年間）- 修正版
      const longTermData: LongTermData[] = []
      const maxYears = 25

      for (let year = 0; year <= maxYears; year++) {
        // 削減前（3シナリオ）
        const costNoChange = baselineCost * 12 * Math.pow(1 + PRICE_SCENARIOS.noChange.rate, year)
        const costStandard = baselineCost * 12 * Math.pow(1 + PRICE_SCENARIOS.standard.rate, year)
        const costWorst = baselineCost * 12 * Math.pow(1 + PRICE_SCENARIOS.worst.rate, year)
        
        // 削減後（3シナリオ） - 修正: 削減率は同じだが、ベースが上がるので絶対額は上がる
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

      // 投資回収計算（3シナリオ）- 修正版
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
        // 各年の電気代（修正版）
        const yearCostNoChange = baselineCost * 12 * Math.pow(1 + PRICE_SCENARIOS.noChange.rate, year)
        const yearCostStandard = baselineCost * 12 * Math.pow(1 + PRICE_SCENARIOS.standard.rate, year)
        const yearCostWorst = baselineCost * 12 * Math.pow(1 + PRICE_SCENARIOS.worst.rate, year)
        
        const yearCostReducedNoChange = totalReducedCost * Math.pow(1 + PRICE_SCENARIOS.noChange.rate, year)
        const yearCostReducedStandard = totalReducedCost * Math.pow(1 + PRICE_SCENARIOS.standard.rate, year)
        const yearCostReducedWorst = totalReducedCost * Math.pow(1 + PRICE_SCENARIOS.worst.rate, year)

        // 累積
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

      // 投資回収期間を計算
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

  return (
    <div className="space-y-12 md:space-y-16">
      {/* 入力フォーム */}
      <motion.div 
        {...fadeInUp}
        className="bg-white border border-gray-100 rounded-3xl p-6 md:p-10 shadow-lg shadow-gray-100/50"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            あなたの電気代削減額を診断
          </h2>
          <p className="text-gray-600">
            お住まいのエリアと月額電気代を入力してください
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="area" className="block text-sm font-semibold text-gray-900 mb-3">
                お住まいのエリア
              </label>
              <select
                id="area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-base"
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
              <label htmlFor="cost" className="block text-sm font-semibold text-gray-900 mb-3">
                現在の月額電気代（円）
              </label>
              <div className="relative">
                <input
                  id="cost"
                  type="number"
                  min="0"
                  step="1"
                  value={monthlyCost}
                  onChange={(e) => setMonthlyCost(e.target.value)}
                  className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-base"
                  placeholder="例: 15000"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  円
                </span>
              </div>
            </div>
          </div>

          {/* 事業形態選択 */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              事業形態
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['individual', 'soloProprietor', 'corporate'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setBusinessType(type)
                    if (type === 'individual') setTaxCondition('0')
                    else if (type === 'soloProprietor') setTaxCondition('20')
                    else setTaxCondition('corporateSmall800')
                  }}
                  className={`px-4 py-4 rounded-xl border-2 font-semibold transition-all text-sm md:text-base ${
                    businessType === type
                      ? 'border-primary bg-primary text-white shadow-lg shadow-primary/25'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-primary/50 hover:bg-primary/5'
                  }`}
                >
                  {type === 'individual' ? '個人' : type === 'soloProprietor' ? '個人事業主' : '法人'}
                </button>
              ))}
            </div>
          </div>

          {/* 条件選択 */}
          {businessType === 'individual' && (
            <motion.div {...fadeInUp} className="p-5 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-400" />
                個人の場合、一括損金計上はできないため節税効果はありません。
              </p>
            </motion.div>
          )}

          {businessType === 'soloProprietor' && (
            <motion.div {...fadeInUp}>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                所得税率（課税所得に応じて選択）
              </label>
              <select
                value={taxCondition}
                onChange={(e) => setTaxCondition(e.target.value)}
                className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-base"
              >
                <option value="5">5% （課税所得195万円以下）</option>
                <option value="10">10% （課税所得195万円超〜330万円以下）</option>
                <option value="20">20% （課税所得330万円超〜695万円以下）</option>
                <option value="23">23% （課税所得695万円超〜900万円以下）</option>
                <option value="33">33% （課税所得900万円超〜1,800万円以下）</option>
                <option value="40">40% （課税所得1,800万円超〜4,000万円以下）</option>
                <option value="45">45% （課税所得4,000万円超）</option>
              </select>
            </motion.div>
          )}

          {businessType === 'corporate' && (
            <motion.div {...fadeInUp}>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                法人規模・所得区分
              </label>
              <select
                value={taxCondition}
                onChange={(e) => setTaxCondition(e.target.value)}
                className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-base"
              >
                <option value="corporateSmall800">中小法人（資本金1億円以下・所得800万円以下）税率15%</option>
                <option value="corporateSmall800Plus">中小法人（資本金1億円以下・所得800万円超）税率23.2%</option>
              </select>
            </motion.div>
          )}

          {error && (
            <motion.div {...fadeInUp} className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </motion.div>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={loading || !area || !monthlyCost}
            className="w-full h-14 md:h-16 text-base md:text-lg font-bold bg-gradient-to-r from-primary via-primary to-emerald-600 hover:shadow-xl hover:shadow-primary/30 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                計算中...
              </>
            ) : (
              <>
                <Calculator className="mr-2 w-5 h-5" />
                削減額を計算する
              </>
            )}
          </Button>
        </form>
      </motion.div>

      {/* 結果表示 */}
      {result && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-12 md:space-y-16"
        >
          {/* 月別電気代グラフ */}
          <motion.div {...fadeInUp} className="bg-white rounded-3xl border border-gray-100 p-6 md:p-10 shadow-lg shadow-gray-100/50">
            <div className="mb-8">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                {result.area}エリアの年間電気代推移
              </h3>
              <p className="text-gray-600">
                スポット電力価格の変動を反映した削減効果
              </p>
            </div>

            <div className="h-80 md:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="colorReduced" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7CB342" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#7CB342" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                      padding: '12px 16px',
                    }}
                    formatter={(value: number) => [`¥${value.toLocaleString()}`, '']}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '24px' }}
                    iconType="circle"
                  />
                  <Area
                    type="monotone"
                    dataKey="currentCost"
                    name="従来（固定）"
                    stroke="#ef4444"
                    strokeWidth={3}
                    fill="url(#colorCurrent)"
                    dot={{ fill: "#ef4444", strokeWidth: 2, r: 4, stroke: "#fff" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="reducedCost"
                    name="削減後（変動反映）"
                    stroke="#7CB342"
                    strokeWidth={3}
                    fill="url(#colorReduced)"
                    dot={{ fill: "#7CB342", strokeWidth: 2, r: 4, stroke: "#fff" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-8 text-xs text-gray-500 text-center">
              ※ 2025年度データ参照（JEPXスポット市場価格に基づく月別変動を反映）
            </div>
          </motion.div>

          {/* 削減効果サマリー */}
          <motion.div 
            {...fadeInUp}
            className="bg-gradient-to-br from-primary via-primary to-emerald-600 rounded-3xl p-8 md:p-12 shadow-2xl text-white overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
            
            <div className="relative z-10">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-5 py-2 mb-6">
                  <TrendingDown className="w-5 h-5" />
                  <span className="text-sm font-semibold">年間削減効果</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black mb-3">
                  削減率 {result.reductionRate}%
                </h2>
                <p className="text-white/90 text-lg">
                  AI-EMSによるスポット価格最適化
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-10">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/20"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium text-white/90">平均月間削減額</span>
                  </div>
                  <p className="text-4xl md:text-5xl font-black mb-2">
                    ¥{result.avgMonthlySavings.toLocaleString()}
                  </p>
                  <p className="text-xs text-white/70">
                    年間平均の月額削減額
                  </p>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/20"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium text-white/90">年間削減額</span>
                  </div>
                  <p className="text-4xl md:text-5xl font-black mb-2">
                    ¥{result.annualSavings.toLocaleString()}
                  </p>
                  <p className="text-xs text-white/70">
                    12ヶ月分の合計削減額
                  </p>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white text-primary hover:bg-white/90 border-0 h-14 font-bold shadow-lg"
                  asChild
                >
                  <a
                    href="https://docs.google.com/forms/d/e/1FAIpQLSdVRVxurB8AOO9KT1-Mv5kmM3A_VawLS-gB6mfW2Ia4LO-DuQ/viewform?usp=header"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Mail className="mr-2 w-5 h-5" />
                    無料相談
                  </a>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white text-primary hover:bg-white/90 border-0 h-14 font-bold shadow-lg"
                  asChild
                >
                  <a
                    href="https://docs.google.com/forms/d/e/1FAIpQLSdVRVxurB8AOO9KT1-Mv5kmM3A_VawLS-gB6mfW2Ia4LO-DuQ/viewform?usp=header"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileText className="mr-2 w-5 h-5" />
                    資料請求
                  </a>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white text-primary hover:bg-white/90 border-0 h-14 font-bold shadow-lg"
                  asChild
                >
                  <a href="#agency">
                    <Users className="mr-2 w-5 h-5" />
                    代理店募集
                  </a>
                </Button>
              </div>
            </div>
          </motion.div>

          {/* 電気代上昇シナリオセクション */}
          <motion.div {...fadeInUp} className="bg-white rounded-3xl border border-gray-100 p-6 md:p-10 shadow-lg shadow-gray-100/50">
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                  電気代上昇シナリオ別シミュレーション
                </h3>
              </div>
              <p className="text-gray-600 text-lg">
                過去データと将来予測に基づく3つのシナリオで投資回収期間を算出
              </p>
            </div>

            {/* シナリオ説明カード */}
            <motion.div 
              variants={staggerChildren}
              initial="initial"
              animate="animate"
              className="grid md:grid-cols-3 gap-6 mb-12"
            >
              {/* 現状維持 */}
              <motion.div 
                variants={fadeInUp}
                whileHover={{ y: -4 }}
                className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-6 transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: PRICE_SCENARIOS.noChange.color }} />
                  <h4 className="font-bold text-gray-900 text-lg">現状維持（0%）</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  最も保守的な予測。電気料金が今後横ばいで推移すると仮定したケース。
                </p>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-gray-500 leading-relaxed">
                      過去10年のデータでは電気代は上昇傾向にあるため、この想定は楽観的である可能性があります。
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* 標準シナリオ */}
              <motion.div 
                variants={fadeInUp}
                whileHover={{ y: -4 }}
                className="bg-primary/5 border-2 border-primary rounded-2xl p-6 transition-all relative overflow-hidden"
              >
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                    <Zap className="w-3 h-3" />
                    推奨
                  </span>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: PRICE_SCENARIOS.standard.color }} />
                  <h4 className="font-bold text-gray-900 text-lg">標準シナリオ（3%）</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  過去10年間（2014-2024年）の実績データに基づく現実的な予測。
                </p>
                <div className="bg-white rounded-xl p-4 border border-primary/20">
                  <p className="text-xs font-semibold text-gray-900 mb-2">主な上昇要因：</p>
                  <ul className="text-xs text-gray-600 space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>再エネ賦課金の段階的増加</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>発電所の維持・更新コスト</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>送配電網の強靭化投資</span>
                    </li>
                  </ul>
                </div>
              </motion.div>

              {/* 悪化シナリオ */}
              <motion.div 
                variants={fadeInUp}
                whileHover={{ y: -4 }}
                className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6 transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: PRICE_SCENARIOS.worst.color }} />
                  <h4 className="font-bold text-gray-900 text-lg">悪化シナリオ（5%）</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  円安・エネルギー危機の長期化を想定した悲観的ケース。
                </p>
                <div className="bg-white rounded-xl p-4 border border-orange-200">
                  <p className="text-xs font-semibold text-gray-900 mb-2">想定される要因：</p>
                  <ul className="text-xs text-gray-600 space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-0.5">•</span>
                      <span>円安の長期化（1ドル=150円超）</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-0.5">•</span>
                      <span>化石燃料価格の高騰継続</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-0.5">•</span>
                      <span>原発再稼働遅延</span>
                    </li>
                  </ul>
                  <p className="text-xs text-orange-600 font-semibold mt-3">
                    ※2022年は前年比+15%を記録
                  </p>
                </div>
              </motion.div>
            </motion.div>

            {/* 長期予測グラフ */}
            <div className="bg-gray-50 rounded-2xl p-6 md:p-8 mb-12">
              <h4 className="font-bold text-gray-900 text-xl mb-6">長期電気代推移予測（20年間）</h4>
              <div className="h-80 md:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={result.longTermData.slice(0, 21)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="year"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                      label={{ value: '経過年数', position: 'insideBottom', offset: -5, fill: '#6b7280' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                      tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                        padding: '12px 16px',
                      }}
                      formatter={(value: number) => `¥${value.toLocaleString()}`}
                    />
                    <Legend wrapperStyle={{ paddingTop: '24px' }} />
                    
                    <Line
                      type="monotone"
                      dataKey="costNoChange"
                      name="削減前(0%)"
                      stroke={PRICE_SCENARIOS.noChange.color}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="costStandard"
                      name="削減前(3%)"
                      stroke={PRICE_SCENARIOS.standard.color}
                      strokeWidth={3}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="costWorst"
                      name="削減前(5%)"
                      stroke={PRICE_SCENARIOS.worst.color}
                      strokeWidth={3}
                      dot={false}
                    />
                    
                    <Line
                      type="monotone"
                      dataKey="costReducedStandard"
                      name="ENELEAGE導入後(3%)"
                      stroke="#3b82f6"
                      strokeWidth={4}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 text-xs text-gray-500 text-center">
                ※ ENELEAGE導入後も電気代は上昇しますが、削減率は維持されるため差額が拡大します
              </div>
            </div>

            {/* 投資回収グラフ */}
            <div className="bg-gray-50 rounded-2xl p-6 md:p-8 mb-12">
              <h4 className="font-bold text-gray-900 text-xl mb-2">投資回収期間グラフ</h4>
              <p className="text-sm text-gray-600 mb-6">
                {getBusinessTypeName()}（{getTaxConditionName()}）の場合
              </p>
              <div className="h-80 md:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={result.paybackData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="year"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                      label={{ value: '経過年数', position: 'insideBottom', offset: -5, fill: '#6b7280' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                      tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                        padding: '12px 16px',
                      }}
                      formatter={(value: number) => `¥${value.toLocaleString()}`}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '24px' }}
                      content={(props) => {
                        const { payload } = props
                        return (
                          <div className="flex flex-wrap justify-center gap-4 pt-4">
                            {payload?.map((entry, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ 
                                    backgroundColor: entry.color,
                                    ...(entry.value === '実質投資額' ? { 
                                      border: `2px solid ${entry.color}`, 
                                      backgroundColor: 'transparent' 
                                    } : {})
                                  }}
                                />
                                <span className="text-xs text-gray-600">{entry.value}</span>
                              </div>
                            ))}
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-0.5 border-t-2 border-dashed border-orange-500" />
                              <span className="text-xs text-gray-600">15年保証</span>
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
                      dataKey="cumulativeSavingsNoChange"
                      name="累積削減額(0%)"
                      stroke={PRICE_SCENARIOS.noChange.color}
                      strokeWidth={2}
                      strokeDasharray="3 3"
                      dot={false}
                    />
                    
                    <Line
                      type="monotone"
                      dataKey="cumulativeSavingsStandard"
                      name="累積削減額(3%)"
                      stroke={PRICE_SCENARIOS.standard.color}
                      strokeWidth={3}
                      dot={false}
                    />
                    
                    <Line
                      type="monotone"
                      dataKey="cumulativeSavingsWorst"
                      name="累積削減額(5%)"
                      stroke={PRICE_SCENARIOS.worst.color}
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-6 text-xs text-gray-500 text-center">
                ※ 累積削減額が実質投資額を超えた時点で投資回収完了
              </div>
            </div>

            {/* シナリオ別比較カード */}
            <motion.div 
              variants={staggerChildren}
              initial="initial"
              animate="animate"
              className="grid md:grid-cols-3 gap-6"
            >
              {/* 現状維持 */}
              <motion.div 
                variants={fadeInUp}
                whileHover={{ scale: 1.02 }}
                className="bg-white border-2 border-gray-200 rounded-2xl p-6 transition-all"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: PRICE_SCENARIOS.noChange.color }} />
                  <h5 className="font-bold text-gray-900">現状維持（0%）</h5>
                </div>
                <div className="space-y-5">
                  <div>
                    <p className="text-xs text-gray-500 mb-2">20年累積削減額</p>
                    <p className="text-3xl font-black text-gray-900">
                      ¥{Math.round(result.total20YearsNoChange / 10000)}万円
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-2">投資回収期間</p>
                    <p className="text-3xl font-black">
                      {result.paybackNoChange < 999 ? (
                        <span className={result.paybackNoChange <= WARRANTY_YEARS ? 'text-emerald-600' : 'text-orange-600'}>
                          {result.paybackNoChange}年
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xl">回収困難</span>
                      )}
                    </p>
                  </div>
                  {result.paybackNoChange < 999 && (
                    result.paybackNoChange <= WARRANTY_YEARS ? (
                      <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span className="text-sm font-semibold text-emerald-700">15年保証内で回収</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-orange-600 shrink-0" />
                        <span className="text-sm font-semibold text-orange-700">保証期間超過</span>
                      </div>
                    )
                  )}
                </div>
              </motion.div>

              {/* 標準シナリオ */}
              <motion.div 
                variants={fadeInUp}
                whileHover={{ scale: 1.02 }}
                className="bg-primary/5 border-2 border-primary rounded-2xl p-6 transition-all relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: PRICE_SCENARIOS.standard.color }} />
                    <h5 className="font-bold text-gray-900">標準シナリオ（3%）</h5>
                    <span className="ml-auto text-xs bg-primary text-white font-bold px-2 py-1 rounded">推奨</span>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <p className="text-xs text-gray-500 mb-2">20年累積削減額</p>
                      <p className="text-3xl font-black text-primary">
                        ¥{Math.round(result.total20YearsStandard / 10000)}万円
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-2">投資回収期間</p>
                      <p className="text-3xl font-black">
                        {result.paybackStandard < 999 ? (
                          <span className={result.paybackStandard <= WARRANTY_YEARS ? 'text-emerald-600' : 'text-orange-600'}>
                            {result.paybackStandard}年
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xl">回収困難</span>
                        )}
                      </p>
                    </div>
                    {result.paybackStandard < 999 && (
                      result.paybackStandard <= WARRANTY_YEARS ? (
                        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <span className="text-sm font-semibold text-emerald-700">15年保証内で回収</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-xl">
                          <AlertCircle className="w-5 h-5 text-orange-600 shrink-0" />
                          <span className="text-sm font-semibold text-orange-700">保証期間超過</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </motion.div>

              {/* 悪化シナリオ */}
              <motion.div 
                variants={fadeInUp}
                whileHover={{ scale: 1.02 }}
                className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6 transition-all"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: PRICE_SCENARIOS.worst.color }} />
                  <h5 className="font-bold text-gray-900">悪化シナリオ（5%）</h5>
                </div>
                <div className="space-y-5">
                  <div>
                    <p className="text-xs text-gray-500 mb-2">20年累積削減額</p>
                    <p className="text-3xl font-black text-orange-600">
                      ¥{Math.round(result.total20YearsWorst / 10000)}万円
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-2">投資回収期間</p>
                    <p className="text-3xl font-black">
                      {result.paybackWorst < 999 ? (
                        <span className={result.paybackWorst <= WARRANTY_YEARS ? 'text-emerald-600' : 'text-orange-600'}>
                          {result.paybackWorst}年
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xl">回収困難</span>
                      )}
                    </p>
                  </div>
                  {result.paybackWorst < 999 && (
                    result.paybackWorst <= WARRANTY_YEARS ? (
                      <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span className="text-sm font-semibold text-emerald-700">15年保証内で回収</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-orange-600 shrink-0" />
                        <span className="text-sm font-semibold text-orange-700">保証期間超過</span>
                      </div>
                    )
                  )}
                </div>
              </motion.div>
            </motion.div>

            {/* 費用内訳 */}
            <div className="mt-12 bg-gray-50 rounded-2xl p-6 md:p-8">
              <h4 className="font-bold text-gray-900 text-xl mb-6">費用内訳</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-base">
                  <span className="text-gray-600">製品定価</span>
                  <span className="font-bold text-gray-900 text-lg">¥{result.productPrice.toLocaleString()}</span>
                </div>
                {businessType !== 'individual' && (
                  <>
                    <div className="flex justify-between items-center text-base">
                      <span className="text-gray-600">税率</span>
                      <span className="font-bold text-gray-900">{result.taxRate}%</span>
                    </div>
                    <div className="flex justify-between items-center text-base pt-3 border-t border-gray-200">
                      <span className="text-gray-600">一括損金による節税額</span>
                      <span className="font-bold text-primary text-lg">-¥{result.taxSavings.toLocaleString()}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center text-lg font-bold pt-4 border-t-2 border-gray-300">
                  <span className="text-gray-900">実質投資額</span>
                  <span className="text-primary text-2xl">¥{result.actualInvestment.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* セールスポイント */}
          <motion.div 
            {...fadeInUp}
            className="bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 border-2 border-primary/20 rounded-3xl p-6 md:p-10 overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32" />
            <div className="relative z-10 flex flex-col md:flex-row items-start gap-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-emerald-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-primary/25">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-black text-gray-900 text-2xl md:text-3xl mb-4">
                  💡 電気代高騰時代こそENELEAGE
                </h4>
                <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                  電気代が上昇すればするほど、ENELEAGE導入の削減効果が大きくなります！
                </p>
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <p className="font-bold text-gray-900 mb-4 text-lg">【例】標準シナリオ（年3%上昇）の場合：</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-600 text-sm">1年後の月間削減額:</span>
                      <span className="font-bold text-gray-900">¥{result.avgMonthlySavings.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-primary/5 rounded-xl">
                      <span className="text-gray-600 text-sm">5年後の月間削減額:</span>
                      <span className="font-bold text-primary">¥{Math.round(result.avgMonthlySavings * 1.46).toLocaleString()} <span className="text-xs">(+46%)</span></span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-primary/5 rounded-xl">
                      <span className="text-gray-600 text-sm">10年後の月間削減額:</span>
                      <span className="font-bold text-primary">¥{Math.round(result.avgMonthlySavings * 2.12).toLocaleString()} <span className="text-xs">(+112%)</span></span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-primary/5 rounded-xl">
                      <span className="text-gray-600 text-sm">15年後の月間削減額:</span>
                      <span className="font-bold text-primary">¥{Math.round(result.avgMonthlySavings * 2.84).toLocaleString()} <span className="text-xs">(+184%)</span></span>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-gradient-to-r from-primary/10 to-emerald-500/10 rounded-xl border border-primary/20">
                    <p className="text-primary font-black text-center text-lg">
                      導入が早いほど、長期的な削減効果が大きくなります！
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 補助金の備考 */}
          <motion.div 
            {...fadeInUp}
            className="bg-blue-50 border-2 border-blue-200 rounded-3xl p-6 md:p-8"
          >
            <div className="flex flex-col md:flex-row items-start gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-xl mb-3">自治体補助金でさらにお得に</h4>
                <p className="text-gray-700 leading-relaxed mb-4">
                  各自治体が提供する蓄電池導入補助金を活用することで、初期投資をさらに削減できます。
                  補助金額は自治体によって異なりますが、数十万円〜100万円以上の補助が受けられる場合もあり、
                  投資回収期間をさらに短縮することが可能です。
                </p>
                <p className="text-xs text-gray-500">
                  ※ 補助金の詳細はお住まいの自治体にお問い合わせください
                </p>
              </div>
            </div>
          </motion.div>

          {/* 代理店募集 */}
          <motion.div {...fadeInUp} id="agency" className="bg-white border border-gray-100 rounded-3xl p-8 md:p-12 shadow-lg shadow-gray-100/50">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-5 py-2 mb-6">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-primary">販売代理店募集</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
                一緒に日本の電気代削減を推進しませんか
              </h3>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
                ENELEAGE Zeroの販売代理店を募集しています。<br />
                充実したサポート体制で、あなたのビジネスを支援します。
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {[
                { num: '1', title: '高収益モデル', desc: '魅力的なマージン設定で安定した収益を実現' },
                { num: '2', title: '充実サポート', desc: '営業ツール提供・研修・技術サポート完備' },
                { num: '3', title: '成長市場', desc: '電力自由化で拡大する蓄電池市場' }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -4 }}
                  className="text-center p-8 bg-gray-50 rounded-2xl border border-gray-200 transition-all"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/25">
                    <span className="text-3xl font-black text-white">{item.num}</span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-lg mb-3">{item.title}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="text-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-emerald-600 text-white hover:shadow-xl hover:shadow-primary/30 h-16 px-10 text-lg font-bold"
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