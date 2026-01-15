"use client"

import { TrendingUp, AlertTriangle, Zap, Calendar, CloudLightning, Shield } from "lucide-react"
import { useEffect, useRef, useState } from "react"

const priceFactors = [
  { label: "政府補助金の終了", detail: "2025年4月終了で月300〜400円の負担増" },
  { label: "再エネ賦課金の上昇", detail: "2012年→2025年で約16倍に増加" },
  { label: "燃料費の高騰", detail: "LNG・原油価格高騰、円安の影響" },
  { label: "電力需要の増加", detail: "EV・ヒートポンプ普及で中長期増加見込み" },
]

const disasterStats = [
  { icon: CloudLightning, value: "15,132", unit: "件", label: "2023年の全国停電発生件数" },
  { icon: Calendar, value: "72", unit: "時間", label: "大規模災害時の平均復旧時間" },
  { icon: AlertTriangle, value: "80", unit: "%", label: "南海トラフ地震30年以内発生確率" },
]

export function ProblemSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
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
  }, [])

  return (
    <section ref={sectionRef} id="problem" className="py-16 md:py-20 lg:py-28 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー - スマホで読みやすく */}
        <div className="text-center mb-12 md:mb-16">
          <p className="text-primary font-semibold text-xs sm:text-sm tracking-wide mb-3">CURRENT ISSUES</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-3 sm:mb-4 px-2">
            今、電気代と災害リスクに
            <br className="md:hidden" />
            直面しています
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-4">
            電気料金の高騰は確実視されており、自然災害による大規模停電のリスクは常に存在します。
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12">
          {/* 電気代高騰 - スマホで余白を広く */}
          <div
            className={`relative p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-200/50 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {/* ヘッダー - スマホで大きく */}
            <div className="flex items-center gap-3 mb-5 sm:mb-6">
              <div className="w-12 h-12 sm:w-12 sm:h-12 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6 sm:w-6 sm:h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground">電気料金の高騰</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">様々な要因で上昇が続く</p>
              </div>
            </div>

            {/* 要因リスト - スマホで読みやすく */}
            <div className="space-y-3">
              {priceFactors.map((factor, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 sm:p-3 bg-card/80 rounded-lg border border-border/50 transition-all duration-500 ${
                    isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                  }`}
                  style={{ transitionDelay: `${index * 100 + 200}ms` }}
                >
                  <Zap className="w-4 h-4 sm:w-4 sm:h-4 text-orange-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-foreground text-sm sm:text-sm">{factor.label}</p>
                    <p className="text-xs sm:text-xs text-muted-foreground mt-0.5">{factor.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 災害リスク - スマホで余白を広く */}
          <div
            className={`relative p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/5 border border-blue-200/50 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "150ms" }}
          >
            {/* ヘッダー - スマホで大きく */}
            <div className="flex items-center gap-3 mb-5 sm:mb-6">
              <div className="w-12 h-12 sm:w-12 sm:h-12 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground">災害時の停電リスク</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">備えが必要な時代</p>
              </div>
            </div>

            {/* 統計情報 - スマホで読みやすく */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {disasterStats.map((stat, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-card/80 rounded-lg border border-border/50 transition-all duration-500 ${
                    isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
                  }`}
                  style={{ transitionDelay: `${index * 100 + 300}ms` }}
                >
                  <div className="w-10 h-10 sm:w-10 sm:h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <stat.icon className="w-5 h-5 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-xs text-muted-foreground leading-tight">{stat.label}</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground mt-0.5">
                      {stat.value}
                      <span className="text-sm font-normal text-muted-foreground ml-1">{stat.unit}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* 注意書き - スマホで読みやすく */}
            <div className="mt-4 p-3 sm:p-4 bg-blue-500/10 rounded-lg border border-blue-200/30">
              <p className="text-xs sm:text-xs text-blue-700 leading-relaxed">
                災害発生直後の72時間は「生命を左右する重要な時間」と言われています。
                特に高齢者や医療機器を使用している方にとって、停電は命に関わる問題です。
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}