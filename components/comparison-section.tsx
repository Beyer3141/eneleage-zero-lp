"use client"

import { Check, X, Zap, Clock, Shield, Repeat, Box } from "lucide-react"
import { useEffect, useRef, useState } from "react"

const comparisonData = [
  {
    label: "搭載容量",
    icon: Box,
    eneleage: "11.776kWh",
    others: ["16.4kWh", "12kWh", "13kWh"],
  },
  {
    label: "停電時切替時間",
    icon: Clock,
    eneleage: "約0.01秒",
    eneleageHighlight: true,
    others: ["約5秒", "約5秒", "約5秒〜30秒"],
  },
  {
    label: "製品保証",
    icon: Shield,
    eneleage: "15年",
    eneleageHighlight: true,
    others: ["10年", "10年", "10年"],
  },
  {
    label: "JEPX連動システム",
    icon: Zap,
    eneleage: "あり",
    eneleageHighlight: true,
    others: ["なし", "なし", "なし"],
  },
  {
    label: "サイクル寿命",
    icon: Repeat,
    eneleage: "10,000回",
    others: ["-", "-", "-"],
  },
]

export function ComparisonSection() {
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
    <section ref={sectionRef} className="py-16 md:py-20 lg:py-28 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー - スマホで読みやすく */}
        <div className="text-center mb-12 md:mb-16">
          <p className="text-primary font-semibold text-xs sm:text-sm tracking-wide mb-3">COMPARISON</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-3 sm:mb-4 px-2">
            他社製品との比較
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground px-4">
            ENELEAGE Zeroは国内唯一のJEPX連動システムを搭載
          </p>
        </div>

        {/* 比較表 - スマホで横スクロール可能 */}
        <div
          className={`transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* スマホ用：横スクロールのヒント */}
          <div className="md:hidden text-center mb-3">
            <p className="text-xs text-muted-foreground">← 横にスクロールできます →</p>
          </div>

          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[500px] bg-card rounded-xl sm:rounded-2xl border border-border overflow-hidden">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-3 sm:p-4 text-left text-xs sm:text-sm font-medium text-muted-foreground w-32 sm:w-40">項目</th>
                  <th className="p-3 sm:p-4 text-center bg-primary/10 border-x border-primary/20">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] sm:text-xs text-primary font-medium mb-0.5 sm:mb-1">VOLTA</span>
                      <span className="font-bold text-xs sm:text-base text-foreground">ENELEAGE Zero</span>
                    </div>
                  </th>
                  <th className="p-3 sm:p-4 text-center text-xs sm:text-sm font-medium text-muted-foreground">A社</th>
                  <th className="p-3 sm:p-4 text-center text-xs sm:text-sm font-medium text-muted-foreground">B社</th>
                  <th className="p-3 sm:p-4 text-center text-xs sm:text-sm font-medium text-muted-foreground">C社</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr
                    key={index}
                    className={`border-b border-border last:border-b-0 transition-all duration-500 ${
                      isVisible ? "opacity-100" : "opacity-0"
                    }`}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <td className="p-3 sm:p-4">
                      <div className="flex items-center gap-2">
                        <row.icon className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
                        <span className="text-xs sm:text-sm font-medium text-foreground">{row.label}</span>
                      </div>
                    </td>
                    <td className="p-3 sm:p-4 text-center bg-primary/5 border-x border-primary/20">
                      <span className={`font-bold text-xs sm:text-base ${row.eneleageHighlight ? "text-primary" : "text-foreground"}`}>
                        {row.eneleage}
                      </span>
                      {row.eneleageHighlight && <Check className="w-3 h-3 sm:w-4 sm:h-4 text-primary inline-block ml-1" />}
                    </td>
                    {row.others.map((value, i) => (
                      <td key={i} className="p-3 sm:p-4 text-center text-xs sm:text-sm text-muted-foreground">
                        {value === "なし" ? (
                          <span className="flex items-center justify-center gap-1 text-red-400">
                            <X className="w-3 h-3 sm:w-4 sm:h-4" />
                            {value}
                          </span>
                        ) : (
                          value
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* UPS機能の説明 - スマホで読みやすく */}
        <div
          className={`mt-10 sm:mt-12 p-5 sm:p-8 bg-card rounded-2xl border border-border transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "500ms" }}
        >
          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-base sm:text-lg text-foreground mb-2">0.01秒切替のUPS機能とは？</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4">
                ENELEAGE Zeroは停電時UPS（無停電電源装置）としての機能を有します。
                予想外の停電や電源トラブルが起きた際に、機器にしばらくの間電力を供給し続けて、
                機器やデータが壊れたり失われたりしないように守ります。
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 bg-red-50 rounded-lg border border-red-200/50">
                  <p className="text-[10px] sm:text-xs font-medium text-red-600 mb-1 sm:mb-2">一般的な蓄電池の場合</p>
                  <p className="text-xs sm:text-sm text-red-700">5秒間の断絶 → PCのデータ消失、機器の再起動が必要</p>
                </div>
                <div className="p-3 sm:p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-[10px] sm:text-xs font-medium text-primary mb-1 sm:mb-2">ENELEAGE Zeroの場合</p>
                  <p className="text-xs sm:text-sm text-foreground">0.01秒で切替 → PCもエアコンも照明も継続稼働</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}