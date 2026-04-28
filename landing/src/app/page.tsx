import Hero from '@/components/hero'
import Problem from '@/components/problem'
import Solution from '@/components/solution'
import ValueLoop from '@/components/value-loop'
import Features from '@/components/features'
import WhoItsFor from '@/components/who-its-for'
import Pricing from '@/components/pricing'
import Trust from '@/components/trust'
import SignupForm from '@/components/signup-form'
import CtaFinal from '@/components/cta-final'
import Footer from '@/components/footer'

export default function Home() {
  return (
    <main>
      <Hero />
      <ValueLoop />
      <Problem />
      <Solution />
      <Features />
      <WhoItsFor />
      <Pricing />
      <Trust />
      <SignupForm />
      <CtaFinal />
      <Footer />
    </main>
  )
}
