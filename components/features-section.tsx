"use client"

import { Receipt, Building2, Zap, Maximize2, Volume2, Smartphone } from "lucide-react"
import { useEffect, useRef, useState } from "react"

const features = [
  {
    number: "01",
    icon: Receipt,
    title: "経費計上で節税効果",
    description: "設備投資として経費計上可能。一括償却や減価償却で法人税・所得税を軽減できます。",
    color: "from-emerald-500/10 to-emerald-500/5",
  },
  {
    number: "02",
    icon: Building2,
    title: "戸建て・マンション・事業所OK",
    description: "太陽光パネル不要だから、屋根がなくても大丈夫。室内設置型でどこでも導入可能です。",
    color: "from-teal-500/10 to-teal-500/5",
  },
  {
    number: "03",
    icon: Zap,
    title: "停電時も0.01秒で切替",
    description: "UPS（無停電電源装置）機能搭載。PCやサーバーが止まらずに切り替わるので、BCP対策に最適です。",
    color: "from-green-500/10 to-green-500/5",
  },
  {
    number: "04",
    icon: Maximize2,
    title: "省スペース設計",
    description: "幅58cm×奥行17cmのコンパクト設計。リビング、事務所、バックヤードなど狭いスペースにも設置可能。",
    color: "from-lime-500/10 to-lime-500/5",
  },
  {
    number: "05",
    icon: Volume2,
    title: "静音設計",
    description: "運転時10〜50dB。エアコンと同等程度の静かさで、住宅や店舗でも気になりません。",
    color: "from-cyan-500/10 to-cyan-500/5",
  },
  {
    number: "06",
    icon: Smartphone,
    title: "WEBアプリで簡単管理",
    description: "24時間どこからでもリアルタイムでモニタリング・遠隔操作。ソフトウェアも自動更新されます。",
    color: "from-blue-500/10 to-blue-500/5",
  },
]

export function FeaturesSection() {
  const [visibleCards, setVisibleCards] = useState<number[]>([])
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            features.forEach((_, index) => {
              setTimeout(() => {
                setVisibleCards((prev) => [...prev, index])
              }, index * 100)
            })
          }
        })
      },
      { threshold: 0.1 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} id="features" className="py-16 md:py-20 lg:py-28 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー - スマホで読みやすく */}
        <div className="text-center mb-12 md:mb-16">
          <p className="text-primary font-semibold text-xs sm:text-sm tracking-wide mb-3">FEATURES</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight px-2">
            ENELEAGE Zero の特徴
          </h2>
        </div>

        {/* 特徴カード - スマホで1カラム、タブレットで2カラム、PCで3カラム */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.number}
              className={`group relative p-5 sm:p-6 md:p-8 rounded-2xl bg-gradient-to-br ${feature.color} border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 ${
                visibleCards.includes(index) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
            >
              {/* Number badge - スマホで少し小さく */}
              <span className="absolute top-3 right-3 sm:top-4 sm:right-4 text-4xl sm:text-5xl md:text-6xl font-black text-primary/10 group-hover:text-primary/20 transition-colors">
                {feature.number}
              </span>

              <div className="relative z-10">
                {/* アイコン - スマホで適切なサイズ */}
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                  <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>

                {/* タイトル - スマホで読みやすく */}
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground mb-2 sm:mb-3 pr-8">
                  {feature.title}
                </h3>

                {/* 説明 - スマホで読みやすく */}
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}