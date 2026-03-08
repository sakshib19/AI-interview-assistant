import { Navigation } from "../components/landing/navigation"
import { Hero } from "../components/landing/hero"
import { Features } from "../components/landing/features"
import { HowItWorks } from "../components/landing/how-it-works"
import { SocialProof } from "../components/landing/social-proof"
import { Footer } from "../components/landing/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950">
      <Navigation />
      <Hero />
      <Features />
      <HowItWorks />
      <SocialProof />
      <Footer />
    </main>
  )
}
