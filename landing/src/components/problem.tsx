import { EyeOff, FileSearch, Timer, MessageCircleWarning } from 'lucide-react'

const problems = [
  {
    icon: EyeOff,
    title: 'No central visibility',
    description:
      'Workflows everywhere. No single source of truth.',
    iconColor: 'text-orange-400',
    iconBg: 'bg-orange-400/10',
    borderAccent: 'hover:border-orange-400/20',
  },
  {
    icon: FileSearch,
    title: 'Failures get buried in logs',
    description:
      'n8n logs errors. It doesn\'t surface patterns, group failures, or flag what keeps recurring.',
    iconColor: 'text-red-400',
    iconBg: 'bg-red-400/10',
    borderAccent: 'hover:border-red-400/20',
  },
  {
    icon: Timer,
    title: 'Debugging takes too long',
    description:
      'Find the execution. Open the node. Repeat. Fully manual. Completely slow.',
    iconColor: 'text-orange-500',
    iconBg: 'bg-orange-500/10',
    borderAccent: 'hover:border-orange-500/20',
  },
  {
    icon: MessageCircleWarning,
    title: 'Clients expect answers instantly',
    description:
      'When it breaks, someone\'s waiting. Without visibility, you\'re always last to know.',
    iconColor: 'text-red-500',
    iconBg: 'bg-red-500/10',
    borderAccent: 'hover:border-red-500/20',
  },
]

export default function Problem() {
  return (
    <section className="py-28 bg-[#0d0d14]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-5">The Problem</p>
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-white leading-tight">
            n8n is powerful — but when something
            <br className="hidden sm:block" /> breaks,{' '}
            <span className="text-red-400">you&apos;re blind.</span>
          </h2>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {problems.map((p) => {
            const Icon = p.icon
            return (
              <div
                key={p.title}
                className={`glass-card rounded-2xl p-7 group transition-all duration-300 ${p.borderAccent} hover:bg-white/[0.03]`}
              >
                <div className={`w-11 h-11 rounded-xl ${p.iconBg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-5 h-5 ${p.iconColor}`} />
                </div>
                <h3 className="font-display font-bold text-white text-lg mb-2">{p.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{p.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
