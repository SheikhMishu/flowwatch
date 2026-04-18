'use client'

import { useState } from 'react'
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'

export default function Waitlist() {
  const [email, setEmail] = useState('')
  const [instances, setInstances] = useState('')
  const [agency, setAgency] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !instances || !agency) {
      setError('Please fill in all fields.')
      return
    }
    setError('')
    setStatus('loading')

    // TODO: wire up to Supabase / Resend / your backend
    await new Promise((r) => setTimeout(r, 1200))
    setStatus('success')
  }

  return (
    <section id="signup" className="py-28 bg-[#09090b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">Early Access</p>
            <h2 className="font-display font-bold text-4xl sm:text-5xl text-white mb-3">
              Get started free.
            </h2>
            <p className="text-zinc-500 text-base">
              First 200 users get <span className="text-indigo-400 font-semibold">Pro free for 3 months</span> — no credit card required.
            </p>
          </div>

          {/* Form */}
          {status === 'success' ? (
            <div className="glass-card rounded-2xl p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-400/10 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="font-display font-bold text-white text-2xl mb-2">You&apos;re on the list!</h3>
              <p className="text-zinc-500 text-sm leading-relaxed mb-1">
                We&apos;ll invite users in batches — check your inbox for a confirmation.
              </p>
              <p className="text-zinc-600 text-xs mt-4">
                Share your link to move up the queue (coming soon)
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">
                  Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@agency.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.07] transition-all duration-200"
                />
              </div>

              {/* Instance count */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">
                  How many n8n instances do you run?
                </label>
                <select
                  required
                  value={instances}
                  onChange={(e) => setInstances(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.07] transition-all duration-200 appearance-none cursor-pointer"
                >
                  <option value="" disabled className="bg-zinc-900">Select...</option>
                  <option value="1" className="bg-zinc-900">1 (just me)</option>
                  <option value="2-5" className="bg-zinc-900">2–5</option>
                  <option value="6-10" className="bg-zinc-900">6–10</option>
                  <option value="10+" className="bg-zinc-900">10+</option>
                </select>
              </div>

              {/* Agency qualifier */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wide">
                  Are you using n8n for clients?
                </label>
                <div className="flex gap-3">
                  {[
                    { value: 'yes', label: 'Yes — agency / freelance' },
                    { value: 'no', label: 'No — personal use' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAgency(opt.value)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
                        agency === opt.value
                          ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
                          : 'border-white/10 text-zinc-500 hover:border-white/20 hover:text-zinc-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && <p className="text-red-400 text-xs">{error}</p>}

              {/* Submit */}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm hover:opacity-90 hover:scale-[1.01] active:scale-100 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-indigo-900/30 mt-2"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    Start for Free
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-zinc-700 text-xs text-center pt-1">
                No spam. No credit card. Invite-only access.
              </p>
              <p className="text-indigo-400/60 text-xs text-center font-medium">
                Limited early access — invites sent weekly
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
