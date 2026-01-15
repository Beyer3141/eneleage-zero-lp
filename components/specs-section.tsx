"use client"

import { Battery, Gauge, Timer, RefreshCw, ShieldCheck, Box, Thermometer, Wifi } from "lucide-react"

const specs = [
  { icon: Battery, label: "蓄電容量", value: "10.3", unit: "kWh", description: "使用可能容量" },
  { icon: Gauge, label: "定格出力", value: "5,000", unit: "W", description: "系統連系時" },
  { icon: Timer, label: "停電時切替", value: "0.01", unit: "秒", description: "UPS機能搭載" },
  { icon: RefreshCw, label: "サイクル寿命", value: "10,000", unit: "回", description: "60%容量維持" },
  { icon: ShieldCheck, label: "保証期間", value: "15", unit: "年", description: "業界最長クラス" },
  { icon: Box, label: "設置方法", value: "室内", unit: "床置き", description: "工事不要" },
  { icon: Thermometer, label: "動作温度", value: "-15〜60", unit: "°C", description: "推奨0〜40°C" },
  { icon: Wifi, label: "通信", value: "RS485", unit: "CAN", description: "遠隔監視対応" },
]

const detailSpecs = [
  { label: "名称", value: "ENELEAGE Zero" },
  { label: "電池種別", value: "リチウムリン酸鉄（LFP）" },
  { label: "搭載容量", value: "11.776kWh" },
  { label: "電力方式", value: "単相三線式" },
  { label: "出力電圧", value: "100V・200V" },
  { label: "対応周波数", value: "50Hz/60Hz（自動切替）" },
  { label: "対応電圧", value: "38.4〜60V" },
  { label: "停電時自立出力", value: "5kW（全負荷型/200V出力）" },
]

export function SpecsSection() {
  return (
    <section id="specs" className="py-16 md:py-20 lg:py-28 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー - スマホで読みやすく */}
        <div className="text-center mb-12 md:mb-16">
          <p className="text-primary font-semibold text-xs sm:text-sm tracking-wide mb-3">SPECIFICATIONS</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight px-2">製品仕様</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-start">
          {/* 製品画像 - スマホで読みやすく */}
          <div className="relative order-2 lg:order-1">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-3xl blur-3xl" />
            <div className="relative bg-card rounded-2xl p-5 sm:p-8 border border-border">
              <img
                src="/images/807-e4-bc-9a-e8-ad-b0-e5-ae-a4.png"
                alt="VOLTA 蓄電池"
                className="w-full max-w-xs sm:max-w-sm mx-auto h-auto object-contain"
              />
              {/* サイズ表示 - スマホで3カラム */}
              <div className="mt-5 sm:mt-6 grid grid-cols-3 gap-2 sm:gap-4 text-center">
                <div className="p-2.5 sm:p-3 bg-muted rounded-lg sm:rounded-xl">
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">高さ</p>
                  <p className="text-base sm:text-lg font-bold text-foreground">94.1cm</p>
                </div>
                <div className="p-2.5 sm:p-3 bg-muted rounded-lg sm:rounded-xl">
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">幅</p>
                  <p className="text-base sm:text-lg font-bold text-foreground">58cm</p>
                </div>
                <div className="p-2.5 sm:p-3 bg-muted rounded-lg sm:rounded-xl">
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">奥行</p>
                  <p className="text-base sm:text-lg font-bold text-foreground">17cm</p>
                </div>
              </div>
            </div>
          </div>

          {/* スペック一覧 - スマホで読みやすく */}
          <div className="order-1 lg:order-2">
            {/* スペックカード - スマホで2カラム */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 mb-6 sm:mb-8">
              {specs.map((spec, index) => (
                <div
                  key={index}
                  className="group p-3 sm:p-4 rounded-lg sm:rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                >
                  <spec.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">{spec.label}</p>
                  <p className="text-base sm:text-xl font-bold text-foreground">
                    {spec.value}
                    <span className="text-[10px] sm:text-xs font-normal text-muted-foreground ml-1">{spec.unit}</span>
                  </p>
                  <p className="text-[9px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">{spec.description}</p>
                </div>
              ))}
            </div>

            {/* 詳細スペック - スマホで読みやすく */}
            <div className="bg-muted/50 rounded-xl p-4 sm:p-6 border border-border">
              <h4 className="font-semibold text-sm sm:text-base text-foreground mb-3 sm:mb-4">詳細仕様</h4>
              <div className="space-y-1.5 sm:space-y-2">
                {detailSpecs.map((item, index) => (
                  <div key={index} className="flex justify-between py-1.5 sm:py-2 border-b border-border last:border-b-0 gap-2">
                    <span className="text-xs sm:text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-xs sm:text-sm font-medium text-foreground text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}