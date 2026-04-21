import { Building2, User, Users } from 'lucide-react'
import { AnimateOnScroll } from './animate-on-scroll'

const audiences = [
  {
    icon: Building2,
    title: 'Agencies',
    description:
      'Managing multiple client automations across instances. You need cross-instance visibility and a status page to show clients you\'re on top of it.',
    tags: ['Multi-instance', 'Client status pages', 'Team roles'],
    gradient: 'from-indigo-600/20 to-violet-600/20',
    hoverGradient: 'group-hover:from-indigo-600/30 group-hover:to-violet-600/30',
    iconColor: 'text-indigo-400',
    tagStyle: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/15',
  },
  {
    icon: User,
    title: 'Freelancers',
    description:
      'Running mission-critical workflows solo. When something breaks, you need to know immediately and fix it fast — before your client notices.',
    tags: ['Instant alerts', 'AI debugging', 'Fast retries'],
    gradient: 'from-violet-600/20 to-purple-600/20',
    hoverGradient: 'group-hover:from-violet-600/30 group-hover:to-purple-600/30',
    iconColor: 'text-violet-400',
    tagStyle: 'bg-violet-500/10 text-violet-400 border-violet-500/15',
  },
  {
    icon: Users,
    title: 'Teams',
    description:
      "Can't afford silent automation failures. Need shared incident visibility, ownership tracking, and alerts that reach the right person.",
    tags: ['Incident ownership', 'Shared dashboard', 'Team alerts'],
    gradient: 'from-blue-600/20 to-indigo-600/20',
    hoverGradient: 'group-hover:from-blue-600/30 group-hover:to-indigo-600/30',
    iconColor: 'text-blue-400',
    tagStyle: 'bg-blue-500/10 text-blue-400 border-blue-500/15',
  },
]

export default function WhoItsFor() {
  return (
    <section className="py-28 bg-[#f1f5f9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <AnimateOnScroll className="text-center mb-16">
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-zinc-900 leading-tight">
            Built for people who{' '}
            <span className="gradient-text">can&apos;t afford</span>
            <br className="hidden sm:block" /> silent failures.
          </h2>
        </AnimateOnScroll>

        {/* Audience cards */}
        <AnimateOnScroll animation="stagger-children" className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {audiences.map((a) => {
            const Icon = a.icon
            return (
              <div
                key={a.title}
                className="group glass-card rounded-2xl p-7 hover:border-indigo-200 hover:shadow-md transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${a.gradient} ${a.hoverGradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-all duration-300`}>
                  <Icon className={`w-6 h-6 ${a.iconColor}`} />
                </div>

                <h3 className="font-display font-bold text-zinc-900 text-xl mb-3">{a.title}</h3>
                <p className="text-zinc-600 text-sm leading-relaxed mb-5">{a.description}</p>

                <div className="flex flex-wrap gap-2">
                  {a.tags.map((tag) => (
                    <span key={tag} className={`text-xs px-2.5 py-1 rounded-full border font-medium ${a.tagStyle}`}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </AnimateOnScroll>
      </div>
    </section>
  )
}
