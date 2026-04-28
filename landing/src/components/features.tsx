import Image from 'next/image'
import { FolderOpen, Brain, Bell, RotateCcw, Globe } from 'lucide-react'
import { AnimateOnScroll } from './animate-on-scroll'

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
    image: '/images/incidents.png',
    imageAlt: 'FlowMonix incident detection grouping 7 failures into one incident with timeline',
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
    image: '/images/analytics.png',
    imageAlt: 'FlowMonix analytics showing top failing workflows with retry actions',
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
    image: '/images/debugging.png',
    imageAlt: 'FlowMonix AI debugging panel showing root cause analysis and fix steps',
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
    image: '/images/alerts.png',
    imageAlt: 'FlowMonix smart alerts configuration with Slack and email channels',
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
    image: '/images/status-page.png',
    imageAlt: 'FlowMonix public status page showing workflow health to clients',
  },
]

export default function Features() {
  return (
    <section className="py-28 bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <AnimateOnScroll className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-5">Features</p>
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-zinc-900">
            Everything you need.{' '}
            <span className="text-zinc-400">Nothing you don&apos;t.</span>
          </h2>
        </AnimateOnScroll>

        {/* First 4 features: 2-col grid */}
        <AnimateOnScroll animation="stagger-children" className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {features.slice(0, 4).map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="group glass-card rounded-2xl overflow-hidden hover:border-indigo-200 hover:shadow-md transition-all duration-300"
              >
                {/* Text content */}
                <div className="p-7">
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center group-hover:from-indigo-200 group-hover:to-violet-200 transition-all duration-300">
                      <Icon className="w-5 h-5 text-indigo-600" />
                    </div>
                    {f.badge && (
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${f.badgeColor}`}>
                        {f.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-bold text-zinc-900 text-xl mb-2">{f.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed mb-4">{f.description}</p>
                  <ul className="space-y-2">
                    {f.points.map((pt) => (
                      <li key={pt} className="flex items-start gap-2.5 text-sm text-zinc-500">
                        <span className="mt-[3px] w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        </span>
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Screenshot */}
                <div className="mx-4 mb-4 rounded-xl overflow-hidden border border-zinc-200 shadow-sm">
                  <Image
                    src={f.image}
                    alt={f.imageAlt}
                    width={800}
                    height={500}
                    className="w-full h-auto"
                  />
                </div>
              </div>
            )
          })}
        </AnimateOnScroll>

        {/* Last feature: full-width with image on the side */}
        {features.slice(4).map((f) => {
          const Icon = f.icon
          return (
            <AnimateOnScroll key={f.title}>
              <div className="group glass-card rounded-2xl overflow-hidden hover:border-indigo-200 hover:shadow-md transition-all duration-300">
                <div className="md:flex">
                  {/* Text */}
                  <div className="p-7 md:w-2/5 flex flex-col justify-center">
                    <div className="flex items-start justify-between mb-5">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center group-hover:from-indigo-200 group-hover:to-violet-200 transition-all duration-300">
                        <Icon className="w-5 h-5 text-indigo-600" />
                      </div>
                      {f.badge && (
                        <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${f.badgeColor}`}>
                          {f.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="font-display font-bold text-zinc-900 text-xl mb-2">{f.title}</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed mb-5">{f.description}</p>
                    <ul className="space-y-2.5">
                      {f.points.map((pt) => (
                        <li key={pt} className="flex items-start gap-2.5 text-sm text-zinc-500">
                          <span className="mt-[3px] w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          </span>
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Screenshot */}
                  <div className="md:w-3/5 p-4 flex items-center">
                    <div className="rounded-xl overflow-hidden border border-zinc-200 shadow-sm w-full">
                      <Image
                        src={f.image}
                        alt={f.imageAlt}
                        width={900}
                        height={560}
                        className="w-full h-auto"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          )
        })}
      </div>
    </section>
  )
}
