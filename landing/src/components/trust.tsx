import { CheckCircle, Clock, Zap, BellOff, Globe, Bot } from 'lucide-react'
import { AnimateOnScroll } from './animate-on-scroll'

const trustPoints = [
  'No setup required — connect in under 2 minutes',
  'No self-hosting — fully managed, zero infra',
  'Works with your existing n8n — cloud or self-hosted',
  'Give clients their own status page — agencies love this',
]

const expectations = [
  {
    icon: Clock,
    title: 'Know within minutes, not hours',
    body: 'Sync runs every 5 minutes. The moment a workflow fails, FlowMonix picks it up — before your client does.',
  },
  {
    icon: Zap,
    title: 'One incident, not 40 alerts',
    body: 'Repeated failures with the same error are grouped into a single incident. No noise. Just signal.',
  },
  {
    icon: Bot,
    title: 'Understand errors in plain English',
    body: 'AI explains root cause and suggests a fix in one click. No more digging through n8n logs manually.',
  },
  {
    icon: BellOff,
    title: 'Alerts that actually mean something',
    body: 'Cooldowns prevent duplicate notifications. Your team reads alerts because they only fire when they matter.',
  },
  {
    icon: Globe,
    title: 'A status page you can share',
    body: 'Give clients a live URL showing system health. Stop fielding "is it working?" messages entirely.',
  },
  {
    icon: CheckCircle,
    title: 'Fix and close in the same tab',
    body: 'Retry failed executions, mark incidents resolved, and see the outcome — without opening n8n.',
  },
]

export default function Trust() {
  return (
    <section className="py-28 bg-[#f1f5f9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Headline */}
        <AnimateOnScroll className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-5">Built for real n8n users</p>
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-zinc-900 mb-6">
            What you can expect.
          </h2>

          {/* Trust checklist */}
          <AnimateOnScroll animation="stagger-children" className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto text-left mt-10">
            {trustPoints.map((pt) => (
              <div key={pt} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <span className="text-zinc-600 text-sm">{pt}</span>
              </div>
            ))}
          </AnimateOnScroll>
        </AnimateOnScroll>

        {/* Expectation cards */}
        <AnimateOnScroll animation="stagger-children" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {expectations.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="glass-card rounded-2xl p-6 hover:border-indigo-200 hover:shadow-md transition-all duration-300">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mb-4">
                  <Icon className="w-4.5 h-4.5 text-indigo-500" />
                </div>
                <p className="text-zinc-800 text-sm font-semibold mb-2">{item.title}</p>
                <p className="text-zinc-600 text-sm leading-relaxed">{item.body}</p>
              </div>
            )
          })}
        </AnimateOnScroll>
      </div>
    </section>
  )
}
