'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { AnimateOnScroll } from './animate-on-scroll'

interface Attribution {
  utm_source: string
  utm_medium: string
  utm_campaign: string
  utm_content: string
  utm_term: string
  fbclid: string
  referrer: string
  landing_page: string
}

function getAttribution(): Attribution {
  const p = new URLSearchParams(window.location.search)
  return {
    utm_source: p.get('utm_source') ?? '',
    utm_medium: p.get('utm_medium') ?? '',
    utm_campaign: p.get('utm_campaign') ?? '',
    utm_content: p.get('utm_content') ?? '',
    utm_term: p.get('utm_term') ?? '',
    fbclid: p.get('fbclid') ?? '',
    referrer: document.referrer ?? '',
    landing_page: window.location.pathname + window.location.search,
  }
}

export default function SignupForm() {
  const [email, setEmail] = useState('')
  const [instances, setInstances] = useState('')
  const [agency, setAgency] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')
  const [attribution, setAttribution] = useState<Attribution | null>(null)

  useEffect(() => {
    setAttribution(getAttribution())
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !instances || !agency) {
      setError('Please fill in all fields.')
      return
    }
    setError('')
    setStatus('loading')

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, instances, agency, ...attribution }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setStatus('error')
        return
      }
      setStatus('success')
      if (typeof window !== 'undefined' && (window as Window & { fbq?: (...args: unknown[]) => void }).fbq) {
        (window as Window & { fbq?: (...args: unknown[]) => void }).fbq!('track', 'CompleteRegistration')
      }
    } catch {
      setError('Network error — please try again.')
      setStatus('error')
    }
  }

  return (
    <section id="signup" className="py-28 bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto">
          {/* Header */}
          <AnimateOnScroll className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-4">Free to start</p>
            <h2 className="font-display font-bold text-4xl sm:text-5xl text-zinc-900 mb-3">
              Get started free.
            </h2>
            <p className="text-zinc-500 text-base">
              No credit card required. Start monitoring your n8n workflows in minutes.
            </p>
          </AnimateOnScroll>

          {/* Success state */}
          {status === 'success' ? (
            <AnimateOnScroll animation="scale-up" className="glass-card rounded-2xl p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
              </div>
              <h3 className="font-display font-bold text-zinc-900 text-2xl mb-2">You&apos;re in!</h3>
              <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                Your spot is reserved. Head to the app to create your free account and start monitoring now.
              </p>
              <a
                href="https://app.flowmonix.com"
                className="inline-flex items-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Go to FlowMonix <ArrowRight className="w-4 h-4" />
              </a>
            </AnimateOnScroll>
          ) : (
            <AnimateOnScroll animation="scale-up" className="glass-card rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wide">
                  Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@agency.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all duration-200"
                />
              </div>

              {/* Instance count */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wide">
                  How many n8n instances do you run?
                </label>
                <select
                  required
                  value={instances}
                  onChange={(e) => setInstances(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all duration-200 appearance-none cursor-pointer"
                >
                  <option value="" disabled className="bg-white">Select...</option>
                  <option value="1" className="bg-white">1 (just me)</option>
                  <option value="2-5" className="bg-white">2–5</option>
                  <option value="6-10" className="bg-white">6–10</option>
                  <option value="10+" className="bg-white">10+</option>
                </select>
              </div>

              {/* Agency qualifier */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wide">
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
                          ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                          : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && <p className="text-red-500 text-xs">{error}</p>}

              {/* Submit */}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm hover:opacity-90 hover:scale-[1.01] active:scale-100 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-indigo-300/50 mt-2"
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

              <p className="text-zinc-400 text-xs text-center pt-1">
                No credit card required. Cancel any time.
              </p>
            </form>
            </AnimateOnScroll>
          )}
        </div>
      </div>
    </section>
  )
}
