import { Eye, Brain, RotateCcw, LayoutDashboard } from 'lucide-react'

const solutions = [
  {
    icon: Eye,
    title: 'See failures instantly',
    description:
      'Real-time feed of every failed execution across all connected n8n instances — in one place, the moment it happens.',
  },
  {
    icon: Brain,
    title: 'Understand root cause with AI',
    description:
      'One-click AI analysis explains what broke, why it broke, and exactly how to fix it. No log archaeology required.',
  },
  {
    icon: RotateCcw,
    title: 'Retry executions in one click',
    description:
      'Identify the issue, understand the fix, re-run the workflow — without ever leaving FlowMonix or opening n8n.',
  },
  {
    icon: LayoutDashboard,
    title: 'Monitor all workflows in one place',
    description:
      'Full workflow health dashboard: success rates, execution history, instance status, and incident count at a glance.',
  },
]

export default function Solution() {
  return (
    <section className="py-28 bg-[#09090b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-5">The Solution</p>
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-white leading-tight">
            A real-time{' '}
            <span className="gradient-text">command center</span>
            <br className="hidden sm:block" /> for your automations.
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {solutions.map((s, i) => {
            const Icon = s.icon
            return (
              <div
                key={s.title}
                className="group relative rounded-2xl p-8 border border-white/[0.07] bg-gradient-to-br from-white/[0.025] to-transparent hover:border-indigo-500/25 hover:from-indigo-500/[0.04] transition-all duration-300"
              >
                {/* Background number */}
                <div className="absolute top-6 right-7 font-display font-extrabold text-6xl text-white/[0.04] select-none pointer-events-none">
                  {String(i + 1).padStart(2, '0')}
                </div>

                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600/20 to-violet-600/20 flex items-center justify-center mb-5 group-hover:from-indigo-600/30 group-hover:to-violet-600/30 transition-all duration-300">
                  <Icon className="w-5 h-5 text-indigo-400" />
                </div>

                <h3 className="font-display font-bold text-white text-xl mb-2.5">{s.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{s.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
