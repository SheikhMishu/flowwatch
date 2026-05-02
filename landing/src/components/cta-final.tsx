import { ArrowRight, Sparkles } from 'lucide-react'
import { AnimateOnScroll } from './animate-on-scroll'

export default function CtaFinal() {
  return (
    <section className="py-24 bg-[#f1f5f9] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll animation="scale-up" className="relative rounded-3xl overflow-hidden">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700" />

          {/* Sharp grid-line overlay */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,1) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />

          {/* Sharp top accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-white/0 via-white/50 to-white/0" />

          {/* Content */}
          <div className="relative z-10 text-center py-16 sm:py-24 px-5 sm:px-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 mb-8">
              <Sparkles className="w-3.5 h-3.5 text-white/80" />
              <span className="text-xs font-semibold text-white/80 tracking-wide">
                Free to start — no credit card required
              </span>
            </div>

            <h2 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-7xl text-white mb-4 leading-[1.08]">
              Stop guessing.
              <br />
              <span className="block sm:inline">Start knowing</span>{' '}
              <span className="block sm:inline">what broke — instantly.</span>
            </h2>

            <p className="text-white/60 text-base sm:text-lg mb-10 max-w-sm mx-auto leading-relaxed">
              Create your free account and start monitoring in minutes.
            </p>

            <a
              href="#signup"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-white text-indigo-700 font-bold text-base hover:bg-white/95 hover:scale-[1.02] active:scale-100 transition-all duration-200 shadow-2xl shadow-black/30"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  )
}
