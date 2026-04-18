import { FolderOpen, Brain, Bell, RotateCcw, Globe } from 'lucide-react'

const features = [
  {
    icon: FolderOpen,
    title: 'Incident Detection',
    badge: 'Your edge',
    badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    description: 'Stop chasing logs. FlowMonix groups repeated failures by error pattern into a single incident — with frequency, timeline, and auto-resolution built in.',
    points: [
      'Groups failures by error signature',
      'Shows frequency + timeline in one view',
      'Auto-resolves after 30 min of stability',
    ],
  },
  {
    icon: RotateCcw,
    title: 'One-Click Retry',
    badge: null,
    badgeColor: '',
    description: 'Identify the issue, fix it, re-run the workflow — without opening n8n. Resolve incidents end-to-end from a single dashboard.',
    points: [
      'Retry directly from incident cards',
      'No need to context-switch to n8n',
      'Available to viewers — read + retry only',
    ],
  },
  {
    icon: Brain,
    title: 'AI Debugging',
    badge: 'Pro',
    badgeColor: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    description: 'Know what broke and exactly how to fix it — without digging through node outputs or reading cryptic stack traces.',
    points: [
      'Root cause in plain English',
      'Step-by-step fix suggestions',
      'Cached per error — no redundant API calls',
    ],
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    badge: null,
    badgeColor: '',
    description: 'Get notified only when it actually matters. Real pattern-based triggers with built-in cooldowns so your team never gets spammed.',
    points: [
      'Trigger on real failure patterns',
      'Slack, email, and webhook channels',
      'Per-alert cooldowns — no spam',
    ],
  },
  {
    icon: Globe,
    title: 'Public Status Page',
    badge: 'Agencies',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    description: 'Give clients confidence without extra work. Auto-generated status pages show health, incidents, and uptime — no login required.',
    points: [
      'Custom slug per workspace',
      'Live incident count + instance health',
      'Auto-refreshes every 60 seconds',
    ],
  },
]

export default function Features() {
  return (
    <section className="py-28 bg-[#09090b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-5">Features</p>
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-white">
            Everything you need.{' '}
            <span className="text-zinc-600">Nothing you don&apos;t.</span>
          </h2>
        </div>

        {/* 2-col grid; last card spans full width */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((f, i) => {
            const Icon = f.icon
            const isLast = i === features.length - 1
            return (
              <div
                key={f.title}
                className={`group glass-card rounded-2xl p-7 hover:border-indigo-500/20 hover:bg-indigo-500/[0.02] transition-all duration-300 ${isLast ? 'md:col-span-2' : ''}`}
              >
                <div className={`flex items-start justify-between mb-5 ${isLast ? 'md:mb-0' : ''}`}>
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600/20 to-violet-600/20 flex items-center justify-center group-hover:from-indigo-600/30 group-hover:to-violet-600/30 transition-all duration-300">
                    <Icon className="w-5 h-5 text-indigo-400" />
                  </div>
                  {f.badge && (
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${f.badgeColor}`}>
                      {f.badge}
                    </span>
                  )}
                </div>

                <div className={isLast ? 'md:flex md:gap-12 md:items-start' : ''}>
                  <div className={isLast ? 'md:flex-1' : ''}>
                    <h3 className="font-display font-bold text-white text-xl mb-2">{f.title}</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">{f.description}</p>
                  </div>

                  <ul className={`mt-5 space-y-2.5 ${isLast ? 'md:mt-0 md:flex-1' : ''}`}>
                    {f.points.map((pt) => (
                      <li key={pt} className="flex items-start gap-2.5 text-sm text-zinc-500">
                        <span className="mt-[3px] w-4 h-4 rounded-full bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        </span>
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
