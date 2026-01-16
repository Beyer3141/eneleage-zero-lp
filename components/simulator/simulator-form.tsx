"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calculator, TrendingDown, Calendar, DollarSign, Mail, FileText, Users, CheckCircle2, AlertCircle, TrendingUp, Info } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend, Tooltip, Line, LineChart, ReferenceLine } from 'recharts'

const AREA_REDUCTION_CSV_URL = 'https://docs.google.com/spreadsheets/d/1CutW05rwWNn2IDKPa7QK9q5m_A59lu1lwO1hJ-4GCHU/export?format=csv&gid=184100076'
const POWER_PRICE_CSV_URL = 'https://docs.google.com/spreadsheets/d/1tPQZyeBHEE2Fh2nY5MBBMjUIF30YQTYxi3n2o36Ikyo/export?format=csv&gid=0'

const PRODUCT_PRICE = 3500000
const WARRANTY_YEARS = 15

// 税率設定
const TAX_RATES = {
  individual: 0, // 個人は一括償却なし
  soloProprietor: {
    5: 0.05,
    10: 0.10,
    20: 0.20,
    23: 0.23,
    33: 0.33,
    40: 0.40,
    45: 0.45,
  },
  corporateSmall800: 0.15, // 中小法人800万以下
  corporateSmall800Plus: 0.232, // 中小法人800万超
  corporateLarge: 0.232, // 大法人
}

// 電気代上昇シナリオ
const PRICE_SCENARIOS = {
  noChange: { rate: 0, name: '現状維持', color: '#9ca3af' },
  standard: { rate: 0.03, name: '標準シナリオ', color: '#7CB342' },
  worst: { rate: 0.05, name: '悪化シナリオ', color: '#f97316' },
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
  // 削減前（3シナリオ）
  costNoChange: number
  costStandard: number
  costWorst: number
  // 削減後
  costReduced: number
}

interface PaybackData {
  year: number
  investment: number
  // 累積削減額（3シナリオ）
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
  // 投資回収（3シナリオ）
  productPrice: number
  taxRate: number
  taxSavings: number
  actualInvestment: number
  paybackNoChange: number
  paybackStandard: number
  paybackWorst: number
  paybackData: PaybackData[]
  // 累積削減額（3シナリオ・20年）
  total20YearsNoChange: number
  total20YearsStandard: number
  total20YearsWorst: number
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

      // 長期予測データ（25年間）
      const longTermData: LongTermData[] = []
      const maxYears = 25

      for (let year = 0; year <= maxYears; year++) {
        const costNoChange = baselineCost * 12 * Math.pow(1 + PRICE_SCENARIOS.noChange.rate, year)
        const costStandard = baselineCost * 12 * Math.pow(1 + PRICE_SCENARIOS.standard.rate, year)
        const costWorst = baselineCost * 12 * Math.pow(1 + PRICE_SCENARIOS.worst.rate, year)
        const costReduced = totalReducedCost * Math.pow(1.00, year) // 削減後はほぼ横ばい

        longTermData.push({
          year,
          costNoChange: Math.round(costNoChange),
          costStandard: Math.round(costStandard),
          costWorst: Math.round(costWorst),
          costReduced: Math.round(costReduced),
        })
      }

      // 投資回収計算（3シナリオ）
      const taxRate = getTaxRate()
      const taxSavings = Math.round(PRODUCT_PRICE * taxRate)
      const actualInvestment = PRODUCT_PRICE - taxSavings

      // 累積削減額と投資回収期間（3シナリオ）
      const paybackData: PaybackData[] = []
      let cumulativeNoChange = 0
      let cumulativeStandard = 0
      let cumulativeWorst = 0
      let cumulativeReduced = 0

