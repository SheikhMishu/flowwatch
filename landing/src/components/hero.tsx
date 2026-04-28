import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { FlowMonixMark } from './brand-mark'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden dot-grid">
      {/* Background glow orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="glow-orb absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-indigo-600/10 blur-[140px]" />
        <div className="glow-orb absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-[100px]" style={{ animationDelay: '2s' }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <FlowMonixMark className="w-5 h-5" />
          </div>
          <span className="font-display font-extrabold text-lg tracking-tight">
            <span className="text-zinc-900">Flow</span>
            <span style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>monix</span>
          </span>
        </div>
        <a
          href="#signup"
          className="flex items-center gap-1.5 text-sm text-zinc-800 hover:text-zinc-900 transition-colors duration-200"
        >
          Get Started <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </nav>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        {/* Badge */}
        <div className="animate-in gradient-border inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-8 cursor-default">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-xs font-semibold text-indigo-600 tracking-widest uppercase">Built for n8n</span>
        </div>

        {/* Headline */}
        <h1 className="animate-in delay-100 font-display font-extrabold text-5xl sm:text-6xl lg:text-7xl text-zinc-900 leading-[1.06] tracking-tight mb-6">
          Know exactly what broke
          <br />
          <span className="gradient-text">in your automations</span>
          {' '}— before it costs you.
        </h1>

        {/* Subheadline */}
        <p className="animate-in delay-200 text-zinc-600 text-lg sm:text-xl max-w-2xl leading-relaxed mb-10">
          FlowMonix monitors your n8n workflows, groups failures into incidents,
          and explains errors with AI — so you can fix issues in seconds, not hours.
        </p>

        {/* CTAs */}
        <div className="animate-in delay-300 flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="#signup"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm hover:opacity-90 hover:scale-[1.02] active:scale-100 transition-all duration-200 shadow-lg shadow-indigo-900/40"
          >
            Start Free
            <ArrowRight className="w-4 h-4" />
          </a>
          {/* View Demo button hidden until demo video is recorded */}
        </div>

        {/* Trust pills */}
        <div className="animate-in delay-400 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-4 text-xs">
          {['Free to start', 'No credit card', 'Works with any n8n'].map((item, i, arr) => (
            <span key={item} className="flex items-center gap-6">
              <span className="text-zinc-600 font-medium">{item}</span>
              {i < arr.length - 1 && <span className="w-px h-3 bg-zinc-300 inline-block" />}
            </span>
          ))}
        </div>

        {/* Dashboard mockup
            float-anim: continuous gentle bob (starts after 1.5s)
            animate-in: one-time entrance fade-up (0.65s)
        */}
        <div className="float-anim mt-20 w-full max-w-5xl mx-auto">
          <div className="animate-in delay-500 relative">
            <div className="rounded-2xl border border-zinc-200 overflow-hidden shadow-2xl shadow-zinc-300/40">
              <Image
                src="/images/hero.png"
                alt="FlowMonix dashboard showing live workflow monitoring and incident detection"
                width={1440}
                height={900}
                className="w-full h-auto"
                priority
              />
            </div>
            {/* Fade gradient at bottom blends into light page bg */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#f8fafc] to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  )
}
