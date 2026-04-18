import { AlertTriangle, Zap, FolderOpen, Brain, CheckCircle2 } from 'lucide-react'

const steps = [
  {
    icon: AlertTriangle,
    label: 'Workflow fails',
    sub: 'n8n execution errors',
    iconColor: 'text-red-400',
    iconBg: 'bg-red-400/10 border-red-400/20',
    numColor: 'text-red-400/40',
  },
  {
    icon: Zap,
    label: 'Detected instantly',
    sub: 'Real-time sync picks it up',
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-400/10 border-amber-400/20',
    numColor: 'text-amber-400/40',
  },
  {
    icon: FolderOpen,
    label: 'Grouped into incident',
    sub: 'Same pattern = one ticket',
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-400/10 border-blue-400/20',
    numColor: 'text-blue-400/40',
  },
  {
    icon: Brain,
    label: 'AI explains root cause',
    sub: 'Fix steps in plain English',
    iconColor: 'text-violet-400',
    iconBg: 'bg-violet-400/10 border-violet-400/20',
    numColor: 'text-violet-400/40',
  },
  {
    icon: CheckCircle2,
    label: 'Fixed in seconds',
    sub: 'One-click retry to confirm',
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-400/10 border-emerald-400/20',
    numColor: 'text-emerald-400/40',
  },
]

export default function ValueLoop() {
  return (
    <section className="py-28 bg-[#0d0d14] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20">
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-white leading-tight">
            From failure to fixed —{' '}
            <span className="gradient-text">in seconds.</span>
          </h2>
          <p className="mt-4 text-zinc-500 text-lg max-w-lg mx-auto">
            The entire resolution loop happens inside FlowMonix. No context switching, no tab diving.
          </p>
        </div>

        {/* Desktop: horizontal */}
        <div className="hidden md:flex items-start relative">
          {/* Connecting gradient line behind steps */}
          <div className="absolute top-[2.1rem] left-[4.5rem] right-[4.5rem] h-px bg-gradient-to-r from-red-400/20 via-violet-400/30 to-emerald-400/20" />

          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={step.label} className="flex-1 flex flex-col items-center gap-4 relative z-10">
                {/* Circle */}
                <div className={`w-[4.5rem] h-[4.5rem] rounded-2xl border ${step.iconBg} flex items-center justify-center bg-[#0d0d14]`}>
                  <Icon className={`w-7 h-7 ${step.iconColor}`} />
                </div>
                {/* Label */}
                <div className="text-center px-2">
                  <div className={`font-display font-extrabold text-xs mb-1 ${step.numColor} tracking-widest`}>
                    0{i + 1}
                  </div>
                  <p className="text-sm font-semibold text-zinc-200 leading-snug">{step.label}</p>
                  <p className="text-xs text-zinc-600 mt-1 leading-snug">{step.sub}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Mobile: vertical */}
        <div className="md:hidden space-y-0">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={step.label} className="flex gap-5">
                {/* Left: icon + connector */}
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-xl border ${step.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${step.iconColor}`} />
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-px flex-1 min-h-[2rem] bg-white/[0.07] my-1" />
                  )}
                </div>
                {/* Right: text */}
                <div className="pt-2 pb-6">
                  <div className={`text-[10px] font-bold tracking-widest uppercase ${step.numColor} mb-0.5`}>
                    0{i + 1}
                  </div>
                  <p className="text-sm font-semibold text-zinc-200">{step.label}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">{step.sub}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
