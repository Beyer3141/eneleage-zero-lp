"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calculator, TrendingDown, Calendar, DollarSign, Mail, FileText, Users, CheckCircle2, AlertCircle } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend, Tooltip, Line, LineChart, ReferenceLine } from 'recharts'

// ⭐️ ここを自分のURLに書き換えてください！
const AREA_REDUCTION_CSV_URL = 'https://docs.google.com/spreadsheets/d/1CutW05rwWNn2IDKPa7QK9q5m_A59lu1lwO1hJ-4GCHU/export?format=csv&gid=184100076'
const POWER_PRICE_CSV_URL = 'https://docs.google.com/spreadsheets/d/1tPQZyeBHEE2Fh2nY5MBBMjUIF30YQTYxi3n2o36Ikyo/export?format=csv&gid=0'

// 製品情報
const PRODUCT_PRICE = 3500000 // 定価: 350万円
const CORPORATE_TAX_RATE = 0.30 // 法人税率: 30%
const INDIVIDUAL_TAX_RATES = [0.10, 0.20, 0.30] // 個人事業主の所得税率
const WARRANTY_YEARS = 15 // 保証期間: 15年

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

interface PaybackResult {
  taxRate: number
  taxSavings: number
  actualInvestment: number
  paybackYears: number
  paybackWithinWarranty: boolean
}

interface SimulationResult {
  area: string
  baselineMonthlyCost: number
  reductionRate: number
  avgMonthlySavings: number
  annualSavings: number
  monthlyData: MonthlyData[]
  productPrice: number
  corporate: PaybackResult
  individual10: PaybackResult
  individual20: PaybackResult
  individual30: PaybackResult
}

export function SimulatorForm() {
  const [area, setArea] = useState<string>('')
  const [monthlyCost, setMonthlyCost] = useState<string>('')
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

  const calculatePayback = (taxRate: number, annualSavings: number): PaybackResult => {
    const taxSavings = Math.round(PRODUCT_PRICE * taxRate)
    const actualInvestment = PRODUCT_PRICE - taxSavings
    const paybackYears = parseFloat((actualInvestment / annualSavings).toFixed(1))
    const paybackWithinWarranty = paybackYears <= WARRANTY_YEARS

    return {
      taxRate: taxRate * 100,
      taxSavings,
      actualInvestment,
      paybackYears,
      paybackWithinWarranty,
    }
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

      const corporate = calculatePayback(CORPORATE_TAX_RATE, annualSavings)
      const individual10 = calculatePayback(INDIVIDUAL_TAX_RATES[0], annualSavings)
      const individual20 = calculatePayback(INDIVIDUAL_TAX_RATES[1], annualSavings)
      const individual30 = calculatePayback(INDIVIDUAL_TAX_RATES[2], annualSavings)

      setResult({
        area: selectedAreaData.area,
        baselineMonthlyCost: baselineCost,
        reductionRate: selectedAreaData.reductionRate,
        avgMonthlySavings,
        annualSavings,
        monthlyData,
        productPrice: PRODUCT_PRICE,
        corporate,
        individual10,
        individual20,
        individual30,
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

      {result && (
        <div className="space-y-6">
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

          <div className="bg-card rounded-2xl border border-border p-6 md:p-10 shadow-sm">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2">
                投資回収シミュレーション
              </h3>
              <p className="text-muted-foreground">
                一括損金計上による節税効果を含めた実質投資回収期間
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-muted/50 rounded-xl p-6 border border-border">
                <h4 className="font-bold text-foreground mb-4 text-lg">法人の場合</h4>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">製品定価</span>
                    <span className="font-semibold">¥{result.productPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">法人税{result.corporate.taxRate}%</span>
                    <span className="font-semibold text-primary">-¥{result.corporate.taxSavings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="font-medium">実質投資額</span>
                    <span className="font-bold text-lg">¥{result.corporate.actualInvestment.toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-center py-4 bg-card rounded-lg mb-4">
                  <p className="text-sm text-muted-foreground mb-1">投資回収期間</p>
                  <p className="text-4xl font-black text-foreground mb-1">{result.corporate.paybackYears}</p>
                  <p className="text-sm font-medium">年</p>
                </div>

                {result.corporate.paybackWithinWarranty ? (
                  <div className="flex items-center justify-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-700">15年保証内で回収</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-medium text-orange-700">15年保証を超過</span>
                  </div>
                )}
              </div>

              <div className="bg-muted/50 rounded-xl p-6 border border-border">
                <h4 className="font-bold text-foreground mb-4 text-lg">個人事業主の場合</h4>
                
                <div className="space-y-4">
                  {[
                    { label: '所得税率 10%', data: result.individual10 },
                    { label: '所得税率 20%', data: result.individual20 },
                    { label: '所得税率 30%', data: result.individual30 },
                  ].map((item, index) => (
                    <div key={index} className="bg-card rounded-lg p-4">
                      <p className="text-sm font-semibold text-foreground mb-2">{item.label}</p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">節税額</p>
                          <p className="font-semibold">¥{(item.data.taxSavings / 10000).toFixed(0)}万</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">実質投資</p>
                          <p className="font-semibold">¥{(item.data.actualInvestment / 10000).toFixed(0)}万</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">回収期間</p>
                          <p className="font-bold text-lg">{item.data.paybackYears}年</p>
                        </div>
                      </div>
                      
                      {item.data.paybackWithinWarranty && (
                        <div className="mt-2 flex items-center gap-1 text-emerald-600">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-xs font-medium">15年以内</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground mt-4">
                  ※ 所得税率は課税所得によって異なります
                </p>
              </div>
            </div>
          </div>

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