"use client"

import { ArrowDown, Check, TrendingDown, MapPin } from "lucide-react"
import { useEffect, useRef, useState } from "react"

const regionData = [
  { region: "北海道", rate: 49 },
  { region: "東北", rate: 36 },
  { region: "関東", rate: 37 },
  { region: "中部", rate: 35 },
  { region: "北陸", rate: 41 },
  { region: "関西", rate: 42 },
  { region: "中国", rate: 39 },
  { region: "四国", rate: 39 },
  { region: "九州", rate: 39 },
]

export function BenefitsSection() {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const targetCount = 147456

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true)
          }
        })
      },
      { threshold: 0.2 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [isVisible])

  useEffect(() => {
    if (isVisible && count < targetCount) {
      const duration = 2000
      const steps = 60
      const increment = targetCount / steps
      const stepDuration = duration / steps

      const timer = setInterval(() => {
        setCount((prev) => {
          const next = prev + increment
          if (next >= targetCount) {
            clearInterval(timer)
            return targetCount
          }
          return next
        })
      }, stepDuration)

      return () => clearInterval(timer)
    }
  }, [isVisible, count])

  return (
    <section ref={sectionRef} id="benefits" className="py-16 md:py-20 lg:py-28 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー - スマホで読みやすく */}
        <div className="text-center mb-12 md:mb-16">
          <p className="text-primary font-semibold text-xs sm:text-sm tracking-wide mb-3">COST REDUCTION</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight px-2">
            全国平均40%のコスト削減を実現
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-start">
          {/* 地域別削減率 - スマホで読みやすく */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-5 sm:mb-6">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <p className="font-semibold text-sm sm:text-base text-foreground">地域別 電力削減率</p>
              <span className="text-[10px] sm:text-xs text-muted-foreground">（300kWh以上の利用ケース）</span>
            </div>

            {/* バーグラフ - スマホで余白調整 */}
            <div className="space-y-2.5 sm:space-y-3">
              {regionData.map((item, index) => (
                <div
                  key={item.region}
                  className={`flex items-center gap-3 sm:gap-4 transition-all duration-500 ${
                    isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                  }`}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <span className="w-11 sm:w-12 text-xs sm:text-sm text-muted-foreground">{item.region}</span>
                  <div className="flex-1 h-7 sm:h-8 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2 sm:pr-3"
                      style={{
                        width: isVisible ? `${item.rate}%` : "0%",
                        transitionDelay: `${index * 50 + 300}ms`,
                      }}
                    >
                      <span className="text-[10px] sm:text-xs font-bold text-primary-foreground">{item.rate}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 特徴リスト - スマホで読みやすく */}
            <div className="mt-6 sm:mt-8 space-y-2.5 sm:space-y-3">
              {[
                "72時間のバックアップ電力確保",
                "大がかりな工事不要で簡単導入",
                "停電時もPC・冷蔵庫が継続稼働",
                "15年の長期製品保証付き",
              ].map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 bg-muted/50 rounded-xl border border-border transition-all duration-500 ${
                    isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                  }`}
                  style={{ transitionDelay: `${index * 100 + 500}ms` }}
                >
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 sm:w-3 sm:h-3 text-primary-foreground" />
                  </div>
                  <span className="text-foreground text-xs sm:text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* コスト計算 - スマホで読みやすく */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-primary/10 to-transparent rounded-3xl blur-2xl -z-10" />
            <div className="relative bg-card border border-border rounded-2xl p-5 sm:p-8 shadow-xl">
              <div className="flex items-center gap-2 mb-6 sm:mb-8">
                <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">月の電気代 25,600円の場合</p>
              </div>

              <div className="space-y-5 sm:space-y-6">
                {/* 従来の電気代 */}
                <div className="p-4 sm:p-6 rounded-xl bg-muted">
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 uppercase tracking-wide">従来の年間電気代</p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">¥307,200</p>
                </div>

                {/* 矢印 */}
                <div className="flex justify-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 animate-bounce">
                    <ArrowDown className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                  </div>
                </div>

                {/* 導入後の電気代 */}
                <div className="p-4 sm:p-6 rounded-xl bg-primary/10 border-2 border-primary/30">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] sm:text-xs text-primary uppercase tracking-wide font-medium">ENELEAGE Zero導入後</p>
                    <span className="text-[10px] sm:text-xs font-bold text-primary-foreground bg-primary px-2 sm:px-3 py-1 rounded-full">
                      48%削減
                    </span>
                  </div>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">¥159,744</p>
                </div>

                {/* 年間削減額 */}
                <div className="text-center p-5 sm:p-6 rounded-xl bg-foreground">
                  <p className="text-[10px] sm:text-xs text-card/70 mb-2 uppercase tracking-wide">年間削減額</p>
                  <p className="text-3xl sm:text-4xl md:text-5xl font-black text-card">¥{Math.floor(count).toLocaleString()}</p>
                </div>
              </div>

              <p className="text-[10px] sm:text-xs text-muted-foreground mt-5 sm:mt-6 text-center">
                ※電気代高騰時にはさらなる削減効果が期待できます
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}