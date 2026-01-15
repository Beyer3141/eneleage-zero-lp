import { HeroSection } from "@/components/hero-section"
import { ProblemSection } from "@/components/problem-section"
import { SolutionSection } from "@/components/solution-section"
import { FeaturesSection } from "@/components/features-section"
import { EmsSection } from "@/components/ems-section"
import { BenefitsSection } from "@/components/benefits-section"
import { ComparisonSection } from "@/components/comparison-section"
import { SpecsSection } from "@/components/specs-section"
import { SupportSection } from "@/components/support-section"
import { CtaSection } from "@/components/cta-section"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <FeaturesSection />
      <EmsSection />
      <BenefitsSection />
      <ComparisonSection />
      <SpecsSection />
      <SupportSection />
      <CtaSection />
      <Footer />
    </main>
  )
}
