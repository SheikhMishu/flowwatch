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
      "A client chased me about a broken CRM sync that had been failing for 3 days. I had no idea. That was the last straw. FlowMonix caught the next failure in 4 minutes. Never missed one since.",
    name: 'Marcus T.',
    role: 'Automation Agency · 20+ clients',
    initials: 'MT',
    from: 'from-indigo-600',
    to: 'to-violet-600',
  },
  {
    quote:
      "Spent 2 hours once tracing a webhook failure through 14 nodes. FlowMonix showed me the exact problem in 8 seconds the first time I tried it. I genuinely laughed out loud.",
    name: 'Priya S.',
    role: 'Freelance n8n Developer',
    initials: 'PS',
    from: 'from-violet-600',
    to: 'to-purple-600',
  },
  {
    quote:
      "We had 60 workflows across 3 instances and no idea what was healthy. Now I open one tab and see everything. Turned our n8n setup from a liability into something I can defend in a board meeting.",
    name: 'Tom W.',
    role: 'Head of Automation · SaaS Startup',
    initials: 'TW',
    from: 'from-blue-600',
    to: 'to-indigo-600',
  },
  {
    quote:
      "The status page sold it for me. I sent the link to a client and they stopped asking 'is the integration working?' completely. That alone is worth the subscription.",
    name: 'Jess R.',
    role: 'Solo n8n Consultant',
    initials: 'JR',
    from: 'from-indigo-500',
    to: 'to-blue-600',
  },
  {
    quote:
      "We were getting duplicate Slack alerts every time the same node broke. With FlowMonix cooldowns, that noise is gone. My team actually reads alerts now because they mean something.",
    name: 'Daniel K.',
    role: 'Automation Lead · E-commerce Agency',
    initials: 'DK',
    from: 'from-violet-500',
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
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.slice(0, 3).map((t) => (
              <div key={t.name} className="glass-card rounded-2xl p-6 relative group hover:border-white/10 transition-all duration-300">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:mx-[16.67%]">
            {testimonials.slice(3).map((t) => (
              <div key={t.name} className="glass-card rounded-2xl p-6 relative group hover:border-white/10 transition-all duration-300">
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
