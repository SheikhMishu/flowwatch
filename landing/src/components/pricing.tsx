import { ArrowRight, Check } from 'lucide-react'
import { AnimateOnScroll } from './animate-on-scroll'

const plans = [
  {
    name: 'Free',
    price: '$0',
    per: null,
    description: 'For individuals getting started with n8n monitoring.',
    features: [
      '1 n8n instance',
      '7-day data retention',
      '2 team members',
      '2 alert rules',
      'Email & webhook alerts',
    ],
    cta: 'Get Started',
    popular: false,
    cardStyle: 'glass-card hover:border-zinc-300 hover:shadow-md',
    ctaStyle: 'border border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 hover:bg-zinc-50',
  },
  {
    name: 'Pro',
    price: '$29',
    per: '/mo',
    description: 'For serious users who rely on automations being up.',
    features: [
      '5 n8n instances',
      '30-day data retention',
      '10 team members',
      '20 alert rules',
      'AI debugging (100 req/mo)',
      'Slack + email + webhook alerts',
    ],
    cta: 'Get Started',
    popular: true,
    cardStyle: 'gradient-border shadow-xl shadow-indigo-200/60',
    ctaStyle: 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-90',
  },
  {
    name: 'Team',
    price: '$99',
    per: '/mo',
    description: 'For agencies managing client automations at scale.',
    features: [
      '10 n8n instances',
      '90-day data retention',
      'Unlimited members',
      'Unlimited alert rules',
      'AI debugging (500 req/mo)',
      'All alert channels',
    ],
    cta: 'Get Started',
    popular: false,
    cardStyle: 'glass-card hover:border-zinc-300 hover:shadow-md',
    ctaStyle: 'border border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 hover:bg-zinc-50',
  },
]

export default function Pricing() {
  return (
    <section className="py-28 bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <AnimateOnScroll className="text-center mb-16">
          <div className="w-8 h-[2px] bg-indigo-500 mx-auto mb-3" />
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-5">Pricing</p>
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-zinc-900">
            Simple pricing.{' '}
            <span className="text-zinc-400">No surprises.</span>
          </h2>
          <p className="mt-4 text-zinc-500 text-lg">
            Start free — no credit card required.
          </p>
        </AnimateOnScroll>

        {/* Anchor nudge */}
        <AnimateOnScroll animation="fade-in" delay={100} className="text-center mb-6">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest">
            Most agencies choose Team
          </p>
        </AnimateOnScroll>

        {/* Plan cards */}
        <AnimateOnScroll animation="stagger-children" className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div key={plan.name} className={`relative rounded-2xl p-7 transition-all duration-300 ${plan.cardStyle}`}>
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold shadow-lg shadow-indigo-900/30">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div className="mb-6">
                <p className="text-zinc-500 font-semibold text-sm mb-1">{plan.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="font-display font-extrabold text-4xl text-zinc-900">{plan.price}</span>
                  {plan.per && <span className="text-zinc-400 text-sm">{plan.per}</span>}
                </div>
                <p className="text-zinc-400 text-xs mt-2 leading-relaxed">{plan.description}</p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-7">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-600">
                    <Check className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href="#signup"
                className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${plan.ctaStyle}`}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          ))}
        </AnimateOnScroll>

        {/* Footnote */}
        <p className="text-center text-zinc-400 text-xs mt-8">
          All plans include public status page, in-app help center, and branded email notifications.
        </p>
      </div>
    </section>
  )
}
