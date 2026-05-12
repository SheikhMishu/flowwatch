import Hero from '@/components/hero'
import Problem from '@/components/problem'
import Solution from '@/components/solution'
import ValueLoop from '@/components/value-loop'
import Features from '@/components/features'
import WhoItsFor from '@/components/who-its-for'
import Trust from '@/components/trust'
import Pricing from '@/components/pricing'
import SignupForm from '@/components/signup-form'
import CtaFinal from '@/components/cta-final'
import Footer from '@/components/footer'
import ScrollToTop from '@/components/scroll-to-top'

export default function Home() {
  return (
    <>
    <ScrollToTop />
    <main>
      <Hero />
      <Problem />
      <Solution />
      <ValueLoop />
      <Features />
      <WhoItsFor />
      <Trust />
      <Pricing />
      <SignupForm />
      <CtaFinal />
      <Footer />
    </main>
    </>
  )
}
