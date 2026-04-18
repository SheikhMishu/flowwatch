import { ArrowRight, Play } from 'lucide-react'
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
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-900/40">
            <FlowMonixMark className="w-5 h-5" />
          </div>
          <span className="font-display font-extrabold text-lg tracking-tight">
            <span className="text-white">Flow</span>
            <span style={{ background: 'linear-gradient(135deg, #818CF8, #A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>monix</span>
          </span>
        </div>
        <a
          href="#signup"
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors duration-200"
        >
          Get Started <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </nav>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        {/* Badge */}
        <div className="animate-in gradient-border inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-8 cursor-default">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-xs font-semibold text-indigo-300 tracking-widest uppercase">Built for n8n</span>
        </div>

        {/* Headline */}
        <h1 className="animate-in delay-100 font-display font-extrabold text-5xl sm:text-6xl lg:text-7xl text-white leading-[1.06] tracking-tight mb-6">
          Know exactly what broke
          <br />
          <span className="gradient-text">in your automations</span>
          {' '}— before it costs you.
        </h1>

        {/* Subheadline */}
        <p className="animate-in delay-200 text-zinc-400 text-lg sm:text-xl max-w-2xl leading-relaxed mb-10">
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
          <a
            href="#demo"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-white/10 text-zinc-300 font-semibold text-sm hover:border-white/20 hover:text-white hover:bg-white/5 transition-all duration-200"
          >
            <Play className="w-4 h-4 fill-current opacity-60" />
            View Demo
          </a>
        </div>

        {/* Micro-proof */}
        <p className="animate-in delay-350 text-xs text-zinc-500 mt-5">
          Join 100+ n8n users already signed up
        </p>

        {/* Trust pills */}
        <div className="animate-in delay-400 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-4 text-xs text-zinc-600">
          {['Free to start', 'No credit card', 'Works with any n8n'].map((item, i, arr) => (
            <span key={item} className="flex items-center gap-6">
              <span className="text-zinc-400 font-medium">{item}</span>
              {i < arr.length - 1 && <span className="w-px h-3 bg-zinc-700 inline-block" />}
            </span>
          ))}
        </div>

        {/* Dashboard mockup */}
        <div className="animate-in delay-500 relative mt-20 w-full max-w-4xl mx-auto">
          <div className="rounded-2xl border border-white/10 bg-[#0d0d14] overflow-hidden shadow-2xl shadow-black/60">
            {/* Window chrome */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#111118]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-zinc-800" />
                <div className="w-3 h-3 rounded-full bg-zinc-800" />
                <div className="w-3 h-3 rounded-full bg-zinc-800" />
              </div>
              <div className="text-[11px] text-zinc-700 font-mono">app.flowmonix.com/dashboard</div>
              <div className="w-16" />
            </div>

            {/* Dashboard UI */}
            <div className="p-5 space-y-4">
              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total Workflows', value: '24', color: 'text-zinc-200' },
                  { label: 'Open Incidents', value: '3', color: 'text-red-400' },
                  { label: 'Success Rate', value: '96.4%', color: 'text-emerald-400' },
                ].map((s) => (
                  <div key={s.label} className="bg-[#111118] rounded-xl p-4 border border-white/5">
                    <p className="text-[10px] text-zinc-600 mb-1.5 font-medium">{s.label}</p>
                    <p className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Incidents list */}
              <div className="space-y-2">
                {[
                  { name: 'Stripe Webhook Handler', meta: '7 failures · 5 min', status: 'open', color: 'text-red-400 bg-red-400/10' },
                  { name: 'Slack Notification Flow', meta: '3 failures · 10 min', status: 'investigating', color: 'text-amber-400 bg-amber-400/10' },
                  { name: 'CRM Sync Pipeline', meta: '1 failure · 2 min ago', status: 'open', color: 'text-red-400 bg-red-400/10' },
                ].map((inc) => (
                  <div
                    key={inc.name}
                    className="flex items-center justify-between bg-[#111118] rounded-xl px-4 py-3 border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${inc.status === 'open' ? 'bg-red-400' : 'bg-amber-400'} animate-pulse flex-shrink-0`} />
                      <div className="text-left">
                        <p className="text-xs font-semibold text-zinc-200">{inc.name}</p>
                        <p className="text-[10px] text-zinc-600">{inc.meta}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${inc.color}`}>
                      {inc.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Fade gradient at bottom of mockup */}
          <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#09090b] to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  )
}