      for (let year = 0; year <= maxYears; year++) {
        // 各年の電気代
        const yearCostNoChange = baselineCost * 12 * Math.pow(1 + PRICE_SCENARIOS.noChange.rate, year)
        const yearCostStandard = baselineCost * 12 * Math.pow(1 + PRICE_SCENARIOS.standard.rate, year)
        const yearCostWorst = baselineCost * 12 * Math.pow(1 + PRICE_SCENARIOS.worst.rate, year)
        const yearCostReduced = totalReducedCost

        // 累積
        cumulativeNoChange += yearCostNoChange
        cumulativeStandard += yearCostStandard
        cumulativeWorst += yearCostWorst
        cumulativeReduced += yearCostReduced

        paybackData.push({
          year,
          investment: actualInvestment,
          cumulativeSavingsNoChange: Math.round(cumulativeNoChange - cumulativeReduced),
          cumulativeSavingsStandard: Math.round(cumulativeStandard - cumulativeReduced),
          cumulativeSavingsWorst: Math.round(cumulativeWorst - cumulativeReduced),
        })
      }

      // 投資回収期間を計算
      const findPaybackYear = (cumulativeSavingsKey: 'cumulativeSavingsNoChange' | 'cumulativeSavingsStandard' | 'cumulativeSavingsWorst'): number => {
        for (let i = 0; i < paybackData.length; i++) {
          if (paybackData[i][cumulativeSavingsKey] >= actualInvestment) {
            // 線形補間で小数点まで計算
            if (i === 0) return 0
            const prevSavings = paybackData[i - 1][cumulativeSavingsKey]
            const currSavings = paybackData[i][cumulativeSavingsKey]
            const fraction = (actualInvestment - prevSavings) / (currSavings - prevSavings)
            return parseFloat((i - 1 + fraction).toFixed(1))
          }
        }
        return 999 // 回収不可
      }

      const paybackNoChange = findPaybackYear('cumulativeSavingsNoChange')
      const paybackStandard = findPaybackYear('cumulativeSavingsStandard')
      const paybackWorst = findPaybackYear('cumulativeSavingsWorst')

      // 20年累積削減額
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
    <div className="space-y-8">
      {/* 入力フォーム */}
      <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="area" className="block text-sm font-medium text-foreground mb-2">
                お住まいのエリア
              </label>
              <select
                id="area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
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
              <label htmlFor="cost" className="block text-sm font-medium text-foreground mb-2">
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
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="例: 15000"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  円
                </span>
              </div>
            </div>
          </div>

          {/* 事業形態選択 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              事業形態
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  setBusinessType('individual')
                  setTaxCondition('0')
                }}
                className={`px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                  businessType === 'individual'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-foreground hover:border-primary/50'
                }`}
              >
                個人
              </button>
              <button
                type="button"
                onClick={() => {
                  setBusinessType('soloProprietor')
                  setTaxCondition('20')
                }}
                className={`px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                  businessType === 'soloProprietor'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-foreground hover:border-primary/50'
                }`}
              >
                個人事業主
              </button>
              <button
                type="button"
                onClick={() => {
                  setBusinessType('corporate')
                  setTaxCondition('corporateSmall800')
                }}
                className={`px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                  businessType === 'corporate'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-foreground hover:border-primary/50'
                }`}
              >
                法人
              </button>
            </div>
          </div>

          {/* 条件選択（事業形態によって動的に変わる） */}
          {businessType === 'individual' && (
            <div className="p-4 bg-muted/50 rounded-xl">
              <p className="text-sm text-muted-foreground">
                個人の場合、一括損金計上はできないため節税効果はありません。
              </p>
            </div>
          )}

