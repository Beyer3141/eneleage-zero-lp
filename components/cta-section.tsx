import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, FileText, MessageCircle } from "lucide-react"

export function CtaSection() {
  const formUrl =
    "https://docs.google.com/forms/d/e/1FAIpQLSdVRVxurB8AOO9KT1-Mv5kmM3A_VawLS-gB6mfW2Ia4LO-DuQ/viewform?usp=header"

  return (
    <section className="relative py-16 sm:py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-emerald-600" />
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          {/* バッジ - スマホで読みやすく */}
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-6 sm:mb-8">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            <span className="text-xs sm:text-sm font-medium text-white">無料シミュレーション実施中</span>
          </div>

          {/* ヘッダー - スマホで読みやすく */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-5 sm:mb-6 tracking-tight leading-tight px-2">
            あなたの電気代
            <br />
            削減額を無料で診断
          </h2>
          <p className="text-white/80 mb-8 sm:mb-10 text-sm sm:text-base md:text-lg max-w-xl mx-auto leading-relaxed px-4">
            ご家庭や事業所の電気使用状況をもとに、具体的な削減額を算出します。
            専門スタッフが最適なプランをご提案いたします。
          </p>

          {/* CTAボタン - スマホで縦並び */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-10 sm:mb-12">
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90 px-8 sm:px-10 h-12 sm:h-14 text-base font-semibold shadow-xl shadow-black/10 w-full sm:w-auto"
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
              className="border-2 border-white/30 text-white hover:bg-white/10 h-12 sm:h-14 bg-transparent text-base font-medium w-full sm:w-auto"
              asChild
            >
              <a href={formUrl} target="_blank" rel="noopener noreferrer">
                資料ダウンロード
              </a>
            </Button>
          </div>

          {/* 特徴アイコン - スマホで縦並び */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3 sm:p-4 backdrop-blur-sm">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white shrink-0" />
              <span className="text-white/90 text-xs sm:text-sm">お見積り無料</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3 sm:p-4 backdrop-blur-sm">
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white shrink-0" />
              <span className="text-white/90 text-xs sm:text-sm">専門スタッフ対応</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3 sm:p-4 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white shrink-0" />
              <span className="text-white/90 text-xs sm:text-sm">最短即日回答</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}