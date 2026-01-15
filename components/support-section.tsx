"use client"

import { Phone, Wrench, MapPin } from "lucide-react"
import { useEffect, useRef, useState } from "react"

const supportFeatures = [
  {
    icon: Wrench,
    title: "製品不具合は費用0円",
    description: "調査費・運送費・撤去費用・再設置費用など全てメーカー負担。設置後も安心です。",
  },
  {
    icon: Phone,
    title: "専門スタッフが対応",
    description: "インフォメーションセンターで専門スタッフがお電話にてサポートいたします。",
  },
  {
    icon: MapPin,
    title: "全国拠点から迅速対応",
    description: "札幌・仙台・東京・名古屋・大阪・広島・福岡など、お近くの拠点から対応します。",
  },
]

export function SupportSection() {
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
          <p className="text-primary font-semibold text-xs sm:text-sm tracking-wide mb-3">AFTER SUPPORT</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-3 sm:mb-4 px-2">
            充実のアフターサポート
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground px-4">
            販売後の商品対応はすべてメーカーが一次対応いたします
          </p>
        </div>

        {/* サポート特徴 - スマホで1カラム */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-10 sm:mb-12">
          {supportFeatures.map((feature, index) => (
            <div
              key={index}
              className={`p-5 sm:p-8 bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-xl transition-all duration-500 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 sm:mb-6">
                <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-foreground mb-2 sm:mb-3">{feature.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* サポートフロー - スマホで読みやすく */}
        <div
          className={`bg-card rounded-2xl border border-border p-5 sm:p-8 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "450ms" }}
        >
          <h3 className="font-bold text-base sm:text-lg text-foreground mb-5 sm:mb-6 text-center">不具合時の対応フロー</h3>
          
          {/* スマホ: 縦並び、PC: 横並び */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-4">
            {[
              { step: "01", title: "お問い合わせ", desc: "不具合・不調を感じたらコールセンターへ" },
              { step: "02", title: "リモート診断", desc: "専門スタッフが状況を確認" },
              { step: "03", title: "現地対応", desc: "必要に応じて技術者を派遣" },
              { step: "04", title: "復旧完了", desc: "故障部品交換で即日利用可能" },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="text-center p-3 sm:p-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary text-primary-foreground font-bold text-sm sm:text-base flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    {item.step}
                  </div>
                  <h4 className="font-semibold text-foreground text-sm sm:text-sm mb-1">{item.title}</h4>
                  <p className="text-xs sm:text-xs text-muted-foreground">{item.desc}</p>
                </div>
                
                {/* 矢印 - PCのみ表示 */}
                {index < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 text-muted-foreground">
                    →
                  </div>
                )}
                
                {/* 矢印 - スマホのみ表示 */}
                {index < 3 && (
                  <div className="md:hidden flex justify-center my-1">
                    <div className="text-muted-foreground text-lg">↓</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}