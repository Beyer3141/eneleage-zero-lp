"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Zap, Clock, ShieldCheck, Home, Building } from "lucide-react"
import { useEffect, useState } from "react"

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section className="relative min-h-screen flex flex-col bg-gradient-to-b from-muted/30 via-background to-background pt-20 overflow-hidden">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23000000' fillOpacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative flex-1 flex flex-col items-center justify-center px-4 md:px-6 py-8 md:py-12">
        {/* 削減率バッジ - スマホで大きく */}
        <div
          className={`absolute top-6 right-4 md:top-8 md:right-16 lg:right-24 z-20 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"
          }`}
          style={{ transitionDelay: "300ms" }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl scale-110" />
            <div className="relative bg-primary text-primary-foreground rounded-full w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 lg:w-48 lg:h-48 flex flex-col items-center justify-center text-center p-3 shadow-2xl border-4 border-primary-foreground/20">
              <p className="text-[0.5rem] sm:text-[10px] md:text-xs font-medium">ソーラーパネルなしで</p>
              <p className="text-[9px] sm:text-[10px] md:text-xs mt-0.5">電気代平均</p>
              <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black">
                40<span className="text-base sm:text-lg md:text-xl">%</span>
              </p>
              <p className="text-[9px] sm:text-[10px] md:text-xs font-medium">削減</p>
            </div>
          </div>
        </div>

        {/* 日本初バッジ - スマホで大きく */}
        <div
          className={`absolute top-6 left-4 md:top-8 md:left-16 lg:left-24 z-20 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"
          }`}
          style={{ transitionDelay: "400ms" }}
        >
          <div className="bg-foreground text-background px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg">
            日本初
          </div>
        </div>

        {/* Product image - スマホで適切なサイズ */}
        <div
          className={`relative w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto mb-6 md:mb-8 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-3xl blur-3xl scale-90" />
          <img
            src="/images/807-e4-bc-9a-e8-ad-b0-e5-ae-a4.png"
            alt="VOLTA 蓄電池"
            className="relative w-full h-auto object-contain drop-shadow-2xl"
          />
        </div>

        {/* テキストコンテンツ - スマホで読みやすく */}
        <div
          className={`text-center max-w-3xl mx-auto px-2 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "200ms" }}
        >
          <p className="text-primary font-semibold text-sm sm:text-base md:text-base mb-3 tracking-wide">
            太陽光パネルなしで電気代を削減する
          </p>

          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] text-foreground mb-3 sm:mb-4">
            ENELEAGE Zero
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-2 sm:mb-3">
            革新的なエネルギーマネジメントシステムで、
          </p>
          <p className="text-base sm:text-lg md:text-xl text-foreground font-medium mb-5 sm:mb-6">
            家庭にも、事業所にも、新しい電力の選択を。
          </p>

          {/* アイコン - スマホで見やすく */}
          <div className="flex justify-center gap-4 sm:gap-6 mb-5 sm:mb-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Home className="w-5 h-5 sm:w-5 sm:h-5 text-primary" />
              <span className="text-xs sm:text-sm">一般家庭</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building className="w-5 h-5 sm:w-5 sm:h-5 text-primary" />
              <span className="text-xs sm:text-sm">事業所・店舗</span>
            </div>
          </div>

          {/* 特徴バッジ - スマホで縦並び */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
            <div className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2.5 sm:py-2 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
              <Zap className="w-4 h-4 sm:w-4 sm:h-4 text-primary" />
              <span className="text-sm sm:text-sm font-medium text-foreground">年間約15万円削減</span>
            </div>
            <div className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2.5 sm:py-2 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
              <Clock className="w-4 h-4 sm:w-4 sm:h-4 text-primary" />
              <span className="text-sm sm:text-sm font-medium text-foreground">0.01秒で切替</span>
            </div>
            <div className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2.5 sm:py-2 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
              <ShieldCheck className="w-4 h-4 sm:w-4 sm:h-4 text-primary" />
              <span className="text-sm sm:text-sm font-medium text-foreground">15年保証</span>
            </div>
          </div>

          {/* CTAボタン - スマホで大きく */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 sm:px-8 h-12 sm:h-14 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all w-full sm:w-auto"
              asChild
            >
              <a href="/simulator">
                料金シミュレーター
                <ArrowRight className="ml-2 w-5 h-5" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-border text-foreground hover:bg-muted h-12 sm:h-14 bg-card text-base font-medium w-full sm:w-auto"
              asChild
            >
              <a href="#problem">詳しく見る</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}