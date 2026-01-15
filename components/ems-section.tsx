"use client"

import { Zap, BarChart3, TrendingDown, TrendingUp } from "lucide-react"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, ReferenceLine, CartesianGrid } from "recharts"

const chartData = [
  { hour: "0時", price: 15, fill: true },
  { hour: "3時", price: 8, fill: true },
  { hour: "6時", price: 12, fill: true },
  { hour: "9時", price: 22, fill: false },
  { hour: "12時", price: 32, fill: false },
  { hour: "15時", price: 28, fill: false },
  { hour: "18時", price: 38, fill: false },
  { hour: "21時", price: 25, fill: false },
  { hour: "24時", price: 15, fill: true },
]

export function EmsSection() {
  return (
    <section id="technology" className="py-16 md:py-20 lg:py-28 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー - スマホで読みやすく */}
        <div className="text-center mb-10 sm:mb-12">
          <p className="text-primary font-semibold text-xs sm:text-sm tracking-wide mb-3">HOW IT WORKS</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-3 sm:mb-4 px-2">
            AI-EMSによる自動最適化
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-4">
            JEPX（日本卸電力取引所）の電力価格をリアルタイムで監視し、
            AIが自動で最適な蓄電・放電タイミングを判断します。
          </p>
        </div>

        {/* 蓄電・放電説明カード - スマホで縦並び */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-8 sm:mb-10">
          <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center shrink-0">
              <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="font-bold text-base sm:text-lg">電気代の安い時間に自動で蓄電</p>
              <p className="text-primary-foreground/80 text-xs sm:text-sm">深夜～早朝の低価格帯で買電</p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-card border border-border rounded-xl">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
            </div>
            <div>
              <p className="font-bold text-base sm:text-lg text-foreground">電気代の高い時間に蓄電気を利用</p>
              <p className="text-muted-foreground text-xs sm:text-sm">ピーク時の高額電気代を回避</p>
            </div>
          </div>
        </div>

        {/* グラフカード - スマホで見やすく */}
        <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 md:p-10 shadow-sm">
          {/* グラフヘッダー - スマホで縦並び */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">電気料金（円/kWh）</p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-xs text-muted-foreground">蓄電（買電）</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-foreground/30" />
                <span className="text-xs text-muted-foreground">放電（利用）</span>
              </div>
            </div>
          </div>

          {/* グラフ - スマホで高さを大きく */}
          <div className="h-64 sm:h-72 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7CB342" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7CB342" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="hour"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 10 }}
                  dy={5}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 10 }}
                  domain={[0, 45]}
                  ticks={[0, 10, 20, 30, 40]}
                />
                <ReferenceLine y={20} stroke="#7CB342" strokeDasharray="5 5" strokeOpacity={0.5} />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#7CB342"
                  strokeWidth={2}
                  fill="url(#colorPrice)"
                  dot={{ fill: "#7CB342", strokeWidth: 2, r: 4, stroke: "#fff" }}
                  activeDot={{ r: 6, fill: "#7CB342", stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* 価格帯説明 - スマホで縦並び */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-6 sm:mt-8">
            <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-primary/5 rounded-xl border border-primary/20">
              <Zap className="w-7 h-7 sm:w-8 sm:h-8 text-primary shrink-0" />
              <div>
                <p className="font-semibold text-sm sm:text-base text-foreground">安い時間帯に蓄電</p>
                <p className="text-xs sm:text-sm text-muted-foreground">0時～6時：平均 10円/kWh</p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-muted rounded-xl border border-border">
              <BarChart3 className="w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground shrink-0" />
              <div>
                <p className="font-semibold text-sm sm:text-base text-foreground">高い時間帯に放電</p>
                <p className="text-xs sm:text-sm text-muted-foreground">12時～20時：平均 32円/kWh</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}