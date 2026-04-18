import { CheckCircle, Quote } from 'lucide-react'

const trustPoints = [
  'No setup required — connect in under 2 minutes',
  'No self-hosting — fully managed, zero infra',
  'Works with your existing n8n — cloud or self-hosted',
  'Give clients their own status page — agencies love this',
]

const testimonials = [
  {
    quote:
      "Finally, a way to know when a client's workflow breaks before they tell me. This is exactly what was missing from the n8n ecosystem.",
    name: 'Alex M.',
    role: 'n8n Agency Owner',
    initials: 'AM',
    from: 'from-indigo-600',
    to: 'to-violet-600',
  },
  {
    quote:
      "The AI debugging alone saves me an hour per incident. I see the root cause instantly instead of tracing through nodes one by one.",
    name: 'Sarah K.',
    role: 'Automation Freelancer',
    initials: 'SK',
    from: 'from-violet-600',
    to: 'to-purple-600',
  },
  {
    quote:
      "We manage 40+ client workflows. FlowMonix is the first tool that gives us real peace of mind — and our clients love the status pages.",
    name: 'David R.',
    role: 'Head of Automations',
    initials: 'DR',
    from: 'from-blue-600',
    to: 'to-indigo-600',
  },
]

export default function Trust() {
  return (
    <section className="py-28 bg-[#0d0d14]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Headline */}
        <div className="text-center mb-14">
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-white mb-10">
            Built for real n8n users.
          </h2>

          {/* Trust checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto text-left">
            {trustPoints.map((pt) => (
              <div key={pt} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <span className="text-zinc-400 text-sm">{pt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="relative">
          {/* "Placeholder" label above the cards */}
          <p className="text-center text-[11px] font-mono text-zinc-700 uppercase tracking-widest mb-5">
            Early access testimonials — placeholder
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map((t) => (
              <div key={t.name} className="glass-card rounded-2xl p-6 relative group hover:border-white/10 transition-all duration-300">
                {/* Placeholder watermark */}
                <div className="absolute top-3 right-3 text-[9px] text-zinc-800 font-mono uppercase tracking-widest">
                  placeholder
                </div>

                <Quote className="w-6 h-6 text-indigo-400/30 mb-4" />

                <p className="text-zinc-400 text-sm leading-relaxed italic mb-6">&ldquo;{t.quote}&rdquo;</p>

                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.from} ${t.to} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <span className="text-white text-xs font-bold">{t.initials}</span>
                  </div>
                  <div>
                    <p className="text-zinc-300 text-xs font-semibold">{t.name}</p>
                    <p className="text-zinc-600 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
