import { ArrowRight, Sparkles } from 'lucide-react'

export default function CtaFinal() {
  return (
    <section className="py-24 bg-[#0d0d14] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700" />

          {/* Dot pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '28px 28px',
            }}
          />

          {/* Glow orbs inside the card */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/20 rounded-full blur-3xl pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 text-center py-20 sm:py-24 px-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 mb-8">
              <Sparkles className="w-3.5 h-3.5 text-white/80" />
              <span className="text-xs font-semibold text-white/80 tracking-wide">
                Free to start — no credit card required
              </span>
            </div>

            <h2 className="font-display font-extrabold text-5xl sm:text-6xl lg:text-7xl text-white mb-4 leading-[1.05]">
              Stop guessing.
              <br />
              Start knowing what broke — instantly.
            </h2>

            <p className="text-white/60 text-lg mb-10 max-w-sm mx-auto leading-relaxed">
              Join the waitlist and be among the first to get access.
            </p>

            <a
              href="#signup"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-white text-indigo-700 font-bold text-base hover:bg-white/95 hover:scale-[1.02] active:scale-100 transition-all duration-200 shadow-2xl shadow-black/30"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
