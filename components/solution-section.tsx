"use client"

import { X, Check, Home, MapPin, Wallet } from "lucide-react"
import { useEffect, useRef, useState } from "react"

const barriers = [
  {
    icon: Home,
    title: "設置ハードル",
    traditional: "屋根の形状や築年数で設置困難、マンションは設置面積不足",
    solution: "室内床置きでどこでも設置OK",
  },
  {
    icon: MapPin,
    title: "地域ハードル",
    traditional: "日照時間が短い地域、豪雪・塩害地域は効率低下や損傷リスク",
    solution: "太陽光不要なので全国どこでも導入可能",
  },
  {
    icon: Wallet,
    title: "費用ハードル",
    traditional: "太陽光+蓄電池セットは日本の平均年収相当の費用",
    solution: "蓄電池のみで初期費用を大幅カット",
  },
]

export function SolutionSection() {
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
          <p className="text-primary font-semibold text-xs sm:text-sm tracking-wide mb-3">THE SOLUTION</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-3 sm:mb-4 px-2">
            従来の導入ハードルを
            <br className="md:hidden" />
            すべて解決
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-4">
            ENELEAGE Zeroは、太陽光パネル不要の革新的なアプローチで、
            これまで導入を諦めていた方にも新しい選択肢を提供します。
          </p>
        </div>

        {/* ハードル比較 - スマホで縦並び */}
        <div className="space-y-6 md:space-y-6">
          {barriers.map((barrier, index) => (
            <div
              key={index}
              className={`grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              {/* ハードル名 - スマホで大きく */}
              <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6 bg-card rounded-xl border border-border">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <barrier.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">BARRIER {String(index + 1).padStart(2, "0")}</p>
                  <p className="font-bold text-foreground text-base sm:text-lg">{barrier.title}</p>
                </div>
              </div>

              {/* 従来の問題 - スマホで読みやすく */}
              <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-6 bg-red-50 rounded-xl border border-red-200/50">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-red-600 font-medium mb-1">従来の課題</p>
                  <p className="text-xs sm:text-sm text-red-700 leading-relaxed">{barrier.traditional}</p>
                </div>
              </div>

              {/* ENELEAGE Zeroの解決策 - スマホで読みやすく */}
              <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-6 bg-primary/10 rounded-xl border border-primary/20">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-primary font-medium mb-1">ENELEAGE Zero</p>
                  <p className="text-xs sm:text-sm text-foreground font-medium leading-relaxed">{barrier.solution}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 導入可能率 - スマホで読みやすく */}
        <div
          className={`mt-10 sm:mt-12 p-6 sm:p-8 bg-card rounded-2xl border border-border text-center transition-all duration-700 ${
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
          style={{ transitionDelay: "500ms" }}
        >
          <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
            これまで導入を諦めていた約<span className="text-foreground font-bold text-lg sm:text-xl">50%</span>の方も
          </p>
          <p className="text-2xl sm:text-3xl md:text-4xl font-black text-primary">
            ENELEAGE Zeroなら導入可能に
          </p>
        </div>
      </div>
    </section>
  )
}