          {businessType === 'soloProprietor' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                所得税率（課税所得に応じて選択）
              </label>
              <select
                value={taxCondition}
                onChange={(e) => setTaxCondition(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              >
                <option value="5">5% （課税所得195万円以下）</option>
                <option value="10">10% （課税所得195万円超〜330万円以下）</option>
                <option value="20">20% （課税所得330万円超〜695万円以下）</option>
                <option value="23">23% （課税所得695万円超〜900万円以下）</option>
                <option value="33">33% （課税所得900万円超〜1,800万円以下）</option>
                <option value="40">40% （課税所得1,800万円超〜4,000万円以下）</option>
                <option value="45">45% （課税所得4,000万円超）</option>
              </select>
            </div>
          )}

          {businessType === 'corporate' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                法人規模・所得区分
              </label>
              <select
                value={taxCondition}
                onChange={(e) => setTaxCondition(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              >
                <option value="corporateSmall800">中小法人（資本金1億円以下・所得800万円以下）税率15%</option>
                <option value="corporateSmall800Plus">中小法人（資本金1億円以下・所得800万円超）税率23.2%</option>
              </select>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={loading || !area || !monthlyCost}
            className="w-full h-14 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
          >
            {loading ? '計算中...' : (
              <>
                <Calculator className="mr-2 w-5 h-5" />
                年間削減額を計算する
              </>
            )}
          </Button>
        </form>
      </div>

      {/* 結果表示 */}
      {result && (
        <div className="space-y-6">
          {/* 月別電気代グラフ */}
          <div className="bg-card rounded-2xl border border-border p-6 md:p-10 shadow-sm">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2">
                {result.area}エリアの年間電気代推移
              </h3>
              <p className="text-muted-foreground">
                スポット電力価格の変動を反映した削減効果
              </p>
            </div>

            <div className="h-80 md:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="colorReduced" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7CB342" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7CB342" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    label={{ value: '月額電気代(円)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '8px 12px',
                    }}
                    formatter={(value: number) => `¥${value.toLocaleString()}`}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '20px' }}
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

            <div className="mt-6 text-xs text-muted-foreground text-center">
              ※ 2025年度データ参照（JEPXスポット市場価格に基づく月別変動を反映）
            </div>
          </div>

          {/* 削減効果サマリー */}
          <div className="bg-gradient-to-br from-primary via-primary to-emerald-600 rounded-2xl p-8 md:p-10 shadow-xl text-white">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 mb-4">
                <TrendingDown className="w-4 h-4" />
                <span className="text-sm font-medium">年間削減効果</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">
                削減率 {result.reductionRate}%
              </h2>
              <p className="text-white/80">
                AI-EMSによるスポット価格最適化
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-white/80" />
                  <span className="text-sm text-white/80">平均月間削減額</span>
                </div>
                <p className="text-3xl md:text-4xl font-bold mb-2">
                  ¥{result.avgMonthlySavings.toLocaleString()}
                </p>
                <p className="text-xs text-white/60">
                  年間平均の月額削減額
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-5 h-5 text-white/80" />
                  <span className="text-sm text-white/80">年間削減額</span>
                </div>
                <p className="text-3xl md:text-4xl font-bold mb-2">
                  ¥{result.annualSavings.toLocaleString()}
                </p>
                <p className="text-xs text-white/60">
                  12ヶ月分の合計削減額
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 pt-6 border-t border-white/20">
              <Button
                size="lg"
                variant="outline"
                className="bg-white text-primary hover:bg-white/90 border-0 h-12 font-semibold"
                asChild
              >
                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLSdVRVxurB8AOO9KT1-Mv5kmM3A_VawLS-gB6mfW2Ia4LO-DuQ/viewform?usp=header"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Mail className="mr-2 w-4 h-4" />
                  無料相談
                </a>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="bg-white text-primary hover:bg-white/90 border-0 h-12 font-semibold"
                asChild
              >
                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLSdVRVxurB8AOO9KT1-Mv5kmM3A_VawLS-gB6mfW2Ia4LO-DuQ/viewform?usp=header"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileText className="mr-2 w-4 h-4" />
                  資料請求
                </a>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="bg-white text-primary hover:bg-white/90 border-0 h-12 font-semibold"
                asChild
              >
                <a href="#agency">
                  <Users className="mr-2 w-4 h-4" />
                  代理店募集
                </a>
              </Button>
            </div>
          </div>

          {/* シナリオ説明カード */}
          <div className="bg-card rounded-2xl border border-border p-6 md:p-10 shadow-sm">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                <h3 className="text-2xl font-bold text-foreground">
                  電気代上昇シナリオ別シミュレーション
                </h3>
              </div>
              <p className="text-muted-foreground">
                過去データと将来予測に基づく3つのシナリオで投資回収期間を算出
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {/* 現状維持シナリオ */}
              <div className="bg-muted/50 border-2 border-border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PRICE_SCENARIOS.noChange.color }}></div>
                  <h4 className="font-bold text-foreground">現状維持（0%）</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  最も保守的な予測。電気料金が今後横ばいで推移すると仮定したケース。
                </p>
                <div className="bg-card rounded-lg p-3 text-xs text-muted-foreground">
                  <div className="flex items-start gap-1">
                    <Info className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>過去10年のデータでは電気代は上昇傾向にあるため、この想定は楽観的である可能性があります。</span>
                  </div>
                </div>
              </div>

              {/* 標準シナリオ */}
              <div className="bg-primary/5 border-2 border-primary rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PRICE_SCENARIOS.standard.color }}></div>
                  <h4 className="font-bold text-foreground flex items-center gap-2">
                    標準シナリオ（3%）
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">推奨</span>
                  </h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  過去10年間（2014-2024年）の実績データに基づく現実的な予測。
                </p>
                <div className="bg-card rounded-lg p-3 text-xs space-y-1">
                  <p className="font-medium text-foreground">主な上昇要因：</p>
                  <ul className="text-muted-foreground space-y-0.5 ml-3">
                    <li>• 再エネ賦課金の段階的増加</li>
                    <li>• 発電所の維持・更新コスト</li>
                    <li>• 送配電網の強靭化投資</li>
                  </ul>
                </div>
              </div>

              {/* 悪化シナリオ */}
              <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PRICE_SCENARIOS.worst.color }}></div>
                  <h4 className="font-bold text-foreground">悪化シナリオ（5%）</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  円安・エネルギー危機の長期化を想定した悲観的ケース。
                </p>
                <div className="bg-card rounded-lg p-3 text-xs space-y-1">
                  <p className="font-medium text-foreground">想定される要因：</p>
                  <ul className="text-muted-foreground space-y-0.5 ml-3">
                    <li>• 円安の長期化（1ドル=150円超）</li>
                    <li>• 化石燃料価格の高騰継続</li>
                    <li>• 原発再稼働遅延</li>
                  </ul>
                  <p className="text-orange-600 font-medium mt-2">※2022年は前年比+15%を記録</p>
                </div>
              </div>
            </div>

