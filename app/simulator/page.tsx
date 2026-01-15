import { Metadata } from 'next'
import { SimulatorForm } from '@/components/simulator/simulator-form'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

export const metadata: Metadata = {
  title: '料金シミュレーター | ENELEAGE Zero',
  description: '月別の電気代推移と削減効果を実データで可視化。年間の削減額を確認。',
}

export default function SimulatorPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <section className="relative py-20 md:py-28 bg-gradient-to-b from-muted/30 via-background to-background overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23000000' fillOpacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        
        <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-6">
            <span className="text-sm font-medium text-primary">年間削減額を可視化</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            電気代削減シミュレーター
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            月別の電気代推移と削減効果をグラフで確認。<br />
            1年間でどれだけ節約できるか、一目でわかります
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <SimulatorForm />
        </div>
      </section>

      <Footer />
    </main>
  )
}