            {/* 長期予測グラフ */}
            <div className="bg-muted/30 rounded-xl p-6 mb-6">
              <h4 className="font-bold text-foreground mb-4 text-lg">長期電気代推移予測（20年間）</h4>
              <div className="h-80 md:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={result.longTermData.slice(0, 21)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="year"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9ca3af", fontSize: 12 }}
                      label={{ value: '経過年数', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9ca3af", fontSize: 12 }}
                      label={{ value: '年間電気代(円)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
                      tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '8px 12px',
                      }}
                      formatter={(value: number) => `¥${value.toLocaleString()}`}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    
                    <Line
                      type="monotone"
                      dataKey="costNoChange"
                      name="現状維持(0%)"
                      stroke={PRICE_SCENARIOS.noChange.color}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                    
                    <Line
                      type="monotone"
                      dataKey="costStandard"
                      name="標準(3%)"
                      stroke={PRICE_SCENARIOS.standard.color}
                      strokeWidth={3}
                      dot={false}
                    />
                    
                    <Line
                      type="monotone"
                      dataKey="costWorst"
                      name="悪化(5%)"
                      stroke={PRICE_SCENARIOS.worst.color}
                      strokeWidth={3}
                      dot={false}
                    />
                    
                    <Line
                      type="monotone"
                      dataKey="costReduced"
                      name="ENELEAGE導入後"
                      stroke="#3b82f6"
                      strokeWidth={4}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-xs text-muted-foreground text-center">
                ※ ENELEAGE導入後はスポット価格最適化により、市場価格上昇の影響を受けにくい
              </div>
            </div>
          </div>

          {/* 投資回収シミュレーション */}
          <div className="bg-card rounded-2xl border border-border p-6 md:p-10 shadow-sm">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2">
                投資回収シミュレーション
              </h3>
              <p className="text-muted-foreground">
                {getBusinessTypeName()}（{getTaxConditionName()}）の場合
              </p>
            </div>

            {/* 投資回収グラフ */}
            <div className="bg-muted/30 rounded-xl p-6 mb-6">
              <h4 className="font-bold text-foreground mb-4 text-lg">投資回収期間グラフ</h4>
              <div className="h-80 md:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={result.paybackData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="year"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9ca3af", fontSize: 12 }}
                      label={{ value: '経過年数', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9ca3af", fontSize: 12 }}
                      label={{ value: '累積金額(円)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
                      tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '8px 12px',
                      }}
                      formatter={(value: number) => `¥${value.toLocaleString()}`}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
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
                                    ...(entry.value === '実質投資額' ? { border: '2px solid currentColor', backgroundColor: 'transparent' } : {})
                                  }}
                                ></div>
                                <span className="text-xs text-muted-foreground">{entry.value}</span>
                              </div>
                            ))}
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-0.5 border-t-2 border-dashed" style={{ borderColor: '#f59e0b' }}></div>
                              <span className="text-xs text-muted-foreground">15年保証</span>
                            </div>
                          </div>
                        )
                      }}
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
              
              <div className="mt-4 text-xs text-muted-foreground text-center">
                ※ 累積削減額が実質投資額を超えた時点で投資回収完了
              </div>
            </div>

            {/* シナリオ別比較表 */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {/* 現状維持 */}
              <div className="bg-muted/50 rounded-xl p-6 border border-border">
                <h5 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PRICE_SCENARIOS.noChange.color }}></div>
                  現状維持（0%）
                </h5>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">20年累積削減額</p>
                    <p className="text-2xl font-bold text-foreground">
                      ¥{Math.round(result.total20YearsNoChange / 10000)}万円
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">投資回収期間</p>
                    <p className="text-2xl font-bold">
                      {result.paybackNoChange < 999 ? (
                        <span className={result.paybackNoChange <= WARRANTY_YEARS ? 'text-emerald-600' : 'text-orange-600'}>
                          {result.paybackNoChange}年
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-lg">回収困難</span>
                      )}
                    </p>
                  </div>
                  {result.paybackNoChange < 999 && (
                    result.paybackNoChange <= WARRANTY_YEARS ? (
                      <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-medium text-emerald-700">15年保証内</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                        <span className="text-xs font-medium text-orange-700">保証超過</span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* 標準シナリオ */}
              <div className="bg-primary/10 border-2 border-primary rounded-xl p-6">
                <h5 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PRICE_SCENARIOS.standard.color }}></div>
                  標準シナリオ（3%）
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">推奨</span>
                </h5>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">20年累積削減額</p>
                    <p className="text-2xl font-bold text-primary">
                      ¥{Math.round(result.total20YearsStandard / 10000)}万円
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">投資回収期間</p>
                    <p className="text-2xl font-bold">
                      {result.paybackStandard < 999 ? (
                        <span className={result.paybackStandard <= WARRANTY_YEARS ? 'text-emerald-600' : 'text-orange-600'}>
                          {result.paybackStandard}年
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-lg">回収困難</span>
                      )}
                    </p>
                  </div>
                  {result.paybackStandard < 999 && (
                    result.paybackStandard <= WARRANTY_YEARS ? (
                      <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-medium text-emerald-700">15年保証内</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                        <span className="text-xs font-medium text-orange-700">保証超過</span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* 悪化シナリオ */}
              <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
                <h5 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PRICE_SCENARIOS.worst.color }}></div>
                  悪化シナリオ（5%）
                </h5>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">20年累積削減額</p>
                    <p className="text-2xl font-bold text-orange-600">
                      ¥{Math.round(result.total20YearsWorst / 10000)}万円
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">投資回収期間</p>
                    <p className="text-2xl font-bold">
                      {result.paybackWorst < 999 ? (
                        <span className={result.paybackWorst <= WARRANTY_YEARS ? 'text-emerald-600' : 'text-orange-600'}>
                          {result.paybackWorst}年
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-lg">回収困難</span>
                      )}
                    </p>
                  </div>
                  {result.paybackWorst < 999 && (
                    result.paybackWorst <= WARRANTY_YEARS ? (
                      <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-medium text-emerald-700">15年保証内</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                        <span className="text-xs font-medium text-orange-700">保証超過</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* 費用内訳 */}
            <div className="bg-muted/50 rounded-xl p-6 border border-border">
              <h4 className="font-bold text-foreground mb-4 text-lg">費用内訳</h4>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">製品定価</span>
                  <span className="font-semibold">¥{result.productPrice.toLocaleString()}</span>
                </div>
                {businessType !== 'individual' && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">税率</span>
                      <span className="font-semibold">{result.taxRate}%</span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="text-muted-foreground">一括損金による節税額</span>
                      <span className="font-semibold text-primary">-¥{result.taxSavings.toLocaleString()}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-sm font-bold text-lg border-t pt-3">
                  <span>実質投資額</span>
                  <span>¥{result.actualInvestment.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* セールスポイント */}
          <div className="bg-gradient-to-br from-emerald-50 to-blue-50 border-2 border-primary/30 rounded-xl p-6 md:p-8">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-lg mb-2">💡 電気代高騰時代こそENELEAGE</h4>
                <p className="text-muted-foreground mb-4">
                  電気代が上昇すればするほど、ENELEAGE導入の削減効果が大きくなります！
                </p>
                <div className="bg-white rounded-lg p-4 space-y-2 text-sm">
                  <p className="font-bold text-foreground">【例】標準シナリオ（年3%上昇）の場合：</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
                    <span>1年後の月間削減額:</span>
                    <span className="font-semibold text-foreground">¥{result.avgMonthlySavings.toLocaleString()}</span>
                    <span>5年後の月間削減額:</span>
                    <span className="font-semibold text-primary">¥{Math.round(result.avgMonthlySavings * 1.46).toLocaleString()} <span className="text-xs">(+46%↑)</span></span>
                    <span>10年後の月間削減額:</span>
                    <span className="font-semibold text-primary">¥{Math.round(result.avgMonthlySavings * 2.12).toLocaleString()} <span className="text-xs">(+112%↑)</span></span>
                    <span>15年後の月間削減額:</span>
                    <span className="font-semibold text-primary">¥{Math.round(result.avgMonthlySavings * 2.84).toLocaleString()} <span className="text-xs">(+184%↑)</span></span>
                  </div>
                  <p className="text-primary font-bold pt-2 border-t">
                    導入が早いほど、長期的な削減効果が大きくなります！
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 補助金の備考 */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <h4 className="font-semibold text-foreground mb-2">自治体補助金でさらにお得に</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  各自治体が提供する蓄電池導入補助金を活用することで、初期投資をさらに削減できます。
                  補助金額は自治体によって異なりますが、数十万円〜100万円以上の補助が受けられる場合もあり、
                  投資回収期間をさらに短縮することが可能です。
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  ※ 補助金の詳細はお住まいの自治体にお問い合わせください
                </p>
              </div>
            </div>
          </div>

          {/* 代理店募集 */}
          <div id="agency" className="bg-card border border-border rounded-2xl p-8 md:p-10 shadow-sm">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">販売代理店募集</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                一緒に日本の電気代削減を推進しませんか
              </h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                ENELEAGE Zeroの販売代理店を募集しています。<br />
                充実したサポート体制で、あなたのビジネスを支援します。
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-6 bg-muted/50 rounded-xl">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h4 className="font-semibold text-foreground mb-2">高収益モデル</h4>
                <p className="text-sm text-muted-foreground">
                  魅力的なマージン設定で安定した収益を実現
                </p>
              </div>

              <div className="text-center p-6 bg-muted/50 rounded-xl">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h4 className="font-semibold text-foreground mb-2">充実サポート</h4>
                <p className="text-sm text-muted-foreground">
                  営業ツール提供・研修・技術サポート完備
                </p>
              </div>

              <div className="text-center p-6 bg-muted/50 rounded-xl">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h4 className="font-semibold text-foreground mb-2">成長市場</h4>
                <p className="text-sm text-muted-foreground">
                  電力自由化で拡大する蓄電池市場
                </p>
              </div>
            </div>

            <div className="text-center">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 font-semibold"
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
          </div>
        </div>
      )}
    </div>
  )
}